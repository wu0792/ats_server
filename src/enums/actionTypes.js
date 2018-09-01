const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')
const urlParser = require('url')
const fs = require('fs')

const ACTION_TYPES = new Enum({
    NETWORK: {
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
        preProcess: async (director) => {
            let page = director.page,
                noMockUrlRegexs = director.noMockUrls.length ? director.noMockUrls.map(urlArray => new RegExp(urlArray[1])) : [],
                entryList = director.groupedList[ACTION_TYPES.NETWORK.key],
                canMock = director.mode.value.canMock

            if (entryList.length) {
                await page.setRequestInterception(true)
                page.on('request', request => {
                    let redirectUrl = ''
                    const method = request.method(),
                        url = request.url()

                    if (canMock && noMockUrlRegexs.some((regex, index) => {
                        let targetUrl = url,
                            noMockUrl = regex.source

                        if (noMockUrl.indexOf('http') !== 0) {
                            let parsedUrl = urlParser.parse(targetUrl)
                            targetUrl = `${parsedUrl.host}${parsedUrl.pathname}`
                        }

                        let matched = regex.test(targetUrl)
                        if (matched) {
                            if (director.noMockUrls[index].length === 3) {
                                redirectUrl = url.replace(new RegExp(noMockUrl), director.noMockUrls[index][2])
                            }
                            return true
                        } else {
                            return false
                        }
                    })) {
                        if (redirectUrl) {
                            // redirect url
                            console.log(`redirect url: ${url} => ${redirectUrl}`)
                            request.continue({ url: redirectUrl })
                        } else {
                            // not mock the url if match any of noMockUrlRegex
                            console.log(`continue: ${url}`)
                            request.continue()
                        }
                    } else {
                        const firstMatchedRequestIndex = entryList.findIndex(entry => {
                            let parsedTargetUrl = urlParser.parse(url),
                                targetUrlPath = `${parsedTargetUrl.host}${parsedTargetUrl.pathname}`,
                                parsedEntryUrl = urlParser.parse(entry.url),
                                entryUrlPath = `${parsedEntryUrl.host}${parsedEntryUrl.pathname}`

                            return entry.method === method && (entry.url === url || (targetUrlPath === entryUrlPath && noMockUrlRegexs.some((regex, index) => {
                                let looseMatch = director.noMockUrls[index][0]
                                if (looseMatch) {
                                    return regex.test(url)
                                } else {
                                    return false
                                }
                            })))
                        })

                        if (firstMatchedRequestIndex >= 0) {
                            console.log(`respond: ${url}`)
                            const validRequest = entryList[firstMatchedRequestIndex],
                                { body, status, header } = validRequest

                            entryList.splice(firstMatchedRequestIndex, 1)

                            request.respond({
                                status: status,
                                body: body,
                                headers: header
                            })
                        } else {
                            console.log(`continue: ${url}`)
                            request.continue()
                        }
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

                const currentNavigateIdIndex = allNavigateId.indexOf(currentNavigateId),
                    nextNavigateId = allNavigateId[currentNavigateIdIndex + 1] || Infinity

                director.currentNavigateId = currentNavigateId
                director.nextNavigateId = nextNavigateId
                director.onDomContentLoaded(firstEntry)
            })
        }
    },
    MUTATION: {
        collect: (data) => new ActionEntry.MutationActionEntry(data),
        preProcess: async (director) => {
            const dirNames = ['expect', 'actual', 'compare']

            dirNames.forEach(dirName => {
                if (!fs.existsSync(`./${dirName}/${director.systemInfo.id}/`)) {
                    fs.mkdirSync(`./${dirName}/${director.systemInfo.id}/`)
                }
            })
        }
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