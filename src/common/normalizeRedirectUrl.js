const urlParser = require('url')

const normalizeRedirectUrl = (rawUrl, redirectUrl) => {
    if (redirectUrl) {
        if (redirectUrl.indexOf('http') === 0) {
            return redirectUrl
        } else {
            const parsedRawUrl = urlParser.parse(rawUrl),
                trimRedirectUrlStartSlash = redirectUrl[0] === '/' ? redirectUrl.substring(1) : redirectUrl

            return `${parsedRawUrl.protocol}//${parsedRawUrl.host}/${trimRedirectUrlStartSlash}`
        }
    } else {
        return rawUrl
    }
}

module.exports = normalizeRedirectUrl