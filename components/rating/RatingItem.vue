<template>
	<li class="rating__item item">
		<card-wrapper class="item__wrapper">
			<div class="item__icon"
				 :class="'place_' + user.place"
				 v-if="user.place < 4"
			></div>
			<p class="item__place" v-if="user.place > 3">{{ user.place }}</p>
			<img :src="getUserAvatarUrl" alt="avatar" class="item__user-avatar">
			<!--		<div class="item__user-template" v-if="getUserAvatarUrl.length === 0">-->
			<!--			<p class="item__user-short">{{ getShortName }}</p>-->
			<!--		</div>-->
			<div class="item__user-info">
				<p class="item__username">{{ getUsername }}</p>
				<div class="item__points">
					<img src="@/assets/game/balance-icon.webp" alt="" class="item__main-icon">
					<p class="item__count">{{ editPoints }}</p>
				</div>
			</div>
		</card-wrapper>
	</li>
</template>

<script>
import methodsMixin from "@/mixins/methodsMixin";
import axios from "axios";

export default {
	name: "RatingItem",
	mixins: [methodsMixin],
	props: {
		user: {
			type: Object,
			required: true,
		}
	},
	data() {
		return {
			showImg: false,
		}
	},
	computed: {
		getUsername() {
			return this.user.username ? this.user.username : this.user.fullName
		},
		// getShortName() {
		// 	return this.getUsername.slice(0, 1)
		// },
		getUserAvatarUrl() {
			return `https://t.me/i/userpic/320/${this.user.username}.jpg`
		},
		editPoints() {
			return this.filterNumber(this.user.click)
		},
	},
	methods: {
		errorImage(event) {
			event.target.src = 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/middle-boost.png'
		},
	}
	// 	async checkImageUrl() {
	// 		try {
	// 			let response = await axios.get(this.getUserAvatarUrl)
	// 		} catch(err) {
	// 			console.log(err)
	// 			// if (err.response.status === 404) {
	// 				// this.showImg = false
	// 			// }
	// 		}
	// 	},
	// },
	// mounted() {
	// 	this.checkImageUrl()
	// }
}
</script>

<style scoped>
.item__wrapper {
	display: flex;
	align-items: center;
	padding: 10px;
}

.item__icon {
	margin-right: 10px;
	width: 24px;
	height: 24px;
}

.place_1 {
	background: url('@/assets/rating/first-place.png') no-repeat;
	background-size: cover;
}

.place_2 {
	background: url('@/assets/rating/second-place.png') no-repeat;
	background-size: cover;
}

.place_3 {
	background: url('@/assets/rating/third-place.png') no-repeat;
	background-size: cover;
}

.item__place {
	margin-right: 10px;
	width: 24px;
	text-align: center;
	font-size: 14px;
}

.item__user-avatar {
	margin-right: 10px;
	width: 34px;
	height: 34px;
	border-radius: 100px;
}

.item__user-template {
	margin-right: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 46px;
	border-radius: 100px;
	background-color: #000;
}

.item__username {
	margin-bottom: 6px;
	font-size: 14px;
	font-family: Inter-Medium, sans-serif;
}

.item__points {
	display: flex;
	align-items: center;
}

.item__main-icon {
	margin-right: 3px;
	width: 16px;
	height: 16px;
}

.item__count {
	color: #7CFF99;
	font-size: 14px;
	font-family: Inter-Medium, sans-serif;
}
</style>