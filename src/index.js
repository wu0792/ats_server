//handle setupevents as quickly as possible
const setupEvents = require('../installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

const electron = require('electron')

const { app, BrowserWindow, Menu } = electron

const path = require('path')
const url = require('url')
const { onSetChromiumPath } = require('./common/chromiumPathHandler')
const autoOpenLink = require('./common/autoOpenLink/main')

const menuTemplate = [
    {
        label: '查看',
        submenu: [
            {
                label: '设置chrominum路径',
                click() {
                    onSetChromiumPath()
                }
            },
            {
                label: 'Developer Tools',
                accelerator: 'Ctrl+Shift+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            },
            {
                label: '退出',
                accelerator: 'Ctrl+Q',
                click: () => {
                    app.quit()
                }
            }
        ]
    },
    {
        label: '帮助',
        submenu: [
            {
                label: 'CONF文档',
                click() {
                    autoOpenLink('http://www.baidu.com')
                }
            }
        ]
    }
]

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({ width: 800, height: 600 });

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './html/home.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

const mainMenu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(mainMenu)

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});