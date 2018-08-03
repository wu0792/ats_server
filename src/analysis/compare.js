const fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch')

function doCompare(id, fileName,index,count) {
    let img1 = fs.createReadStream(`./expect/${id}/${fileName}`).pipe(new PNG()).on('parsed', compare),
        img2 = fs.createReadStream(`./actual/${id}/${fileName}`).pipe(new PNG()).on('parsed', compare),
        filesRead = 0;

    function compare() {
        if (++filesRead < 2) return;
        let diff = new PNG({ width: img1.width, height: img1.height })

        const differentPixelCount = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });
        if (differentPixelCount === 0) {
            console.log(`[√] ${index+1}/${count} ${fileName} equal.`)
        } else {
            console.log(`[×] ${index+1}/${count} ${fileName} has ${differentPixelCount} pixels difference.`)
        }

        if (differentPixelCount > 0) {
            diff.pack().pipe(fs.createWriteStream(`./compare/${id}/${fileName}`))
        }
    }
}

function startCompare(id) {
    const root = `./expect/${id}`

    fs.readdir(root, (err, files) => {
        if (err) {
            console.error(err)
        } else {
            const count = files.length
            files.forEach((file, index) => {
                doCompare(id, file, index,count)
            })
        }
    })


}

module.exports = startCompare