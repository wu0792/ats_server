const ACTION_TYPES = require('../enums/actionTypes')

class Director {
    constructor(page, groupedList, flatList) {
        this.page = page
        this.groupedList = groupedList
        this.flatList = flatList
        this.currentNavigateId = NaN
        this.nextNavigateId = NaN
    }

    async onDomContentLoaded() {
        for (let i = 0; i < this.flatList.length; i++) {
            const entry = this.flatList[i],
                id = entry.data.id

            if (id > this.currentNavigateId && id < this.nextNavigateId)
                await entry.process(this.page)
        }
    }

    async preProcess() {
        const actionTypes = ACTION_TYPES.enums
        actionTypes.forEach(async actionType => {
            await actionType.value.preProcess(this)
        })
    }
}

module.exports = Director