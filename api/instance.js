export default class Api {
    constructor(axios) {
        this.axios = axios;
    }

    request(url = '', method = 'get', data = null) {
        const options = {
            method,
            url,
            // timeout
        }
        if (data) {
            options.data = data;
        }
        return this.axios(options).then(res => res.data);
    }
}