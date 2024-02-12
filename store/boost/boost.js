export default {
    state: ()=>({
        allBoosts: [],
        activeBoosts: [],
        skins: [],
    }),
    mutations: {
        ADD_ALL_BOOSTS(state, item) {
            state.allBoosts = item.sort((a, b) => a.id - b.id)
        },
        ADD_ACTIVE_BOOSTS(state, item) {
            state.activeBoosts = item
        },
        ADD_SKINS(state, item) {
            state.skins = item
        },
    },
    actions: {
        SAVE_ALL_BOOSTS({commit}, item) {
            commit('ADD_ALL_BOOSTS', item)
        },
        SAVE_ACTIVE_BOOSTS({commit}, item) {
            commit('ADD_ACTIVE_BOOSTS', item)
        },
        SAVE_SKINS({commit}, item) {
            commit('ADD_SKINS', item)
        },
    },
    getters: {
        GET_ALL_BOOSTS: state => {
            return state.allBoosts
        },
        GET_ACTIVE_BOOSTS: state => {
            return state.activeBoosts
        },
        GET_SKINS: state => {
            return state.skins
        },
    }
}