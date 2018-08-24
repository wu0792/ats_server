const querySelector = async (page, validSelector) => {
    const elInfo = await page.evaluate((selector) => {
        let el = document.querySelector(selector),
            nodeName, nodeWith, nodeHeight
        if (el) {
            nodeName = el.nodeName
            nodeWith = el.offsetWidth
            nodeHeight = el.offsetHeight
        }

        return { scrollX, scrollY, nodeName, nodeWith, nodeHeight }
    }, validSelector)

    return elInfo
}

module.exports = querySelector