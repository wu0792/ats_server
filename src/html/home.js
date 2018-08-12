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
async function runPuppeteer(mode, notifier, groupedList, systemInfo, flatList, noMockUrls) {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 25,
        executablePath:
            'node_modules/puppeteer/.local-chromium/win64-571375/chrome-win32/chrome.exe'
    })

    const page = await browser.newPage()
    await page.setRequestInterception(true)
    await page.setViewport({ width: 1366, height: 768 })

    const director = new Director(mode, notifier, page, groupedList, systemInfo, flatList, noMockUrls)
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
async function prepare(configFilePath, mode, notifier) {
    const configJson = await readConfigFrom(configFilePath),
        { dataFilePath, title, noMockUrls } = configJson,
        receiver = new Receiver(dataFilePath),
        groupPromise = receiver.dumpGroupedListWrapper(),
        wrapper = await groupPromise,
        list = await receiver.dumpFlatList()

    const { onStartProcess, onExpectEntryFailure, onStartExpectEntry, onFinishExpectEntry } = notifier
    !onStartProcess && (notifier.onStartProcess = () => { })
    !onExpectEntryFailure && (notifier.onExpectEntryFailure = () => { })
    !onStartExpectEntry && (notifier.onStartExpectEntry = () => { })
    !onFinishExpectEntry && (notifier.onFinishExpectEntry = () => { })
    !onNotifyCompareProgress && (notifier.onNotifyCompareProgress = () => { })

    runPuppeteer(mode, notifier, wrapper.groupedList, wrapper.systemInfo, list, noMockUrls)
}

//tab2.run expect
let expectFinishMap = {},
    expectFailureMap = {},
    totalExpectCount = 0,
    finishExpectCount = 0,
    failureExpectCount = 0

const getExpectSummaryEl = () => document.getElementById('expectSummary'),
    getExpectTogglerEl = () => getExpectSummaryEl().querySelector('.toggler'),
    getExpectDetailEl = () => document.getElementById('expectDetail'),
    getFinishExpectCountEl = () => document.getElementById('finishExpectCount'),
    getFailureExpectCountEl = () => document.getElementById('failureExpectCount'),
    getTotalExpectCountEl = () => document.getElementById('totalExpectCount'),
    toggleExpectDetail = () => {
        let expectDetail = getExpectDetailEl()
        expectDetail.style.display = expectDetail.style.display === 'none' ? 'block' : 'none'
    },
    renderExpectSummary = () => {
        getFinishExpectCountEl().innerText = finishExpectCount
        getFailureExpectCountEl().innerText = failureExpectCount
        getTotalExpectCountEl().innerText = totalExpectCount
    },
    renderExpectDetail = (id) => {
        const finishEntry = expectFinishMap[id],
            failureEntry = expectFailureMap[id]

        if (finishEntry || failureEntry) {
            const li = document.createElement('li')

            if (finishEntry) {
                li.className = 'expect_entry finish'
                li.innerHTML = finishEntry.render()
            } else {
                li.className = 'expect_entry error'
                li.innerHTML = failureEntry.render()
            }

            getExpectDetailEl().appendChild(li)
            getExpectDetailEl().children[0].style.display = 'none'
        }
    },
    onStartProcess = (count) => {
        totalExpectCount = count
    },
    onStartExpectEntry = (entry) => {
    },
    onFinishExpectEntry = (entry) => {
        const id = entry.data.id
        expectFinishMap[id] = entry
        finishExpectCount++

        renderExpectSummary()
        renderExpectDetail(id)
    },
    onExpectEntryFailure = (entry, ex) => {
        const id = entry.data.id
        expectFailureMap[id] = entry
        failureExpectCount++

        renderExpectSummary()
        renderExpectDetail(id)
    }

document.getElementById('runExpect').addEventListener('click', async function () {
    const expectError = document.getElementById('expectError'),
        configFilePathOfExpect = document.getElementById('configFilePathOfExpect').value.trim(),
        expectDetailEl = getExpectDetailEl()

    expectError.innerText = ''

    if (!configFilePathOfExpect) {
        expectError.innerText = '请输入配置文件路径'
        return
    }

    expectFinishMap = {}
    totalExpectCount = 0
    finishExpectCount = 0
    failureExpectCount = 0

    expectDetailEl.children[0].style.display = 'block'
    while (expectDetailEl.children.length > 1) {
        expectDetailEl.children[1].remove()
    }

    getExpectSummaryEl().style.display = 'block'
    getExpectDetailEl().style.display = 'none'

    getExpectTogglerEl().removeEventListener('click', toggleExpectDetail)
    getExpectTogglerEl().addEventListener('click', toggleExpectDetail)

    await prepare(configFilePathOfExpect, START_MODE.expect, { onStartProcess, onExpectEntryFailure, onStartExpectEntry, onFinishExpectEntry })
})

//tab3.run actual
let equalsMap = {},
    notEqualsMap = {},
    totalComparCount = 0,
    equalsCount = 0,
    notEqualsCount = 0

const getEqualsSummaryEl = () => document.getElementById('compareEqualsSummary'),
    getEqualsTogglerEl = () => getEqualsSummaryEl().querySelector('a.toggler'),
    getEqualsDetailEl = () => document.getElementById('compareEqualsDetail'),
    getNotEqualsSummaryEl = () => document.getElementById('compareNotEqualsSummary'),
    getNotEqualsTogglerEl = () => getNotEqualsSummaryEl().querySelector('a.toggler'),
    getNotEqualsDetailEl = () => document.getElementById('compareNotEqualsDetail'),
    getEqualsCountEl = () => document.getElementById('equalsCount'),
    getTotalCountOfEqualEl = () => document.getElementById('totalCountOfEqual'),
    getNotEqualsEl = () => document.getElementById('notEqualsCount'),
    getTotalCountOfNotEqualEl = () => document.getElementById('totalCountOfNotEqual')

const toggleEquaslDetail = () => {
    let detailEl = getEqualsDetailEl()
    detailEl.style.display = detailEl.style.display === 'none' ? 'block' : 'none'
}

const toggleNotEquaslDetail = () => {
    let detailEl = getNotEqualsDetailEl()
    detailEl.style.display = detailEl.style.display === 'none' ? 'block' : 'none'
}

const onNotifyCompareProgress = (index, count, fileName, differentPixelCount) => {
    totalComparCount = count

    if (differentPixelCount === 0) {
        equalsCount++
        equalsMap[index] = { count, fileName, differentPixelCount }
        renderEqualsDetail(index)
    } else {
        notEqualsCount++
        notEqualsMap[index] = { count, fileName, differentPixelCount }
        renderNotEqualsDetail(index)
    }

    renderEqualsSummary()
    renderNotEqualsSummary()
}

const renderEqualsSummary = () => {
    getEqualsCountEl().innerText = equalsCount
    getTotalCountOfEqualEl().innerText = totalComparCount
}

const renderNotEqualsSummary = () => {
    getNotEqualsEl().innerText = notEqualsCount
    getTotalCountOfNotEqualEl().innerText = totalComparCount
}

const renderEqualsDetail = (index) => {
    const theEqualItem = equalsMap[index]
    if (theEqualItem) {
        const { count, fileName } = theEqualItem,
            span = document.createElement('span')

        span.className = 'equal_entry'
        span.innerText = `[√] ${index + 1}/${count} ${fileName} equal.`

        getEqualsDetailEl().appendChild(span)
        getEqualsDetailEl().children[0].style.display = 'none'
    }
}

const renderNotEqualsDetail = (index) => {
    const theNotEqualItem = notEqualsMap[index]
    if (theNotEqualItem) {
        const { count, fileName, differentPixelCount } = theNotEqualItem,
            span = document.createElement('span')

        span.className = 'equal_entry'
        span.innerText = `[×] ${index + 1}/${count} ${fileName} has ${differentPixelCount} pixels difference.`

        getNotEqualsDetailEl().appendChild(span)
        getNotEqualsDetailEl().children[0].style.display = 'none'
    }
}

document.getElementById('runActual').addEventListener('click', async function () {
    const actualError = document.getElementById('actualError'),
        configFilePathOfActual = document.getElementById('configFilePathOfActual').value.trim(),
        equalsDetailEl = getEqualsDetailEl(),
        notEqualsDetailEl = getNotEqualsDetailEl()

    actualError.innerText = ''
    totalComparCount = 0
    equalsCount = 0
    notEqualsCount = 0
    equalsMap = {}
    notEqualsMap = {}

    if (!configFilePathOfActual) {
        actualError.innerText = '请输入配置文件路径'
        return
    }

    getEqualsSummaryEl().style.display = 'block'
    getNotEqualsSummaryEl().style.display = 'block'
    renderEqualsSummary()
    renderNotEqualsSummary()

    equalsDetailEl.children[0].style.display = 'block'
    while (equalsDetailEl.children.length > 1) {
        equalsDetailEl.children[1].remove()
    }

    notEqualsDetailEl.children[0].style.display = 'block'
    while (notEqualsDetailEl.children.length > 1) {
        notEqualsDetailEl.children[1].remove()
    }

    equalsDetailEl.style.display = 'none'
    notEqualsDetailEl.style.display = 'none'
    getEqualsTogglerEl().removeEventListener('click', toggleEquaslDetail)
    getEqualsTogglerEl().addEventListener('click', toggleEquaslDetail)
    getNotEqualsTogglerEl().removeEventListener('click', toggleNotEquaslDetail)
    getNotEqualsTogglerEl().addEventListener('click', toggleNotEquaslDetail)

    await prepare(configFilePathOfActual, START_MODE.actual, { onNotifyCompareProgress })
})