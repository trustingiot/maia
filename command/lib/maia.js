/**
 * Masked Authenticated IOTA Address
 */
class MAIA {

	static get VERSION() {
		return 3
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
	 * obj.channelLayers -> channelLayers
	 * obj.channelDepth -> channelDepth
	 */
	constructor(obj) {
		this.iota = new IOTA({provider: obj.provider})
		this.depth = obj.depth || 9
		this.mwm = obj.mwm || 14
		this.channelLayers = obj.channelLayers || 3
		this.channelDepth = obj.channelLayers || 15
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
			response.payload = undefined
			response.maia = message.maia
			await this.processGET(response)
			break

		case MAIA.METHOD.POST:
			response.payload = message.payload
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

		message.payload = await this.get(message.maia)
		message.status = MAIA.RESPONSE_CODE.OK
	}

	/**
	 * Process POST request
	 */
	async processPOST(message) {
		if (!this.validAddress(message.seed)) {
			message.status = MAIA.RESPONSE_CODE.INVALID_SEED
			return
		}

		let r = await this.post(message.payload, message.seed)
		message.maia = this.maia
		message.status = MAIA.RESPONSE_CODE.OK
	}

	/**
	 * Get MAIA
	 */
	async get(maia) {
		let messages = null
		let message = null
		try {
			do {
				messages = await this.obtainMessages(maia)
				message = (messages.length == 0) ? null : messages[messages.length - 1]
				message = this.readMessage(message)
				if (message == null || message.config === undefined) {
					return message
				}
				maia = message.config.next
			} while (true)
		} catch(err) {
			return null
		}
	}

	/**
	 * Read JSON message from MAM channel (message = {null -> null || trytes -> json})
	 */
	readMessage(message) {
		let result = null
		if (message != null) {
			let text = this.iota.utils.fromTrytes(message)
			result = JSON.parse(text)
		}
		return result
	}

	/**
	 * Post MAIA
	 */
	async post(payload, seed = null) {
		this.seed = (seed == null) ? MAIA.keyGen() : seed
		this.maia = MAIA.generateMAIA(this.seed)
		let result = await this.doPost(payload, this.seed, this.maia, null)
		return result.message
	}

	async doPost(payload, seed, root, parentPayload) {
		let channel = await this.prepareChannel(seed, root)
		let result

		// Virgin channel
		if (channel.messages.length == 0) {
			result = await this.postInVirginChannel(payload, seed, root, parentPayload, channel)

		// Started channel
		} else {
			result = await this.postInStartedChannel(payload, seed, root, this.readMessage(channel.messages[0]), channel)
		}

		return result
	}

	/**
	 * Prepare channel for publish (set mam.channel.start = #(messages) )
	 */
	async prepareChannel(seed, root) {
		let result = {}
		result.messages = await this.obtainMessages(root)
		result.mam = Mam.init(this.iota, seed)
		// FIXME Bug in MAM @see obtainMessages
		result.mam.channel.start = result.messages.length
		return result
	}

	async postInVirginChannel(payload, seed, root, parentPayload, channel) {
		let config = parentPayload
		let result = { pulished: true, payload: {}, message: null }
		let index = { config: { next: null } }
		let aux

		do {
			channel.mam.start = 0
			config = this.generateConfig(config)
			await this.publish(channel.mam, config)

			if (config.config.layers > 0) {
				aux = await this.generateSeed(seed)
				index.config.next = root = MAIA.generateMAIA(aux)

				// FIXME MAIA.generateMAIA(x) breaks the current channel
				await Mam.init(this.iota, seed)
				seed = aux
				// END FIX

				await this.publish(channel.mam, index)
				channel = await this.prepareChannel(seed, index.config.next)
			}
		} while (config.config.layers > 0)

		result.payload.data = this.prepareData(payload.data)
		result.message = await this.publish(channel.mam, result.payload)
		return result
	}

	/**
	 * Generate configuration
	 */
	generateConfig(parent) {
		let result = { config: {} }
		if (parent == null) {
			result.config.protocol = 'maia'
			result.config.version = MAIA.VERSION
			result.config.layers = this.channelLayers
			result.config.depth = this.channelDepth
		} else {
			result.config.layers = parent.config.layers - 1
			result.config.depth = parent.config.depth
		}
		return result
	}

	/**
	 * Generate seed for MAM channel
	 */
	async generateSeed(seed, index = 0) {
		let result = await this.hash(seed + this.iota.utils.toTrytes(index.toString()))
		return result
	}

	/**
	 * Prepare data
	 */
	prepareData(current, previous = undefined) {
		let result

		// Remove empty
		if (previous === undefined) {
			result = {}
			for (var key in current) {
				if (current[key] != '') {
					result[key] = current[key]
				}
			}

		// Copy old values and remove empty ones
		} else {
			result = previous
			for (var key in current) {
				if (current[key] == '') {
					delete result[key]
				} else {
					result[key] = current[key]
				}
			}
		}

		return result
	}

	async postInStartedChannel(payload, seed, root, parentPayload, channel) {

		// Last node in channel
		let config = this.readMessage(channel.messages[0])
		let last = this.readMessage(channel.messages[channel.messages.length - 1])
		let result = { published: false, payload: {}, message: null }
		let index = { config: { next: null } }

		// Intermediate node
		if (last.config !== undefined) {
			let aux = await this.generateSeed(seed, channel.messages.length - 2)
			result = await this.doPost(payload, aux, last.config.next)
			if (!result.published) {
				if (result.published = ((config.config.protocol !== undefined) || (channel.messages.length < config.config.depth + 1))) {
					let channelSeed = await this.generateSeed(seed, channel.messages.length - 1)
					index.config.next = MAIA.generateMAIA(channelSeed)

					// FIXME MAIA.generateMAIA(x) breaks the current channel
					await Mam.init(this.iota, seed)
					// END FIX

					channel.mam.start = channel.messages.length
					await this.publish(channel.mam, index)

					result = await this.doPost(result.payload, channelSeed, index.config.next, config)
				}
			}

		// Final node
		} else {
			result.payload.data = this.prepareData(payload.data, last.data)
			if (result.published = (channel.messages.length < config.config.depth + 1))
				result.message = await this.publish(channel.mam, result.payload)
		}

		return result
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
	 * Publish payload
	 */
	async publish(mam, payload) {
		let trytes = this.iota.utils.toTrytes(JSON.stringify(payload))
		let message = Mam.create(mam, trytes)
		await Mam.attach(message.payload, message.root, this.depth, this.mwm)
		return message
	}

	/**
	 * Hash using SHA256
	 */
	// TODO user curl
	async hash(message) {
		const hash = await MAIA.sha256(message)
		return this.iota.utils.toTrytes(hash).substring(0,81)
	}

	/**
	 * Validate address
	 */
	validAddress(address) {
		if (!this.iota.valid.isAddress(address)) return false
		if (address.length == 81) return true
		return this.iota.utils.isValidChecksum(address)
	}

	/**
	 * Create a view
	 * 
	 * @param maia MAIA address
	 * @param field MAIA field
	 */
	async createView(maia, field) {
		const address = MAIA.keyGen()

		const payload = {maia: maia, field: field}
		const message = this.iota.utils.toTrytes(JSON.stringify(payload))

		let promise = (t) => new Promise((resolve) => this.iota.api.sendTransfer('', this.depth, this.mwm, t, (a, b) => resolve(b)))
		let result = await promise([{address: address, message: message, value: 0}])
		return result[0].hash
	}

	/**
	 * Read a view
	 *
	 * @param view View hash
	 */
	async readView(view) {
		let promise = (h) => new Promise((resolve) => this.iota.api.getTransactionsObjects(h, (a, b) => resolve(b)))
		let result = await promise([view])
		let content = await this.extractView(result)
		return content
	}

	/**
	 * Extract content from view
	 * 
	 * @param bundle View bundle
	 */
	async extractView(bundle) {
		let message = this.iota.utils.extractJson(bundle)
		if (message != null) {
			message = JSON.parse(message)
			if (message.maia !== undefined && message.field !== undefined) {
				let payload = await this.get(message.maia)
				if (payload != null && payload.data !== undefined) {
					return payload.data[message.field]
				}
			}
		}
		return undefined
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
	 * Generate SHA-256 hash
	 */
	static async sha256(message) {
		if (isNode()) {
			return crypto.createHash('sha256').update(message).digest('hex')

		} else {
			// https://github.com/digitalbazaar/forge
			var md = forge.md.sha256.create()
			md.update(message)
			return md.digest().toHex()
		}
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
}

function isNode() {
	return (typeof window === 'undefined')
}

// Backend
if (isNode()) {
	var crypto = require('crypto')
	var IOTA = require('iota.lib.js')
	var Mam = require('./mam.node.js')

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
