<template>
	<card-wrapper class="bonus-wrapper">
		<ul class="friends__list bonus-list">
			<li class="bonus-list__item bonus-item">
				<div class="bonus-item__image-wrapper">
					<img src="@/assets/friends/telegram.svg" alt="" class="bonus-item__image">
				</div>
				<div class="bonus-item__info">
					<!--				<h4 class="bonus-item__name">Пригласи друга</h4>-->
					<p class="bonus-item__description">
						<strong class="bonus-item_color">+100</strong> макс. энергии
					</p>
					<span class="bonus-item__description">
					<img src="@/assets/game/balance-icon.webp" alt="" class="bonus-item__icon">
					<strong class="bonus-item_color">2,500</strong>
					тебе и другу
				</span>
				</div>
			</li>
			<li class="bonus-list__item bonus-item">
				<div class="bonus-item__image-wrapper">
					<img src="@/assets/friends/premium.svg" alt="" class="bonus-item__image">
				</div>
				<div class="bonus-item__info">
					<!--					<h4 class="bonus-item__name">Друг с <strong class="name_color">Telegram Premium</strong></h4>-->
					<p class="bonus-item__description">
						<strong class="bonus-item_color">+1000</strong>
						макс. энергии
					</p>
					<span class="bonus-item__description">
					<img src="@/assets/game/balance-icon.webp" alt="" class="bonus-item__icon">
					<strong class="bonus-item_color">25,000</strong>
					тебе и другу
				</span>
				</div>
			</li>
		</ul>
		<main-button class="invite-btn"
			@click="addFriend"
		>
			{{ buttonText }}
		</main-button>
	</card-wrapper>
</template>

<script>

import computedMixin from "@/mixins/computedMixin";
import {mapGetters} from "vuex";

export default {
	name: "BonusForFriends",
	mixins: [computedMixin],
	data() {
		return {
			buttonText: 'Пригласить друга',
		}
	},
  computed: {
    ...mapGetters([
      'GET_USER_INFO',
    ]),
  },
	methods: {
		async addFriend() {
			let userId = this.GET_USER_INFO?.id
			let link = `t.me/wmclick_bot/click?startapp=${userId}`

			await navigator.clipboard.writeText(link);
			let previousText = this.buttonText
			this.buttonText = 'Ссылка скопирована.';

			if (this.webApp.isVersionAtLeast('6.1')) {
				this.webApp.HapticFeedback.impactOccurred('light')
			}

			setTimeout(() => {
				this.buttonText = previousText
			}, 3000)
		},
	}
}
</script>

<style scoped>

.bonus-wrapper {
	margin: 30px 0;
	padding: 10px;
}

.bonus-list {
	display: flex;
	flex-direction: column;
	margin-bottom: 10px;
}

.bonus-item {
	display: flex;
	align-items: center;
}

.bonus-item:first-child {
	margin-bottom: 10px;
	padding-bottom: 10px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.bonus-item__image-wrapper {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	margin-right: 10px;
	border-radius: 6px;
	background: rgba(255, 255, 255, 0.06);
}

.bonus-item__image {
	width: 24px;
	height: 24px;
}

.bonus-item__name {
	margin-bottom: 6px;
	font-size: 16px;
	font-weight: 500;
}

.name_color {
	color: #51B1FF;
	font-size: inherit;
	line-height: inherit;
	font-weight: inherit;
}

.bonus-item__description {
	display: block;
	font-size: 14px;
	line-height: 14px;
}

.bonus-item__description:first-child {
	margin-bottom: 5px;
}

.bonus-item_color {
	color: #7CFF99;
	font-size: inherit;
	line-height: 14px;
	font-weight: inherit;
}

.bonus-item__icon {
	margin-right: 4px;
	width: 16px;
	height: 16px;
}

.invite-btn {
	width: 100%;
	padding: 18px;
}
</style>