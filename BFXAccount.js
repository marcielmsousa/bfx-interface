const msg = log => {console.log(log)}
const bfxTapiV2 = require('./BFX_AuthV2')
const bfxTapiV1 = require('./BFX_AuthV1')
const enums = require('./Enums')

module.exports = {
	
	// 10 req/min
	readWallets: readWallets,
	// 10 req/min
	readWallet: readWallet,
	
	haveEnoughBalance: haveEnoughBalance,
	transferAllBalancesToExchange: transferAllBalancesToExchange,
	transferAllBalancesToMargin: transferAllBalancesToMargin,
	getActiveOrders: getActiveOrders,
	getActivePositions: getActivePositions,
	getOrdersHistory: getOrdersHistory,
	readWalletsV2: readWalletsV2,
}

function readWalletsV2(){
	return new Promise( (resolve, reject) => {
		bfxTapiV2.execute( `${enums.apiPath.wallets}`, {}, result => {
			resolve( result )
		})
	})
}

function getOrdersHistory( start, end, limit ){
	return new Promise( resolve => {
		let body = {}
		
		if( start != undefined && end != undefined ){
			body.start = start
			body.end = end
		}
		if( limit != undefined ) body.limit = limit
		
		bfxTapiV2.execute( `${enums.apiPath.ordersInfo}/hist`, body, result => {
			let swap = []
			result.forEach( item => {
				swap.push( normalizeOrderData(item) )
			})
			resolve( swap )
		})
	})
}

function normalizeOrderData( order ){
	let swap = {
		id: order[0],
		gid: order[1], //Group ID
		cid: order[2], //Client order ID
		symbol: order[3],
		mts_create: order[4],
		mts_update: order[5],
		amount: order[6],
		amount_orig: order[7],
		type: order[8],
		type_prev: order[9],
		mts_tif: order[10], //TIF -> Time in force | Indicates expiry time of trade, if it was setled
		order_status: order[11],
		price: order[12],
		price_avg: order[13],
		price_trailing: order[14],
		price_aux_limit: order[15], //Auxiliary Limit price (for STOP LIMIT)
		notify: order[16] == 0 ? false : true,
		hidden: order[17] == 0 ? false : true,
		placed_id: order[18], //ID of the OCO order that generate this order
		routing: order[19], //Indicates origin of action: BFX, ETHFX, API>BFX, API>ETHFX
		flags: order[20], //Hidden=64, Close=512, Reduce Only=1024, Post Only=4096, OCO=16384, No Var Rates=524288 || See https://docs.bitfinex.com/v2/docs/flag-values. 
		meta: order[21]
	}
	return swap
}

function getActivePositions(){
	return new Promise( resolve => {
		bfxTapiV2.execute( enums.apiPath.activePositions, {}, result => {
			let swap = []
			result.forEach( item => {
				swap.push( normalizePositionData(item) )
			})
			resolve( swap )
		})
	})
}

function normalizePositionData( pos ){
	let swap = {
		symbol: pos[0],
		status: pos[1],
		amount: pos[2],
		base_price: pos[3],
		margin_funding: pos[4],
		margin_funding_type: pos[5] == 0 ? 'daily' : 'term',
		pl: pos[6],
		pl_perc: pos[7],
		price_liq: pos[8],
		leverage: pos[9],
		position_id: pos[10],
		mts_create: pos[11],
		mts_update: pos[12],
		// updated: `${new Date(pos[12]).toDateString()} - ${new Date(pos[12]).toTimeString()}`,
		type: pos[13] == 0 ? 'margin' : 'derivatives',
		collateral: pos[14],
		collateral_min: pos[15],
		meta: pos[16]
	}
	return swap
}

function getActiveOrders(){
	return new Promise( resolve => {
		bfxTapiV2.execute( enums.apiPath.ordersInfo, {}, result => {
			let swap = []
			result.forEach( order => {
				swap.push( normalizeOrderData(order) )
			})
			resolve( swap )
		})
	})
}

function transferAllBalancesToExchange(){
	return transferAllBalances( enums.walletTypeV1.margin, enums.walletTypeV1.exchange)
}

function transferAllBalancesToMargin(){
	return transferAllBalances( enums.walletTypeV1.exchange, enums.walletTypeV1.margin)
}

async function transferAllBalances( fromWallet, toWallet ){
	let wallets
	let queue = []
	let currenciesToIgnore
	let ignoreCurrency
	let errorOccured
	do{
		await readWallets().then( result => {
			wallets = result
		}).catch(reject => { msg (reject)})
		/*
		await handlers.paramsPromise().then( params => {
			currenciesToIgnore = params.currencies_to_ignore
		})
		*/
		queue = []
		wallets.forEach( wallet => {
			ignoreCurrency = isOnArray( currenciesToIgnore, wallet.currency )
			if(!ignoreCurrency && wallet.type == fromWallet ){
				queue.push({
					currency: wallet.currency,
					amount: wallet.available,
					originWallet: fromWallet,/*== 'trading' ? enums.walletTypeV2.margin : fromWallet,*/
					targetWallet: toWallet /*== 'trading' ? enums.walletTypeV2.margin : toWallet*/
				})
			}
		})
		if(queue.length > 0){
			await transferCurrency( queue.shift() ).then( result => {
				msg( result )
				errorOccured = result[0] == 'error' ? true : false
			})
		}
		
		if(queue.length > 0 || errorOccured){
			//Max req/min on walletsV1 endpoint = 10
			let sleepTimeMillis = 60/10*1000
			await sleep( sleepTimeMillis )
		}else{
			msg('No more balances to move')
			break
		}
	}while(true)
	return new Promise( resolve => { resolve(0) } ) 
}

function sleep(millis){
	return new Promise( res => setTimeout(millis, res))
}

function isOnArray(arr, item) {
	let arrItem;
	for (let index in arr) {
		arrItem = arr[index];
		if (arrItem === item) {
			return true;
		}
	}
	return false;
}


function transferCurrency(transferParameters) {
	let body = {
		from: transferParameters.originWallet,
		to: transferParameters.targetWallet,
		currency: transferParameters.currency.toUpperCase(),
		amount: transferParameters.amount.toString()
	}
	msg(`Will transfer ${body.amount} ${body.currency} from ${body.from.toUpperCase()} to ${body.to.toUpperCase()} wallet.`)
	return new Promise( resolve => {
		bfxTapiV2.execute(enums.apiPath.transferFunds, body, result => {
			resolve( result )
		})
	})
}

function haveEnoughBalance(coin, volume, walletType, callback){
	readWallets( wallets => {
		let targetWallet = undefined
		for(const item of wallets){
			if(item.type.toUpperCase() == walletType.toUpperCase()){
				if(item.currency.toUpperCase() == coin.toUpperCase()){
					targetWallet = item
					break
				}
			}
		}
		
		if(targetWallet != undefined){
			switch(true){
				case targetWallet.available >= volume:
					callback(true)
					break
				
				default:
					callback(false)
			}
		}else{
			callback(false)
		}
	})
}

function readWallet(currency){
	return new Promise( (resolve, reject) => {
		readWallets().then( wallets => {
			for(let i in wallets){
				if(wallets[i].currency.toUpperCase() == currency.toUpperCase()){
					resolve(wallets[i])
					break
				}
			}
			reject( `Currency ${currency} have no available balance` )
		})
	})
}

function readWallets(){
	return new Promise( resolve => {
		//Version 2 of BFXAPI dont showing how much of balance is available
		bfxTapiV1.execute(enums.apiPath.walletsV1, undefined, wallets => {
			resolve( JSON.parse(wallets) )
		})
	})
}