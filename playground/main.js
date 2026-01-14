import { Ectrol } from 'ectrol'
import { app, BrowserWindow } from 'electron/main'

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
    },
  })

  win.loadFile('index.html')

  win.webContents.openDevTools()

  const ectrol = new Ectrol(win.webContents)

  win.webContents.on('did-finish-load', async () => {
    await ectrol.localStorage.setItem('greeting', 'Hello, localStorage!')
    await ectrol.sessionStorage.setItem('greeting', 'Hello, sessionStorage!')

    console.warn(await ectrol.localStorage.getItem('greeting'))
    console.warn(await ectrol.sessionStorage.getItem('greeting'))

    console.log(await ectrol.$('#info').getBoundingClientRect())

    const btn1 = ectrol.$('#btn')
    const btn2 = ectrol.$('#btn2')
    const inputBox = ectrol.$('#inputBox')
    const textArea = ectrol.$('#textArea')
    const checkbox1 = ectrol.$('#checkbox1')
    const radio2 = ectrol.$('#radio2')
    const dropdown = ectrol.$('#dropdown')

    await new Promise(resolve => setTimeout(resolve, 5000))

    await btn1.click()
    await btn2.click()

    await new Promise(resolve => setTimeout(resolve, 3000))
    await btn1.hover()
    await btn2.hover()

    await inputBox.fill('Hello, World!')
    await textArea.fill('This is a text area.\n多行文本测试。')
    await checkbox1.check()
    await radio2.check()
    await dropdown.selectOption('option2')

    /** ------------------------------------------------------------------------------------------------- */

    const iframe_btn1 = ectrol.$('iframe|>button#btn')
    const iframe_btn2 = ectrol.$('iframe|>button#btn2')
    const iframe_inputBox = ectrol.$('iframe|>input#inputBox')
    const iframe_textArea = ectrol.$('iframe|>textarea#textArea')
    const iframe_checkbox1 = ectrol.$('iframe|>input#checkbox1')
    const iframe_radio2 = ectrol.$('iframe|>input#radio2')
    const iframe_dropdown = ectrol.$('iframe|>select#dropdown')

    await new Promise(resolve => setTimeout(resolve, 3000))
    await iframe_btn1.click()
    await iframe_btn2.click()

    await new Promise(resolve => setTimeout(resolve, 3000))
    await iframe_btn1.hover()
    await iframe_btn2.hover()

    await iframe_inputBox.fill('Hello, World!')
    await iframe_textArea.fill('This is a text area.\n多行文本测试。')
    await iframe_checkbox1.check()
    await iframe_radio2.check()
    await iframe_dropdown.selectOption('option2')
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
