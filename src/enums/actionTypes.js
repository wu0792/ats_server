const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')

const ACTION_TYPES = new Enum({
    NETWORK: {
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
        preProcess: async (page, entryList) => {
            if (entryList.length) {
                await page.setRequestInterception(true)
                page.on('request', request => {
                    const url = request.url(),
                        matchedRequests = entryList.filter(entry => {
                            return entry.url === url
                        })

                    if (matchedRequests.length) {
                        // todo not get the first one
                        const validRequest = matchedRequests[0],
                            { body, form, status, contentType } = validRequest
                        request.respond({
                            status: status,
                            contentType: contentType,
                            body: body
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