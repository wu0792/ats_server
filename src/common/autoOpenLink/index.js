const { ipcRenderer } = require('electron');

let promptId = null;
let url = null;

const onError = e => {
    if (e instanceof Error) {
        e = e.message;
    }
    ipcRenderer.sendSync('auto-open-link-error', e);
}

window.addEventListener('error', error => {
    if (promptId) {
        onError('An error has occured on the prompt window: \n' + error);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        url = ipcRenderer.sendSync('auto-open-link-get-options')
        let link = document.getElementById('link')
        link.setAttribute('href', url)
        link.click()
    } catch (e) {
        return onError(e);
    }
})

