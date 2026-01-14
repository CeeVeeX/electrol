import type { WebContents } from 'electron'

/**
 * SessionStorage 封装
 *
 * 通过 WebContents 在渲染进程中直接读取/写入 window.sessionStorage。
 * 注意：键值均按字符串处理；生命周期为会话级别。
 */
export class SessionStorage {
  constructor(public readonly contents: WebContents) {}

  /**
   * 获取指定键的值。
   */
  async getItem(key: string): Promise<string | null> {
    return this.contents.executeJavaScript(`sessionStorage.getItem("${key}")`)
  }

  /**
   * 写入指定键的值。
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.contents.executeJavaScript(`sessionStorage.setItem("${key}", "${value}")`)
  }

  /**
   * 删除指定键。
   */
  async removeItem(key: string): Promise<void> {
    await this.contents.executeJavaScript(`sessionStorage.removeItem("${key}")`)
  }
}

export default SessionStorage
