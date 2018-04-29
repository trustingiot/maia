/**
 * MAIA Proof of Concept
 */
let MAIA = require('../../dist/maia.js').MAIA
let instance = new MAIA('https://testnet140.tangle.works:443')

async function testPOST(address, seed) {
	let message = await instance.post(address, seed)
	console.log('maia: ' + message.root)
	return message
}

const testGET = async maia => {
	let result = await instance.get(maia)
	console.log('address: ' + result)
}

async function testUpdate(address, seed) {
	await instance.update(address, seed)
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

	console.log('Generate new maia address for "' + address + '".')
	let message = await testPOST(address, seed)
	let maia = message.root

	console.log('\nObtain maia address "' + maia + '".')
	await testGET(maia)

	address = MAIA.keyGen()
	console.log('\nUpdate maia address "' + maia + '" => "' + address + '".')
	await testUpdate(address, seed)
	console.log("Updated!")

	console.log('\nObtain maia address "' + maia + '".')
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

	console.log("\n#### Generate with random seed ####")
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

	console.log("\n#### Generate with given seed ####")
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

	// Update
	maia = request.maia
	address = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.UPDATE,
		address: address,
		seed: seed
	}
	await testRequest(request)

	// GET
	request = {
		version: version,
		method: MAIA.METHOD.GET,
		maia: maia
	}
	await testRequest(request)
}

async function test() {
	await testAPI()
	await testGateway()
}

test()
