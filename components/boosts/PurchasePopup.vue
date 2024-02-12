<template>
	<div class="popup-template"
		 @click.self="$emit('closePopup')"
	>
		<div class="popup">
			<button class="close-btn"
				@click="$emit('closePopup')"
			>
				<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="white"/>
				</svg>
			</button>
			<div class="popup__content">
				<p class="popup__icon">{{ item?.iconEmoji }}</p>
<!--				<img src="@/assets/boosts/low-boost.png" alt="icon" class="popup__icon">-->
				<div class="text-block">
					<h3 class="popup__name">{{ item?.name }}</h3>
					<p class="popup__text">Добавляет {{ textDescription }}</p>
				</div>
				<div class="text-block">
					<p class="popup__text">{{ textDescription }} при увеличении уровня</p>
<!--					<p class="popup__text">Максимальный уровень 3</p>-->
				</div>
				<div class="text-row">
					<img src="@/assets/game/balance-icon.webp" alt="" class="main-icon">
					<p class="popup__price" :class="{price_red: !checkBalance}">{{ editPrice }}</p>
					<p class="popup__level">{{ getLevel + 1 }} уровень</p>
				</div>
				<main-button class="popup__btn"
					@click="upBoost"
				 	:disabled="!checkBalance"
				>
					{{ btnText }}
				</main-button>
			</div>
		</div>
	</div>
</template>

<script>

import methodsMixin from "@/mixins/methodsMixin";
import computedMixin from "@/mixins/computedMixin";
import {mapActions, mapGetters} from "vuex";

export default {
	name: "PurchasePopup",
	mixins: [methodsMixin, computedMixin],
	props: {
		item: {
			type: Object,
		},
		active: {
			type: Object,
		},
		getLevel: {
			type: Number,
		}
	},
	data() {
		return {

		}
	},
	computed: {
		...mapGetters([
			'GET_USER_INFO',
		]),
		textDescription() {
			if (this.item.type === 'CLICK_POWER') {
				return `+${this.item?.power} за клик`
			} else if (this.item.type === 'MINER') {
				return `+${this.item?.power} в секунду`
			} else if (this.item.type === 'ENERGY_RECOVERY') {
				return `+${this.item?.power} энергии в секунду`
			}
		},
		btnText() {
			if (!this.checkBalance) {
				return 'Недостаточно арбузов'
			} else if (this.active) {
				return 'Прокачать уровень'
			} else {
				return 'Купить'
			}
		},
		checkBalance() {
			if (this.GET_USER_INFO?.clicks >= this.getPriceWithLevel) {
				return true
			} else {
				return false
			}
		},
	},
	methods: {
		...mapActions([
			'SAVE_ACTIVE_BOOSTS',
			'SAVE_USER_INFO'
		]),
		upBoost() {
			if (this.active) {
				this.upgradeBoost()
			} else {
				this.purchaseBoost()
			}
		},
		async upgradeBoost() {
			try {
				let response = await this.clickerApi.upgradeBoost(this.active.id)
				this.$emit('closePopup')
				await this.updateBoost()
				await this.updateUserInfo()
			} catch (err) {
				console.log(err)
			}
		},
		async purchaseBoost() {
			try {
				let response = await this.clickerApi.purchaseBoost(this.item.id)
				this.$emit('closePopup')
				await this.updateBoost()
				await this.updateUserInfo()
			} catch(err) {
				console.log(err)
			}
		},
		async updateBoost() {
			try {
				let response = await this.clickerApi.getActiveBoosts()
				await this.SAVE_ACTIVE_BOOSTS(response.items)
			} catch(err) {
				console.log(err)
			}
		},
		async updateUserInfo() {
			try {
				let response = await this.clickerApi.getUserInfo()
				this.SAVE_USER_INFO(response)
			} catch(err) {
				console.log(err)
			}
		},
	},
	mounted() {
		// console.log(this.item)
	}
}
</script>

<style scoped>
	.popup-template {
		position: fixed;
		bottom: 0;
		left: 0;
		top: 0;
		right: 0;
		z-index: 999;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		height: 100dvh;
	}

	.popup {
		position: relative;
		padding: 40px 16px 20px 16px;
		border-radius: 6px 6px 0 0;
		background: rgba(45, 45, 45, 0.80);
		backdrop-filter: blur(10px);
	}

	.close-btn {
		position: absolute;
		top: 20px;
		right: 20px;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 100px;
		background: rgba(255, 255, 255, 0.10);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.popup__content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.popup__icon {
		margin-bottom: 30px;
		//width: 124px;
		//height: 124px;
		font-size: 124px;
	}

	.text-block {
		margin-bottom: 24px;
	}

	.popup__name {
		margin-bottom: 6px;
		font-size: 20px;
		text-align: center;
	}

	.popup__text {
		margin-bottom: 6px;
		text-align: center;
		font-size: 14px;
	}

	.text-row {
		margin-bottom: 30px;
		display: flex;
		align-items: center;
	}

	.main-icon {
		margin-right: 3px;
		width: 16px;
		height: 16px;
	}

	.popup__price {
		transition: .15s;
		margin-right: 15px;
		font-size: 18px;
		font-family: Inter-Medium, sans-serif;
		color: #7CFF99;
	}

	.price_red {
		color: #FF3B30;
	}

	.popup__level {
		font-size: 14px;
		font-family: Inter-Medium, sans-serif;
		opacity: 0.5;
	}

	.popup__btn {
		transition: .15s;
		width: 100%;
		padding: 20px;
	}

	.popup__btn:disabled {
		background: #FF3B30;
		opacity: 0.7;
	}

</style>