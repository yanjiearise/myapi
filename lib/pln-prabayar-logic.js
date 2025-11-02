const axios = require('axios');

class OrkutPlnPrabayar {
    static CHECKER_HOST = 'checker.orderkuota.com';
    static API_HOST = 'app.orderkuota.com';
    static USER_AGENT = 'okhttp/4.12.0';

    #getStaticParams() {
        return {
            'app_reg_id': 'dD9rR-_6TDu_YRaY34daCG:APA91bGi0fQq9nfHvry6spktX3A0lYnKShs1jbu-_ZwGx01jKNBmHTcFdtiiyypd81PGvmshxvX-ELebGBYgHcGeYT1NcaO-6yvi1ieVQBHzH5bB8Sr5hzo',
            'phone_uuid': 'dD9rR-_6TDu_YRaY34daCG',
            'phone_model': 'RMX3771',
            'phone_android_version': '15',
            'app_version_code': '250718',
            'app_version_name': '25.07.18',
            'auth_username': 'defac',
            'auth_token': '2476730:DEGe91HFZILQTPUmXyKvhlotfbjiMwsc',
            'ui_mode': 'light'
        };
    }

    async #getLatestCheckerUrl() {
        const url = `https://` + OrkutPlnPrabayar.API_HOST + `/api/v2/get`;
        
        const bodyPayload = new URLSearchParams({
            'requests[9]': 'top_menu_v2',
            'requests[8]': 'config',
            'requests[0]': 'account',
            ...this.#getStaticParams()
        }).toString();
        
        const headers = {
            'Host': OrkutPlnPrabayar.API_HOST,
            'User-Agent': OrkutPlnPrabayar.USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        try {
            const response = await axios.post(url, bodyPayload, { headers });
            const checkerUrl = response.data?.config?.results?.checkers?.url;
            if (checkerUrl) {
                return checkerUrl;
            }
            throw new Error('Checker URL tidak ditemukan dalam respons konfigurasi.');
        } catch (error) {
            const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
            throw new Error(`Gagal mengambil konfigurasi untuk URL checker: ${errorMessage}`);
        }
    }

    async checkPlnPrabayarName(meterNumber) {
        const urlTemplate = await this.#getLatestCheckerUrl();
        const url = urlTemplate.replace('{ID}', 'pln');
        
        const bodyPayload = new URLSearchParams({
            phoneNumber: '',
            customerId: meterNumber,
            id: 'pln',
            ...this.#getStaticParams()
        }).toString();

        const headers = {
            'Host': OrkutPlnPrabayar.CHECKER_HOST,
            'User-Agent': OrkutPlnPrabayar.USER_AGENT,
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

module.exports = { OrkutPlnPrabayar };
