const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')

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

                        request.respond({
                            status: status,
                            body: body,
                            headers: header
                        });
                    } else {
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



            //used to split user actions
            page.on('framenavigated', async frame => {
                if (frame !== page.mainFrame())
                    return

                let url = frame.url()

                director.currentNavigateId = entryList[0].id

                if (url !== entryList[0].url) {
                    console.error(`navigate url not matched with records, expected: ${entryList[0].url}, actual: ${url}`)
                }

                entryList.splice(0, 1)

                page.once('domcontentloaded', async theFrame => {

                })
            })
        }
    },
    MUTATION: {
        collect: (data) => new ActionEntry.MutationActionEntry(data),
        preProcess: async (director) => { }
    },
    KEYPRESS: {
        collect: (data) => new ActionEntry.KeyPressActionEntry(data),
        preProcess: async (director) => { }
    },
    MOUSEOVER: {
        collect: (data) => new ActionEntry.MouseOverActionEntry(data),
        preProcess: async (director) => { }
    },
    CLICK: {
        collect: (data) => new ActionEntry.ClickActionEntry(data),
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