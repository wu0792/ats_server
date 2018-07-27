const ACTION_TYPES = require('../enums/actionTypes')
const expect = require('expect-puppeteer')
const option = { timeout: 5000 }

const resolveValidSelector = (page, selectors) => {
    return Promise.race(selectors.map(selector => new Promise(async (resolve, reject) => {
        await expect(page).toMatchElement(selector, option)
        resolve(selector)
    })))
}

class ActionEntryBase {
    constructor(data) {
        this.data = data
    }

    getActionType() {
        throw 'should be override and never run here.'
    }

    async process(page) {

    }

    async assert(page) {

    }
}

class NetworkActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.NETWORK
    }
}

class NavigateActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.NAVIGATE
    }

    async process(page) {
        const { url } = this.data
        await page.goto(url)
    }
}

class MutationActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.MUTATION
    }
}

class KeyPressActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.KEYDOWN
    }

    async process(page) {
        console.log('start key press.')
        console.log(this.data)
        const { target, code, shift } = this.data
        const validSelector = await resolveValidSelector(page, target)
        await page.focus(validSelector)
        shift && await page.keyboard.down('Shift')
        code && await page.keyboard.press(code)
        shift && await page.keyboard.up('Shift')
        console.log('end key press')
    }
}

class MouseOverActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.MOUSEOVER
    }

    async process(page) {
        console.log('start mouse over.')
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(page, target)
        await expect(page).toMatchElement(validSelector, option)
        await page.hover(target)
        console.log('end mouse over')
    }
}

class ClickActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.CLICK
    }

    async process(page) {
        console.log('start click.')
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(page, target)
        await page.click(validSelector)
        console.log('end click')
    }
}

class ScrollActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.SCROLL
    }
}

class ResizeActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.RESIZE
    }
}

module.exports = {
    ActionEntryBase,
    NetworkActionEntry,
    NavigateActionEntry,
    MutationActionEntry,
    KeyPressActionEntry,
    MouseOverActionEntry,
    ClickActionEntry,
    ScrollActionEntry,
    ResizeActionEntry
}