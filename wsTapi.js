const crypto = require('crypto-js')
const websocket = require('ws')
require('dotenv').config()
const fs = require('fs')


fileOrDirectoryExists('./logs').then(exists => { if (!exists) createDir('./logs') })

const error = err => {
    console.error(err)
    appendFile(
        './logs/wsTapi.js.error.log',
        `\n${new Date().toISOString} - ${err}`
    )
}

var wsConn
var callback
var connecting = false
var connWatchdogRunning = false

module.exports = {
    interface: interface,
    send: send,
    isConnected: isConnected
}

function isConnected(){
    return wsConn.readyState == 1
}

function send(arg) {
    wsConn.send(JSON.stringify(arg))
}

function interface(cb) {
    callback = cb
    connect()
}

function msgHandler(msg) {
    msg = JSON.parse(msg)
    switch (true) {
        case true:
            callback(msg)
            break
        case msg[1] == 'hb':
            console.log('tapi heart beat...')
    }
}

function connect() {
    connecting = true
    let apiKey = process.env.key
    let apiSecret = process.env.secret

    const authNonce = Date.now()
    const authPayload = 'AUTH' + authNonce
    const authSig = crypto.HmacSHA384(authPayload, apiSecret).toString(crypto.enc.Hex)
    const payload = {
        apiKey,
        authSig,
        authNonce,
        authPayload,
        event: 'auth',
        //dms: 4, // Optional Deam-Man-Switch flag to cancel all orders when socket is closed
    }
    wsConn = new websocket('wss://api.bitfinex.com/ws/2')
    wsConn.on('open', () => {
        connecting = false
        console.log(`${new Date().toISOString()} - Successfully conected!`)
        wsConn.send(JSON.stringify(payload))
        if (!connWatchdogRunning) connWatchdog()
    })
    wsConn.on('message', msgHandler)
    wsConn.on('error', err => {
        error(err)
    })
}

async function connWatchdog() {
    let waitingTime = 10 * 1000
    while (true) {
        connWatchdogRunning = true
        await (new Promise( res => setTimeout(res, waitingTime)))

        switch (true) {
            case !connecting && wsConn.readyState != 1:
                error(`${new Date().toISOString()} - No connection to server`)
                connect()
                break

            case wsConn.readyState == 1:
                waitingTime = 10 * 1000
                break
        }
    }
}

function fileOrDirectoryExists(filePath){
	return new Promise( res => {
		fs.access( filePath, fs.constants.F_OK, err => {
			if(err){
				res(false)
			}else{
				res(true)
			}
		})
	})
}

function createDir(directoryName){
	fs.mkdirSync( `${process.cwd()}/${directoryName}`, {recursive: true}, err => {
		if(err){
			log(err)
		}
	})
}

function appendFile(path, content, callback) {
	fs.appendFile(path != undefined ? path : './output', content, err => {
		if (err) {
			error(`Error -->  ${err}`)
		}
		if (typeof callback === 'function') callback(path, content)
	})
}