<template>
	<div class="wrapper">
		<slot></slot>
	</div>
</template>

<script>
export default {
	name: "card-wrapper",
	data() {
		return {}
	}
}
</script>

<style scoped>
	.wrapper {
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.15);
	}
</style>