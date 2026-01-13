import type { WebContents } from 'electron'

export class SessionStorage {
  constructor(public readonly contents: WebContents) {}

  async getItem(key: string): Promise<string | null> {
    return this.contents.executeJavaScript(`sessionStorage.getItem("${key}")`)
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.contents.executeJavaScript(`sessionStorage.setItem("${key}", "${value}")`)
  }

  async removeItem(key: string): Promise<void> {
    await this.contents.executeJavaScript(`sessionStorage.removeItem("${key}")`)
  }
}

export default SessionStorage
