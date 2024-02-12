<template>
	<div class="boosts">
		<div class="boosts__scroll-template" id="scroll">
			<div class="boosts__balance">
				<Balance
					:balance="balance"
				/>
			</div>
			<!--			<h3 class="boosts__caption">Бесплатные ежедневные бусты</h3>-->
			<!--			<div class="boosts__cards-list">-->
			<!--				<card-wrapper class="boosts__card card">-->
			<!--					<div class="card__info">-->
			<!--						<p class="card__name">Турбо</p>-->
			<!--						<p class="card__description">3/3 доступно</p>-->
			<!--					</div>-->
			<!--					<img src="@/assets/boosts/boosts-icon.png" alt="icon" class="card__icon">-->
			<!--				</card-wrapper>-->
			<!--				<card-wrapper class="boosts__card card">-->
			<!--					<div class="card__info">-->
			<!--						<p class="card__name">100% энергии</p>-->
			<!--						<p class="card__description">3/3 доступно</p>-->
			<!--					</div>-->
			<!--					<img src="@/assets/boosts/energy-boost.png" alt="icon" class="card__icon">-->
			<!--				</card-wrapper>-->
			<!--			</div>-->
			<h3 class="boosts__caption">Мощность</h3>
			<div class="boosts__slider">
				<p class="booost__empty-text" v-if="getPowerBoost.length === 0">Нет доступных бустов</p>
				<card-wrapper class="boosts__wrapper"
							  v-if="getPowerBoost.length > 0"
				>
					<ul class="boosts__list">
						<BoostItem
							@showPopup="showPopup"
							v-for="(item, index) in getPowerBoost.slice(0, 4)"
							:key="index"
							:item="item"
						/>
					</ul>
				</card-wrapper>
				<card-wrapper class="boosts__wrapper"
							  v-if="getPowerBoost.length > 4"
				>
					<ul class="boosts__list">
						<BoostItem
							@showPopup="showPopup"
							v-for="(item, index) in getPowerBoost.slice(4, 8)"
							:key="index"
							:item="item"
						/>
					</ul>
				</card-wrapper>
			</div>
			<h3 class="boosts__caption">Майнинг арбузов</h3>
			<div class="boosts__slider">
				<p class="booost__empty-text" v-if="getMiningBoost.length === 0">Нет доступных бустов</p>
				<card-wrapper class="boosts__wrapper"
							  v-if="getMiningBoost.length > 0"
				>
					<ul class="boosts__list">
						<BoostItem
							@showPopup="showPopup"
							v-for="(item, index) in getMiningBoost.slice(0, 4)"
							:key="index"
							:item="item"
						/>
					</ul>
				</card-wrapper>
				<card-wrapper class="boosts__wrapper"
							  v-if="getMiningBoost.length > 4"
				>
					<ul class="boosts__list">
						<BoostItem
							@showPopup="showPopup"
							v-for="(item, index) in getMiningBoost.slice(4, 8)"
							:key="index"
							:item="item"
						/>
					</ul>
				</card-wrapper>
			</div>
			<h3 class="boosts__caption">Энергия</h3>
			<div class="boosts__slider">
				<p class="booost__empty-text" v-if="getEnergyBoost.length === 0">Нет доступных бустов</p>
				<card-wrapper class="boosts__wrapper"
							  v-if="getEnergyBoost.length > 0"
				>
					<ul class="boosts__list">
						<BoostItem
							@showPopup="showPopup"
							v-for="(item, index) in getEnergyBoost.slice(0, 4)"
							:key="index"
							:item="item"
						/>
					</ul>
				</card-wrapper>
				<card-wrapper class="boosts__wrapper"
							  v-if="getEnergyBoost.length > 4"
				>
					<ul class="boosts__list">
						<BoostItem
							@showPopup="showPopup"
							v-for="(item, index) in getEnergyBoost.slice(4, 8)"
							:key="index"
							:item="item"
						/>
					</ul>
				</card-wrapper>
			</div>
			<PurchasePopup
				v-if="show === true"
				:item="chooseBoost.showItem"
				:active="chooseBoost.active"
				:getLevel="chooseBoost.level"
				@closePopup="closePopup"
			/>
		</div>
		<!--			<h3 class="boosts__caption">Скины</h3>-->
		<!--			<card-wrapper>-->
		<!--				<ul class="boosts__list">-->
		<!--					<SkinItem-->
		<!--						v-for="(item, index) in getEnergyBoost.slice(4, 8)"-->
		<!--						:key="index"-->
		<!--						:item="item"-->
		<!--					/>-->
		<!--				</ul>-->
		<!--			</card-wrapper>-->
	</div>
</template>

<script>
import Balance from "@/components/game/Balance.vue";
import BoostItem from "@/components/boosts/BoostItem.vue";
import computedMixin from "@/mixins/computedMixin";
import {mapActions, mapGetters} from "vuex";
import SkinItem from "@/components/boosts/SkinItem.vue";
import PurchasePopup from "@/components/boosts/PurchasePopup.vue";

export default {
	name: "Boosts",
	components: {
		PurchasePopup,
		SkinItem,
		BoostItem,
		Balance,
	},
	mixins: [computedMixin],
	data() {
		return {
			show: false,
			balance: {
				value: 0,
			},
			chooseBoost: {
				showItem: null,
				active: null,
				level: 0
			}
			/*
			{
				"id": 5346448741,
				"referralUserId": null,
				"energy": 985,
				"energyLimit": 1000,
				"clicks": 156,
				"energyRecoveryCheckpointMs": 1706099942028,
				"clickBoostSum": 10,
				"energyBoostSum": 0

				now = currentTimeMillis()
				seconds = (now - energyRecoveryCheckpointMs) / 1000
				count = seconds * energyBoostSum

				if (count >= energyLimit) {
					post("/api/recover-energy", {"count: )

				}
			 */
		}
	},
	computed: {
		...mapGetters([
			'GET_USER_INFO',
			'GET_ALL_BOOSTS',
			'GET_SKINS'
		]),
		// getBalance() {
		// 	return {
		// 		value: this.GET_USER_INFO?.clicks
		// 	}
		// },
		getPowerBoost() {
			if (this.GET_ALL_BOOSTS.length > 0) {
				return this.GET_ALL_BOOSTS.filter((item) => item.type === 'CLICK_POWER')
			} else {
				return []
			}
		},
		getMiningBoost() {
			if (this.GET_ALL_BOOSTS.length > 0) {
				return this.GET_ALL_BOOSTS.filter((item) => item.type === 'MINER')
			} else {
				return []
			}
		},
		getEnergyBoost() {
			if (this.GET_ALL_BOOSTS.length > 0) {
				return this.GET_ALL_BOOSTS.filter((item) => item.type === 'ENERGY_RECOVERY')
			} else {
				return []
			}
		},
		getAllSkins() {
			return this.GET_SKINS
		}
	},
	methods: {
		...mapActions([
			'SAVE_USER_INFO',
			'SAVE_ALL_BOOSTS',
			'SAVE_ACTIVE_BOOSTS',
			'SAVE_SKINS'
		]),
		showPopup(value) {
			this.chooseBoost.showItem = value.showItem
			this.chooseBoost.active = value.active
			this.chooseBoost.level = value.level
			this.show = true
		},
		closePopup() {
			this.chooseBoost.showItem = null
			this.chooseBoost.active = null
			this.chooseBoost.level = 0
			this.show = false
		},
		async getUserInfo() {
			try {
				let response = await this.clickerApi.getUserInfo()
				await this.SAVE_USER_INFO(response)
				this.balance.value = response?.clicks
			} catch (err) {
				console.log(err)
			}
		},
		async getAllBoosts() {
			try {
				let response = await this.clickerApi.getAllBoosts()
				this.SAVE_ALL_BOOSTS(response.items)
				sessionStorage.setItem('boostsLoaded', JSON.stringify(response.items))
			} catch (err) {
				console.log(err)
			}
		},
		async getActiveBoosts() {
			try {
				let response = await this.clickerApi.getActiveBoosts()
				this.SAVE_ACTIVE_BOOSTS(response.items)
			} catch (err) {
				console.log(err)
			}
		},
		async getSkins() {
			try {
				let response = await this.clickerApi.getAllSkins()
				this.SAVE_SKINS(response.items)
				sessionStorage.setItem('skinsLoaded', JSON.stringify(response.items))
			} catch (err) {
				console.log(err)
			}
		},
		checkFirstSessionLoad() {
			let boostsLoaded = JSON.parse(sessionStorage.getItem('boostsLoaded'))
			let skinsLoaded = JSON.parse(sessionStorage.getItem('skinsLoaded'))

			if (boostsLoaded) {
				this.SAVE_ALL_BOOSTS(boostsLoaded)
			} else {
				this.getAllBoosts()
			}
			if (skinsLoaded) {
				this.SAVE_SKINS(skinsLoaded)
			} else {
				this.getSkins()
			}
		},
		scrollEvent(event) {
			// console.log(event)
		},
		// async getMySkin() {
		// try {
		// 	let response = await this.clickerApi.getActiveBoosts()
		// 	this.SAVE_ACTIVE_BOOSTS(response)
		// } catch(err) {
		// 	console.log(err)
		// }
		// }
	},
	mounted() {
		this.getUserInfo()
		this.getActiveBoosts()
		this.checkFirstSessionLoad()
		// this.getMySkin()
	},
	watch: {
		show: {
			handler: function () {
				if (this.show) {
					document.documentElement.style.overflow = 'hidden'
					return
				}
				document.documentElement.style.overflow = 'auto'
			},
			deep: true
		},
	}
}
</script>

<style scoped>
.boosts {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
	height: 100dvh;
}

.boosts__scroll-template {
	padding-bottom: 20px;
	padding-top: 40px;
	height: 100%;
	overflow-y: scroll;
}

.boosts__balance {
	margin-bottom: 40px;
	padding: 0 16px;
}

.boosts__caption {
	margin-bottom: 14px;
	font-size: 20px;
	padding: 0 16px;
}

.boosts__cards-list {
	margin-bottom: 40px;
	display: flex;
	gap: 0 8px;
	padding: 0 16px;
}

.card {
	flex: 50%;
	padding: 14px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.card__icon {
	width: 32px;
	height: 32px;
}

.card__name {
	margin-bottom: 6px;
	font-size: 14px;
	font-family: Inter-Medium, sans-serif;
}

.card__description {
	font-size: 13px;
	opacity: 0.7;
}

.boosts__slider {
	display: flex;
	align-items: flex-start;
	flex-wrap: nowrap;
	overflow-x: auto;
	gap: 0 14px;
	padding: 0 16px 0 16px;
	scroll-snap-type: x mandatory;
	scroll-padding-left: 16px;
	scroll-padding-right: 16px;
}

.boosts__slider::-webkit-scrollbar {
	width: 0;
}

.boosts__slider:not(:last-child) {
	margin-bottom: 40px;
}

.boosts__slider:last-child {
	//margin-bottom: 20px;
}

.boosts__wrapper {
	min-width: calc(100vw - 50px);
	padding: 16px;
	scroll-snap-align: start;
}

.boosts__list {
	display: flex;
	flex-direction: column;
//gap: 10px 0;
}
</style>