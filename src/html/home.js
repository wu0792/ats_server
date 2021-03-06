const Receiver = require('../analysis/receiver')
const Director = require('../actor/director')
const SaveFile = require('../common/saveFile')
const START_MODE = require('../enums/startMode')
const puppeteer = require('puppeteer')
const getNowString = require('../common/getNowString')
const readFilePromise = require('fs-readfile-promise')
const getImageBase64 = require('../common/getImageBase64')
const fs = require('fs')
const { onSetChromiumPath, onGetChromiumPath } = require('../common/chromiumPathHandler')
const SystemInfo = require('../analysis/systemInfo')

let systemInfo,
    browser,
    chromiumPath = ''

document.title = `ATS ${SystemInfo.version}`

let checkChromiumPath = () => {
    onGetChromiumPath().then(path => {
        chromiumPath = path
        if (!chromiumPath || !fs.existsSync(chromiumPath)) {
            onSetChromiumPath(newPath => {
                chromiumPath = newPath
                checkChromiumPath()
            })
        }
    })
}

checkChromiumPath()

/**
 * 
 * @param {run mode: expect/actual} mode 
 * @param {the grouped data retrieved from data file} groupedList 
 * @param {some system info like version, id etc} systemInfo 
 * @param {the flat data retrieved from data file} flatList 
 * @param {urls that config the mock} noMockUrls
 */
async function runPuppeteer(mode, notifier, groupedList, systemInfo, flatList, noMockUrls, looseAjaxUrls, isPreview) {
    if (browser) {
        await browser.close()
    }

    const { innerWidth, innerHeight } = systemInfo.initSize
    browser = await puppeteer.launch({
        headless: !isPreview,
        slowMo: 25,
        executablePath: chromiumPath,
        args: [
            '--disable-infobars',
            // `--window-size=${outerWidth},${outerHeight}`,
            '--start-maximized'
        ]
    })

    const page = await browser.newPage()
    await page.setRequestInterception(true)
    await page.setViewport({ width: innerWidth, height: innerHeight })

    const director = new Director(mode, notifier, page, groupedList, systemInfo, flatList, noMockUrls, looseAjaxUrls, isPreview)
    await director.preProcess()
}

//tab1.saveConfig
document.getElementById('saveConfig').addEventListener('click', function () {
    let dataFilePath = document.getElementById('dataFilePath').value.trim(),
        processMultipleText = (value) => value.trim().split('\n').map(val => val.trim()).filter(val => val),
        noMockUrls = processMultipleText(document.getElementById('noMockUrls').value),
        looseAjaxUrls = processMultipleText(document.getElementById('looseAjaxUrls').value),
        title = document.getElementById('title').value.trim()

    if (!dataFilePath) {
        alert('请输入数据文件路径')
        return
    }

    let data = {
        dataFilePath,
        title,
        noMockUrls,
        looseAjaxUrls
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
async function prepare(configFilePath, mode, notifier, isPreview) {
    const configJson = await readConfigFrom(configFilePath),
        { dataFilePath, noMockUrls, looseAjaxUrls } = configJson,
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

    systemInfo = wrapper.systemInfo

    runPuppeteer(mode, notifier, wrapper.groupedList, wrapper.systemInfo, list, noMockUrls, looseAjaxUrls, isPreview)
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
                li.className = `progress_entry finish ${finishEntry.skip ? 'skip' : ''}`
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
    }, false)
})

document.getElementById('runExpectPreview').addEventListener('click', async function () {
    initForRepeatProgress(EXPECT, {
        onStartProcess: entry => onStartProcess(EXPECT, entry),
        onEntryFailure: (entry, ex) => onEntryFailure(EXPECT, entry, ex),
        onStartEntry: entry => onStartEntry(EXPECT, entry),
        onFinishEntry: (entry) => onFinishEntry(EXPECT, entry)
    }, true)
})

async function initForRepeatProgress(type, notifier, isPreview) {
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

    await prepare(configFilePath, START_MODE.get(type), notifier, isPreview)
}

//tab3.run actual
let equalsMap = {},
    notEqualsMap = {},
    totalComparCount = 0,
    equalsCount = 0,
    notEqualsCount = 0

const getEqualsTogglerEl = () => document.querySelector('.equalDetailToggler'),
    getEqualsDetailEl = () => document.getElementById('compareEqualsDetail'),
    getCompareSummaryEl = () => document.getElementById('compareSummary'),
    getNotEqualsTogglerEl = () => document.querySelector('.notEqualDetailToggler'),
    getNotEqualsDetailEl = () => document.getElementById('compareNotEqualsDetail'),
    getEqualsCountEl = () => document.getElementById('equalsCount'),
    getTotalCountOfEqualEl = () => document.getElementById('totalCountOfEqual'),
    getNotEqualsEl = () => document.getElementById('notEqualsCount')

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

    renderCompareSummary()
}

const renderCompareSummary = () => {
    getEqualsCountEl().innerText = equalsCount
    getNotEqualsEl().innerText = notEqualsCount
    getTotalCountOfEqualEl().innerText = totalComparCount
}

const renderEqualsDetail = (index) => {
    const theEqualItem = equalsMap[index]
    if (theEqualItem) {
        const { count, fileName } = theEqualItem,
            span = document.createElement('span')

        span.className = 'equal_entry'
        span.innerHTML = `<span class='correct'>√</span> ${fileName}`

        getEqualsDetailEl().appendChild(span)
        getEqualsDetailEl().children[0].style.display = 'none'
    }
}

const renderNotEqualsDetail = (index) => {
    const theNotEqualItem = notEqualsMap[index]
    if (theNotEqualItem) {
        const { fileName, differentPixelCount } = theNotEqualItem,
            span = document.createElement('span'),
            fileNameReg = /(\d+)\.[A-Z]+/i,
            fileNameMatch = fileName.match(fileNameReg),
            id = fileNameMatch.length === 2 ? fileNameMatch[1] : 0

        span.className = 'equal_entry'
        span.innerHTML = `<span class='error'>×</span> ${fileName} ${differentPixelCount} 不同像素点<a href='javascript:void(0);'><span class='viewNotEqualImage' fileId='${id}'>...</span></a>`
        span.querySelector('.viewNotEqualImage').addEventListener('click', (ev) => toggleNotEqualImage(ev))

        getNotEqualsDetailEl().appendChild(span)
        getNotEqualsDetailEl().children[0].style.display = 'none'
    }
}

async function toggleNotEqualImage(ev) {
    const target = ev.target,
        next = target.parentElement.parentElement.nextElementSibling,
        expand = next && next.nodeName === 'DIV' && next.getAttribute('imageRoot')

    if (expand) {
        next.remove()
    } else {
        const fileId = target.getAttribute('fileId'),
            dataId = systemInfo.id,
            expectPath = `./expect/${dataId}/${fileId}.png`,
            actualPath = `./actual/${dataId}/${fileId}.png`,
            comparePath = `./compare/${dataId}/${fileId}.png`

        let expectImage = new Image(),
            actualImage = new Image(),
            compareImage = new Image()

        let expectImageDiv = document.createElement('div'),
            actualImageDiv = document.createElement('div'),
            compareImageDiv = document.createElement('div')

        expectImageDiv.className = 'expectImage'
        actualImageDiv.className = 'actualImage'
        compareImageDiv.className = 'compareImage'

        const imageRoot = document.createElement('div')
        imageRoot.setAttribute('imageRoot', '1')

        imageRoot.appendChild(expectImageDiv)
        imageRoot.appendChild(actualImageDiv)
        imageRoot.appendChild(compareImageDiv)

        expectImageDiv.appendChild(expectImage)
        actualImageDiv.appendChild(actualImage)
        compareImageDiv.appendChild(compareImage)

        target.parentElement.parentElement.after(imageRoot)

        const base64Expect = await getImageBase64(expectPath)
        const base64Actual = await getImageBase64(actualPath)
        const base64Compare = await getImageBase64(comparePath)

        expectImage.src = base64Expect
        actualImage.src = base64Actual
        compareImage.src = base64Compare
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

    getCompareSummaryEl().style.display = 'block'
    renderCompareSummary()

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
    }, false)
})

document.getElementById('runActualPreview').addEventListener('click', async function () {
    regEventForCompareResult()
    await initForRepeatProgress(ACTUAL, {
        onNotifyCompareProgress,
        onStartProcess: entry => onStartProcess(ACTUAL, entry),
        onEntryFailure: (entry, ex) => onEntryFailure(ACTUAL, entry, ex),
        onStartEntry: entry => onStartEntry(ACTUAL, entry),
        onFinishEntry: (entry) => onFinishEntry(ACTUAL, entry)
    }, true)
})