const ACTION_TYPES = require('../enums/actionTypes')
const delay = require('../common/delay')
const asyncForEach = require('../common/asyncForEach')

class Director {
    constructor(mode, page, groupedList, systemInfo, flatList, urls) {
        this.mode = mode
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
        this.noMockUrls = urls.map(url => {
            //universal the format
            let arrowSplitIndex = url.indexOf('=>')
            if (arrowSplitIndex >= 0) {
                return [url.substring(0, arrowSplitIndex), url.substring(arrowSplitIndex + 2)]
            } else {
                return [url, '']
            }
        })
        this.currentNavigateId = NaN
        this.nextNavigateId = NaN
    }

    async onDomContentLoaded() {
        await asyncForEach(this.flatList, async (entry, i) => {
            const id = entry.data.id

            if (id > this.currentNavigateId && id < this.nextNavigateId) {
                const delayPromise = delay(i === 0 ? 0 : (new Date(this.flatList[i].data.time) - new Date(this.flatList[i - 1].data.time)))

                try {
                    // await delayPromise
                    console.log('start entry.id:' + entry.data.id)
                    console.log(entry)
                    await entry.process(this.page, this.systemInfo, this.mode)
                    console.log('finish entry.id:' + entry.data.id)
                } catch (ex) {
                    console.warn(ex)
                }
            }

            if (i === this.flatList.length - 1) {
                console.log('finish all process.')
            }
        })
    }

    async preProcess() {
        const actionTypes = ACTION_TYPES.enums
        for (const actionType of actionTypes) {
            await actionType.value.preProcess(this)
        }
    }
}

module.exports = Director