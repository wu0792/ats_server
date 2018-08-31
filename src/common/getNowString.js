/**
 * get current date and time string, format：20180811_213918
 */
const getNowString = () => {
    const now = new Date(),
        year = now.getFullYear(),
        month = now.getMonth() + 1,
        day = now.getDate(),
        hour = now.getHours(),
        min = now.getMinutes(),
        sec = now.getSeconds()

    let date = `${year}${month < 10 ? '0' : ''}${month}${day < 10 ? '0' : ''}${day}`,
        time = `${hour < 10 ? '0' : ''}${hour}${min < 10 ? '0' : ''}${min}${sec < 10 ? '0' : ''}${sec}`

    return `${date}_${time}`
}

module.exports = getNowString