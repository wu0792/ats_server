const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((error) => {
        console.error(error.message || error)
        process.exit(1)
    })

function getInstallerConfig() {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'release')

    return Promise.resolve({
        appDirectory: path.join(outPath, 'ats-win32-x64/'),
        authors: 'wumm@ctrip.com',
        noMsi: true,
        outputDirectory: path.join(outPath, 'windows-installer'),
        exe: 'ats.exe',
        setupExe: 'ats.exe',
        description: 'ats'
        // setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'icon.ico')
    })
}
