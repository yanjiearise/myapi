const qrcode = require('qrcode');
const { crc16ccitt } = require('crc');

class DynamicQris {
    static buildTLV(tag, value) {
        const valueLength = String(value).length;
        const lengthString = valueLength.toString().padStart(2, '0');
        return `${tag}${lengthString}${value}`;
    }

    static generate(baseQrisString, amount, refId) {
        if (!baseQrisString || typeof baseQrisString !== 'string') {
            throw new Error('Base QRIS string is invalid.');
        }
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            throw new Error('Amount must be a positive number.');
        }

        let mutableQrString = baseQrisString;

        if (mutableQrString.endsWith('6304')) {
            mutableQrString = mutableQrString.slice(0, -4);
        }

        const transactionAmountTag = this.buildTLV('54', amount);
        mutableQrString += transactionAmountTag;

        if (refId) {
            const referenceIdTag = this.buildTLV('07', refId);
            const additionalDataTag = this.buildTLV('62', referenceIdTag);
            mutableQrString += additionalDataTag;
        }

        const crcPayload = mutableQrString + '6304';
        const crcValue = crc16ccitt(Buffer.from(crcPayload, 'utf-8')).toString(16).toUpperCase().padStart(4, '0');
        const finalQrString = crcPayload + crcValue;

        return finalQrString;
    }

    static async generateQrImage(qrString) {
        try {
            return await qrcode.toDataURL(qrString, { width: 300 });
        } catch (error) {
            throw new Error('Failed to generate QR code image.');
        }
    }
}

module.exports = { DynamicQris };
