const ACTION_TYPES = require('../enums/actionTypes')
const delay = require('../common/delay')
const asyncForEach = require('../common/asyncForEach')
const startCompare = require('../analysis/compare')
const MarkCursor = require('../common/markCursor')
const expect = require('expect-puppeteer')

class Director {
    constructor(mode, notifier, page, groupedList, systemInfo, flatList, noMockUrls, looseAjaxUrls, isPreview) {
        this.mode = mode
        this.notifier = notifier
        this.page = page
        this.systemInfo = systemInfo
        this.groupedList = groupedList
        this.flatList = flatList
        this.isPreview = isPreview
        this.finishedCount = 0
        this.looseAjaxUrls = looseAjaxUrls
        this.checkFinishTimeoutFlag = null
        // the urls has following formats:
        // ['oldurl.com/old/path1.js',
        //  'oldurl.com/old/path2.js=>newUrl.com/new/path2.js',
        //  'oldurl.com/old/(.*).js=>newUrl.com/new/$1.js',
        //  '*abc.com/path/def.ashx.*']     // the start (*) at begining means the url (abc.com/path/def.ashx.*) need not response from record, while respone directly
        // previous one just let the network go as real request, 
        // while the next one redirect to specific url : 
        this.noMockUrls = noMockUrls.map(noMockUrl => {
            //universal the format
            let arrowSplitIndex = noMockUrl.indexOf('=>')

            if (arrowSplitIndex >= 0) {
                return [noMockUrl.substring(0, arrowSplitIndex), noMockUrl.substring(arrowSplitIndex + 2)]
            } else {
                return [noMockUrl, '']
            }
        })
        this.currentNavigateId = NaN
        this.nextNavigateId = NaN
    }

    async checkFinish() {
        const doCompare = async () => {
            await startCompare(this.systemInfo.id, this.notifier.onNotifyCompareProgress)
        }

        if (this.finishedCount === this.flatList.length) {
            console.log('finish all process.')

            if (this.mode.value.needCompare) {
                clearTimeout(this.checkFinishTimeoutFlag)
                await doCompare()
            }
        } else {
            // if no more action after 30s, we alse do compare
            if (this.mode.value.needCompare) {
                clearTimeout(this.checkFinishTimeoutFlag)
                this.checkFinishTimeoutFlag = setTimeout(async () => {
                    await doCompare()
                }, 30000)
            }
        }
    }

    async onDomContentLoaded(navigateEntry) {
        this.finishedCount++

        // await this.checkFinish()
        // return

        if (this.isPreview) {
            await expect(this.page).toMatchElement('head', { timeout: 30000 })
            await expect(this.page).toMatchElement('body', { timeout: 30000 })
            await MarkCursor(this.page)
        }

        this.notifier.onFinishEntry(this.flatList.find(entry => entry.data.id === navigateEntry.id))

        await delay(10000)

        const entryBelongToCurrentNavigate = this.flatList.filter(entry => entry.data.id > this.currentNavigateId && entry.data.id < this.nextNavigateId)
        await asyncForEach(entryBelongToCurrentNavigate, async (entry, i) => {
            try {
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