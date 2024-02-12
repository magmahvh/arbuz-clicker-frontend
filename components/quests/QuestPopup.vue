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
				<img :src="getImageLink" alt="icon" class="popup__icon">
				<div class="text-block">
					<h3 class="popup__name">{{ item?.name }}</h3>
				</div>
				<div class="text-block">
					<p class="popup__text">
						{{ item.description }}
						<img src="@/assets/game/balance-icon.webp" alt="icon" class="main-icon">
					</p>
				</div>
				<main-button class="popup__btn"
							 @click="addFriend"
				>
					{{ buttonText }}
				</main-button>
			</div>
		</div>
	</div>
</template>

<script>
import computedMixin from "@/mixins/computedMixin";
import {mapGetters} from "vuex";

export default {
	name: "QuestPopup",
	props: {
		item: {
			type: Object,
			required: true
		}
	},
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
		getImageLink() {
			if (this.item.referralsRequired === 10) {
				return 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/low-boost.png'
			} else if (this.item.referralsRequired === 50) {
				return 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/middle-boost.png'
			} else if (this.item.referralsRequired === 500) {
				return 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/high-boost.png'
			} else if (this.item.referralsRequired === 5000) {
				return 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/friends-icon.png'
			}
		},
	},
	methods: {
		async addFriend() {
			let userId = this.GET_USER_INFO?.id
			let link = `t.me/wmclick_bot/click?startapp=${userId}`

			await navigator.clipboard.writeText(link);
			let previousText = this.buttonText
			this.buttonText = 'Ссылка скопирована';

			if (this.webApp.isVersionAtLeast('6.1')) {
				this.webApp.HapticFeedback.impactOccurred('light')
			}

			setTimeout(() => {
				this.buttonText = previousText
				this.$emit('closePopup')
			}, 700)
		},
	},
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
	width: 124px;
	height: 124px;
}

.text-block {
	max-width: 80%;
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
	line-height: 14px;
}

.main-icon {
	margin-left: 3px;
	width: 16px;
	height: 16px;
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
	margin-right: 15px;
	font-size: 18px;
	font-family: Inter-Medium, sans-serif;
	color: #7CFF99;
}

.popup__level {
	font-size: 14px;
	font-family: Inter-Medium, sans-serif;
	opacity: 0.5;
}

.popup__btn {
	width: 100%;
	padding: 20px;
}
</style>