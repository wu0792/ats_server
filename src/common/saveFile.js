/**
 * 保存文件到本地
 */
class SaveFile {
    /**
     * 保存json格式
     * @param {待保存数据} data 
     * @param {document对象} theDocument 
     * @param {文件名} fileName 
     */
    static saveJson(data, theDocument, fileName) {
        let saveByteArray = (function () {
            let a = theDocument.createElement("a")
            theDocument.body.appendChild(a)
            a.style = "display: none"

            return function (data, name) {
                let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                let url = theDocument.defaultView.URL.createObjectURL(blob)
                a.href = url
                a.download = name
                a.click()
                theDocument.defaultView.URL.revokeObjectURL(url)
            }
        }())

        saveByteArray(data, fileName)
    }
}

module.exports = SaveFile