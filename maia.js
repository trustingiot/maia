let IOTA = require('iota.lib.js')
let MAM = require('./lib/mam.node.js')

module.exports.publish = publish
module.exports.obtain = obtain
module.exports.update = update

async function publish(iota, address) {
	let state = MAM.init(iota)
    let message = MAM.create(state, address)
    await MAM.attach(message.payload, message.root)
    return message
}

async function obtain(iota, maia) {
	MAM.init(iota)
	let packet = await MAM.fetch(maia, 'public')
	return (packet.messages.length == 0) ? null : packet.messages[packet.messages.length - 1]
}

async function update(iota, maia, seed, address) {
	let state = MAM.init(iota, seed)
	let packet = await MAM.fetch(maia, 'public')
	state.channel.start = packet.messages.length
	
    let message = MAM.create(state, address)
    await MAM.attach(message.payload, message.root)
    return message
}