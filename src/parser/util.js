const keywords = 'if then else lambda true false'

exports.isKeyword = function isKeyword(w) {
    return keywords.indexOf(w) >= 0
}

exports.isDigit = function isDigit(c) {
    return /[0-9]/.test(c)
}

exports.isIdStart = functiono isIdStart(c) {
    return /[a-z$_]/i.test(c)
}

exports.isId = function isId(c) {
    return isIdStart(c) || isDigit(c)
}

exports.isOpChar = function isOpChar(c) {
    return '+-*/%=&|!<>'.indexOf(c) >= 0
}

exports.isPunc = function isPunc(c) {
    return '.,:;()[]{}'.indexOf(c) >= 0
}

exports.isWhitespace = function isWhitespace(c) {
    return /\s/.test(c)
}

exports.readWhile = function readWhile(input, predicate) {
    let str = ''
    while (!input.eof() && predicate(input.peek())) {
        str += input.next()
    }
    return str
}

exports.readNumber = function readNumber(input) {
    let hasDot = false
    let number = readWhile(input, c => {
        if (c === '.') {
            if (hasDot) return false
            hasDot = true
            return true
        }
        return isDigit(c)
    })
    return {
        type: 'num',
        value: parseFloat(number)
    }
}

exports.readIdent = function readIdent(input) {
    let id = readWhile(input, isId)
    return {
        type: isKeyword(id) ? 'kw' : 'var',
        value: id
    }
}

exports.readEscaped = function readEscaped(input, end) {
    let escaped = false,
        str = ''

    input.next()
    while (!input.eof()) {
        let c = input.next()
        if (escaped) {
            str += c
            escaped = false
        } else if (c === '\\') {
            escaped = true
        } else if (c === end) {
            break
        } else {
            str += c
        }
    }
    return str
}

exports.readString = function readString(input) {
    return {
        type: 'str',
        value: readEscaped(input, '"')
    }
}

exports.skipComment = function skipComment(input) {
    readWhile(c => c !== '\n')
    input.next()
}

exports.readNext = function readNext(input) {
    let c = null

    readWhile(isWhitespace)
    if (input.eof()) return null
    if ((c = input.peek()) === '#') {
        skipComment(input)
        return readNext(input)
    }
    if (c === '"') return readString(input)
    if (isDigit(c)) return readNumber(input)
    if (isIdStart(c)) return readIdent(input)
    if (isPunc(c)) return {
        type: 'punc',
        value: input.next()
    }
    if (isOpChar(c)) return {
        type: 'op',
        value: readWhile(isOpChar)
    }
    input.croak(`Can\'t handle character: ${c}`)
}