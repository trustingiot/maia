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
			POST: 'post',
			UPDATE: 'update'
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

	constructor(provider) {
		this.iota = new IOTA({provider})
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

		case MAIA.METHOD.UPDATE:
			response.address = message.address
			response.seed = message.seed
			await this.processUpdate(response)
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
	 * Process update request
	 */
	async processUpdate(message) {
		if (!this.validAddress(message.address)) {
			message.status = MAIA.RESPONSE_CODE.INVALID_ADDRESS
			return
		}

		if (!this.validAddress(message.seed)) {
			message.status = MAIA.RESPONSE_CODE.INVALID_SEED
			return
		}

		await this.update(message.address, message.seed)
		message.status = MAIA.RESPONSE_CODE.OK
	}

	/**
	 * Obtain address from MAIA
	 */
	async get(maia) {
		await this.initMAM()
		let messages = await this.obtainMessages(maia)
		return (messages.length == 0) ? null : messages[messages.length - 1]
	}

	/**
	 * Generate MAIA for address
	*/
	async post(address, seed = null) {
		await this.initMAM(seed)
		return await this.publish(address)
	}

	/**
	 * Publish address
	 */
	async publish(address) {
		let message = Mam.create(this.mam, address)
		await Mam.attach(message.payload, message.root)
		return message
	}

	/**
	 * Update MAIA address
	 */
	async update(address, seed) {
		let maia = MAIA.generateMAIA(seed)
		await this.initMAM(seed, maia)
		return await this.publish(address)
	}

	/**
	 * Init MAM
	 */
	async initMAM(seed = null, maia = null) {
		this.mam = (seed == null) ? Mam.init(this.iota) : Mam.init(this.iota, seed)
		await this.fixChannelStart(seed, maia)
		this.maia = maia
		this.seed = this.mam.seed
	}

	// FIXME Bug in MAM
	async fixChannelStart(seed, maia) {
		if (seed != null && maia != null) {
			let messages = await this.obtainMessages(maia)
			this.mam.channel.start = messages.length
		}
	}

	/**
	 * Obtain channel messages
	 */
	async obtainMessages(maia) {
		let packet = await Mam.fetch(maia, 'public')
		return packet.messages
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
