//
// Javascript functions for PoC website
//
const defaultNode = 'https://iotanode.us:443'
const defaultDepth = 9
const defaultMWM = 14
const inputs = ['address', 'maia', 'seed']
const date = '2018.06.18'

let request = {address:'', seed:'', maia:''}
let mode
let node = null
let instance

// Return MAIA instance
async function getMAIA() {
	let auxNode = document.getElementById('node').value
	if (auxNode != node) {
		initRequest()
		node = auxNode
		setInputValue('result', "Checking connection to node '" + node + "'")
		instance = new MAIA({provider: node})
		let connected = await instance.isConnected()
		finishRequest()
		if (!connected) {
			appendInputValue('result', "\n\nCould not connect to the node '" + node + "'")
			instance = null
			node = null
		}
	}
	if (instance != null) {
		instance.depth = parseInt(document.getElementById('depth').value)
		instance.mwm = parseInt(document.getElementById('mwm').value)
	}
	return instance
}

// Set MAIA mode
function setMode() {
	mode = document.getElementById('mode').value
}

// Execute an action
async function execute(action) {
	switch (action) {
	case MAIA.METHOD.GET:
		(mode === 'gateway') ? call(MAIA.METHOD.GET) : get()
		break

	case MAIA.METHOD.POST:
		(mode === 'gateway') ? call(MAIA.METHOD.POST) : post()
		break
	}
}

// Not empty field
function notEmpty(field) {
	if (request[field] == '') {
		alert('Empty ' + field)
		return false
	}
	return true
}

// Set request field
function setRequestField(field) {
	let value = document.getElementById(field).value
	if (value != '') request[field] = value
}

// Set request fields
function setRequestFields() {
	for (var i in inputs) {
		request[inputs[i]] = document.getElementById(inputs[i]).value
	}
}

// Clean contents
function clean() {
	for (var i in inputs) {
		document.getElementById(inputs[i]).value = ''
	}
	document.getElementById('result').value = ''
}

// Set input value
function setInputValue(id, value) {
	if (value != null) {
		document.getElementById(id).value = value
	}
}

// Append value to input
function appendInputValue(id, value) {
	let element = document.getElementById(id)
	element.value = element.value + value
}

// Generate random input
function random(id) {
	document.getElementById(id).value = MAIA.keyGen()
}

// Find parameter
function findParameter(parameterName) {
	var result = null, tmp = []
	var items = location.search.substr(1).split("&")
	for (var index = 0; index < items.length; index++) {
		tmp = items[index].split("=")
		if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1])
	}
	return result
}

// Set web info
function setInfo() {
	document.getElementById('info-version').value = MAIA.VERSION
	document.getElementById('info-date').innerHTML = date
}

// Set input value from parameter
function setInputFromParameter(id) {
	setInputValue(id, findParameter(id))
}

// Set all inputs from parameters
function setInputsFromParameters() {
	for (var i in inputs) {
		setInputFromParameter(inputs[i])
	}
}

// Try to carry out a get request
function tryGet(timeout = 1000) {
	if (document.getElementById('maia').value !== '') {
		setTimeout(function () {
			call(MAIA.METHOD.GET)
		}, timeout)
	}
}

// Execute after load
function afterLoad() {
	setMode()
	document.getElementById('node').value = defaultNode
	document.getElementById('depth').value = defaultDepth
	document.getElementById('mwm').value = defaultMWM
	setInfo()
	setInputsFromParameters()
	tryGet()
}

// Init request
function initRequest() {
	document.getElementById('loader').addEventListener("webkitAnimationIteration", loaderRepeatFunction)
	document.getElementById('loader').addEventListener("animationiteration", loaderRepeatFunction)
	document.getElementById('timer').innerHTML = ''
	document.getElementById('loader').style.display = 'block'
	document.getElementById('timer').style.display = 'block'
	document.getElementById('result').style.opacity = 0.5
}

// Finish request
function finishRequest() {
	document.getElementById('loader').style.display = 'none'
	document.getElementById('timer').style.display = 'none'
	document.getElementById('loader').removeEventListener("webkitAnimationIteration", loaderRepeatFunction)
	document.getElementById('loader').removeEventListener("animationiteration", loaderRepeatFunction)
	document.getElementById('result').style.opacity = 1
}

// Loader repeat function
function loaderRepeatFunction(event) {
	document.getElementById('timer').innerHTML = event.elapsedTime
}