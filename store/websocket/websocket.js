export default {
    state: ()=>({
        energy: null,
        miner: {},
    }),
    mutations: {
        SAVE_WEBSOCKET_ENERGY(state, item) {
            state.energy = item
        },
        SAVE_WEBSOCKET_MINER(state, item) {
            state.miner = item
        },
    },
    actions: {
        WEBSOCKET_ENERGY({commit}, item) {
            commit('SAVE_WEBSOCKET_ENERGY', item)
        },
        WEBSOCKET_MINER({commit}, item) {
            commit('SAVE_WEBSOCKET_MINER', item)
        },
    },
    getters: {
        GET_WEBSOCKET_ENERGY: state => {
            return state.energy
        },
        GET_WEBSOCKET_MINER: state => {
            return state.miner
        },
    }
}