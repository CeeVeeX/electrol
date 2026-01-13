import type { WebContents } from 'electron'

export class LocalStorage {
  constructor(public readonly contents: WebContents) {}

  async getItem(key: string): Promise<string | null> {
    return this.contents.executeJavaScript(`localStorage.getItem("${key}")`)
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.contents.executeJavaScript(`localStorage.setItem("${key}", "${value}")`)
  }

  async removeItem(key: string): Promise<void> {
    await this.contents.executeJavaScript(`localStorage.removeItem("${key}")`)
  }
}

export default LocalStorage
