const STORAGE_KEYS = require('./storageKeys')
const prompt = require('./prompt/index')
const tenny = require('teeny-conf')
const path = require('path')
const fs = require('fs')

const CONFIG_FILE_NAME = 'config.json'
let CONFIG_FILE_PATH = path.join(__dirname, CONFIG_FILE_NAME).replace('/', '\\')

let asarIndex = CONFIG_FILE_PATH.indexOf('.asar\\')
if (asarIndex > 0) {
    let prevPath = CONFIG_FILE_PATH.substr(0, asarIndex),
        pathArray = prevPath.split('\\'),
        appRootPath = pathArray.filter((val, index) => index < pathArray.length - 3)

    appRootPath.push(CONFIG_FILE_NAME)

    CONFIG_FILE_PATH = appRootPath.join('\\')
}

if (!fs.existsSync(CONFIG_FILE_PATH)) {
    fs.appendFileSync(CONFIG_FILE_PATH, '{}', 'utf8')
}

const config = new tenny(CONFIG_FILE_PATH, {})

const onSetChromiumPath = (cb) => {
    onGetChromiumPath().then(path => {
        let chromiumPath = path

        prompt({
            alwaysOnTop: true,
            title: '设置 Chromium 路径',
            label: ['请输入安装Chromium后的chrome.exe文件的完整路径', '(下载地址: https://pan.baidu.com/s/1-XOJAtj_r5zFxzdd6NO-vQ)'],
            value: chromiumPath,
            inputAttrs: {
                type: 'text'
            },
            type: 'input',
            width: 500,
            height: 200
        }).then(newPath => {
            if (newPath) {
                config.set(STORAGE_KEYS.CHROMIUM_PATH, newPath)
                config.save().then(() => {
                    typeof cb === 'function' && cb(newPath)
                })
            }
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