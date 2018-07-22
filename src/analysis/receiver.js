const ACTION_TYPES = require('../enums/actionTypes')
const Collector = require('./collector')
const readFilePromise = require('fs-readfile-promise')

class Receiver {
    constructor(path) {
        this.path = path
        this.data = null
    }

    async init() {
        let configText = await readFilePromise(this.path, { encoding: 'utf8' }),
            configJson = JSON.parse(configText)

        this.data = configJson
    }

    async dump() {
        await this.init()

        const keys = Object.keys(this.data),
            collector = new Collector()

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i],
                dataList = this.data[key]

            const theActionType = ACTION_TYPES.get(key.toUpperCase())
            if (theActionType) {
                let entryList = dataList.map(data => theActionType.value.collect(data))
                collector.collect(theActionType, entryList)
            } else {
                throw `unknown action type: ${key}, all known action types are: ${ACTION_TYPES.enums.map(theEnum => theEnum.key.toLowerCase()).join(', ')}.`
            }
        }

        return collector.flat()
    }
}

module.exports = Receiver