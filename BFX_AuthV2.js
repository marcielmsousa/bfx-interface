const CryptoJS = require('crypto-js')
const request = require('request')
const handler = require('./handlers')
require('dotenv').config()

module.exports = {
	execute: doPost
}

function doPost(apiPath, body, callback) {
	let apiKey = process.env.key
	let apiSecret = process.env.secret

	let nonce = (Date.now()).toString()

	let signature = `/api${apiPath}${nonce}${JSON.stringify(body)}`
	const sig = CryptoJS.HmacSHA384(signature, apiSecret).toString()

	const options = {
		url: `https://api.bitfinex.com${apiPath}`,
		headers: {
			'bfx-nonce': nonce,
			'bfx-apikey': apiKey,
			'bfx-signature': sig
		},
		body: body,
		json: true
	}

	request.post(options, (err, response, body) => {
		if (err) console.log(`BFXTAPI v2 error --> ${err}`)
		callback(body)
	})
}