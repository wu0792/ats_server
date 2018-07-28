const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')
const urlParser = require('url')

const ACTION_TYPES = new Enum({
    NETWORK: {
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
        preProcess: async (director) => {
            let page = director.page,
                entryList = director.groupedList[ACTION_TYPES.NETWORK.key]

            if (entryList.length) {
                await page.setRequestInterception(true)
                page.on('request', request => {
                    const method = request.method(),
                        url = request.url(),
                        firstMatchedRequestIndex = entryList.findIndex(entry => {
                            return entry.url === url && entry.method === method
                        })

                    if (firstMatchedRequestIndex >= 0) {
                        const validRequest = entryList[firstMatchedRequestIndex],
                            { body, form, status, header } = validRequest

                        entryList.splice(firstMatchedRequestIndex, 1)

                        console.log(`request.response: ${url}`)
                        request.respond({
                            status: status,
                            body: body,
                            headers: header
                        });
                    } else {
                        console.log(`request.continue: ${url}`)
                        request.continue()
                    }
                })
            }
        }
    },
    NAVIGATE: {
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

                page.once('domcontentloaded', () => {
                    const currentNavigateIdIndex = allNavigateId.indexOf(currentNavigateId),
                        nextNavigateId = allNavigateId[currentNavigateIdIndex + 1] || Infinity

                    director.currentNavigateId = currentNavigateId
                    director.nextNavigateId = nextNavigateId
                    director.onDomContentLoaded()
                })
            })
        }
    },
    MUTATION: {
        collect: (data) => new ActionEntry.MutationActionEntry(data),
        preProcess: async (director) => { }
    },
    FOCUS: {
        collect: (data) => new ActionEntry.FocusActionEntry(data),
        preProcess: async (director) => { }
    },
    BLUR: {
        collect: (data) => new ActionEntry.BlurActionEntry(data),
        preProcess: async (director) => { }
    },
    CHANGE: {
        collect: (data) => new ActionEntry.ChangeActionEntry(data),
        preProcess: async (director) => { }
    },
    KEYDOWN: {
        collect: (data) => new ActionEntry.KeyDownActionEntry(data),
        preProcess: async (director) => { }
    },
    KEYUP: {
        collect: (data) => new ActionEntry.KeyUpActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEDOWN: {
        collect: (data) => new ActionEntry.MouseDownActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEUP: {
        collect: (data) => new ActionEntry.MouseUpActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEOVER: {
        collect: (data) => new ActionEntry.MouseOverActionEntry(data),
        preProcess: async (director) => { }
    },
    SCROLL: {
        collect: (data) => new ActionEntry.ScrollActionEntry(data),
        preProcess: async (director) => { }
    },
    RESIZE: {
        collect: (data) => new ActionEntry.ResizeActionEntry(data),
        preProcess: async (director) => { }
    },
})

module.exports = ACTION_TYPES 