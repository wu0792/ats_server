const ACTION_TYPES = require('../enums/actionTypes')
const delay = require('../common/delay')
const asyncForEach = require('../common/asyncForEach')
const startCompare = require('../analysis/compare')

class Director {
    constructor(mode, notifier, page, groupedList, systemInfo, flatList, noMockUrls) {
        this.mode = mode
        this.notifier = notifier
        this.page = page
        this.systemInfo = systemInfo
        this.groupedList = groupedList
        this.flatList = flatList
        // the urls has two formats:
        // ['oldurl.com/old/path1.js']
        // ['oldurl.com/old/path2.js=>newUrl.com/new/path2.js',
        //  'oldurl.com/old/(.*).js=>newUrl.com/new/$1.js']
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

    async onDomContentLoaded(navigateId) {
        const navigateEntry = this.flatList.find(entry => entry.data.id === navigateId)
        if (navigateEntry) {
            this.notifier.onFinishExpectEntry(navigateEntry)
        }

        await asyncForEach(this.flatList, async (entry, i) => {
            const id = entry.data.id

            if (id > this.currentNavigateId && id < this.nextNavigateId) {
                // const delayPromise = delay(i === 0 ? 0 : (new Date(this.flatList[i].data.time) - new Date(this.flatList[i - 1].data.time)))

                try {
                    // await delayPromise

                    this.notifier.onStartExpectEntry(entry)
                    await entry.process(this.page, this.systemInfo, this.mode)
                    this.notifier.onFinishExpectEntry(entry)
                } catch (ex) {
                    this.notifier.onExpectEntryFailure(entry, ex)
                }
            }

            if (i === this.flatList.length - 1) {
                console.log('finish all process.')

                if (this.mode.value.needCompare) {
                    startCompare(this.systemInfo.id, this.notifier.onNotifyCompareProgress)
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