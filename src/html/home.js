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

    const { onStartProcess, onEntryFailure, onStartEntry, onFinishEntry } = notifier
    !onStartProcess && (notifier.onStartProcess = () => { })
    !onEntryFailure && (notifier.onEntryFailure = () => { })
    !onStartEntry && (notifier.onStartEntry = () => { })
    !onFinishEntry && (notifier.onFinishEntry = () => { })
    !onNotifyCompareProgress && (notifier.onNotifyCompareProgress = () => { })

    runPuppeteer(mode, notifier, wrapper.groupedList, wrapper.systemInfo, list, noMockUrls)
}

//tab2.run expect
const EXPECT = 'expect',
    ACTUAL = 'actual'

let finishMap = { [EXPECT]: {}, [ACTUAL]: {} },
    failureMap = { [EXPECT]: {}, [ACTUAL]: {} },
    totalCount = { [EXPECT]: 0, [ACTUAL]: 0 },
    finishCount = { [EXPECT]: 0, [ACTUAL]: 0 },
    failureCount = { [EXPECT]: 0, [ACTUAL]: 0 }

const getSummaryEl = (type) => document.getElementById(`${type}Summary`),
    getTogglerEl = (type) => getSummaryEl(type).querySelector('.toggler'),
    getDetailEl = (type) => document.getElementById(`${type}Detail`),
    getFinishCountEl = (type) => document.getElementById(`${type}FinishCount`),
    getFailureCountEl = (type) => document.getElementById(`${type}FailureCount`),
    getTotalCountEl = (type) => document.getElementById(`${type}TotalCount`),
    toggleDetail = (type) => {
        let detail = getDetailEl(type)
        detail.style.display = detail.style.display === 'none' ? 'block' : 'none'
    },
    toggleExpectDetail = () => {
        toggleDetail(EXPECT)
    },
    toggleActualDetail = () => {
        toggleDetail(ACTUAL)
    },
    renderSummary = (type) => {
        getFinishCountEl(type).innerText = finishCount[type]
        getFailureCountEl(type).innerText = failureCount[type]
        getTotalCountEl(type).innerText = totalCount[type]
    },
    renderDetail = (type, id) => {
        const finishEntry = finishMap[type][id],
            failureEntry = failureMap[type][id]

        if (finishEntry || failureEntry) {
            const li = document.createElement('li')

            if (finishEntry) {
                li.className = 'progress_entry finish'
                li.innerHTML = finishEntry.render()
            } else {
                li.className = 'progress_entry error'
                li.innerHTML = failureEntry.render()
                li.setAttribute('title', failureEntry.error ? failureEntry.error.message : '')
            }

            getDetailEl(type).appendChild(li)
            getDetailEl(type).children[0].style.display = 'none'
        }
    },
    onStartProcess = (type, count) => {
        totalCount[type] = count
    },
    onStartEntry = (type, entry) => {
    },
    onFinishEntry = (type, entry) => {
        if (entry.error) {
            onEntryFailure(type, entry, new Error(entry.error))
        } else {
            const id = entry.data.id
            finishMap[type][id] = entry
            finishCount[type]++

            renderSummary(type)
            renderDetail(type, id)
        }
    },
    onEntryFailure = (type, entry, ex) => {
        const id = entry.data.id
        entry.error = ex
        failureMap[type][id] = entry
        failureCount[type]++

        renderSummary(type)
        renderDetail(type, id)
    }

document.getElementById('runExpect').addEventListener('click', async function () {
    initForRepeatProgress(EXPECT, {
        onStartProcess: entry => onStartProcess(EXPECT, entry),
        onEntryFailure: (entry, ex) => onEntryFailure(EXPECT, entry, ex),
        onStartEntry: entry => onStartEntry(EXPECT, entry),
        onFinishEntry: (entry) => onFinishEntry(EXPECT, entry)
    })
})

async function initForRepeatProgress(type, notifier) {
    const error = document.getElementById(`${type}Error`),
        configFilePath = document.getElementById(`${type}ConfigFilePath`).value.trim()

    error.innerText = ''

    if (!configFilePath) {
        error.innerText = '请输入配置文件路径'
        return
    }

    finishMap[type] = {}
    totalCount[type] = 0
    finishCount[type] = 0
    failureCount[type] = 0

    let detailEl = getDetailEl(type)
    detailEl.children[0].style.display = 'block'
    while (detailEl.children.length > 1) {
        detailEl.children[1].remove()
    }

    getSummaryEl(type).style.display = 'block'
    getDetailEl(type).style.display = 'none'

    const theToggleDetail = type === EXPECT ? toggleExpectDetail : toggleActualDetail
    getTogglerEl(type).removeEventListener('click', theToggleDetail)
    getTogglerEl(type).addEventListener('click', theToggleDetail)

    await prepare(configFilePath, START_MODE.get(type), notifier)
}

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

function regEventForCompareResult() {
    const equalsDetailEl = getEqualsDetailEl(),
        notEqualsDetailEl = getNotEqualsDetailEl()

    totalComparCount = 0
    equalsCount = 0
    notEqualsCount = 0
    equalsMap = {}
    notEqualsMap = {}

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
}

document.getElementById('runActual').addEventListener('click', async function () {
    regEventForCompareResult()
    await initForRepeatProgress(ACTUAL, {
        onNotifyCompareProgress,
        onStartProcess: entry => onStartProcess(ACTUAL, entry),
        onEntryFailure: (entry, ex) => onEntryFailure(ACTUAL, entry, ex),
        onStartEntry: entry => onStartEntry(ACTUAL, entry),
        onFinishEntry: (entry) => onFinishEntry(ACTUAL, entry)
    })
})