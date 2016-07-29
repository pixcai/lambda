module.exports = function InputStream(source) {
    let line = 1,
        column = 0,
        position = 0

    Object.defineProperty(this, 'source', {
        value: source
    })

    InputStream.prototype.next = function() {
        const nextChar = this.source.charAt(position++)
        if (nextChar === '\n') {
            line++, column = 0
        } else {
            column++
        }
        return nextChar
    }

    InputStream.prototype.peek = function() {
        return this.source.charAt(position)
    }

    InputStream.prototype.eof = function() {
        return this.peek() === ''
    }

    InputStream.prototype.croak = function(message) {
        throw new Error(`${message} (${line}:${column})`)
    }
}
