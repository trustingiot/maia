/**
 * MAIA Proof of Concept
 */
let MAIA = require('../../dist/maia.js').MAIA

// TODO Set configuration
let provider = 'https://iotanode.be:443'
let mwm = 14

let doAPITest = true
let doGatewayTest = true
let doViewTest = true

let instance = new MAIA({provider: provider, mwm: mwm})

async function testPOST(payload, seed) {
	let message = await instance.post(payload, seed)
	return message
}

async function testGET(maia) {
	let result = await instance.get(maia)
	console.log('payload ' + JSON.stringify(result))
}

async function testAPI() {

	console.log()
	console.log("  #########")
	console.log("  #       #")
	console.log("  #  API  #")
	console.log("  #       #")
	console.log("  #########")
	console.log()

	let seed = MAIA.keyGen()
	let maia = MAIA.generateMAIA(seed)
	let payload = {
		data: {
			address: MAIA.keyGen()
		}
	}

	console.log('Random seed    ' + seed)
	console.log('MAIA for seed  ' + maia)
	console.log('Random address ' + payload.data.address)

	console.log('\n> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log('Done')

	console.log('\n> GET   ' + maia)
	await testGET(maia)

	payload.data.address = MAIA.keyGen()
	console.log('\nRandom address ' + payload.data.address)
	console.log('> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log("Done")

	console.log('\n> GET   ' + maia)
	await testGET(maia)

	payload.data.twitter = 'fjestrella'
	console.log('\nTwitter ' + payload.data.twitter)
	console.log('> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log("Done")

	console.log('\n> GET   ' + maia)
	await testGET(maia)

	payload.data.twitter = 'trustingiot'
	console.log('\nUpdate twitter ' + payload.data.twitter)
	console.log('> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log("Done")

	console.log('\n> GET   ' + maia)
	await testGET(maia)

	payload.data.address = ''
	console.log('\nRemove address "' + payload.data.address + '"')
	console.log('> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log("Done")

	console.log('\n> GET   ' + maia)
	await testGET(maia)

	payload.data.twitter = ''
	console.log('\nRemove twitter "' + payload.data.twitter + '"')
	console.log('> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log("Done")

	console.log('\n> GET   ' + maia)
	await testGET(maia)
}

async function testRequest(request) {
	console.log('= Request =')
	console.log(request)
	let response = await instance.gateway(request)
	console.log('= Response =')
	console.log(response)
	return response
}

async function testGateway() {

	console.log()
	console.log("  #############")
	console.log("  #           #")
	console.log("  #  GATEWAY  #")
	console.log("  #           #")
	console.log("  #############")
	console.log()

	let address, seed, maia
	let version = MAIA.VERSION
	let request = {}
	let response = {}

	console.log("#### Null request ####")
	await testRequest(null)

	console.log("\n#### Invalid method ####")
	await testRequest({version: version, method: 'undefined'})

	console.log("\n#### Invalid version ####")
	await testRequest({version: version + 1, method: MAIA.METHOD.OBTAIN})

	console.log("\n#### POST with random seed ####")
	// POST
	address = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.POST,
		payload: {
			data: {
				address: address
			}
		},
	}
	response = await testRequest(request)

	// GET
	request = {
		version: version,
		method: MAIA.METHOD.GET,
		maia: response.maia
	}
	await testRequest(request)

	console.log("\n#### POST with given seed ####")
	// POST
	address = MAIA.keyGen()
	seed = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.POST,
		seed: seed,
		payload: {
			data: {
				address: address
			}
		},
	}
	response = await testRequest(request)

	// GET
	request = {
		version: version,
		method: MAIA.METHOD.GET,
		maia: response.maia
	}
	await testRequest(request)

	console.log("\n#### Update ####")
	// POST
	address = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.POST,
		seed: seed,
		payload: {
			data: {
				address: address
			}
		},
	}
	response = await testRequest(request)

	// GET
	request = {
		version: version,
		method: MAIA.METHOD.GET,
		maia: response.maia
	}
	await testRequest(request)
}

async function testViews() {

	let seed = MAIA.keyGen()
	let maia = MAIA.generateMAIA(seed)
	let payload = {
		data: {
			twitter: 'fjestrella'
		}
	}

	console.log('Random seed     ' + seed)
	console.log('MAIA for seed   ' + maia)
	console.log('Twitter address ' + payload.data.twitter)

	console.log('\n> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log('Done')

	let field = 'twitter'
	console.log('\n> Create view')
	let view = await instance.createView(maia, field)
	console.log('Created view ' + view)

	console.log('\n> Read view ' + view)
	let content = await instance.readView(view)
	console.log('View content ' + content)

	payload.data.twitter = 'trustingiot'
	console.log('\n> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log('Done')

	console.log('\n> Read view ' + view)
	content = await instance.readView(view)
	console.log('View content ' + content)

	payload.data.twitter = ''
	console.log('\n> POST payload ' + JSON.stringify(payload))
	await testPOST(payload, seed)
	console.log('Done')

	console.log('\n> Read view ' + view)
	content = await instance.readView(view)
	console.log('View content ' + content)
}

async function test() {
	if (doAPITest) await testAPI()
	if (doGatewayTest) await testGateway()
	if (doViewTest) await testViews()
}

test()
