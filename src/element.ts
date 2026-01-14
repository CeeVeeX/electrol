import type { WebContents } from 'electron'

/**
 * 扩展版的元素位置信息，基于 DOMRect 并补充中心点坐标。
 */
export interface IBoundingClientRect {
  x: number
  y: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
  centerX: number
  centerY: number
}

/**
 * 二维向量坐标。
 */
export interface IVector2D {
  x: number
  y: number
}

/**
 * 尺寸信息。
 */
export interface ISize {
  width: number
  height: number
}

/**
 * ElementHandle
 *
 * - 封装了在指定 WebContents 中对单个元素进行操作的能力
 * - 选择器支持 iframe 穿越，形如：`iframe.sel |> .inner |> button.submit`
 * - 大多数 API 接受 `timeout`，轮询查找元素直到超时
 */
export class ElementHandle {
  isNotFound = false

  constructor(
    public readonly contents: WebContents,
    public readonly selector: string,
  ) {}

  /**
   * 生成在 renderer 端执行的查找脚本。
   * - 通过 `|>` 支持逐层进入 iframe。
   * - 在 `window.__ELECTROL__` 上缓存找到的元素及其 rect，以减少后续访问成本。
   * - 当传入 `timeout > 0` 时会在 renderer 端做原地轮询，直到找到或超时。
   */
  private _getElement(timeout: number = 0): string {
    return /* js */`
     (()=>{
        function getElement() {
          const selector = "${this.selector}";

          if (!selector) return null;

          window.__ELECTROL__ = window.__ELECTROL__ || {};
          if (window.__ELECTROL__[selector]) {
            return window.__ELECTROL__[selector];
          }

          // 分层选择器，支持 iframe 穿越
          const parts = selector.split('|>').map(s => s.trim());
          if (!parts.length) return null;

          let currentDocument = document;
          let offsetLeft = 0;
          let offsetTop = 0;
          let element = null;

          for (let i = 0; i < parts.length; i++) {
            if (!currentDocument) return null;

            const part = parts[i];
            // 在当前文档查找该层选择器
            const el = currentDocument.querySelector(part);

            if (!el) {
              console.warn('未找到元素:', part);
              return null;
            }

            const rect = el.getBoundingClientRect();

            // 累加当前层级偏移
            offsetLeft += rect.left;
            offsetTop += rect.top;

            element = el;

            const isLast = i === parts.length - 1;
            if (!isLast) {
              if (el.tagName !== 'IFRAME') {
                console.warn('非 iframe 元素却尝试进入下一层:', part);
                return null;
              }

              const nextDoc = el.contentDocument || el.contentWindow?.document;
              if (!nextDoc) {
                console.warn('无法访问 iframe.contentDocument（可能跨域）');
                return null;
              }

              currentDocument = nextDoc;
            }
          }

          if (!element) return null;

          const finalRect = element.getBoundingClientRect();

          // 缓存元素
          // 缓存以避免重复查找
          window.__ELECTROL__[selector] = {
            element,
            rect: new DOMRect(
              offsetLeft,
              offsetTop,
              finalRect.width,
              finalRect.height
            )
          };

          return window.__ELECTROL__[selector]
        }

        const timeout = ${timeout}

        if(timeout <= 0) {
          return getElement();
        }

        const startTime = Date.now()
        while (Date.now() - startTime < timeout) {
          const element = getElement();
          if (element) return element;
        }
        return null;
      })()
    `
  }

  /**
   * 触发元素 mouseover 事件（不移动真实鼠标）。
   */
  hover() {
    return this.contents.executeJavaScript(/* js */`
      (function() {
        const target = ${this._getElement()};
        if (!target) return null;

        const event = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        target.element.dispatchEvent(event);
      })()
    `)
  }

  /**
   * 点击
   * - 通过 WebContents.sendInputEvent 发送 mouseDown/mouseUp 事件
   * - 默认在元素中心点点击
   * - 支持修饰键（Alt/Control/Meta/Shift）按下期间点击
   * - 注意：此操作会触发鼠标悬浮事件
   */
  async click(options?: {
    button?: 'left' | 'right' | 'middle'
    clickCount?: number
    delay?: number
    modifiers?: ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[]
    position?: IVector2D
    timeout?: number
  }) {
    const rect = await this.getBoundingClientRect(options?.timeout)

    if (!rect)
      return

    const _handle = async () => {
      this.contents.sendInputEvent({
        type: 'mouseDown',
        x: rect.centerX,
        y: rect.centerY,
        button: options?.button || 'left',
        clickCount: 1,
      })

      await new Promise(resolve => setTimeout(resolve, options?.delay || 10))

      this.contents.sendInputEvent({
        type: 'mouseUp',
        x: rect.centerX,
        y: rect.centerY,
        button: options?.button || 'left',
        clickCount: 1,
      })
    }

    if (options?.modifiers) {
      for (const modifier of options.modifiers) {
        this.contents.sendInputEvent({
          type: 'keyDown',
          keyCode: modifier,
        })
      }
    }

    if (options?.clickCount) {
      for (let i = 0; i < options.clickCount; i++) {
        await _handle()
      }
    }
    else {
      await _handle()
    }

    if (options?.modifiers) {
      for (const modifier of options.modifiers) {
        this.contents.sendInputEvent({
          type: 'keyUp',
          keyCode: modifier,
        })
      }
    }
  }

  /**
   * 双击
   * - 底层复用 click，并将 `clickCount` 设为 2。
   */
  async dblclick(options?: {
    button?: 'left' | 'right' | 'middle'
    delay?: number
    modifiers?: ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[]
    position?: IVector2D
    timeout?: number
  }) {
    return this.click({
      ...options,
      clickCount: 2,
    })
  }

  /**
   * 将复选框或单选按钮设为选中，并派发 change 事件。
   */
  check() {
    return this.contents.executeJavaScript(/* js */`
      (function() {
        const target = ${this._getElement()};
        if (!target) return null;

        // 验证输入框是否是复选框或单选按钮
        if (target.element.tagName !== 'INPUT' || (target.element.type !== 'checkbox' && target.element.type !== 'radio')) return null;

        target.element.checked = true;
        target.element.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `)
  }

  /**
   * 填充输入框内容。
   * - 适用于 `<input>`、`<textarea>` 或 `contenteditable` 元素。
   * - 会触发 `input` 事件（冒泡）。
   */
  async fill(value: string, options?: {
    timeout?: number
  }) {
    await this.contents.executeJavaScript(/* js */`
      (function() {
        const target = ${this._getElement(options?.timeout)};
        if (!target) return null;

        // 验证输入框是否是文本类型
        if (target.element.tagName !== 'INPUT' && target.element.tagName !== 'TEXTAREA' && !target.element.isContentEditable) return null;

        target.element.focus();

        target.element.value = ${JSON.stringify(value)};
        target.element.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `)
  }

  /**
   * 在元素上发送按键事件。
   * - 先调用 `focus()`，随后按下并抬起指定组合键。
   * - 组合键用 `+` 连接，如 `Control+Shift+A`。
   * @example
   * press('a', { delay: 100, timeout: 1000 })
   * press('Control+Shift+T')
   */
  async press(key: string, options?: {
    delay?: number
    timeout?: number
  }) {
    await this.focus(options)

    const keys = key.split('+')

    for (const key of keys) {
      this.contents.sendInputEvent({
        type: 'keyDown',
        keyCode: key,
      })
    }

    await new Promise(resolve => setTimeout(resolve, options?.delay || 10))

    for (const key of keys) {
      this.contents.sendInputEvent({
        type: 'keyUp',
        keyCode: key,
      })
    }
  }

  /**
   * 聚焦输入型元素（input/textarea/contenteditable）。
   */
  async focus(options?: {
    timeout?: number
  }) {
    return this.contents.executeJavaScript(/* js */`
      (function() {
        const target = ${this._getElement(options?.timeout)};
        if (!target) return null;

        // 验证输入框是否是文本类型
        if (target.element.tagName !== 'INPUT' && target.element.tagName !== 'TEXTAREA' && !target.element.isContentEditable) return null;

        target.element.focus();
      })()
    `)
  }

  /**
   * 检查元素是否存在（支持超时轮询）。
   */
  async exist(timeout?: number): Promise<boolean> {
    return await this.contents.executeJavaScript(/* js */`!!${this._getElement(timeout)}`)
  }

  /**
   * 获取元素的位置信息。
   * - 返回扩展的 DOMRect 信息并包含元素中心点坐标。
   */
  getBoundingClientRect(timeout: number = 0): Promise<IBoundingClientRect | null> {
    if (this.isNotFound)
      return Promise.resolve(null)

    return this.contents.executeJavaScript(/* js */`
      (function() {
        const target = ${this._getElement(timeout)};

        if (!target) return null;

        const rect = target.rect;
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
          centerX: rect.x + rect.width / 2,
          centerY: rect.y + rect.height / 2
        };
      })()
    `)
  }
}

export default ElementHandle
