/**
 * MAIA Proof of Concept
 */
let MAIA = require('../dist/maia.js').MAIA

//TODO Set configuration
let provider = 'https://iotanode.be:443'
let mwm = 14
let n = 365
let channelLayers = 3
let channelDepth = 5

let t0

function timeRespectT0() {
	t1 = new Date()
	process.stdout.write('' + (t1 - t0))
	t0 = t1
}

async function testMAIA() {
	console.log('Test with mwm = ' + mwm + ', n = ' + n + ', channel layers = ' + channelLayers + ' and channel depth = ' + channelDepth)

	let instance = new MAIA({provider: provider, mwm:mwm, channelLayers:channelLayers, channelDepth:channelDepth})
	let address, seed, maia
	let version = MAIA.VERSION
	let request = {}
	let response = {}
	seed = MAIA.keyGen()

	t0 = new Date()
	for (let i = 1; i <= n; i++) {
		process.stdout.write('\ni = ' + i)

		address = MAIA.keyGen()
		request = {
			version: version,
			method: MAIA.METHOD.POST,
			payload: {data: {address: address}},
			seed: seed
		}
		process.stdout.write(', POST: ')
		response = await instance.gateway(request)
		if (i == 1) {
			maia = response.maia
		}
		timeRespectT0()

		request = {
			version: version,
			method: MAIA.METHOD.GET,
			maia: maia
		}
		process.stdout.write(', GET: ')
		response = await instance.gateway(request)
		if (response.payload.data.address != address) {
			console.error('Aborted execution: ' + response.payload.data.address + ' != ' + address)
			return
		}
		timeRespectT0()
	}
}

async function test() {
	await testMAIA()
}

test()
