let IOTA = require('iota.lib.js')
let Mam = require('./lib/mam.node.js')

module.exports.publish = publish
module.exports.obtain = obtain
module.exports.update = update

async function publish(iota, address) {
	let state = Mam.init(iota)
    let message = Mam.create(state, address)
    await Mam.attach(message.payload, message.root)
    return message
}

async function obtain(iota, maia) {
	Mam.init(iota)
	let packet = await Mam.fetch(maia, 'public')
	return (packet.messages.length == 0) ? null : packet.messages[packet.messages.length - 1]
}

async function update(iota, maia, seed, address) {
	let state = Mam.init(iota, seed)
	let packet = await Mam.fetch(maia, 'public')
	state.channel.start = packet.messages.length
	
    let message = Mam.create(state, address)
    await Mam.attach(message.payload, message.root)
    return message
}