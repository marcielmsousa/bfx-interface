module.exports = {
    apiPath: {
        wallets: '/v2/auth/r/wallets',
        walletsHistory: '/v2/auth/r/wallets/hist',
        retrieveOrders: '/v2/auth/r/orders',
        submitOrder: '/v2/auth/w/order/submit',
        transferFunds: '/v2/auth/w/transfer',
        walletsV1: '/v1/balances',
        updateOrder: '/v2/auth/w/order/update',
        cancelOrdersV1: '/v1/order/cancel/all',
		symbolsDetailsV1Url: 'https://api.bitfinex.com/v1/symbols_details',
		apiUrlV2: 'https://api-pub.bitfinex.com/v2',
		activePositions: '/v2/auth/r/positions',
		ordersInfo: '/v2/auth/r/orders',
		ordersHistoryV1: '/v1/orders/hist',
	},
	
	orderType: {
		limit: 'LIMIT',
		market: 'MARKET',
		stop: 'STOP',
		stopLimit: 'STOP LIMIT',
		trailingStop: 'TRAILING STOP',
		fok: 'FOK',
		ioc: 'IOC',
		exchangeMarket: 'EXCHANGE MARKET',
		exchangeLimit: 'EXCHANGE LIMIT',
		exchangeStop: 'EXCHANGE STOP',
		exchangeStopLimit: 'EXCHANGE STOP LIMIT',
		exchangeTrailingStop: 'EXCHANGE TRAILING STOP',
		exchangeFok: 'EXCHANGE FOK',
		exchangeIoc: 'EXCHANGE IOC'
	},
	
	orderSide: {
		sell: -1,
		buy: 1
	},
	
	walletTypeV1: {
		margin: 'trading',
		exchange: 'exchange'
	},
	
	walletTypeV2: {
		margin: 'margin',
		exchange: 'exchange'
	},
}