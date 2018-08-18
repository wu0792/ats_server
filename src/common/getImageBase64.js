const readFilePromise = require('fs-readfile-promise')
const path = require('path')

/**
 * get base64 string of image
 * @param {the image file path} filePath 
 */
const getImageBase64 = async (filePath) => {
    let buffer = await readFilePromise(filePath)

    //get image file extension name
    let extensionName = path.extname(filePath)

    //convert image file to base64-encoded string
    let base64Image = new Buffer(buffer, 'binary').toString('base64')

    //combine all strings
    return `data:image/${extensionName.split('.').pop()};base64,${base64Image}`
}

module.exports = getImageBase64