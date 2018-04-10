/**
 * MAIA Proof of Concept
 */

let IOTA = require('iota.lib.js');
let MAM = require('../../lib/mam.node.js');
let MAIA = require('../../dist/maia.node.js');

const provider = 'https://testnet140.tangle.works:443';
const iota = new IOTA({ provider })

const testGenerate = async address => {
	let message = await MAIA.publish(iota, address);
	let seed = message.state.seed;
	let maia = message.root;
	
	console.log('seed: ' + seed);
	console.log('maia: ' + maia);
	return message;
}

const testObtain = async maia => {
	let result = await MAIA.obtain(iota, maia);
	console.log('address: ' + result);
}

async function testUpdate(maia, seed, address) {
	await MAIA.update(iota, maia, seed, address);
}

async function test() {
	let address = 'KIFEHFFMQDPHLHGURUXDZGTJVDZMDLCFSVXXRNXKCIXJZSJNBWULBLQXYSNZNVGIJXVCITXREHUUKCHGDCSEBGYDEB';
	
	console.log('Generate new maia address for "' + address + '".');
	let message = await testGenerate(address);
	let maia = message.root;
	
	console.log('\nObtain maia address "' + maia + '".');
	await testObtain(maia);
	
	address = 'XUCLXBEAKY9JJLPQGGNMKNSBJZULR9CXBVWXBTEBBRQXR9LLMUTOBSZYQPINWDEB9HAADVYCVVZNVQEOY';
	console.log('\nUpdate maia address "' + maia + '" => "' + address + '".');
	await testUpdate(maia, message.state.seed, address);
	console.log("Updated!")
	
	console.log('\nObtain maia address "' + maia + '".');
	await testObtain(maia);
}

test();
