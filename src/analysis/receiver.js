const ACTION_TYPES = require('../enums/actionTypes')
const Collector = require('./collector')
const readFilePromise = require('fs-readfile-promise')

class Receiver {
    constructor(path) {
        this.path = path
        this.data = null
    }

    async init() {
        if (!this.data) {
            let configText = await readFilePromise(this.path, { encoding: 'utf8' }),
                configJson = JSON.parse(configText)

            this.data = configJson
        }
    }

    async dumpGroupedList() {
        await this.init()

        const keys = Object.keys(this.data),
            groupedList = {}

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i],
                dataList = this.data[key]

            const upperCasedKey = key.toUpperCase(),
                theActionType = ACTION_TYPES.get(upperCasedKey)
            if (theActionType) {
                groupedList[upperCasedKey] = dataList
            } else {
                throw `unknown action type: ${key}, all known action types are: ${ACTION_TYPES.enums.map(theEnum => theEnum.key.toLowerCase()).join(', ')}.`
            }
        }

        return groupedList
    }

    async dumpFlatList() {
        const groupedList = await this.dumpGroupedList()

        const keys = ACTION_TYPES.enums.map(theEnum => theEnum.key),
            collector = new Collector()

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i],
                dataList = groupedList[key]

            const theActionType = ACTION_TYPES.get(key)
            if (theActionType) {
                let entryList = dataList.map(data => theActionType.value.collect(data))
                collector.collect(theActionType, entryList)
            }
        }

        return collector.flat()
    }
}

module.exports = Receiver