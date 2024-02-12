import axios from "axios";
import Api from "@/api/instance.js";

export default class ClickerApi extends Api {

    constructor() {
        let initData = null
        if (window.Telegram.WebApp.initData) {
            initData = window.Telegram.WebApp.initData
        } else {
            initData = process.env.VUE_APP_TEST_INIT
        }
        const ax = axios.create({
            baseURL: process.env.VUE_APP_BACKEND,
            headers: {
                post: {
                    "Content-Type": "application/json",
                    // 'Access-Control-Allow-Origin': '*',
                },
                'X-Telegram-Init-Data': initData
            }
        });

        super(ax);
    }
    // USER REGISTRATION
    getUserInfo() {
        return this.request('users/me')
    }

    createUser(referralUserId) {
        // console.log("Creating user with referral id: " + parseInt(referralUserId))
        return this.request('users/me', 'POST', {
            referralUserId: isNaN(referralUserId) ? null : referralUserId
        })
    }

    // SKINS

    getAllSkins() {
        return this.request('skin/all')
    }

    getMySkins() {
        return this.request('skin/available')
    }

    activateSkins(idsList) {
        return this.request('skin/activate', 'POST', {
            ids: idsList
        })
    }

    // USERS RATING

    getUsersRating() {
        return this.request('users/top')
    }

    getCurrentPlace() {
        return this.request('users/place')
    }

    // CLICK

    addClick(count) {
        return this.request('click', 'POST' , {
            count: count
        })
    }

    // BOOST

    getActiveBoosts() {
        return this.request('boosts/active')
    }

    getAllBoosts() {
        return this.request('boosts/metas')
    }

    purchaseBoost(metaId) {
        return this.request('boosts/purchase', 'POST', {
            metaId: metaId
        })
    }

    upgradeBoost(boostId) {
        return this.request('boosts/upgrade', 'POST', {
            boostId: boostId,
        })
    }

    // FRIENDS
    getFriends() {
        return this.request('users/friends')
    }

    // TASKS
    getAllTasks() {
        return this.request('task/all')
    }
}