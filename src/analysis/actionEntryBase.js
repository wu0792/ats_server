const ACTION_TYPES = require('../enums/actionTypes')
const expect = require('expect-puppeteer')
const option = { timeout: 2000 }

const MOUSE_BUTTON_MAP = {
    0: 'left',
    1: 'middle',
    2: 'right'
}

const resolveValidSelector = (page, selectors) => {
    return Promise.race(selectors.map(selector => new Promise(async (resolve, reject) => {
        const matchPromise = expect(page).toMatchElement(selector, option)
        matchPromise.catch(ex => {
            console.warn('unable to match element:')
            console.warn(selectors)
            resolve(null)
        })

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

class FocusActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.FOCUS
    }

    async process(page) {
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start focus.')
            await page.focus(target)
            console.log('end focus')
        }
    }
}

class BlurActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.BLUR
    }

    async process(page) {
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start blur.')
            await page.evaluate((selector) => {
                document.querySelector(selector).blur()
            }, validSelector)
            console.log('end blur')
        }
    }
}

class ChangeActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.CHANGE
    }

    async process(page) {
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start change.')
            await page.evaluate((selector) => {
                document.querySelector(selector).dispatchEvent(new Event('change'))
            }, validSelector)
            console.log('end change')
        }
    }
}

class KeyDownActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.KEYDOWN
    }

    async process(page) {
        console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start key down.')
            await page.keyboard.down(code)
            console.log('end key down')
        }
    }
}

class KeyUpActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.KEYUP
    }

    async process(page) {
        console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start key up.')
            await page.keyboard.up(code)
            console.log('end key up')
        }
    }
}

class MouseDownActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.MOUSEDOWN
    }

    async process(page) {
        console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start mouse down.')
            await page.mouse.down({ button: MOUSE_BUTTON_MAP[button] })
            console.log('end key down')
        }
    }
}

class MouseUpActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return ACTION_TYPES.MOUSEUP
    }

    async process(page) {
        console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(page, target)

        if (validSelector) {
            console.log('start mouse up.')
            await page.mouse.up({ button: MOUSE_BUTTON_MAP[button] })
            console.log('end key up')
        }
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

        if (validSelector) {
            await expect(page).toMatchElement(validSelector, option)
            await page.hover(target)
            console.log('end mouse over')
        }
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

        if (validSelector) {
            await page.click(validSelector)
            console.log('end click')
        }
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
    FocusActionEntry,
    BlurActionEntry,
    ChangeActionEntry,
    KeyDownActionEntry,
    KeyUpActionEntry,
    MouseDownActionEntry,
    MouseUpActionEntry,
    MouseOverActionEntry,
    ClickActionEntry,
    ScrollActionEntry,
    ResizeActionEntry
}