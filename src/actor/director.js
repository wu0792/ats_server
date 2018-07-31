const ACTION_TYPES = require('../enums/actionTypes')
const { delay } = require('../common/delay')

class Director {
    constructor(page, groupedList, systemInfo, flatList) {
        this.page = page
        this.systemInfo = systemInfo
        this.groupedList = groupedList
        this.flatList = flatList
        this.currentNavigateId = NaN
        this.nextNavigateId = NaN
    }

    async onDomContentLoaded() {
        // console.log(`onDomContentLoaded:this.currentNavigateId(${this.currentNavigateId}),this.nextNavigateId(${this.nextNavigateId})`)

        let i = -1
        for (const entry of this.flatList) {
            i++
            const id = entry.data.id

            if (id > this.currentNavigateId && id < this.nextNavigateId) {
                const delayPromise = delay(i === 0 ? 0 : (new Date(this.flatList[i].data.time) - new Date(this.flatList[i - 1].data.time)))

                try {
                    // await delayPromise
                    console.log('start entry.id:' + entry.data.id)
                    console.log(entry)
                    await entry.process(this.page, this.systemInfo)
                    console.log('finish entry.id:' + entry.data.id)
                } catch (ex) {
                    // console.warn(`entry.process exception:`)
                    // console.warn(entry)
                    console.warn(ex)
                }
            }

            if (i === this.flatList.length - 1) {
                console.log('finish all process.')
            }
        }
    }

    async preProcess() {
        const actionTypes = ACTION_TYPES.enums
        for (const actionType of actionTypes) {
            await actionType.value.preProcess(this)
        }
    }
}

module.exports = Director