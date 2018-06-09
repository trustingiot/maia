//
// Gateway mode functions
//
async function call(method) {
	buildRequest(method)
	sendRequest()
}

function buildRequest(method) {
	request = {
		version: MAIA.VERSION,
		method: method,
	}
	setFields()
}

function setFields() {
	switch (request.method) {
	case MAIA.METHOD.GET:
		setRequestField('maia')
		break

	case MAIA.METHOD.POST:
		setRequestField('address')
		setRequestField('seed')
		break
	}
}

async function sendRequest() {
	let m = await getMAIA()
	if (m != null) {
		initRequest()
		setInputValue('result', 'Request: ')
		appendInputValue('result', JSON.stringify(request, null, '\t'))
	
		let response = await m.gateway(request)
		appendInputValue('result', '\n\nResponse: ')
		appendInputValue('result',  JSON.stringify(response, null, '\t'))
		finishRequest()
	}
}