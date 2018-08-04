const ACTION_TYPES = require('../enums/actionTypes')
const Collector = require('./collector')
const readFilePromise = require('fs-readfile-promise')
const SystemInfo = require('./systemInfo')

class Receiver {
    constructor(path) {
        this.path = path
        this.systemInfo = null
    }

    async init() {
        if (!this.data) {
            let configText = await readFilePromise(this.path, { encoding: 'utf8' }),
                configJson = JSON.parse(configText)

            this.systemInfo = new SystemInfo(configJson)
            this.data = configJson.data
        }
    }

    async dumpGroupedListWrapper() {
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

        return {
            groupedList,
            systemInfo: this.systemInfo
        }
    }

    async dumpFlatList() {
        const wrapper = await this.dumpGroupedListWrapper(),
            { groupedList } = wrapper

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