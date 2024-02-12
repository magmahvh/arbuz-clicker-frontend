<template>
	<div class="community">
		<div class="community__content">
			<p class="community__text">Поиск сообщества</p>
			<div class="arrow-image"></div>
		</div>
	</div>
</template>

<script>
export default {
	name: "SearchCommunity",
	data() {
		return {

		}
	}
}
</script>

<style scoped>
	.community {
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
	}

	.community__content {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 10px;
	}

	.community__text {
		font-size: 14px;
	}

	.arrow-image {
		margin-left: 5px;
		width: 24px;
		height: 24px;
		background: url('@/assets/game/community-arrow.svg') no-repeat;
		opacity: 0.7;
	}
</style>