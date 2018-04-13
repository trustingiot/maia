/**
 * MAIA Proof of Concept
 */
let MAIA = require('../../dist/maia.js').MAIA
let instance = new MAIA('https://testnet140.tangle.works:443')

const testGenerate = async address => {
	let message = await instance.generate(address)
	let seed = message.state.seed
	let maia = message.root

	console.log('seed: ' + seed)
	console.log('maia: ' + maia)
	return message
}

const testObtain = async maia => {
	let result = await instance.obtain(maia)
	console.log('address: ' + result)
}

async function testUpdate(maia, seed, address) {
	await instance.update(seed, maia, address)
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
	let message = await testGenerate(address, seed)
	let maia = message.root

	console.log('\nObtain maia address "' + maia + '".')
	await testObtain(maia)

	address = MAIA.keyGen()
	console.log('\nUpdate maia address "' + maia + '" => "' + address + '".')
	await testUpdate(maia, seed, address)
	console.log("Updated!")

	console.log('\nObtain maia address "' + maia + '".')
	await testObtain(maia)
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
	// Generate
	address = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.GENERATE,
		address: address
	}
	response = await testRequest(request)

	// Obtain
	request = {
		version: version,
		method: MAIA.METHOD.OBTAIN,
		maia: response.maia
	}
	await testRequest(request)

	console.log("\n#### Generate with given seed ####")
	// Generate
	address = MAIA.keyGen()
	seed = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.GENERATE,
		address: address,
		seed: seed
	}
	response = await testRequest(request)

	// Obtain
	request = {
		version: version,
		method: MAIA.METHOD.OBTAIN,
		maia: response.maia
	}
	await testRequest(request)

	console.log("\n#### Update ####")
	// Generate
	address = MAIA.keyGen()
	seed = MAIA.keyGen()
	request = {
		version: version,
		method: MAIA.METHOD.GENERATE,
		address: address,
		seed: seed
	}
	response = await testRequest(request)

	// Obtain
	request = {
		version: version,
		method: MAIA.METHOD.OBTAIN,
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
		seed: seed,
		maia: maia
	}
	await testRequest(request)

	// Obtain
	request = {
		version: version,
		method: MAIA.METHOD.OBTAIN,
		maia: maia
	}
	await testRequest(request)
}

async function test() {
	await testAPI()
	await testGateway()
}

test()
