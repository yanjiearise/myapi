const axios = require('axios');

class OrderKuotaChecker {
    static CHECKER_HOST = 'checker.orderkuota.com';
    static API_HOST = 'app.orderkuota.com';
    static USER_AGENT = 'okhttp/4.12.0';

    #getStaticParams() {
        return {
            app_reg_id: "dD9rR-_6TDu_YRaY34daCG:APA91bGi0fQq9nfHvry6spktX3A0lYnKShs1jbu-_ZwGx01jKNBmHTcFdtiiyypd81PGvmshxvX-ELebGBYgHcGeYT1NcaO-6yvi1ieVQBHzH5bB8Sr5hzo",
            phone_uuid: "dD9rR-_6TDu_YRaY34daCG",
            phone_model: "RMX3771",
            phone_android_version: "15",
            app_version_code: "250718",
            app_version_name: "25.07.18",
            auth_username: "defac",
            auth_token: "2476730:DEGe91HFZILQTPUmXyKvhlotfbjiMwsc",
            ui_mode: "light"
        };
    }

    async #getLatestCheckerUrl() {
        const url = `https://` + OrderKuotaChecker.API_HOST + `/api/v2/get`;
        
        const bodyPayload = new URLSearchParams({
            'requests[9]': 'top_menu_v2',
            'requests[6]': 'unread_notification_count',
            'requests[5]': 'bottom_menu',
            'requests[8]': 'config',
            'requests[2]': 'payments',
            'requests[1]': 'navigation_menu',
            'requests[4]': 'point',
            'requests[3]': 'total_pending_trx',
            'requests[0]': 'account',
            ...this.#getStaticParams()
        }).toString();
        
        const headers = {
            'Host': OrderKuotaChecker.API_HOST,
            'User-Agent': OrderKuotaChecker.USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        try {
            const response = await axios.post(url, bodyPayload, { headers });
            const checkerUrl = response.data?.config?.results?.checkers?.url;
            if (checkerUrl) {
                return checkerUrl;
            }
            throw new Error('Checker URL not found in config response.');
        } catch (error) {
            const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
            throw new Error(`Failed to get config for checker URL: ${errorMessage}`);
        }
    }

    async checkEwalletName(provider, phoneNumber) {
        const urlTemplate = await this.#getLatestCheckerUrl();
        const url = urlTemplate.replace('{ID}', provider);
        
        const bodyPayload = new URLSearchParams({
            phoneNumber: phoneNumber,
            customerId: '',
            id: provider,
            ...this.#getStaticParams()
        }).toString();

        return this.#executeCheck(url, bodyPayload);
    }

    async checkGameId(gameCode, gameUserId) {
        const urlTemplate = await this.#getLatestCheckerUrl();
        const url = urlTemplate.replace('{ID}', gameCode);

        const bodyPayload = new URLSearchParams({
            phoneNumber: this.#getStaticParams().auth_username,
            customerId: gameUserId,
            id: gameCode,
            ...this.#getStaticParams()
        }).toString();

        return this.#executeCheck(url, bodyPayload);
    }

    async #executeCheck(url, bodyPayload) {
        const headers = {
            'Host': OrderKuotaChecker.CHECKER_HOST,
            'User-Agent': OrderKuotaChecker.USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            const response = await axios.post(url, bodyPayload, { headers });
            return response.data;
        } catch (error) {
            const errorMessage = error.response ? (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.message) : error.message;
            throw new Error(errorMessage);
        }
    }
}

module.exports = { OrderKuotaChecker };
