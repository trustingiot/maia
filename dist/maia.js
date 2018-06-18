/**
 * Masked Authenticated IOTA Address
 */
class MAIA {

	static get VERSION() {
		return 2
	}

	static get METHOD() {
		return {
			GET: 'get',
			POST: 'post'
		}
	}

	static get RESPONSE_CODE() {
		return {
			OK: 'ok',
			INVALID_VERSION: 'invalid version',
			INVALID_REQUEST: 'invalid request',
			UNKNOWN_REQUEST: 'unknown request',
			INVALID_ADDRESS: 'invalid address',
			INVALID_SEED: 'invalid seed',
			INVALID_MAIA: 'invalid maia'
		}
	}

	/**
	 * obj.provider -> node
	 * obj.depth -> depth
	 * obj.mwm -> mwm
	 */
	constructor(obj) {
		this.iota = new IOTA({provider: obj.provider})
		this.depth = obj.depth || 9
		this.mwm = obj.mwm || 14
	}

	/**
	 * Check connection
	 */
	async isConnected() {
		try {
			// TODO Remove this ...
			let mam = Mam.init(this.iota)
			await Mam.fetch(MAIA.keyGen(), 'public')
			return true
		} catch (err) {
			return false
		}
	}

	/**
	 * Message gateway
	 */
	async gateway(message) {
		let response = {}
		if (message == null || message.method === undefined || message.version === undefined) {
			response.status = MAIA.RESPONSE_CODE.INVALID_REQUEST
			return response
		}

		if (message.version > MAIA.VERSION) {
			response.status = MAIA.RESPONSE_CODE.INVALID_VERSION
			return response
		}

		switch (message.method) {
		case MAIA.METHOD.GET:
			response.address = undefined
			response.maia = message.maia
			await this.processGET(response)
			break

		case MAIA.METHOD.POST:
			response.address = message.address
			response.seed = (message.seed === undefined) ? MAIA.keyGen() : message.seed
			response.maia = undefined
			await this.processPOST(response)
			break

		default:
			response.status = MAIA.RESPONSE_CODE.UNKNOWN_REQUEST
		}

		return response
	}

	/**
	 * Process GET request
	 */
	async processGET(message) {
		if (!this.validAddress(message.maia)) {
			message.status = MAIA.RESPONSE_CODE.INVALID_MAIA
			return
		}

		message.address = await this.get(message.maia)
		message.status = MAIA.RESPONSE_CODE.OK
	}

	/**
	 * Process POST request
	 */
	async processPOST(message) {
		if (!this.validAddress(message.address)) {
			message.status = MAIA.RESPONSE_CODE.INVALID_ADDRESS
			return
		}

		if (!this.validAddress(message.seed)) {
			message.status = MAIA.RESPONSE_CODE.INVALID_SEED
			return
		}

		let r = await this.post(message.address, message.seed)
		message.maia = r.root
		message.status = MAIA.RESPONSE_CODE.OK
	}

	/**
	 * Get MAIA
	 */
	async get(maia) {
		let messages = await this.obtainMessages(maia)
		return (messages.length == 0) ? null : messages[messages.length - 1]
	}

	/**
	 * Post MAIA
	 */
	async post(address, seed = null) {
		this.seed = (seed == null) ? MAIA.keyGen() : seed
		this.maia = MAIA.generateMAIA(this.seed)

		let messages = await this.obtainMessages(this.maia)
		this.mam = Mam.init(this.iota, this.seed)
		// FIXME Bug in MAM @see obtainMessages
		this.mam.channel.start = messages.length

		return await this.publish(address)
	}

	/**
	 * Obtain channel messages
	 */
	async obtainMessages(maia) {
		try {
			this.mam = Mam.init(this.iota)
			let packet = await Mam.fetch(maia, 'public')
			return packet.messages

			// FIXME add method to MAM to remove exception (hasMessages)
		} catch (err) {
			return []
		}
	}

	/**
	 * Publish address
	 */
	async publish(address) {
		let message = Mam.create(this.mam, address)
		await Mam.attach(message.payload, message.root, this.depth, this.mwm)
		return message
	}

	/**
	 * Generate seed (copy & adapted from => https://github.com/iotaledger/mam.client.js/blob/master/src/index.js)
	 */
	static keyGen(length = 81) {
		var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9'
		var values = MAIA.generateRandomValues(length)
		var result = new Array(length)
		for (var i = 0; i < length; i++) {
			result[i] = charset[values[i] % charset.length]
		}
		return result.join('')
	}

	/**
	 * Generate n random values
	 */
	static generateRandomValues(n) {
		var values
		if (isNode()) {
			values = crypto.randomBytes(n)
		} else {
			values = new Uint32Array(n)
			crypto.getRandomValues(values)
		}
		return values
	}

	/**
	 * Generate MAIA from seed (Dirty way...)
	 */
	// TODO use iota-bindings to create merkle tree
	static generateMAIA(seed) {
		return Mam.create(Mam.init(iotaWrapper, seed), '').root
	}

	/**
	 * Validate address
	 */
	validAddress(address) {
		if (!this.iota.valid.isAddress(address)) return false
		if (address.length == 81) return true
		return this.iota.utils.isValidChecksum(address)
	}
}

function isNode() {
	return (typeof window === 'undefined')
}

// Backend
if (isNode()) {
	var crypto = require('crypto')
	var IOTA = require('iota.lib.js')
	var Mam = require('../lib/mam.node.js')

	exports.IOTA = IOTA
	exports.Mam = Mam
	exports.MAIA = MAIA
	exports.iotaWrapper = new IOTA('')

// Frontend
} else {
	window.MAIA = MAIA
	var crypto = window.crypto
	var iotaWrapper = new IOTA('')
}
