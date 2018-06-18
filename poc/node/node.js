/**
 * MAIA Proof of Concept
 */
let MAIA = require('../../dist/maia.js').MAIA
let instance = new MAIA({provider: 'https://testnet140.tangle.works:443'})

async function testPOST(address, seed) {
	let message = await instance.post(address, seed)
	return message
}

async function testGET(maia) {
	let result = await instance.get(maia)
	console.log('address ' + result)
}

async function testAPI() {

	console.log()
	console.log("  #########")
	console.log("  #       #")
	console.log("  #  API  #")
	console.log("  #       #")
	console.log("  #########")
	console.log()

	let address = MAIA.keyGen()
	let seed = MAIA.keyGen()
	let maia = MAIA.generateMAIA(seed)

	console.log('Random seed    ' + seed)
	console.log('MAIA for seed  ' + maia)
	console.log('Random address ' + address)

	console.log('\n> POST address ' + address)
	await testPOST(address, seed)
	console.log('Done')

	console.log('\n> GET   ' + maia)
	await testGET(maia)

	address = MAIA.keyGen()
	console.log('\nRandom address ' + address)
	console.log('> POST address ' + address)
	await testPOST(address, seed)
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
		address: address
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
		address: address,
		seed: seed
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
		address: address,
		seed: seed
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

async function test() {
	await testAPI()
	await testGateway()
}

test()
