const ACTION_TYPES = require('../enums/actionTypes')

class Director {
    constructor(page, groupedList, flatList) {
        this.page = page
        this.groupedList = groupedList
        this.flatList = flatList
        this.currentNavigateId = NaN
    }

    async preProcess() {
        const actionTypes = ACTION_TYPES.enums
        actionTypes.forEach(async actionType => {
            await actionType.value.preProcess(this)
        })
    }

    async process() {
        for (let i = 0; i < this.flatList.length; i++) {
            const entry = this.flatList[i]
            await entry.process(this.page)
        }
    }
}

module.exports = Director