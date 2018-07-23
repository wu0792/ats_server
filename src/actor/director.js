const ACTION_TYPES = require('../enums/actionTypes')

class Director {
    constructor(page, groupedList, flatList) {
        this.page = page
        this.groupedList = groupedList
        this.flatList = flatList
    }

    async preProcess() {
        const actionTypes = ACTION_TYPES.enums
        actionTypes.forEach(async actionType => {
            await actionType.value.preProcess(this.page, this.groupedList[actionType.key])
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