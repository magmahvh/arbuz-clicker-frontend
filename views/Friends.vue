<template>
	<div class="friends">
		<div class="friends__scroll-template">
			<div class="container">
				<div class="friends__title">
					<img src="@/assets/friends/friends.webp" alt="icon" class="friends__image">
					<h2 class="friends__heading">Приглашайте друзей,<br> чтобы получать бонусы</h2>
				</div>
				<BonusForFriends/>
				<h3 class="friends__caption">Список друзей</h3>
				<card-wrapper class="card-item"
							  v-for="(friend, index) in friends"
							  :key="index"
				>
					<FriendsItem
						:friend="friend"
					/>
				</card-wrapper>
				<card-wrapper class="friends__empty empty-card"
							  v-if="friends.length === 0"
				>
					<p class="empty-card__text">Список друзей пуст</p>
				</card-wrapper>
			</div>
		</div>
	</div>
</template>

<script>
import CardWrapper from "@/components/ui/CardWrapper.vue";
import BonusForFriends from "@/components/friends/BonusForFriends.vue";
import FriendsItem from "@/components/friends/FriendsItem.vue";
import MainButton from "@/components/ui/MainButton.vue";
import computedMixin from "@/mixins/computedMixin";
import {mapGetters} from "vuex";

export default {
	name: "MainPage",
	components: {
		MainButton,
		FriendsItem,
		BonusForFriends,
		CardWrapper
	},
	mixins: [computedMixin],
	data() {
		return {
			friends: [
				// {
				// 	image: '',
				// 	name: 'Mixail',
				// 	count: 0,
				// 	count2: 2500
				// },
				// {
				// 	image: '',
				// 	name: 'Mixail',
				// 	count: 0,
				// 	count2: 2500
				// }
			]
		}
	},
	computed: {
		...mapGetters([
			'GET_USER_INFO',
			'GET_ALL_BOOSTS',
			'GET_SKINS'
		]),
	},
	methods: {
		async getFriends() {
			try {
				let response = await this.clickerApi.getFriends()
				this.friends = response.items
				console.log(response)
			} catch (err) {
				console.log(err)
			}
		}
	},
	mounted() {
		this.getFriends()
	}
}
</script>

<style scoped>
.friends {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
	height: 100dvh;
}

.friends__scroll-template {
	padding-bottom: 20px;
	padding-top: 30px;
	height: 100%;
	overflow-y: scroll;
}

.friends {
	//padding: 30px 0;
}

.friends__title {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.friends__image {
	margin-bottom: 20px;
	width: 124px;
	height: 124px;
}

.friends__heading {
	font-size: 24px;
	line-height: 120%;
	font-weight: 600;
	text-align: center;
}

.friends__caption {
	font-size: 20px;
}

.friends__empty {
	margin-top: 14px;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
}

.empty-card__text {
	font-size: 14px;
}

.card-item {
	padding: 10px;
	margin-top: 2px;
}

.card-item:not(:first-child) {
	margin-top: 14px;
}

.button__wrapper {
//background-color: #131313; position: fixed;
	left: 0;
	bottom: 0;
	width: 100%;
	padding: 20px 16px 40px 16px;
}

.friends__btn {
	width: 100%;
	padding: 20px;
}

</style>