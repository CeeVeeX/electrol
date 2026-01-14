# Electrol = Electron + Control

一个基于 Electron WebContents 的轻量级自动化助手，用于在你的应用内对网页内容进行交互（点击、输入、聚焦、键盘事件等）。

- 专注于 Electron 环境：无需引入完整的浏览器自动化运行时。
- 轻量且易用：API 风格参考了部分 Playwright 用法，学习成本低。
- 支持 iframe 穿越选择器：使用 `|>` 分隔层级，轻松访问嵌套内容。

## 安装

你可以使用任意包管理器进行安装：

```powershell
# PNPM
pnpm add electrol

# NPM
npm install electrol

# Yarn
yarn add electrol
```

## 快速开始

在主进程中创建 `Electrol` 实例，并传入目标 `WebContents`：

```ts
import Electrol from 'electrol'
import { app, BrowserWindow } from 'electron'

let win: BrowserWindow

app.whenReady().then(async () => {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  await win.loadURL('https://example.com')

  const ctl = new Electrol(win.webContents)

  // 基本查询与点击
  const exist = await ctl.$('button.submit').exist(2000)
  if (exist) {
    await ctl.$('button.submit').click()
  }

  // 输入文本（支持 input / textarea / contenteditable）
  await ctl.$('input[name="username"]').fill('hello-world', { timeout: 2000 })

  // 组合键：Ctrl+Shift+T（Windows/Linux 下为 Control，macOS 可用 Meta）
  await ctl.$('input[name="username"]').press('Control+Shift+T', { delay: 50 })

  // 读写存储
  await ctl.localStorage.setItem('token', 'abc123')
  const token = await ctl.localStorage.getItem('token')
  console.log('token:', token)
})
```

### iframe 选择器

当页面包含 iframe 时，使用 `|>` 逐层穿越：

```ts
// 选择外层 iframe，再选择里层的输入框
await ctl.$('iframe#login |> input[name="username"]').fill('user')

// 更深层级示例
await ctl.$('iframe#outer |> iframe#inner |> button.go').click()
```

### 常用 API

- `ctl.$(selector).exist(timeout?)`: 检查元素是否存在（支持超时轮询）。
- `ctl.$(selector).click(options?)`: 点击元素（可配置按钮、次数、修饰键）。
- `ctl.$(selector).dblclick(options?)`: 双击元素。
- `ctl.$(selector).fill(value, options?)`: 填充文本并触发 `input` 事件。
- `ctl.$(selector).press(keys, options?)`: 在元素上发送组合键（自动聚焦）。
- `ctl.$(selector).focus(options?)`: 聚焦输入型元素。
- `ctl.$(selector).getBoundingClientRect(timeout?)`: 获取包含中心点坐标的位置信息。
- `ctl.localStorage.* / ctl.sessionStorage.*`: 操作存储（字符串键值）。

## 为什么不是 Playwright？

编写该库时尚不熟悉 Playwright。后续了解后发现其功能全面，但在 Electron 应用内做少量、直接的页面交互，往往只需要一个轻量方案。Electrol 的设计目标是：在不引入额外浏览器驱动与上下文的前提下，以最小侵入实现 Electron 内的页面自动化。

## 许可

详见 `LICENSE.md`。
