const isElementVisible = (el) => {
    return el && el.style.display !== 'none' || el.style.visibility === 'visible' || el.style.opacity !== '0'
}

module.exports = isElementVisible