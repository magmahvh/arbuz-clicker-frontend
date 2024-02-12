import clickerApi from '@/api/clickerApi.js'
export default {
    computed: {
        webApp() {
            return window.Telegram.WebApp
        },
        getRouteName() {
            return this.$route.name
        },
        clickerApi() {
            return new clickerApi()
        },
        editPrice() {
            return this.filterNumber(this.getPriceWithLevel)
        },
        getPriceWithLevel() {
            if (this.getLevel > 0) {
                let sum = this.item.priceModifier * this.item?.price * (this.getLevel + 1)
                return Math.ceil(sum)
            } else {
                return Number(this.item?.price)
            }
        }
    }
}
