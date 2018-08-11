const Enum = require('enum')

const START_MODE = new Enum({
    expect: {
        canMock: false,
        needCompare: false
    },
    actual: {
        canMock: true,
        needCompare: true
    }
})

module.exports = START_MODE