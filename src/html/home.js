const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')
const SaveFile = require('../common/saveFile')
const START_MODE = require('../enums/startMode')
const puppeteer = require('puppeteer')
const getNowString = require('../common/getNowString')
const readFilePromise = require('fs-readfile-promise')

/**
 * 
 * @param {run mode: expect/actual} mode 
 * @param {the grouped data retrieved from data file} groupedList 
 * @param {some system info like version, id etc} systemInfo 
 * @param {the flat data retrieved from data file} flatList 
 * @param {urls that config the mock} noMockUrls
 */
async function runPuppeteer(mode, groupedList, systemInfo, flatList, noMockUrls) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 25,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage()
    await page.setRequestInterception(true)
    await page.setViewport({ width: 1366, height: 768 })

    const director = new Director(mode, page, groupedList, systemInfo, flatList, noMockUrls)
    await director.preProcess()
}

//tab1.saveConfig
document.getElementById('saveConfig').addEventListener('click', function () {
    let dataFilePath = document.getElementById('dataFilePath').value.trim(),
        noMockUrls = document.getElementById('noMockUrls').value.trim().split('\n').map(val => val.trim()).filter(val => val),
        title = document.getElementById('title').value.trim()

    if (!dataFilePath) {
        alert('请输入配置文件路径')
        return
    }

    let data = {
        dataFilePath,
        title,
        noMockUrls
    }

    SaveFile.saveJson(data, document, `ats_config_${getNowString()}.json`)
})

/**
 * read config data from path
 * @param {config file path}} configFilePath 
 */
async function readConfigFrom(configFilePath) {
    let configText = await readFilePromise(configFilePath, { encoding: 'utf8' }),
        configJson = JSON.parse(configText)

    return configJson
}

/**
 * prepare for runing the puppeteer
 */
async function prepare(configFilePath, mode) {
    const configJson = await readConfigFrom(configFilePath),
        { dataFilePath, title, noMockUrls } = configJson,
        receiver = new Receiver(dataFilePath),
        groupPromise = receiver.dumpGroupedListWrapper(),
        wrapper = await groupPromise,
        list = await receiver.dumpFlatList()

    runPuppeteer(mode, wrapper.groupedList, wrapper.systemInfo, list, noMockUrls)
}

//tab2.run expect
document.getElementById('runExpect').addEventListener('click', async function () {
    const expectError = document.getElementById('expectError'),
        configFilePathOfExpect = document.getElementById('configFilePathOfExpect').value.trim()

    expectError.innerText = ''

    if (!configFilePathOfExpect) {
        expectError.innerText = '请输入配置文件路径'
        return
    }

    await prepare(configFilePathOfExpect, START_MODE.expect)
})

//tab3.run actual
document.getElementById('runActual').addEventListener('click', async function () {
    const actualError = document.getElementById('actualError'),
        configFilePathOfActual = document.getElementById('configFilePathOfActual').value.trim()

    actualError.innerText = ''

    if (!configFilePathOfActual) {
        actualError.innerText = '请输入配置文件路径'
        return
    }

    await prepare(configFilePathOfActual, START_MODE.actual)
})