//
// API mode functions
//
function prepare() {
	setRequestFields()
	setInputValue('result', '')
}

async function get() {
	prepare()
	if (!notEmpty('maia')) return

	let m = await getMAIA()
	if (m != null) {
		initRequest()
		setInputValue('result', 'GET ' + request.maia + '\n\n')
		let result = await m.get(request.maia)
		appendInputValue('result', 'payload ' + JSON.stringify(result))
		finishRequest()
	}
}

async function post() {
	prepare()
	if (!notEmpty('address')) return

	let m = await getMAIA()
	let payload = getPayload()
	if (m != null) {
		initRequest()
		setInputValue('result', 'POST ' + JSON.stringify(payload) + '\n')
		appendInputValue('result', 'seed ' + ((request.seed == '') ? 'random' : request.seed) + '\n\n')
	
		let result = await m.post(payload, (request.seed == '') ? null : request.seed)
	
		appendInputValue('result', 'seed ' + result.state.seed + '\n')
		appendInputValue('result', 'maia ' + result.root + '\n')
		finishRequest()
	}
}