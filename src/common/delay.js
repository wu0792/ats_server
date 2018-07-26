const delay = (druation) => new Promise((resolve) => druation ? setTimeout(resolve, druation) : resolve())


module.exports = {
    delay
}