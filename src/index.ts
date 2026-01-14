import type { WebContents } from 'electron'
import ElementHandle from './element'
import LocalStorage from './localStorage'
import SessionStorage from './sessionStorage'

export * from './element'
export * from './localStorage'
export * from './sessionStorage'

export class Electrol {
  readonly localStorage: LocalStorage
  readonly sessionStorage: SessionStorage

  constructor(public readonly contents: WebContents) {
    this.localStorage = new LocalStorage(contents)
    this.sessionStorage = new SessionStorage(contents)
  }

  $(selector: string) {
    return new ElementHandle(this.contents, selector)
  }
}

export default Electrol
