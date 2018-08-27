const querySelector = async (page, validSelector) => {
    const elInfo = await page.evaluate((selector) => {
        let el = document.querySelector(selector),
            nodeName, nodeWith, nodeHeight,
            positionX, positionY

        if (el) {
            nodeName = el.nodeName
            nodeWith = el.offsetWidth
            nodeHeight = el.offsetHeight
            boundingRect = el.getBoundingClientRect()
            positionX = boundingRect.x
            positionY = boundingRect.y
        }

        return { scrollX, scrollY, nodeName, nodeWith, nodeHeight, positionX, positionY }
    }, validSelector)

    return elInfo
}

module.exports = querySelector