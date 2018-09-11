const STORAGE_KEYS = require('./storageKeys')
const prompt = require('electron-prompt')
const tenny = require('teeny-conf')
const path = require('path')
const fs = require('fs')

const CONFIG_FILE_PATH = path.join(__dirname, './config.json')

if (!fs.existsSync(CONFIG_FILE_PATH)) {
    fs.appendFileSync(CONFIG_FILE_PATH, '{}', 'utf8')
}

const config = new tenny(CONFIG_FILE_PATH, {})

const onSetChromiumPath = (cb) => {
    onGetChromiumPath().then(path => {
        let chromiumPath = path

        prompt({
            title: '设置 Chromium 路径',
            label: '安装Chromium后的exe路径(下载地址: https://download-chromium.appspot.com/)',
            value: chromiumPath,
            inputAttrs: {
                type: 'text'
            },
            type: 'input',
            width: 400,
            height: 200
        }).then(newPath => {
            config.set(STORAGE_KEYS.CHROMIUM_PATH, newPath)
            config.save().then(() => {
                typeof cb === 'function' && cb(newPath)
            })
        })
    })
}

const onGetChromiumPath = () => {
    return new Promise(resolve => {
        config.reload().then(() => {
            resolve(config.get(STORAGE_KEYS.CHROMIUM_PATH) || '')
        })
    })
}

module.exports = {
    onGetChromiumPath,
    onSetChromiumPath
}