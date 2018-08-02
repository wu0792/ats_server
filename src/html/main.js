const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')

const app = require('electron').remote.app,
    path = require('path'),
    fs = require('fs'),
    dialog = require('electron').remote.dialog,
    BrowserWindow = require('electron').remote.BrowserWindow,
    puppeteer = require('puppeteer');

async function repeat(groupedList, systemInfo, flatList, urls) {
    const browser = await puppeteer.launch({
        headless: true,
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
    let path = document.getElementById('path').value.trim()
    if (!path) {
        alert('path is required.')
        return
    }

    let urls = document.getElementById('url').value.trim().split('\n').filter(val => val)

    let receiver = new Receiver(path)
    let groupPromise = receiver.dumpGroupedListWrapper()

    groupPromise.then(wrapper => {
        let listPromise = receiver.dumpFlatList()
        listPromise.then(list => {
            repeat(wrapper.groupedList, wrapper.systemInfo, list, urls)
        })
    })
});
