import type { WebContents } from 'electron'
import ElementHandle from './element'
import LocalStorage from './localStorage'
import SessionStorage from './sessionStorage'

export * from './element'
export * from './localStorage'
export * from './sessionStorage'
export * from './utils'

/**
 * Ectrol
 *
 * 一个针对 Electron WebContents 的轻量级自动化助手。
 * - 提供 `localStorage` / `sessionStorage` 封装
 * - 通过 `$(selector)` 获取元素句柄进行点击、输入、聚焦等操作
 *
 * 选择器支持穿越 iframe：
 * 使用 `|>` 分隔层级，如：`iframe#login |> input[name="username"]`
 */
export class Ectrol {
  readonly localStorage: LocalStorage
  readonly sessionStorage: SessionStorage

  constructor(public readonly contents: WebContents) {
    this.localStorage = new LocalStorage(contents)
    this.sessionStorage = new SessionStorage(contents)
  }

  /**
   * 获取一个元素句柄，用于后续交互。
   * @param selector CSS 选择器；支持通过 `|>` 穿越 iframe
   * @returns `ElementHandle` 实例
   */
  $(selector: string) {
    return new ElementHandle(this.contents, selector)
  }
}

export default Ectrol
