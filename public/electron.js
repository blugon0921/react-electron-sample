const { app, Menu, screen, BrowserWindow, ipcMain, dialog, ipcRenderer } = require("electron")
let isDev = require("electron-is-dev")
const path = require("path")
const url = require('url')
const { ffmpeg, AppData, asyncFfprobe } = require("./electronModule")
const fs = require("fs")

if(!fs.existsSync(AppData)) fs.mkdirSync(AppData)
const isFirst = app.requestSingleInstanceLock()
if(!isFirst) {
    app.quit()
    process.exit(0)
} else app.on("second-instance", (workingDirectory, argv, additionalData) => {
    createWindow(argv, 2)
})

const windows = []

if(!isDev) Menu.setApplicationMenu(false) //Off Menu
function createWindow(argv, openIndex) {
    const primaryDisplay = screen.getAllDisplays()[0]
    const { width, height } = primaryDisplay.size

    const win = new BrowserWindow({
        width: Math.ceil(width*(3200/3840)), //3840기준 3200
        height: Math.ceil(height*(1800/2160)), //2160기준 1800
        minWidth: Math.ceil(width*(1690/3840)), //3840기준 1690
        minHeight: Math.ceil(height*(984/2160)), //2160기준 984
        maxWidth: width, //3840기준 3840
        maxHeight: height, //2160기준 2160
        center: true,
        show: true,
        icon: `${__dirname}/icon.png`,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            // devTools: isDev,
            enableRemoteModule: true
        }
    })
    require("@electron/remote/main").enable(win.webContents)

    isDev ? win.loadURL("http://localhost:3000")
          : win.loadFile(`${__dirname}/../build/index.html`)

    win.webContents.once("did-finish-load", async () => {
        win.show()
        if(isDev) win.webContents.openDevTools()
        win.webContents.send("setId", [windows.length])
        windows.push(win)
        // win.webContents.openDevTools()
//        if(process.platform == "win32" && 2 <= argv.length) { //Open with File
//            if(argv[openIndex] && argv[openIndex] !== ".") {
//                if(!fs.existsSync(argv[openIndex])) return
//            }
//        }
    })
    return win
}

app.whenReady().then(() => {
    if (BrowserWindow.getAllWindows().length === 0) {
        require("@electron/remote/main").initialize()
        createWindow(process.argv, 1)
//        require("./update")(app, createWindow(process.argv, 1))
    }
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})