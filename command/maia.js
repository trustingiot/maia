/**
 * MAIA
 */
let MAIA = require('./lib/maia.js').MAIA
let fs = require('fs')
let arg = require('minimist')(process.argv.slice(2))

const defaultProvider = 'https://iotanode.be:443'
const defaultDepth = 9
const defaultMWM = 14
const defaultChannelLayers = 1
const defaultChannelDepth = 15

function getInstance() {
	arg.provider = arg.provider || defaultProvider
	arg.depth = arg.depth || defaultDepth
	arg.mwm = arg.mwm || defaultMWM
	arg.channelLayers = arg.channelLayers || defaultChannelLayers
	arg.channelDepth = arg.channelDepth || defaultChannelDepth

	return new MAIA({
		provider: arg.provider,
		depth: arg.depth,
		mwm: arg.mwm,
		channelLayers: arg.channelLayers,
		channelDepth: arg.channelDepth})
}

async function postView() {
	let instance = getInstance()
	let view = await instance.createView(arg.maia, arg.post)
	console.log(view)
}

async function post() {
	let instance = getInstance()

	let request = {
		version: MAIA.VERSION,
		method: MAIA.METHOD.POST,
		payload: { data: {}	}
	}
	request.payload.data[arg.post] = arg.value || ''

	if (arg.seed) request.seed = arg.seed

	let response = await instance.gateway(request)
	console.log({seed: response.seed, maia: response.maia})
}

async function get() {
	let instance = getInstance()
	let content = await instance.get(arg.get)
	if (content == null) {
		try {
			let view = await instance.readView(arg.get)
			console.log(view)
		} catch (err) {
			console.log('Undefined')
		}
	} else {
		console.log(content.data)
	}
}

if (arg.get) {
	get()
} else if (arg.post) {
	if (arg.maia) {
		postView()
	} else {
		post()
	}
} else {
	console.log('Usage: maia [options] <command>')
	console.log('\nwhere [options] can be zero or more of the following arguments:')
	console.log('  --provider provider\n      Provider. Default: ' + defaultProvider)
	console.log('  --depth depth\n      Depth. Default: ' + defaultDepth)
	console.log('  --mwm mwm\n      MWM. Default: ' + defaultMWM)
	console.log('  --channelLayers layers\n      Channel layers used for versions. Default: ' + defaultChannelLayers)
	console.log('  --channelDepth depth\n      Channel depth used for versions. Default: ' + defaultChannelDepth)
	console.log('\nand <command> is one of:')
	console.log('  --post field [--value value] [--seed seed]\n      Update field. Add --seed to update or create a maia using this seed. If --value is not specified, then the field is removed')
	console.log('  --post field --maia maia\n      Create a view')
	console.log('  --get <maia or view>\n      Get MAIA or view')
}
