/**
 * Masked Authenticated IOTA Address
 */
class MAIA {	
	constructor(provider) {
		this.iota = new IOTA({provider});
	}
	
	/**
	 * Generate MAIA for address
	 */
	async publish(address) {
		let state = Mam.init(this.iota)
		let message = Mam.create(state, address)
		await Mam.attach(message.payload, message.root)
		return message
	}
	
	/**
	 * Obtain address from MAIA
	 */
	async obtain(maia) {
		Mam.init(this.iota)
		let packet = await Mam.fetch(maia, 'public')
		return (packet.messages.length == 0) ? null : packet.messages[packet.messages.length - 1]
	}

	/**
	 * Update MAIA address
	 */
	async update(maia, seed, address) {
		let state = Mam.init(this.iota, seed)
		let packet = await Mam.fetch(maia, 'public')
		state.channel.start = packet.messages.length
		
		let message = Mam.create(state, address)
		await Mam.attach(message.payload, message.root)
		return message
	}
}

// Frontend
if (typeof window !== 'undefined') {
	window.MAIA = MAIA;
	
// Backend
} else if (typeof module !== 'undefined' && module.exports) {
	var IOTA = require('iota.lib.js')
	var Mam = require('../lib/mam.node.js')

	exports.MAIA = MAIA
}