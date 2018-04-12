/**
 * Masked Authenticated IOTA Address
 */
class MAIA {	
	constructor(provider) {
		this.iota = new IOTA({provider})
	}

	/**
	 * Generate MAIA for address
	*/
	async generate(address, seed = null) {
		this.initMAM(seed)
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
	 * Obtain address from MAIA
	 */
	async obtain(maia) {
		this.initMAM()
		let messages = await this.obtainMessages(maia)
		return (messages.length == 0) ? null : messages[messages.length - 1]
	}

	/**
	 * Update MAIA address
	 */
	async update(address, seed, maia) {
		this.initMAM(seed, maia)
		return await this.publish(address)
	}

	/**
	 * Init MAM
	 */
	initMAM(seed = null, maia = null) {
		this.mam = (seed == null) ? Mam.init(this.iota) : Mam.init(this.iota, seed)
		this.fixChannelStart(seed, maia)
		this.maia = maia
		this.seed = this.mam.seed
	}

	// FIXME Bug in MAM
	fixChannelStart(seed, maia) {
		if (seed != null && maia != null) {
			this.mam.channel.start = this.obtainMessages(maia).length
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

	static generateRandomValues(length) {
		var values
		if (isNode()) {
			values = crypto.randomBytes(length)
		} else {
			values = new Uint32Array(length)
			crypto.getRandomValues(values)
		}
		return values
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

	exports.MAIA = MAIA

// Frontend
} else {
	window.MAIA = MAIA
	var crypto = window.crypto
}
