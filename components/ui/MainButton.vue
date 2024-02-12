<template>
	<button class="main-button">
		<slot></slot>
	</button>
</template>

<script>
export default {
	name: "main-button",
	data() {
		return {}
	}
}
</script>

<style scoped>
	.main-button {
		border-radius: 6px;
		outline: none;
		border: none;
		background: #7CFF99;
		color: #141414;
		font-size: 14px;
	}

	.main-button:active {
		background: #57EA77;
	}
</style>