import type { WebContents } from 'electron'

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

export interface IVector2D {
  x: number
  y: number
}

export interface ISize {
  width: number
  height: number
}

export class ElementHandle {
  isNotFound = false

  constructor(
    public readonly contents: WebContents,
    public readonly selector: string,
  ) {}

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

          const parts = selector.split('|>').map(s => s.trim());
          if (!parts.length) return null;

          let currentDocument = document;
          let offsetLeft = 0;
          let offsetTop = 0;
          let element = null;

          for (let i = 0; i < parts.length; i++) {
            if (!currentDocument) return null;

            const part = parts[i];
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

    const _click = async () => {
      this.contents.sendInputEvent({
        type: 'mouseDown',
        x: rect.centerX,
        y: rect.centerY,
        button: options?.button || 'left',
        clickCount: 1,
      })

      await new Promise(resolve => setTimeout(resolve, options?.delay || 100))

      this.contents.sendInputEvent({
        type: 'mouseUp',
        x: rect.centerX,
        y: rect.centerY,
        button: options?.button || 'left',
        clickCount: 1,
      })
    }

    if (options?.clickCount) {
      for (let i = 0; i < options.clickCount; i++) {
        await _click()
      }
    }
    else {
      await _click()
    }
  }

  dblclick() {}

  check() {}

  fill() {}

  press() {}

  focus() {}

  /**
   * 检查元素是否存在
   * @param timeout 超时时间
   */
  async exist(timeout?: number): Promise<boolean> {
    return await this.contents.executeJavaScript(/* js */`!!${this._getElement(timeout)}`)
  }

  /**
   * 获取元素的位置信息
   * @returns 元素的位置信息
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
