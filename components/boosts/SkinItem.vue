<template>
	<li class="skin">
		<div class="item__info">
			<div class="item__icon-wrapper">
<!--				<p class="item__emoji-icon">{{ skin }}</p>-->
				<!--				<img src="@/assets/boosts/low-boost.png" class="item__icon">-->
			</div>
			<div class="item__text-info">
				<p class="item__name">{{ item?.name }}</p>
				<div class="item__description">
					<img src="@/assets/game/balance-icon.webp" alt="" class="item__mini-icon">
<!--					<strong class="item__text_color">{{ editPrice }}</strong>-->
					<p class="item__text">{{ item?.description }} ур.</p>
				</div>
			</div>
		</div>
		<div class="arrow-icon"></div>
	</li>
</template>

<script>
export default {
	name: "SkinItem",
	data() {
		return {}
	}
}
</script>

<style scoped>

</style>