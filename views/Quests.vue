<template>
	<div class="quest">
		<div class="quest__scroll-template">
			<div class="container">
				<div class="quest__title">
					<img src="@/assets/quest/quests.webp" alt="" class="quest__image">
					<h2 class="quest__heading">Зарабатывай<br> больше арбузов</h2>
				</div>
				<!--			<card-wrapper class="quest__wrapper">-->
				<!--				<ul class="quest__list">-->
				<!--					<QuestItem-->
				<!--						v-for="(item, index) in welcomeQuest"-->
				<!--						:key="index"-->
				<!--						:item="item"-->
				<!--					/>-->
				<!--				</ul>-->
				<!--			</card-wrapper>-->
				<h3 class="quest__caption">Доска заданий</h3>
				<card-wrapper class="quest__wrapper">
					<ul class="quest__list">
						<QuestItem
							v-for="(item, index) in getReferralTasks"
							:key="index"
							:item="item"
							@showPopup="showPopup"
						/>
					</ul>
				</card-wrapper>
				<h3 class="quest__caption">Специальные задания</h3>
				<card-wrapper class="quest__card card">
					<div class="card__icon"></div>
					<p class="card__text">Нет доступных заданий</p>
				</card-wrapper>
				<h3 class="quest__caption">Web3 мир</h3>
				<card-wrapper class="quest__card card">
					<div class="card__icon"></div>
					<p class="card__text">Нет доступных заданий</p>
				</card-wrapper>
			</div>
			<QuestPopup
				v-if="show === true"
				@closePopup="closePopup"
				:item="active"
			/>
		</div>
	</div>
</template>

<script>
import QuestItem from "@/components/quests/QuestItem.vue";
import computedMixin from "@/mixins/computedMixin";
import QuestPopup from "@/components/quests/QuestPopup.vue";

export default {
	name: "Quests",
	components: {
		QuestPopup,
		QuestItem
	},
	mixins: [computedMixin],
	data() {
		return {
			show: false,
			active: null,
			// welcomeQuest: [
			// 	{
			// 		name: 'Пригласительный бонус',
			// 		text: 'До',
			// 		colorText: '50K',
			// 		icon: 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/friends-icon.png',
			// 		secondText: 'за друга'
			// 	},
			// ],
			tasks: [],
			// quests: [
			// 	{
			// 		name: 'Пригласи 10 друзей',
			// 		colorText: '+100,000',
			// 		icon: 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/low-boost.png',
			// 	},
			// 	{
			// 		name: 'Пригласи 50 друзей',
			// 		colorText: '+100,000',
			// 		icon: 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/middle-boost.png',
			// 	},
			// 	{
			// 		name: 'Пригласи 100 друзей',
			// 		colorText: '+100,000',
			// 		icon: 'https://raw.githubusercontent.com/divineempire/clicker-image/master/quest-icons/high-boost.png',
			// 	}
			// ]
		}
	},
	computed: {
		getReferralTasks() {
			if (this.tasks.length > 0) {
				return this.tasks.filter((item) => item.type === 'referral')
			} else {
				return []
			}
		}
	},
	methods: {
		showPopup(item) {
			this.active = item
			this.show = true
		},
		closePopup() {
			this.show = false
			this.active = null
		},
		async getAllTasks() {
			try {
				let response = await this.clickerApi.getAllTasks()
				if (typeof response.items === 'object') {
					if (response.items.length) {
						this.tasks = response.items
					} else {
						this.saveTasks(response.items)
					}
				}
			} catch (err) {
				console.log(err)
			}
		},
		saveTasks(data) {
			let array = []
			for (let item in data) {
				array.push(data[item])
			}
			this.tasks = array
		}
	},
	mounted() {
		this.getAllTasks()
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
		}
	}
}
</script>

<style scoped>
	.quest {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		top: 0;
		height: 100dvh;
	}

	.quest__scroll-template {
		padding-top: 30px;
		padding-bottom: 20px;
		height: 100%;
		overflow-y: scroll;
	}

	.quest__title {
		margin-bottom: 30px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.quest__image {
		margin-bottom: 10px;
		width: 125px;
		height: 125px;
	}

	.quest__heading {
		font-size: 24px;
		line-height: 120%;
		font-weight: 600;
		text-align: center;
	}

	.quest__wrapper {
		margin-bottom: 30px;
		padding: 10px;
	}

	.quest__list {
		display: flex;
		flex-direction: column;
	}

	.quest__caption {
		margin-bottom: 14px;
		font-size: 20px;
	}

	.quest__card {
		width: 100%;
		padding: 30px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.quest__card:not(:last-child) {
		margin-bottom: 30px;
	}

	.quest__card:last-child {
		//margin-bottom: 20px;
	}

	.card__icon {
		margin-bottom: 14px;
		width: 36px;
		height: 36px;
		background: no-repeat url("@/assets/quest/empty-quest.png");
		background-size: cover;

	}

	.card__text {
		font-size: 14px;
	}
</style>