export default {
    methods: {
        filterNumber(num) {
            return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        },
    }
}