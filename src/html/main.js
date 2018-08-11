const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')
const startCompare = require('../analysis/compare')
const SaveFile = require('../common/saveFile')

const puppeteer = require('puppeteer');

async function repeat(groupedList, systemInfo, flatList, urls) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 25,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage();
    await page.setRequestInterception(true)
    await page.setViewport({ width: 1366, height: 768 });

    const director = new Director(page, groupedList, systemInfo, flatList, urls)
    await director.preProcess()
}

function getDataFilePath() { return document.getElementById('path').value.trim(); }
function getNoMockUrls() { return document.getElementById('url').value.trim().split('\n').map(val => val.trim()).filter(val => val); }

document.getElementById('start').addEventListener('click', function () {
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
            repeat(wrapper.groupedList, wrapper.systemInfo, list, urls)
        })
    })
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
        noMockUrls = getNoMockUrls()

    if (!dataFilePath) {
        alert('path is required.')
        return
    }

    let data = {
        path: dataFilePath,
        noMockUrls
    }

    SaveFile.saveJson(data, document, 'ats_config.json')
})