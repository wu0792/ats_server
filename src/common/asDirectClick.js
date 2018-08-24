const isClickable = require('./isClickable')

const asDirectClick = (nodeName, nodeWith, nodeHeight) => {
    return isClickable(nodeName) || nodeWith <= 50 || nodeHeight <= 50
}

module.exports = asDirectClick