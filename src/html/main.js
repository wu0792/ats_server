const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')
const startCompare = require('../analysis/compare')

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

document.getElementById('start').addEventListener('click', function () {
    let path = document.getElementById('path').value.trim(),
        urls = document.getElementById('url').value.trim().split('\n').map(val => val.trim()).filter(val => val)

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
