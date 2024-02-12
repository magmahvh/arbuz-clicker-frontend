<template>
	<div class="balance">
		<p class="balance__title" v-if="getRouteName === 'Boosts'">Твой баланс</p>
		<div class="balance__current">
			<img src="../../assets/game/balance-icon.webp" alt="Balance icon" class="balance__icon">
			<p class="balance__value">{{ enterNumber }}</p>
		</div>
<!--		<p class="balance__per-second" v-if="balance.perSecond >= 0">+{{ balance?.perSecond }} в секунду</p>-->
	</div>
</template>

<script>
import computedMixin from "@/mixins/computedMixin.js";
import methodsMixin from "@/mixins/methodsMixin";
import { gsap } from "gsap"

export default {
	name: "Balance",
	props: {
		balance: {
			type: Object,
			required: true
		}
	},
	mixins: [computedMixin, methodsMixin],
	data() {
		return {
			animatedNumber: 0,
		}
	},
	computed: {
		getBalance() {
			if (this.balance.value) {
				return this.balance.value.toFixed(0)
			} else {
				return 0
			}
		},
		enterNumber() {
			return this.filterNumber(this.animatedNumber.toFixed(0))
		},
	},
	watch: {
		getBalance(newValue) {
			gsap.to(this.$data, { duration: 0.5, animatedNumber: newValue  })
		}
	}
}
</script>

<style scoped>
	.balance {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.balance__title {
		margin-bottom: 10px;
		font-size: 14px;
		opacity: 0.7;
	}

	.balance__current {
		margin-bottom: 10px;
		display: flex;
		align-items: center;
	}

	.balance__icon {
		margin-right: 10px;
		width: 46px;
		height: 46px;
	}

	.balance__value {
		font-size: 46px;
		font-family: Inter-Extrabold, sans-serif;
		font-weight: 800;
	}

	@media screen and (max-height: 600px) {
		.balance__current {
			margin-bottom: 0;
		}

		.balance__icon{
			width: 32px;
			height: 32px;
		}

		.balance__value {
			font-size: 32px;
		}
	}
</style>