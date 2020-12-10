const request = require('request')
const crypto = require('crypto')
const buffer = require('Buffer')
require('dotenv').config()

const baseUrl = 'https://api.bitfinex.com'

module.exports = {
	execute: execute
}


async function execute(path, params, callback){
	let url = path
	let nonce = (Date.now()).toString()
	let completeUrl = `${baseUrl}${url}`
	
	let body
	
	if(params === undefined){
		body = {
			request: url,
			nonce
		}
	}
	
	let apiKey = process.env.key
	let apiSecret = process.env.secret
	
	let payload = buffer.from(JSON.stringify(body))
		.toString('base64')
	
	let signature = crypto
		.createHmac('sha384', apiSecret)
		.update(payload)
		.digest('hex')

	let options = {
		url: completeUrl,
		headers: {
			'X-BFX-APIKEY': apiKey,
			'X-BFX-PAYLOAD': payload,
			'X-BFX-SIGNATURE': signature
		},
		body: JSON.stringify(body)
	}
	
	request.post( options, (error, response, body) => {
		if (error) console.log(`BFXTAPI v1 error --> ${error}`)
		callback(body)
	})
}