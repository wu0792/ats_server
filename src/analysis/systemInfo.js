class SystemInfo {
    constructor(configJson) {

        this.id = configJson.id
        this.version = configJson.version
        this.createAt = configJson.createAt
        this.rootTargets = configJson.rootTargets
    }
}

module.exports = SystemInfo