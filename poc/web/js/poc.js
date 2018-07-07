//
// Javascript functions for PoC website
//
const defaultNode = 'https://iotanode.be:443'
const defaultDepth = 9
const defaultMWM = 14
const defaultLayers = 3
const defaultLayerDepth = 5

const inputs = ['seed', 'maia']
const date = '2018.07.07'

let request = {seed:'', maia:''}
let mode
let node = null
let selectedForm
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
		instance.channelLayers = parseInt(document.getElementById('layers').value)
		instance.channelDepth = parseInt(document.getElementById('layerDepth').value)
	}
	return instance
}

// Set MAIA mode
function setMode() {
	mode = document.getElementById('mode').value
}

// Execute an action
function execute(action) {
	switch (selectedForm) {
	case 'maia':
		executeActionMaia(action)
		break

	case 'view':
		executeActionView(action)
		break
	}
}

// Execute a MAIA action
function executeActionMaia(action) {
	switch (action) {
	case MAIA.METHOD.GET:
		(mode === 'gateway') ? call(MAIA.METHOD.GET) : get()
		break

	case MAIA.METHOD.POST:
		(mode === 'gateway') ? call(MAIA.METHOD.POST) : post()
		break
	}
}

// Execute a view action
async function executeActionView(action) {
	let m = await getMAIA()
	let value = undefined
	switch (action) {
	case MAIA.METHOD.GET:
		if (m != null) {
			initRequest()
			let view = document.getElementById('viewHash').value
			setInputValue('result', 'View: ' + view + '\n')
			value = await m.readView(view)
			appendInputValue('result', 'Value: ' + value)
			finishRequest()
		}
		break

	case MAIA.METHOD.POST:
		if (m != null) {
			initRequest()
			let maia = document.getElementById('viewMAIA').value
			let field = document.getElementById('viewField').value
			setInputValue('result', 'MAIA: ' + maia + '\n')
			appendInputValue('result', 'Field:' + field + '\n\n')
			value = await m.createView(maia, field)
			appendInputValue('result', 'View: ' + value)
			finishRequest()
		}
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

function getPayload() {
	let payload = { data: {} }
	payload.data[document.getElementById('field').value] = document.getElementById('value').value
	return payload
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
	let inputs = ['seed', 'maia', 'field', 'value', 'viewHash', 'viewMAIA', 'viewField']
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
	document.getElementById('layers').value = defaultLayers
	document.getElementById('layerDepth').value = defaultLayerDepth
	setInfo()
	setInputsFromParameters()
	setForm('maia')
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

// Set active form
function setForm(selected) {
	selectedForm = selected
	let opposite = (selectedForm == 'view') ? 'maia' : 'view'
	document.getElementById('button-' + selected).className = 'btn btn-dark active disabled'
	document.getElementById('form-' + selected).style.display = 'block'

	document.getElementById('button-' + opposite).className = 'btn btn-outline-secondary'
	document.getElementById('form-' + opposite).style.display = 'none'
}