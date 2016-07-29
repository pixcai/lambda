const util = require('./util')

module.exports = function TokenStream(input) {
    let current = null

    Object.defineProperty(this, 'input', {
        value: input
    })

    TokenStream.prototype.next = function() {
        let token = current
        current = null
        return token || util.readNext(this.input)
    }

    TokenStream.prototype.peek = function() {
        return current || (current = util.readNext(this.input))
    }

    TokenStream.prototype.eof = function() {
        return this.peek() === null
    }

    TokenStream.prototype.croak = input.croak
}
