const ACTION_TYPES = require('../enums/actionTypes')
const { delay } = require('../common/delay')

class Director {
    constructor(page, groupedList, flatList) {
        this.page = page
        this.groupedList = groupedList
        this.flatList = flatList
        this.currentNavigateId = NaN
        this.nextNavigateId = NaN
    }

    async onDomContentLoaded() {
        console.log(`onDomContentLoaded:this.currentNavigateId(${this.currentNavigateId}),this.nextNavigateId(${this.nextNavigateId})`)

        let i = -1
        for (const entry of this.flatList) {
            i++
            const id = entry.data.id

            if (id > this.currentNavigateId && id < this.nextNavigateId) {
                const delayPromise = delay(i === 0 ? 0 : (new Date(this.flatList[i].data.time) - new Date(this.flatList[i - 1].data.time)))

                try {
                    // await delayPromise
                    await entry.process(this.page)
                } catch (ex) {
                    console.warn(`entry.process exception:`)
                    console.warn(entry)
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