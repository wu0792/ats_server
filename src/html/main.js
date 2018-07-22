const Receiver = require('../analysis/receiver')

const app = require('electron').remote.app,
    path = require('path'),
    fs = require('fs'),
    dialog = require('electron').remote.dialog,
    BrowserWindow = require('electron').remote.BrowserWindow,
    puppeteer = require('puppeteer');

async function getPic(url) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1200, height: 800 });
    await page.screenshot({ path: 'google.png' });

    await browser.close();
}

document.getElementById('start').addEventListener('click', function () {
    // getPic('https://www.google.de');

    let receiver = new Receiver(`C:\\Users\\wu0792\\Downloads\\ats_data (16).json`)
    let listPromise = receiver.dump()
    listPromise.then(list => {
        console.log(list)
    })

});
