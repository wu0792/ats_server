const isClickable = (nodeName) => {
    return ['INPUT', 'SELECT', 'TEXTAREA', 'A', 'BUTTON'].indexOf(nodeName) >= 0
}

module.exports = isClickable