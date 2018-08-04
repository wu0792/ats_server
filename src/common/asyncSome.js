const asyncSome = async (array, evaluateFunc) => {
    let result = false
    for (let i = 0; i < array.length; i++) {
        let isValid = await evaluateFunc(array[i], i, array)
        if (isValid) {
            result = true
            break
        }
    }

    return result
}

module.exports = asyncSome