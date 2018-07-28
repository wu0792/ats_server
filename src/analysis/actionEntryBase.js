const expect = require('expect-puppeteer')
const option = { timeout: 2000, polling: 'mutation' }

const MOUSE_BUTTON_MAP = {
    0: 'left',
    1: 'middle',
    2: 'right'
}

const resolveValidSelector = (id, page, selectors) => {
    return Promise.race(selectors.map(selector => new Promise(async (resolve, reject) => {
        const matchPromise = expect(page).toMatchElement(selector, option)
        matchPromise.catch(async ex => {
            let matchedSelectorInEvaluate = await page.evaluate((theSelectors) => {
                return theSelectors.find(selector => document.querySelector(selector))
            }, selectors)

            if (matchedSelectorInEvaluate) {
                resolve(matchedSelectorInEvaluate)
            } else {
                console.warn(`invalid selectors: ${selectors.join(' | ')}, id: ${id}`)
                console.warn(null)
            }
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
        return 'NETWORK'
    }
}

class NavigateActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'NAVIGATE'
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
        return 'MUTATION'
    }
}

class FocusActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'FOCUS'
    }

    async process(page) {
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            console.log('start focus.')
            await page.focus(validSelector)
            console.log('end focus')
        }
    }
}

class BlurActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'BLUR'
    }

    async process(page) {
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

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
        return 'CHANGE'
    }

    async process(page) {
        console.log(this.data)
        const { target, value } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            console.log('start change.')
            await page.evaluate((theSelector, theValue) => {
                // the change event may happen at input/textarea/select element,
                // the input/textarea change event always fired after keydown, keyup, blur event,
                // so the value always has been set to the element,
                // while select element may happen after click the select elemnt, and
                // the click on the option cann't be cauguth,
                // so we should manualy set the select element's value and then trigger the
                // change event
                const theElement = document.querySelector(theSelector)
                if (theElement.nodeName === 'SELECT') {
                    theElement.value = theValue
                }

                theElement.dispatchEvent(new Event('change'))
            }, validSelector, value)
            console.log('end change')
        }
    }
}

class KeyDownActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'KEYDOWN'
    }

    async process(page) {
        console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

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
        return 'KEYUP'
    }

    async process(page) {
        console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

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
        return 'MOUSEDOWN'
    }

    async process(page) {
        console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

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
        return 'MOUSEUP'
    }

    async process(page) {
        console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

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
        return 'MOUSEOVER'
    }

    async process(page) {
        console.log('start mouse over.')
        console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            await page.hover(validSelector)
            console.log('end mouse over')
        }
    }
}

class ScrollActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'SCROLL'
    }
}

class ResizeActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'RESIZE'
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
    ScrollActionEntry,
    ResizeActionEntry
}