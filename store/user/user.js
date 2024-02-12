export default {
    state: ()=>({
        userInfo: {},
        usersTop: [],
        myRating: {},
    }),
    mutations: {
        ADD_USER_INFO(state, item) {
            state.userInfo = item
        },
        ADD_USERS_RATING(state, item) {
            state.usersTop = item
        },
        ADD_MY_RATING(state, item) {
            state.myRating = item
        },
    },
    actions: {
        SAVE_USER_INFO({commit}, item) {
            commit('ADD_USER_INFO', item)
        },
        SAVE_USERS_RATING({commit}, item) {
            commit('ADD_USERS_RATING', item)
        },
        SAVE_MY_RATING({commit}, item) {
            commit('ADD_MY_RATING', item)
        }
    },
    getters: {
        GET_USER_INFO: state => {
            return state.userInfo
        },
        GET_USERS_RATING: state => {
            return state.usersTop
        },
        GET_MY_RATING: state => {
            return state.myRating
        },
    }
}