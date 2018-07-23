const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')

const app = require('electron').remote.app,
    path = require('path'),
    fs = require('fs'),
    dialog = require('electron').remote.dialog,
    BrowserWindow = require('electron').remote.BrowserWindow,
    puppeteer = require('puppeteer');

async function repeat(groupedList, flatList) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage();
    await page.setRequestInterception(true)
    await page.setViewport({ width: 1366, height: 768 });

    const director = new Director(page, groupedList, flatList)
    await director.preProcess()
    await director.process()
}

document.getElementById('start').addEventListener('click', function () {
    let receiver = new Receiver(`C:\\Users\\wu0792\\Downloads\\ats_data (24).json`)
    let groupPromise = receiver.dumpGroupedList()

    groupPromise.then(group => {
        let listPromise = receiver.dumpFlatList()
        listPromise.then(list => {
            repeat(group, list)
        })
    })
});
