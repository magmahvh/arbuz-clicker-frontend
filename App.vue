<template>
	<div class="visual-hoisting">
		<router-view/>
	</div>
	<div class="background-gradient" :class="getRouteName !== 'Game' ? 'hidden' : '' "></div>
</template>

<script>
import computedMixin from "@/mixins/computedMixin.js";
import {mapActions} from "vuex";
import {websocketMessageEvent} from "@/helpers/websocket/messages";

export default {
	name: 'App',
	mixins: [computedMixin],
	data() {
		return {
			websocket: null,
			websocketCloseCount: 0
		}
	},
	// computed: {
	//
	// },
	methods: {
		...mapActions([
			'SAVE_USER_INFO',
			'WEBSOCKET_ENERGY',
			'WEBSOCKET_MINER'
		]),
		callback() {
			window.history.back()
		},
		closeWebsocket() {
			if (this.websocket !== null) {
				this.websocket.close()
				this.websocket = null
			}
		},
		initWebsocket() {
			let initData = null
			if (this.webApp.initData) {
        // encode in base64
				initData = btoa(this.webApp.initData)
			} else {
				initData = btoa(process.env.VUE_APP_TEST_INIT)
			}
			this.websocket = new WebSocket(`${process.env.VUE_APP_WSS}/events?init-data=${initData}`)
			this.websocket.onmessage = (event) => {
				websocketMessageEvent(event, this)
			}
			this.websocket.onopen = this.websocketOnOpen
			this.websocket.onerror = (error) => {
				console.log(error, 'websocket error')
			}
			this.websocket.onclose = this.websocketOnClose
		},
		websocketOnOpen() {
			console.log('ws соединение установлено')
		},
		websocketOnClose() {
			setTimeout(() => {
				this.initWebsocket()
			}, 5000)
		},
		// saveEnergyRecovery(energy) {
		// 	this.WEBSOCKET_ENERGY(energy)
		// },
		saveClicks(miner) {
			this.WEBSOCKET_MINER(miner)
		},
		setTwaOptions() {
			if (!this.webApp.isExpanded) {
				this.webApp.expand()
				this.webApp.setHeaderColor('#000000')
				this.webApp.setBackgroundColor('#000000')
				this.webApp.enableClosingConfirmation()
			}
			if (this.webApp.MainButton.isVisible) {
				this.webApp.MainButton.hide()
			}
			// this.tonConnectUi.uiOptions = {
			// 	twaReturnUrl: 'https://t.me/bettygames_bot/betty'
			// };
			// this.webApp.onEvent('viewportChanged', (event) => {
			// 	this.webApp.expand()
			// })
			this.webApp.ready()
		},
		async checkUser() {
			try {
				let response = await this.clickerApi.getUserInfo()
				await this.SAVE_USER_INFO(response)
				if (this.websocket === null) {
					this.initWebsocket()
				}
			} catch (err) {
				console.log(err)
				if (err.response.status === 404) {
					await this.createUser()
				}
			}
		},
		async updateUser() {
			try {
				let response = await this.clickerApi.getUserInfo()
				await this.SAVE_USER_INFO(response)
				if (this.websocket === null) {
					this.initWebsocket()
				}
			} catch (err) {
				console.log(err)
			}
		},
		async createUser() {
			try {
				let referralId = this.webApp.initDataUnsafe?.start_param
				console.log("Referral id: " + referralId)
				await this.clickerApi.createUser(parseInt(referralId))
				await this.updateUser()
			} catch (err) {
				console.log(err)
			}
		}
	},
	mounted() {
		// document.addEventListener('DOMContentLoaded',  (event) => {
		// 	console.log(event)
		// })
		setTimeout(() => {
			this.setTwaOptions()
		}, 1000)
		this.checkUser()
	},
	unmounted() {
		this.closeWebsocket()
	},
	watch: {
		getRouteName: {
			handler() {
				let route = this.$route
				if (route.name === 'Game') {
					this.webApp.BackButton.offClick(this.callback)
					this.webApp.BackButton.hide()
				} else {
					if (!this.webApp.BackButton.isVisible) {
						this.webApp.BackButton.show()
						this.webApp.BackButton.onClick(this.callback)
					}
				}
			}
		}
	}
}
</script>

<style>

@font-face {
	font-family: Inter-Regular;
	src: url("~@/fonts/Inter/Inter-Regular.woff2") format("woff2"),
	url("~@/fonts/Inter/Inter-Regular.woff") format("woff");
	font-style: normal;
	font-weight: normal;
	font-display: fallback;
}

@font-face {
	font-family: Inter-Medium;
	src: url("~@/fonts/Inter/Inter-Medium.woff2") format("woff2"),
	url("~@/fonts/Inter/Inter-Medium.woff") format("woff");
	font-style: normal;
	font-weight: normal;
	font-display: fallback;
}

@font-face {
	font-family: Inter-Semibold;
	src: url("~@/fonts/Inter/Inter-SemiBold.woff2") format("woff2"),
	url("~@/fonts/Inter/Inter-SemiBold.woff") format("woff");
	font-style: normal;
	font-weight: normal;
	font-display: fallback;
}

@font-face {
	font-family: Inter-Bold;
	src: url("~@/fonts/Inter/Inter-Bold.woff2") format("woff2"),
	url("~@/fonts/Inter/Inter-Bold.woff") format("woff");
	font-style: normal;
	font-weight: normal;
	font-display: fallback;
}

@font-face {
	font-family: Inter-Extrabold;
	src: url("~@/fonts/Inter/Inter-ExtraBold.woff2") format("woff2"),
	url("~@/fonts/Inter/Inter-ExtraBold.woff") format("woff");
	font-style: normal;
	font-weight: normal;
	font-display: fallback;
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	color: #fff;
	font-family: sans-serif;
	-webkit-tap-highlight-color: transparent;
	line-height: 100%;
}

ul {
	list-style: none;
}

h1, h2, h3 {
	font-family: Inter-Semibold, sans-serif;
	font-weight: 600;
}

h4 {
	font-family: Inter-Medium, sans-serif;
	font-weight: 500;
}

a {
	text-decoration: none;
	font-family: Inter-Regular, sans-serif;
	cursor: pointer;
}

span, strong, p, li {
	font-family: Inter-Regular, sans-serif;
}

button {
	font-family: Inter-Medium, sans-serif;
	font-weight: 500;
	cursor: pointer;
}

body {
	background-color: #000;
}

.container {
	max-width: 100%;
	width: 100%;
	margin: 0 auto;
	padding: 0 16px;
}

.visual-hoisting {
	position: relative;
	z-index: 100;
}

.background-gradient {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	width: 100%;
	height: 70vh;
	border-radius: 10000px;
	background: radial-gradient(50% 50% at 50% 50%, #C7CA3D 0%, #CA3D6F 50%, #000 100%);
	filter: blur(125px);
//z-index: 1;
}

.hidden {
	display: none;
	opacity: 0;
}

::selection {
	background: transparent;
}

::-moz-selection {
	background: transparent;
}

@media screen and (max-width: 600px) {
	.container {
		max-width: 100%;
		width: 100%;
		margin: 0 auto;
		padding: 0 16px;
	}
}
</style>
