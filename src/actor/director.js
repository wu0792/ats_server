const ACTION_TYPES = require('../enums/actionTypes')
const delay = require('../common/delay')
const asyncForEach = require('../common/asyncForEach')
const startCompare = require('../analysis/compare')
const MarkCursor = require('../common/markCursor')
const expect = require('expect-puppeteer')

class Director {
    constructor(mode, notifier, page, groupedList, systemInfo, flatList, noMockUrls, isPreview) {
        this.mode = mode
        this.notifier = notifier
        this.page = page
        this.systemInfo = systemInfo
        this.groupedList = groupedList
        this.flatList = flatList
        this.isPreview = isPreview
        this.finishedCount = 0
        // the urls has following formats:
        // ['oldurl.com/old/path1.js',
        //  'oldurl.com/old/path2.js=>newUrl.com/new/path2.js',
        //  'oldurl.com/old/(.*).js=>newUrl.com/new/$1.js',
        //  '*abc.com/path/def.ashx.*']     // the start (*) at begining means the url (abc.com/path/def.ashx.*) need not response from record, while respone directly
        // previous one just let the network go as real request, 
        // while the next one redirect to specific url : 
        this.noMockUrls = noMockUrls.map(noMockUrl => {
            //universal the format
            let arrowSplitIndex = noMockUrl.indexOf('=>'),
                startsWithStart = noMockUrl[0] === '*'

            if (startsWithStart) {
                noMockUrl = noMockUrl.substring(1)
            }

            if (arrowSplitIndex >= 0) {
                return [startsWithStart, noMockUrl.substring(0, arrowSplitIndex), noMockUrl.substring(arrowSplitIndex + 2)]
            } else {
                return [startsWithStart, noMockUrl, '']
            }
        })
        this.currentNavigateId = NaN
        this.nextNavigateId = NaN
    }

    async checkFinish() {
        if (this.finishedCount === this.flatList.length) {
            console.log('finish all process.')

            if (this.mode.value.needCompare) {
                await startCompare(this.systemInfo.id, this.notifier.onNotifyCompareProgress)
            }
        }
    }

    async onDomContentLoaded(navigateEntry) {
        this.finishedCount++

        if (this.isPreview) {
            await expect(this.page).toMatchElement('head', { timeout: 2000 })
            await expect(this.page).toMatchElement('body', { timeout: 2000 })
            await MarkCursor(this.page)
        }

        this.notifier.onFinishEntry(navigateEntry)

        let waitForNavigatePromiseList = [delay(3000)]
        let navigateFinishSelector = navigateEntry.flag
        if (navigateFinishSelector) {
            const hideMode = navigateFinishSelector[0] === '!'
            if (hideMode) {
                navigateFinishSelector = navigateFinishSelector.substring(1)
                waitForNavigatePromiseList.push(await page.waitForFunction(selector => !document.querySelector(selector), { timeout: 20000 }, navigateFinishSelector))
            } else {
                waitForNavigatePromiseList.push(await page.waitForFunction(selector => !!document.querySelector(selector), { timeout: 20000 }, navigateFinishSelector))
            }
        }

        await Promise.all(waitForNavigatePromiseList)

        await asyncForEach(this.flatList, async (entry, i) => {
            const id = entry.data.id

            if (id > this.currentNavigateId && id < this.nextNavigateId) {
                // const delayPromise = delay(i === 0 ? 0 : (new Date(this.flatList[i].data.time) - new Date(this.flatList[i - 1].data.time)))

                try {
                    // await delayPromise

                    this.notifier.onStartEntry(entry)
                    await entry.process(this.page, this.systemInfo, this.mode, this.isPreview)
                    this.notifier.onFinishEntry(entry)
                    this.finishedCount++
                    await this.checkFinish()
                } catch (ex) {
                    this.notifier.onEntryFailure(entry, ex)
                    this.finishedCount++
                    await this.checkFinish()
                }
            }
        })
    }

    async preProcess() {
        const totalCount = this.flatList.length
        this.notifier.onStartProcess(totalCount)

        const actionTypes = ACTION_TYPES.enums
        for (const actionType of actionTypes) {
            await actionType.value.preProcess(this)
        }
    }
}

module.exports = Director