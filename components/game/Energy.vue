<template>
	<div class="energy">
		<div class="energy__stats stats">
			<div class="stats__left">
				<img src="@/assets/game/energy-boost.png" alt="" class="energy__icon">
				<p class="energy__value current-value">{{ energy.current }}</p>
				<p class="energy__value total-value">/{{ energy.total }}</p>
			</div>
			<div class="stats__right">
				<div class="main-icon"></div>
				<p class="stats__cps-value">{{ getMiningSum }}</p>
				<p class="stats__cps-name">доход в секунду</p>
			</div>
		</div>
		<div class="energy__template">
			<div class="energy__progress" :style="{width: getPercent + '%'}"></div>
		</div>
	</div>
</template>

<script>
import {mapGetters} from "vuex";

export default {
	name: "Energy",
	props: {
		energy: {
			type: Object,
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
		getMiningSum() {
			if (this.GET_USER_INFO.minerBoostSum) {
				return this.GET_USER_INFO?.minerBoostSum
			} else {
				return 0
			}
		},
		getPercent() {
			return this.energy.current / this.energy.total * 100
		}
	}
}
</script>

<style scoped>
	.energy {
		margin-bottom: 20px;
	}

	.energy__stats {
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.stats__left {
		display: flex;
		align-items: center;
	}

	.energy__icon {
		margin-right: 4px;
		width: 20px;
		height: 20px;
	}

	.energy__value {
		font-size: 14px;
	}

	.total-value {
		opacity: 0.5;
	}

	.stats__right {
		display: flex;
		align-items: center;
	}

	.stats__cps-value {
		margin-right: 4px;
		font-size: 14px;
		font-family: Inter-Medium, sans-serif;
	}

	.main-icon {
		margin-right: 4px;
		width: 16px;
		height: 16px;
		background: url("@/assets/game/balance-icon.webp") no-repeat;
		background-size: cover;
	}

	.stats__cps-name {
		font-size: 14px;
		opacity: 0.5;
	}

	.energy__template {
		position: relative;
		height: 6px;
		width: 100%;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.15);
		overflow: hidden;
	}

	.energy__progress {
		transition: .5s;
		position: absolute;
		height: 100%;
		border-radius: 2px;
		background: linear-gradient(270deg, #24FF00 -22.81%, #8FFF00 52.11%, #F00 100%);
	}

	@media screen and (max-height: 600px) {
		.energy {
			margin-bottom: 16px;
		}
	}
</style>