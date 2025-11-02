const axios = require('axios');

class OrderKuotaPascabayar {
    static API_HOST = 'app.orderkuota.com';
    static USER_AGENT = 'okhttp/4.12.0';

    #getStaticParams(authUsername, authToken) {
        return {
            'app_reg_id': 'dD9rR-_6TDu_YRaY34daCG:APA91bGi0fQq9nfHvry6spktX3A0lYnKShs1jbu-_ZwGx01jKNBmHTcFdtiiyypd81PGvmshxvX-ELebGBYgHcGeYT1NcaO-6yvi1ieVQBHzH5bB8Sr5hzo',
            'phone_uuid': 'dD9rR-_6TDu_YRaY34daCG',
            'phone_model': 'RMX3771',
            'phone_android_version': '15',
            'app_version_code': '250718',
            'app_version_name': '25.07.18',
            'auth_username': authUsername,
            'auth_token': authToken,
            'ui_mode': 'light'
        };
    }

    async checkBill(authToken, authUsername, voucherId, targetNumber) {
        const staticParams = this.#getStaticParams(authUsername, authToken);
        let transactionId;

        try {
            const orderUrl = `https://` + OrderKuotaPascabayar.API_HOST + `/api/v2/order`;
            const orderPayload = new URLSearchParams({
                'quantity': '1',
                'id_plgn': targetNumber,
                'kode_promo': '',
                'pin': '',
                'phone': '',
                'voucher_id': voucherId,
                'payment': 'balance',
                'request_time': Date.now().toString(),
                ...staticParams
            }).toString();

            const orderResponse = await axios.post(orderUrl, orderPayload, { 
                headers: { 
                    'Host': OrderKuotaPascabayar.API_HOST, 
                    'User-Agent': OrderKuotaPascabayar.USER_AGENT, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            transactionId = orderResponse.data?.results?.id;
            if (!transactionId) {
                return { success: false, message: "Gagal mendapatkan ID Transaksi dari pengecekan awal.", details: orderResponse.data };
            }
        } catch (error) {
            throw new Error(`Langkah 1 (Inisiasi Tagihan) gagal: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
        }

        const detailsUrl = `https://` + OrderKuotaPascabayar.API_HOST + `/api/v2/get`;
        
        const maxRetries = 10;
        const retryDelay = 3000;
        let lastKnownDetails;

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : retryDelay));
            try {
                const detailsPayload = new URLSearchParams({
                    'requests[transaction_details][id]': transactionId,
                    'requests[transaction_details][is_inquiry_check]': '1',
                    'request_time': Date.now().toString(),
                    ...staticParams
                }).toString();
                
                const detailsResponse = await axios.post(detailsUrl, detailsPayload, {
                    headers: { 
                        'Host': OrderKuotaPascabayar.API_HOST, 
                        'User-Agent': OrderKuotaPascabayar.USER_AGENT, 
                        'Content-Type': 'application/x-www-form-urlencoded' 
                    }
                });
                
                const details = detailsResponse.data?.transaction_details?.results;
                lastKnownDetails = detailsResponse.data;

                if (details && details.is_in_process === false) {
                    return { success: true, ...detailsResponse.data };
                }
            } catch (error) {
                 throw new Error(`Langkah 2 (Final Check Tagihan) gagal: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
            }
        }
        
        return { success: false, message: `Gagal mendapatkan status tagihan final setelah ${maxRetries * retryDelay / 1000} detik.`, lastDetails: lastKnownDetails };
    }
}

module.exports = { OrderKuotaPascabayar };
