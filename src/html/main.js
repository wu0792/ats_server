const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')
const startCompare = require('../analysis/compare')
const SaveFile = require('../common/saveFile')
const START_MODE = require('../enums/startMode')

const puppeteer = require('puppeteer');

async function repeat(mode, groupedList, systemInfo, flatList, urls) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 25,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage();
    await page.setRequestInterception(true)
    await page.setViewport({ width: 1366, height: 768 });

    const director = new Director(mode, page, groupedList, systemInfo, flatList, urls)
    await director.preProcess()
}

function getDataFilePath() { return document.getElementById('path').value.trim(); }
function getRemark() { return document.getElementById('remark').value.trim(); }
function getNoMockUrls() { return document.getElementById('url').value.trim().split('\n').map(val => val.trim()).filter(val => val); }

function prepareRepeat(mode) {
    let path = getDataFilePath(),
        urls = getNoMockUrls()

    if (!path) {
        alert('path is required.')
        return
    }

    let receiver = new Receiver(path)
    let groupPromise = receiver.dumpGroupedListWrapper()

    groupPromise.then(wrapper => {
        let listPromise = receiver.dumpFlatList()
        listPromise.then(list => {
            repeat(mode, wrapper.groupedList, wrapper.systemInfo, list, urls)
        })
    })
}

document.getElementById('expect').addEventListener('click', function () {
    prepareRepeat(START_MODE.expect)
})

document.getElementById('actual').addEventListener('click', function () {
    prepareRepeat(START_MODE.actual)
})

function doCompare(id) {
    startCompare(id)
}

document.getElementById('compare').addEventListener('click', function () {
    const id = document.getElementById('id').value.trim()

    doCompare(id)
})

document.getElementById('save').addEventListener('click', function () {
    let dataFilePath = getDataFilePath(),
        noMockUrls = getNoMockUrls(),
        remark = getRemark()

    if (!dataFilePath) {
        alert('path is required.')
        return
    }

    let data = {
        path: dataFilePath,
        remark,
        noMockUrls
    }

    SaveFile.saveJson(data, document, 'ats_config.json')
})