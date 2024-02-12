import {createRouter, createWebHistory} from 'vue-router'
import ClickerGame from "@/views/ClickerGame.vue";
import Friends from "@/views/Friends.vue";
import Quests from "@/views/Quests.vue";
import Boosts from "@/views/Boosts.vue";
import Rating from "@/views/Rating.vue";

const routes = [
    {
        path: '/',
        name: 'Game',
        component: ClickerGame,
    },
    {
        path: '/friends',
        name: 'Friends',
        component: Friends,
    },
    {
        path: '/quests',
        name: 'Quests',
        component: Quests,
    },
    {
        path: '/rating',
        name: 'Rating',
        component: Rating,
    },
    {
        path: '/boosts',
        name: 'Boosts',
        component: Boosts,
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router
