const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')

const ACTION_TYPES = new Enum({
    NETWORK: {
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
        preProcess: async (page, entryList) => {
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
        preProcess: async (page, entryList) => { }
    },
    MUTATION: {
        collect: (data) => new ActionEntry.MutationActionEntry(data),
        preProcess: async (page, entryList) => { }
    },
    KEYPRESS: {
        collect: (data) => new ActionEntry.KeyPressActionEntry(data),
        preProcess: async (page, entryList) => { }
    },
    MOUSEOVER: {
        collect: (data) => new ActionEntry.MouseOverActionEntry(data),
        preProcess: async (page, entryList) => { }
    },
    CLICK: {
        collect: (data) => new ActionEntry.ClickActionEntry(data),
        preProcess: async (page, entryList) => { }
    },
    SCROLL: {
        collect: (data) => new ActionEntry.ScrollActionEntry(data),
        preProcess: async (page, entryList) => { }
    },
    RESIZE: {
        collect: (data) => new ActionEntry.ResizeActionEntry(data),
        preProcess: async (page, entryList) => { }
    },
})

module.exports = ACTION_TYPES 