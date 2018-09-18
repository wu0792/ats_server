const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')
const urlParser = require('url')
const fs = require('fs')
const normalizeRedirectUrl = require('../common/normalizeRedirectUrl')

const getTargetUrl = (url, testRegSource) => {
    let targetUrl = url

    if (testRegSource.indexOf('http') !== 0) {
        let parsedUrl = urlParser.parse(targetUrl)
        targetUrl = `${parsedUrl.host}${parsedUrl.pathname}`
    }

    return targetUrl
}

const ACTION_TYPES = new Enum({
    NETWORK: {
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
        preProcess: async (director) => {
            let page = director.page,
                looseAjaxUrls = director.looseAjaxUrls,
                noMockUrlRegexs = director.noMockUrls.length ? director.noMockUrls.map(urlArray => new RegExp(urlArray[0])) : [],
                entryList = director.groupedList[ACTION_TYPES.NETWORK.key],
                canMock = director.mode.value.canMock

            if (entryList.length) {
                await page.setRequestInterception(true)
                page.on('request', async request => {
                    let redirectUrl = ''
                    const method = request.method(),
                        url = request.url()

                    if (canMock && noMockUrlRegexs.some((regex, index) => {
                        let noMockUrl = regex.source,
                            targetUrl = getTargetUrl(url, noMockUrl)

                        let matched = regex.test(targetUrl)
                        if (matched) {
                            if (director.noMockUrls[index].length === 2) {
                                redirectUrl = url.replace(new RegExp(noMockUrl), director.noMockUrls[index][1])
                            }
                            return true
                        } else {
                            return false
                        }
                    })) {
                        if (redirectUrl) {
                            // redirect url
                            console.log(`redirect url: ${url} => ${redirectUrl}`)
                            await request.continue({ url: redirectUrl })
                        } else {
                            // not mock the url if match any of noMockUrlRegex
                            console.log(`continue: ${url}`)
                            await request.continue()
                        }
                    } else {
                        const firstMatchedRequestIndex = entryList.findIndex(entry => {
                            let parsedTargetUrl = urlParser.parse(url),
                                targetUrlPath = `${parsedTargetUrl.host}${parsedTargetUrl.pathname}`,
                                parsedEntryUrl = urlParser.parse(entry.url),
                                entryUrlPath = `${parsedEntryUrl.host}${parsedEntryUrl.pathname}`

                            return entry.method === method && (entry.url === url || (targetUrlPath === entryUrlPath && looseAjaxUrls.some((looseAjaxUrl) => {
                                let targetUrl = getTargetUrl(url, looseAjaxUrl)
                                return new RegExp(looseAjaxUrl).test(targetUrl)
                            })))
                        })

                        if (firstMatchedRequestIndex >= 0) {
                            console.log(`respond: ${url}`)
                            const validRequest = entryList[firstMatchedRequestIndex],
                                { body, status, header, redirectUrl } = validRequest

                            entryList.splice(firstMatchedRequestIndex, 1)

                            if (redirectUrl) {
                                const normalizeUrl = normalizeRedirectUrl(url, redirectUrl),
                                    nextNavigateEntry = director.flatList.find(entry => entry.data.id === director.nextNavigateId),
                                    nextNavigateUrl = nextNavigateEntry ? nextNavigateEntry.data.url : ''

                                if (normalizeUrl === nextNavigateUrl) {
                                    await page.goto(nextNavigateUrl)
                                } else {
                                    await request.continue({ url: nextNavigateUrl })
                                }
                            } else {
                                await request.respond({
                                    status: status,
                                    body: body,
                                    headers: header
                                })
                            }
                        } else {
                            console.log(`continue: ${url}`)
                            await request.continue()
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