const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')

const app = require('electron').remote.app,
    path = require('path'),
    fs = require('fs'),
    dialog = require('electron').remote.dialog,
    BrowserWindow = require('electron').remote.BrowserWindow,
    puppeteer = require('puppeteer');

async function repeat(entryList) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    const director = new Director(page, entryList)
    await director.preProcess()
    await director.process()
}

document.getElementById('start').addEventListener('click', function () {
    let receiver = new Receiver(`C:\\Users\\wu0792\\Downloads\\ats_data (22).json`)
    let listPromise = receiver.dump()
    listPromise.then(list => {
        repeat(list)
    })

});
