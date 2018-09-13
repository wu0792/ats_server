class SystemInfo {
    static get version() {
        return '1.0.1'  //当前版本       
    }

    constructor(configJson) {
        this.id = configJson.id
        this.dataVersion = configJson.version   //数据来源版本
        this.createAt = configJson.createAt
        this.rootTargets = configJson.rootTargets
        this.initSize = configJson.initSize
    }
}

module.exports = SystemInfo