const electron = require('electron');
const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
const ipcMain = electron.ipcMain || electron.remote.ipcMain;
const url = require('url');
const path = require('path');

function autoOpenLink(targetUrl) {
    const getOptionsListener = event => {
        event.returnValue = targetUrl
    };

    const errorListener = (event, message) => {
        event.returnValue = null;
        cleanup();
    };

    let win = new BrowserWindow({
        transparent: false,
        frame: true
    });

    const cleanup = () => {
        if (win) {
            win.close();
            win = null;
        }
    };

    ipcMain.on('auto-open-link-get-options', getOptionsListener);
    ipcMain.on('auto-open-link-error', errorListener);

    win.on('closed', () => {
        ipcMain.removeListener('auto-open-link-get-options', getOptionsListener);
        ipcMain.removeListener('auto-open-link-error', errorListener);
    });

    const promptUrl = url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, 'index.html')
    });

    win.loadURL(promptUrl);
}

module.exports = autoOpenLink