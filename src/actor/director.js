class Director {
    constructor(page, entryList) {
        this.page = page
        this.entryList = entryList
    }

    async preProcess() {
        for (let i = 0; i < this.entryList.length; i++) {
            const entry = this.entryList[i]
            await entry.preProcess(this.page)
        }
    }

    async process() {
        for (let i = 0; i < this.entryList.length; i++) {
            const entry = this.entryList[i]
            await entry.process(this.page)
        }
    }
}

module.exports = Director