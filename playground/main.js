import { Electrol } from 'electrol'
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

  const electrol = new Electrol(win.webContents)

  win.webContents.on('did-finish-load', async () => {
    await electrol.localStorage.setItem('greeting', 'Hello, localStorage!')
    await electrol.sessionStorage.setItem('greeting', 'Hello, sessionStorage!')

    console.warn(await electrol.localStorage.getItem('greeting'))
    console.warn(await electrol.sessionStorage.getItem('greeting'))

    console.log(await electrol.$('#info').getBoundingClientRect())

    const btn1 = electrol.$('#btn')
    const btn2 = electrol.$('#btn2')

    await btn1.click()
    await btn2.click()

    await btn1.hover()
    await btn2.hover()
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
