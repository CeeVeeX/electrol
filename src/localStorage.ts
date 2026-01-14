import type { WebContents } from 'electron'

/**
 * LocalStorage 封装
 *
 * 通过 WebContents 在渲染进程中直接读取/写入 window.localStorage。
 * 注意：键值均按字符串处理。
 */
export class LocalStorage {
  constructor(public readonly contents: WebContents) {}

  /**
   * 获取指定键的值。
   */
  async getItem(key: string): Promise<string | null> {
    return this.contents.executeJavaScript(`localStorage.getItem("${key}")`)
  }

  /**
   * 写入指定键的值。
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.contents.executeJavaScript(`localStorage.setItem("${key}", "${value}")`)
  }

  /**
   * 删除指定键。
   */
  async removeItem(key: string): Promise<void> {
    await this.contents.executeJavaScript(`localStorage.removeItem("${key}")`)
  }
}

export default LocalStorage
