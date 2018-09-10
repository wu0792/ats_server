const STORAGE_KEYS = require('./storageKeys')
const prompt = require('electron-prompt')

const onSetChromiumPath = async () => {
    let chromiumPath = onGetChromiumPath()
    let newPath = await prompt({
        title: '请输入Chromium安装后的exe所在路径，Chromium下载地址: (https://download-chromium.appspot.com/)',
        label: 'exe路径:',
        value: chromiumPath,
        inputAttrs: {
            type: 'text'
        },
        type: 'input'
    })

    localStorage.setItem(STORAGE_KEYS.CHROMIUM_PATH, newPath)
}

const onGetChromiumPath = () => {
    return localStorage.getItem(STORAGE_KEYS.CHROMIUM_PATH) || ''
}

module.exports = {
    onGetChromiumPath,
    onSetChromiumPath
}