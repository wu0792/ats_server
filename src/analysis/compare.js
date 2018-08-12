const fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch')

function doCompare(id, fileName, index, count, notifier) {
    let img1Path = `./expect/${id}/${fileName}`,
        img2Path = `./actual/${id}/${fileName}`,
        valid = true

    if (!fs.existsSync(img1Path)) {
        console.warn(`image not found at: ${img1Path}`)
        valid = false
    }

    if (!fs.existsSync(img2Path)) {
        console.warn(`image not found at: ${img2Path}`)
        valid = false
    }

    if (!valid) {
        return
    }

    let img1 = fs.createReadStream(img1Path).pipe(new PNG()).on('parsed', compare),
        img2 = fs.createReadStream(img2Path).pipe(new PNG()).on('parsed', compare),
        filesRead = 0;

    function compare() {
        if (++filesRead < 2) return;
        let diff = new PNG({ width: img1.width, height: img1.height })

        const differentPixelCount = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });
        if (differentPixelCount === 0) {
            notifier(index, count, fileName, 0)
        } else {
            notifier(index, count, fileName, differentPixelCount)
        }

        if (differentPixelCount > 0) {
            diff.pack().pipe(fs.createWriteStream(`./compare/${id}/${fileName}`))
        }
    }
}

function startCompare(id, notifier) {
    const root = `./expect/${id}`

    fs.readdir(root, (err, files) => {
        if (err) {
            console.error(err)
        } else {
            const count = files.length
            files.sort().forEach((file, index) => {
                doCompare(id, file, index, count, notifier)
            })
        }
    })


}

module.exports = startCompare