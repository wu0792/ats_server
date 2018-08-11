const Enum = require('enum')

const START_MODE = new Enum({
    expect: {
        canMock: false
    },
    actual: {
        canMock: true
    }
})

module.exports = START_MODE