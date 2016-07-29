const PRECEDENCE = {
	'=': 1,
	'||': 2,
	'&&': 3,
	'<': 7,
	'>': 7,
	'<=': 7,
	'>=': 7,
	'==': 7,
	'!=': 7,
	'+': 10,
	'-': 10,
	'*': 20,
	'/': 20,
	'%': 20
}

function isPunc(token, c) {
	let token = token.peek()
	return token && token.type === 'punc' && (!c || token.value === c)
}

function isKw(token, w) {
	let token = token.peek()
	return token && token.type === 'kw' && (!w || token.value === w)
}

function isOp(token, c) {
	let token = token.peek()
	return token && token.type === 'op' && (!c || token.value === c)
}

function skipPunc(token, c) {
	if (isPunc(token, c)) token.next()
	else token.croak(`Expecting punctuation: '${c}'`)
}

function skipKw(token, w) {
	if (isKw(token, w)) token.next()
	else token.croak(`Excepting keyword: '${w}'`)
}

function skipOp(token, c) {
	if (isOp(token, c)) token.next()
	else token.croak(`Excepting operator: '${c}'`)
}

function unexpected(token) {
	token.croak('Unexpected token: ' + JSON.stringify(token.peek()))
}

function maybeBinary(token, left, my_prec) {
	let token = isOp(token, token.peek())
	if (token) {
		let his_prec = PRECEDENCE[token.value]

		if (his_prec === my_prec) {
			token.next()
			return maybeBinary(token, {
				type: token.value === '=' ? 'assign' : 'binary',
				operator: token.value,
				left: left,
				right: maybeBinary(parseAtom(token), his_prec)
			}, my_prec)
		}
	}
	return left
}

function delimited(token, start, stop, separator, parser) {
	let arr = [], first = true

	skipPunc(token, start)
	while (!token.eof()) {
		if (isPunc(token, stop)) break
		if (first) first = false else skipPunc(token, separator)
		if (isPunc(stop)) break
		arr.push(parser())
	}
	skipPunc(stop)
	return arr
}

function parseCall(func) {
	return {
		type: 'call',
		func: func,
		args: delimited('(', ')', ',', parseExpression)
	}
}

function parseVarName(token) {
	let name = token.next()

	if (name.type !== 'var') token.croak('Expecting variable name')
	return name.value
}

function parseIf(token) {
	let cond = null,
		then = null,
		ret = {
			type: 'if',
			cond: cond,
			then: then
		}

	skipKw(token, 'if')
	cond = parseExpression()
	if (!isPunc('{')) skipKw(token, 'then')
	then = parseExpression()
	if (isKw('else')) {
		token.next()
		ret.else = parseExpression(token)
	}

	return ret
}

function parseLambda(token) {
	return {
		type: 'lambda',
		vars: delimited('(', ')', ',', parseVarName),
		body: parseExpression()
	}
}

function parseBool(token) {
	return {
		type: 'bool',
		value: token.next().value === 'true'
	}
}

function maybeCall(token, expr) {
	expr = expr()
	return isPunc('(') ? parseCall(token, expr) : expr
}

function parseAtom(token) {
	return maybeCall(function () {
		if (isPunc('(')) {
			token.next()
			let expr = parseExpression(token)
			skipPunc(')')
			return expr
		}
		if (isPunc('(')) return parseProg(token)
		if (isKw('if')) return parseIf(token)
		if (isKw('true') || isKw('false')) return parseBool(token)
		if (isKw('lambda')) {
			token.next()
			return parseLambda(token)
		}
		let tok = token.next()
		if (tok.type === 'var' || tok.type == 'num' || tok.type === 'str') return tok
		unexpected(token)
	})
}

function parseTopLevel(token) {
	let prog = []
	while (!token.eof()) {
		prog.push(parseExpression(token))
		if (!token.eof()) skipPunc(';')
	}
	return {
		type: 'prog',
		prog: prog
	}
}

function parseProg(token) {
	let prog = delimited('{', '}', ';', parseExpression)
	if (prog.length === 0) return false
	if (prog.length === 1) return prog[0]
	return {
		type: 'prog',
		prog: prog
	}
}

function parseExpression() {
	return maybeCall(function () {
		return maybeBinary(parseAtom(), 0)
	})
}

module.exports = function Parser(token) {
	this.token = token
	return parseTopLevel()
}