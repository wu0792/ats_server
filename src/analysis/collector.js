class Collector {
    constructor() {
        this.entryListMap = new Map()
    }

    collect(actionType, entryList) {
        this.entryListMap.set(actionType.key, entryList)
    }

    flat() {
        let keys = this.entryListMap.keys(),
            flatList = []

        let current = keys.next()
        while (!current.done) {
            flatList = flatList.concat(this.entryListMap.get(current.value))
            current = keys.next()
        }

        flatList.sort((prev, next) => prev.data.id - next.data.id)

        return flatList
    }
}

module.exports = Collector