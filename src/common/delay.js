const delay = (druation) => new Promise((resolve) => druation ? setTimeout(() => resolve(0), druation) : resolve(-1))


module.exports = {
    delay
}