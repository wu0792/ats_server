import { ACTION_TYPES } from '../enums/actionTypes';

const readFilePromise = require('fs-readfile-promise')

export class Receiver {
    async constructor(path) {
        let configText = await readFilePromise(path, { encoding: 'utf8' }),
            configJson = JSON.parse(configText)

        this.data = configJson
    }

    analysis() {
        const keys = Object.keys(this.data)
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i],
                list = this.data[key]

            const theActionType = ACTION_TYPES.get(key)
            if (theActionType) {
                
            } else {
                throw `unknown action type: ${key}, all known action types are: ${ACTION_TYPES.enums.map(theEnum => theEnum.key.toLowerCase()).join(', ')}.`
            }
        }
    }
}