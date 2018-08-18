const expect = require('expect-puppeteer')
const asyncSome = require('../common/asyncSome')
const delay = require('../common/delay')
const option = { timeout: 500, polling: 'mutation' }

const MOUSE_BUTTON_MAP = {
    0: 'left',
    1: 'middle',
    2: 'right'
}

const resolveValidSelector = (entry, page, selectors) => {
    let hasResolved = false,
        id = entry.data.id

    return Promise.race(selectors.map(selector => new Promise(async (resolve, reject) => {
        try {
            const matchPromise = await expect(page).toMatchElement(selector, option)
            if (hasResolved === false) {
                hasResolved = true
                resolve(selector)
            }
        } catch (error) {
            let matchedSelectorInEvaluate = await page.evaluate((theSelectors) => {
                return theSelectors.find(selector => document.querySelector(selector))
            }, selectors)

            if (matchedSelectorInEvaluate) {
                if (hasResolved === false) {
                    hasResolved = true
                    resolve(matchedSelectorInEvaluate)
                }
            } else {
                if (hasResolved === false) {
                    hasResolved = true
                    entry.error = new Error(`invalid selectors: ${selectors.join(' | ')}`)
                    resolve(null)
                }
            }
        }
    })))
}

const ifElIsChildOf = async (page, childSelector, parentSelector) => {
    if (childSelector && parentSelector) {
        let insideParent = await page.evaluate((theChildSelector, theParentSelector) => {
            const parentEl = document.querySelector(theParentSelector),
                ifElIsChildOfByEl = (childEl) => {
                    if (childEl) {
                        return childEl === parentEl || childEl.parentElement === parentEl || ifElIsChildOfByEl(childEl.parentElement)
                    } else {
                        return false
                    }
                }

            let childEl = document.querySelector(theChildSelector)
            if (childEl && parentEl) {
                return ifElIsChildOfByEl(childEl)
            } else {
                return false
            }
        }, childSelector, parentSelector)

        return insideParent
    } else {
        return false
    }
}

class ActionEntryBase {
    constructor(data) {
        this.data = data
    }

    getActionType() {
        throw 'should be override and never run here.'
    }

    async process(page, systemInfo, mode) {

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

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon network' title='[network]网络请求'></span><div class='entry network'>${this.data.url}</div>`
    }
}

class NavigateActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'NAVIGATE'
    }

    async process(page, systemInfo, mode) {
        const { url } = this.data
        await page.goto(url)
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon navigate' title='[navigate]页面跳转'></span><div class='entry navigate'>${this.data.url}</div>`
    }
}

class MutationActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'MUTATION'
    }

    async process(page, systemInfo, mode) {
        const { type: currentMutationType, target: currentTarget, time: currentTime } = this.data

        // skip current process if the target is the same as next entry, and interval is short enough
        // consider as the frames of animation
        const { target: nextTarget, time: nextTime } = this.next.data
        if (this.next.getActionType() === this.getActionType() && currentTarget.every(selector => nextTarget.indexOf(selector) >= 0 && (new Date(nextTime) - new Date(currentTime) <= 50))) {
            this.skip = true
            return
        }

        const currentValidSelector = await resolveValidSelector(this, page, currentTarget),
            targetSelectors = systemInfo.rootTargets,
            isInTargets = currentValidSelector && (targetSelectors.length === 0 || await asyncSome(targetSelectors, async targetSelector => {
                let isInsideTarget = await ifElIsChildOf(page, currentValidSelector, targetSelector)
                return isInsideTarget
            }))

        if (currentValidSelector && isInTargets) {
            let position = await page.evaluate((theSelector, id) => {
                let maxWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                    maxHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
                    targetEl = document.querySelector(theSelector)

                if (!targetEl) {
                    throw `invalid selector while screenshot: ${theSelector}, id:${id}`
                }

                const { left, top, width, height } = targetEl.getBoundingClientRect()

                return {
                    width: Math.min(width, maxWidth),
                    height: Math.min(height, maxHeight),
                    left: left + scrollX,
                    top: top + scrollY
                }
            }, currentValidSelector, this.data.id)

            const { left, top, width, height } = position
            if (width > 0 && height > 0) {
                await page.screenshot({
                    clip: { x: left, y: top, width: width, height: height },
                    path: `./${mode.key}/${systemInfo.id}/${this.data.id}.png`
                })
            } else {
                console.log(`no sized element, ${currentValidSelector}: ${JSON.stringify(position)}`)
            }
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon mutation' title='[mutation]页面DOM元素变化'></span><div class='entry mutation'>${this.data.target.join(' | ')}</div>`
    }
}

class FocusActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'FOCUS'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            // console.log('start focus.')
            await page.focus(validSelector)
            // console.log('end focus')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon focus' title='[focus]元素得到焦点'></span><div class='entry focus'>${this.data.target.join(' | ')}</div>`
    }
}

class BlurActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'BLUR'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            // console.log('start blur.')
            await page.evaluate((selector) => {
                document.querySelector(selector).blur()
            }, validSelector)
            // console.log('end blur')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon blur' title='[blur]元素丢失焦点'></span><div class='entry blur'>${this.data.target.join(' | ')}</div>`
    }
}

class ChangeActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'CHANGE'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target, value } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

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

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon change' title='[change]内容改变'></span><div class='entry change'>${this.data.target.join(' | ')}</div>`
    }
}

class KeyDownActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'KEYDOWN'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            // console.log('start key down.')
            await page.keyboard.down(code)
            // console.log('end key down')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon keydown' title='[keydown]键盘按下'></span><div class='entry keydown'>${this.data.target.join(' | ')}</div>`
    }
}

class KeyUpActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'KEYUP'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target, code } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            // console.log('start key up.')
            await page.keyboard.up(code)
            // console.log('end key up')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon keyup' title='[keyup]键盘弹起'></span><div class='entry keyup'>${this.data.target.join(' | ')}</div>`
    }
}

class MouseDownActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'MOUSEDOWN'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            // console.log('start mouse down.')
            await page.mouse.down({ button: MOUSE_BUTTON_MAP[button] })
            // console.log('end key down')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon mousedown' title='[mousedown]鼠标键按下'></span><div class='entry mousedown'>${this.data.target.join(' | ')}</div>`
    }
}

class MouseUpActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'MOUSEUP'
    }

    async process(page, systemInfo, mode) {
        // console.log(this.data)
        const { target, button } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            // console.log('start mouse up.')
            await page.mouse.up({ button: MOUSE_BUTTON_MAP[button] })
            // console.log('end key up')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon mouseup' title='[mouseup]鼠标键弹起'></span><div class='entry mouseup'>${this.data.target.join(' | ')}</div>`
    }
}

class MouseOverActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'MOUSEOVER'
    }

    async process(page, systemInfo, mode) {
        // console.log('start mouse over.')
        // console.log(this.data)
        const { target } = this.data
        const validSelector = await resolveValidSelector(this, page, target)

        if (validSelector) {
            await page.hover(validSelector)
            // console.log('end mouse over')
        }
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon mouseover' title='[mouseover]鼠标HOVER'></span><div class='entry mouseover'>${this.data.target.join(' | ')}</div>`
    }
}

class ScrollActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'SCROLL'
    }

    async process(page, systemInfo, mode) {
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

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon scroll' title='[scroll]屏幕滚动'></span><div class='entry scroll'>(x: ${this.data.x}, y:${this.data.y})</div>`
    }
}

class ResizeActionEntry extends ActionEntryBase {
    constructor(data) {
        super(data)
    }

    getActionType() {
        return 'RESIZE'
    }

    async process(page, systemInfo, mode) {
        const { width, height } = this.data
        await page.setViewport({ width, height })
    }

    render() {
        return `<span class='seq entry'>[${this.data.id}]</span><span class='icon resize' title='[resize]屏幕尺寸改变'></span><div class='entry resize'>(width: ${this.data.width}, height: ${this.data.height})</div>`
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