<template>
	<div class="friends-item">
		<div class="friends-item__profile">
			<img :src="getUserAvatarUrl" alt="" class="friends-item__icon">
			<div class="friends-item__info">
				<p class="friends-item__name">{{ getUserName }}</p>
				<div class="friends-item__bonus bonus">
					<img src="@/assets/game/balance-icon.webp" alt="" class="bonus__icon">
					<p class="bonus__count">{{ friend.clicks }}</p>
					<p class="bonus__count_color">+{{ friend.income }}</p>
				</div>
			</div>
		</div>
		<div class="arrow-icon"></div>
	</div>
</template>

<script>
export default {
	name: "FriendsItem",
	props: {
		friend: {
			type: Object,
			required: true
		}
	},
	data() {
		return {}
	},
	computed: {
		getUserAvatarUrl() {
			// TODO: плейсхолдеры для аватарок если username null
			return `https://t.me/i/userpic/320/${this.friend.username}.jpg`
		},
		getUserName() {
			if (this.friend.username && this.friend.username.length > 0) {
				return '@' + this.friend.username
			} else {
				return this.friend.fullName
			}
		}
	},
	mounted() {
		// console.log(this.friend)
	}
}
</script>

<style scoped>
.friends-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.friends-item__icon {
	width: 34px;
	height: 34px;
	margin-right: 10px;
	border-radius: 100px;
	background: #000;
}

.friends-item__profile {
	display: flex;
	align-items: center;
}

.friends-item__name {
	margin-bottom: 4px;
	font-size: 14px;
}

.bonus {
	display: flex;
	align-items: center;
}

.bonus__icon {
	margin-right: 3px;
	width: 16px;
	height: 16px;
}

.bonus__count {
	margin-right: 15px;
	font-size: 14px;
	font-weight: 500;
}

.bonus__count_color {
	font-size: 14px;
	font-weight: 500;
	color: #7CFF99;
}

.arrow-icon {
	width: 20px;
	height: 20px;
	background: url('@/assets/friends/arrow.svg') no-repeat;
}
</style>