<template>
	<button class="game__field">
		<img class="game__skin" src="@/assets/game/game-skin.png" alt="icon">
	</button>
</template>

<script>
export default {
	name: "GameField",
	data() {
		return {}
	}
}
</script>

<style scoped>
.game__field {
	position: relative;
	max-width: 358px;
	max-height: 358px;
	width: 100%;
	height: calc(100vw - 32px);
	background: transparent;
	border: none;
	outline: none;
	user-select: none;
	font-size: 16px;
}

.game__skin {
	width: 100%;
	pointer-events: none;
	user-select: none
}

.game__field:active {
	transform: scale(0.97);
}

@media screen and (max-height: 600px) {
	.game__field {
		max-width: 269px;
		max-height: 269px;
	}
}
</style>