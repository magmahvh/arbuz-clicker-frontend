<template>
	<div class="game">
		<div class="game__container">
<!--			<SearchCommunity />-->
			<div class="hidden_div"></div>
			<div class="game__interface">
				<Balance
					:balance="balance"
				/>
				<div class="game__template">
					<!--				@click="clickOnField"-->
					<GameField ref="game" id="game" class="game__field"/>
				</div>
				<Energy
					:energy="energy"
				/>
				<Navbar/>
			</div>
		</div>
	</div>
	<!--	<div class="background-gradient"></div>-->
</template>

<script>
import Energy from "@/components/game/Energy.vue";
import Balance from "@/components/game/Balance.vue";
import Navbar from "@/components/game/Navbar.vue";
import GameField from "@/components/game/GameField.vue";
import {mapActions, mapGetters} from "vuex";
import computedMixin from "@/mixins/computedMixin";
import SearchCommunity from "@/components/game/SearchCommunity.vue";

export default {
	name: "ClickerGame",
	components: {
		SearchCommunity,
		GameField,
		Navbar,
		Balance,
		Energy
	},
	mixins: [computedMixin],
	data() {
		return {
			secondInterval: null,
			debounce: null,
			gameIsActive: false,
			clickCount: 0,
			clickCountRaw: 0,
			balance: {
				value: 0,
				perSecond: 0
			},
			energy: {
				current: 0,
				total: 0
			}
		}
	},
	computed: {
		...mapGetters([
			'GET_USER_INFO',
			'GET_WEBSOCKET_ENERGY',
			'GET_WEBSOCKET_MINER'
		]),
		getClickTotal() {
			let clickSum = 0
			if (this.GET_USER_INFO.clickBoostSum > 0) {
				clickSum = 1 * this.GET_USER_INFO.clickBoostSum
			} else {
				clickSum = 1
			}

			return clickSum
		},
		gameConditions() {
			return this.energy.current >= this.energy.total || this.energy.current >= this.getClickTotal;
		},
	},
	methods: {
		...mapActions([
			'SAVE_USER_INFO',
			'WEBSOCKET_ENERGY'
		]),
		checkBalance() {
			if (this.GET_USER_INFO?.clicks) {
				this.balance.value = this.GET_USER_INFO?.clicks
			}
			if (this.GET_USER_INFO?.minerBoostSum) {
				this.balance.perSecond = this.GET_USER_INFO?.minerBoostSum
			}
		},
		checkEnergy() {
			if (this.GET_USER_INFO?.energy) {
				this.energy.current = this.GET_USER_INFO?.energy
			}
			if (this.GET_USER_INFO?.energyLimit) {
				this.energy.total = this.GET_USER_INFO?.energyLimit
			}
		},
		// addWebsocketEnergy() {
		// 	if (this.GET_WEBSOCKET_ENERGY?.value) {
		// 		this.energy.current = this.GET_WEBSOCKET_ENERGY?.value
		// 	}
		// 	if (this.GET_WEBSOCKET_ENERGY?.total) {
		// 		this.energy.total = this.GET_WEBSOCKET_ENERGY?.total
		// 	}
		// },
		checkPlatform() {
			let gameField = document.getElementById('game')
			if (/Android|iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
				gameField.addEventListener('touchend', this.touchEvent)
			} else {
				gameField.addEventListener('click', this.clickOnField)
			}
		},
		async checkUser() {
			try {
				let response = await this.clickerApi.getUserInfo()
				console.log(response, 'http me')
				await this.SAVE_USER_INFO(response)
			} catch (err) {
				console.log(err)
			}
		},
		touchEvent(event) {
			for (let i = 0; i < event.changedTouches.length; i++) {
				this.clickOnField(event.changedTouches[i])
			}
		},
		clickOnField(event) {
			this.gameIsActive = true

			if (this.gameConditions === true) {
				let clickTotal = this.getClickTotal
				this.clickCount += clickTotal
				this.balance.value += clickTotal

				this.createVisualCount(clickTotal, event)
				this.decreaseEnergy(clickTotal)
				this.chargeClicks()
				this.addSuccessHaptic()
			} else {
				this.gameIsActive = false
				this.addFailureHaptic()
			}
		},
		createVisualCount(count, e) {
			let gameField = document.getElementById('game')
			let id = 'clickId_' + Date.now()
			let visualCount = this.setNewVisualCount(count, e, id)
			gameField.appendChild(visualCount)

			setTimeout(() => {
				this.deleteClickCount(id)
			}, 1400)
		},
		setNewVisualCount(count, e, id) {
			let visualCount = document.createElement('p')

			visualCount.classList.add('click-count')
			visualCount.setAttribute('id', id)
			visualCount.textContent = count
			visualCount.style.left = (e.clientX - e.target.offsetLeft - 16) + 'px'
			visualCount.style.top = (e.clientY - e.target.offsetTop - 16) + 'px'

			return visualCount
		},
		deleteClickCount(id) {
			let gameField = document.getElementById('game')
			let visualCount = document.getElementById(id)
			if (gameField && visualCount) {
				gameField.removeChild(visualCount)
			}
		},
		decreaseEnergy(sum) {
			this.energy.current = this.energy.current < sum ? 0 : this.energy.current - sum
		},
		chargeClicks() {
			this.clickCountRaw += 1
			clearTimeout(this.debounce);

			if (this.clickCountRaw === 200) {
				this.postClicks()
				return
			}
			this.debounce = setTimeout(() => {
				this.postClicks()
			}, 500)
		},
		addSuccessHaptic() {
			if (this.webApp.isVersionAtLeast('6.1')) {
				this.webApp.HapticFeedback.impactOccurred('light')
			}
		},
		addFailureHaptic() {
			if (this.webApp.isVersionAtLeast('6.1')) {
				this.webApp.HapticFeedback.notificationOccurred('error')
			}
		},
		recoveryEnergy() {
			if (this.energy.current < this.energy.total) {
				if ((this.energy.current + this.GET_USER_INFO?.energyBoostSum) > this.energy.total) {
					this.energy.current = this.energy.total
					return
				}
				this.energy.current += this.GET_USER_INFO?.energyBoostSum
			}
		},
		addMinerToBalance() {
			if (this.GET_USER_INFO.minerBoostSum && this.GET_USER_INFO?.minerBoostSum > 0) {
				this.balance.value += this.GET_USER_INFO.minerBoostSum
			}
			// if (this.GET_WEBSOCKET_MINER.income) {
			// 	this.balance.value += this.GET_WEBSOCKET_MINER.income
			// }
		},
		async postClicks() {
			try {
				let response = await this.clickerApi.addClick(this.clickCount)
				console.log(response)
				this.energy.current = response?.currentEnergy
				// setTimeout(async () => {
					// let res = await this.clickerApi.getUserInfo()
					// console.log(res)
					// await this.SAVE_USER_INFO(res)
				// }, 1000)
			} catch (err) {
				console.log(err)
			} finally {
				this.clickCount = 0
				this.clickCountRaw = 0
				this.gameIsActive = false
			}
		},
	},
	watch: {
		GET_USER_INFO: {
			handler() {
				this.checkBalance()
				this.checkEnergy()
			}
		},
		// GET_WEBSOCKET_ENERGY: {
		// 	handler() {
		// 		this.addWebsocketEnergy()
		// 	}
		// },
		// GET_WEBSOCKET_MINER: {
		// 	handler() {
		// 		if (this.GET_WEBSOCKET_MINER.fromBoostId !== null) {
		// 			this.addMinerToBalance()
		// 		}
		// 	}
		// }
	},
	mounted() {
		this.checkPlatform()
		this.checkUser()
		document.documentElement.style.overflow = 'hidden'
		this.secondInterval = setInterval(() => {
			this.recoveryEnergy()
			this.addMinerToBalance()
			// if (this.gameIsActive === false) {
			// }
		}, 1000)
	},
	unmounted() {
		// let gameField = document.getElementById('game')
		// gameField.removeEventListener('touchend', this.touchEvent)
		clearInterval(this.secondInterval)
		clearTimeout(this.debounce)
		document.documentElement.style.overflow = 'auto'
	}
}
</script>

<style>
.game {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	top: 0;
	z-index: 100;
	overflow-y: hidden;
	padding-top: 10px;
	padding-bottom: 25px;
	max-height: 100dvh;
}

.game__container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	max-width: 100%;
	width: 100%;
	height: 100%;
	margin: 0 auto;
	padding: 0 16px;
}

.game__template {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	//margin: 0 auto;
	margin-bottom: calc(100vh / 25);
}

.game__interface {
	//position: fixed;
	//left: 16px;
	//bottom: 25px;
	//width: calc(100vw - 32px);
}

.hidden_div {
	opacity: 0;
}

.click-count {
	position: absolute;
	font-size: 30px;
	color: #fff;
	animation: Hide 1.4s forwards;
	pointer-events: none;
}

@keyframes Hide {
	0% {
		transform: translateY(0px);
		opacity: 1;
	}
	100% {
		transform: translateY(-100px);
		opacity: 0;
	}
}

@media screen and (max-height: 600px) {
	.game {
		padding-bottom: 15px;
	}

	.game__template {
		margin-bottom: 16px;
	}
}
</style>