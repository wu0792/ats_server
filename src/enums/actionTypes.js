const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')
const urlParser = require('url')
const fs = require('fs')

const ACTION_TYPES = new Enum({
    NETWORK: {
        ignoreNavigateDelay: true,
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
        preProcess: async (director) => {
            let page = director.page,
                toIgnoreUrlRegex = director.url ? new RegExp(director.url) : null,
                entryList = director.groupedList[ACTION_TYPES.NETWORK.key]

            if (entryList.length) {
                await page.setRequestInterception(true)
                page.on('request', request => {
                    const method = request.method(),
                        url = request.url()

                    if (toIgnoreUrlRegex && !toIgnoreUrlRegex.test(url)) {
                        const firstMatchedRequestIndex = entryList.findIndex(entry => {
                            return entry.url === url && entry.method === method
                        })

                        if (firstMatchedRequestIndex >= 0) {
                            const validRequest = entryList[firstMatchedRequestIndex],
                                { body, form, status, header } = validRequest

                            entryList.splice(firstMatchedRequestIndex, 1)

                            request.respond({
                                status: status,
                                body: body,
                                headers: header
                            })
                        } else {
                            request.continue()
                        }
                    } else {
                        request.continue()
                    }
                })
            }
        }
    },
    NAVIGATE: {
        ignoreNavigateDelay: true,
        collect: (data) => new ActionEntry.NavigateActionEntry(data),
        preProcess: async (director) => {
            let page = director.page,
                entryList = director.groupedList[ACTION_TYPES.NAVIGATE.key]

            if (entryList.length) {
                new ActionEntry.NavigateActionEntry(entryList[0]).process(page)
            } else {
                console.error('no navigate action found, unable to launch.')
            }

            //used to split user actions
            page.on('framenavigated', async frame => {
                if (frame !== page.mainFrame() || entryList.length === 0)
                    return

                // console.warn(`framenavigated, url:${frame.url()}`)
                let url = frame.url(),
                    allNavigateId = entryList.map(entry => entry.id),
                    firstEntry = entryList[0],
                    currentNavigateId = firstEntry.id,
                    firstEntryUrl = firstEntry.url

                if (url !== firstEntryUrl) {
                    const parsedPageUrl = urlParser.parse(firstEntryUrl),
                        hash = parsedPageUrl.hash

                    if (!hash || url !== firstEntryUrl.replace(hash, ''))
                        console.error(`navigate url not matched with records, expected: ${entryList[0].url}, actual: ${url}`)
                }

                entryList.splice(0, 1)

                const currentNavigateIdIndex = allNavigateId.indexOf(currentNavigateId),
                    nextNavigateId = allNavigateId[currentNavigateIdIndex + 1] || Infinity

                director.currentNavigateId = currentNavigateId
                director.nextNavigateId = nextNavigateId
                director.onDomContentLoaded()
            })
        }
    },
    MUTATION: {
        ignoreNavigateDelay: true,
        collect: (data) => new ActionEntry.MutationActionEntry(data),
        preProcess: async (director) => {
            let recordPath = `./record/${director.systemInfo.id}/`
            if (!fs.existsSync(recordPath)) {
                fs.mkdirSync(recordPath)
            }
        }
    },
    FOCUS: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.FocusActionEntry(data),
        preProcess: async (director) => { }
    },
    BLUR: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.BlurActionEntry(data),
        preProcess: async (director) => { }
    },
    CHANGE: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.ChangeActionEntry(data),
        preProcess: async (director) => { }
    },
    KEYDOWN: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.KeyDownActionEntry(data),
        preProcess: async (director) => { }
    },
    KEYUP: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.KeyUpActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEDOWN: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.MouseDownActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEUP: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.MouseUpActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEOVER: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.MouseOverActionEntry(data),
        preProcess: async (director) => { }
    },
    SCROLL: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.ScrollActionEntry(data),
        preProcess: async (director) => { }
    },
    RESIZE: {
        ignoreNavigateDelay: false,
        collect: (data) => new ActionEntry.ResizeActionEntry(data),
        preProcess: async (director) => { }
    },
})

module.exports = ACTION_TYPES 