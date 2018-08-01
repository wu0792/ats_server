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
                resolve(null)
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

    async process(page, systemInfo) {

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

    async process(page, systemInfo) {
        const { url } = this.data
        await page.goto(url)
    }
}

let lastMutationTarget = null,
    lastMutationDateTime = null
class MutationActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'MUTATION'
    }

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target } = this.data

        if (lastMutationTarget === null) {
            lastMutationTarget = [...target]
        }

        if (lastMutationDateTime === null) {
            lastMutationDateTime = new Date()
        }

        if (target.every(selector => lastMutationTarget.indexOf(selector) >= 0) && (new Date() - lastMutationDateTime < 1000)) {
            return
        }

        const validSelector = await resolveValidSelector(this.data.id, page, lastMutationTarget)

        if (validSelector) {
            // console.log('start screenshot.')
            let position = await page.evaluate((theSelector, id) => {
                let maxWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                    maxHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
                    offsetLeftToRoot = 0,
                    offsetTopToRoot = 0,
                    calcOffsetToParent = (el) => {
                        offsetLeftToRoot += el.offsetLeft
                        offsetTopToRoot += el.offsetTop

                        if (el.offsetParent) {
                            calcOffsetToParent(el.offsetParent)
                        }
                    }

                let targetEl = document.querySelector(theSelector)
                if (targetEl) {
                    calcOffsetToParent(targetEl)
                } else {
                    throw `invalid selector while screenshot: ${theSelector}, id:${id}`
                }

                return {
                    width: Math.min(targetEl.offsetWidth, maxWidth),
                    height: Math.min(targetEl.offsetHeight, maxHeight),
                    left: offsetLeftToRoot,
                    top: offsetTopToRoot
                }
            }, validSelector, this.data.id)

            // console.warn(`position:`)
            // console.warn(position)
            const { left, top, width, height } = position
            if (width > 0 && height > 0) {
                await page.screenshot({
                    quality: 100,
                    type: 'jpeg',
                    clip: { x: left, y: top, width: width, height: height },
                    path: `./record/${systemInfo.id}/${this.data.id}.jpeg`
                })
            } else {
                console.warn(`empty position: ${JSON.stringify(position)}`)
            }

            // console.log('end screenshot')

            lastMutationTarget = target
            lastMutationDateTime = new Date()
        }
    }
}

class FocusActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'FOCUS'
    }

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start focus.')
            await page.focus(validSelector)
            // console.log('end focus')
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

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start blur.')
            await page.evaluate((selector) => {
                document.querySelector(selector).blur()
            }, validSelector)
            // console.log('end blur')
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

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target, value } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start change.')
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
            // console.log('end change')
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

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start key down.')
            await page.keyboard.down(code)
            // console.log('end key down')
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

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start key up.')
            await page.keyboard.up(code)
            // console.log('end key up')
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

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start mouse down.')
            await page.mouse.down({ button: MOUSE_BUTTON_MAP[button] })
            // console.log('end key down')
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

    async process(page, systemInfo) {
        // console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            // console.log('start mouse up.')
            await page.mouse.up({ button: MOUSE_BUTTON_MAP[button] })
            // console.log('end key up')
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

    async process(page, systemInfo) {
        // console.log('start mouse over.')
        // console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this.data.id, page, target)

        if (validSelector) {
            await page.hover(validSelector)
            // console.log('end mouse over')
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

    async process(page, systemInfo) {
        // console.log('start scroll.')
        // console.log(this.data)
        const { x, y } = this.data
        const scrollPosition = await page.evaluate(() => {
            return { x: scrollX, y: scrollY }
        })

        if (scrollPosition.x - x || scrollPosition.y - y) {
            await page.evaluate((x1, y1) => {
                window.scrollTo(x1, y1)
            }, x, y)
            // console.log('end scroll')
        }
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