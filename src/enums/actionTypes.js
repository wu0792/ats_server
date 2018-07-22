const Enum = require('enum')
const ActionEntry = require('../analysis/actionEntryBase')

const ACTION_TYPES = new Enum({
    NETWORK: {
        collect: (data) => new ActionEntry.NetworkActionEntry(data),
    },
    NAVIGATE: {
        collect: (data) => new ActionEntry.NavigateActionEntry(data)
    },
    MUTATION: {
        collect: (data) => new ActionEntry.MutationActionEntry(data)
    },
    KEYPRESS: {
        collect: (data) => new ActionEntry.KeyPressActionEntry(data)
    },
    MOUSEOVER: {
        collect: (data) => new ActionEntry.MouseOverActionEntry(data)
    },
    CLICK: {
        collect: (data) => new ActionEntry.ClickActionEntry(data)
    },
    SCROLL: {
        collect: (data) => new ActionEntry.ScrollActionEntry(data)
    },
    RESIZE: {
        collect: (data) => new ActionEntry.ResizeActionEntry(data)
    },
})

module.exports = ACTION_TYPES 