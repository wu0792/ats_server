const STORAGE_KEYS = require('./storageKeys')
const prompt = require('electron-prompt')

const onSetChromiumPath = (cb) => {
    let chromiumPath = onGetChromiumPath()
    prompt({
        title: '设置 Chromium 路径',
        label: '请输入Chromium安装后的exe所在路径（Chromium下载地址: https://download-chromium.appspot.com/)',
        value: chromiumPath,
        inputAttrs: {
            type: 'text'
        },
        type: 'input'
    }).then(newPath => {
        localStorage.setItem(STORAGE_KEYS.CHROMIUM_PATH, newPath)
        typeof cb === 'function' && cb(newPath)
    })
}

const onGetChromiumPath = () => {
    return localStorage.getItem(STORAGE_KEYS.CHROMIUM_PATH) || ''
}

module.exports = {
    onGetChromiumPath,
    onSetChromiumPath
}