const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const fromName = process.env.EMAIL_FROM_NAME || 'Bovalone API';
const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER;

async function sendVerificationEmail(to, code) {
    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to,
        subject: 'Kode Verifikasi Akunmu',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #0056b3;">Verifikasi Emailmu</h2>
                    <p>Terima kasih telah mendaftar. Gunakan kode di bawah ini untuk memverifikasi alamat emailmu:</p>
                    <p style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; background-color: #f2f2f2; padding: 12px 20px; border-radius: 5px; display: inline-block; margin: 10px auto; display: block; width: fit-content;">
                        ${code}
                    </p>
                    <p>Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>.</p>
                    <p style="font-size: 0.9em; color: #777;">Jika kamu tidak meminta kode ini, kamu bisa mengabaikan email ini.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="text-align: center; font-size: 0.8em; color: #aaa;">&copy; ${new Date().getFullYear()} ${fromName}</p>
                </div>
            </div>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email verifikasi berhasil dikirim ke: ${to}`);
    } catch (error) {
        console.error(`❌ Gagal mengirim email ke ${to}:`, error);
        throw new Error('Gagal mengirim email verifikasi.');
    }
}

async function sendChangeEmailVerificationEmail(to, code) {
    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to,
        subject: 'Konfirmasi Perubahan Alamat Emailmu',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #0056b3;">Konfirmasi Email Barumu</h2>
                    <p>Halo,</p>
                    <p>Kamu baru saja meminta untuk mengubah alamat email akunmu. Untuk menyelesaikan proses ini, silakan gunakan kode verifikasi di bawah ini:</p>
                    <p style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; background-color: #f2f2f2; padding: 12px 20px; border-radius: 5px; display: inline-block; margin: 10px auto; display: block; width: fit-content;">
                        ${code}
                    </p>
                    <p>Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>.</p>
                    <p style="font-size: 0.9em; color: #777;">Jika kamu tidak merasa melakukan perubahan ini, harap amankan akunmu atau abaikan email ini.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="text-align: center; font-size: 0.8em; color: #aaa;">&copy; ${new Date().getFullYear()} ${fromName}</p>
                </div>
            </div>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email konfirmasi perubahan email berhasil dikirim ke: ${to}`);
    } catch (error) {
        console.error(`❌ Gagal mengirim email konfirmasi ke ${to}:`, error);
        throw new Error('Gagal mengirim email konfirmasi.');
    }
}

async function sendUsernameChangeEmail(to, code) {
    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to,
        subject: 'Konfirmasi Perubahan Username',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #0056b3;">Konfirmasi Perubahan Username</h2>
                    <p>Halo, gunakan kode di bawah ini untuk mengonfirmasi perubahan username akunmu:</p>
                    <p style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; background-color: #f2f2f2; padding: 12px 20px; border-radius: 5px;">
                        ${code}
                    </p>
                    <p>Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>.</p>
                </div>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
}

async function sendPasswordChangeEmail(to, code) {
    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to,
        subject: 'Konfirmasi Perubahan Password',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #0056b3;">Konfirmasi Perubahan Password</h2>
                    <p>Halo, gunakan kode di bawah ini untuk mengonfirmasi perubahan password akunmu:</p>
                    <p style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; background-color: #f2f2f2; padding: 12px 20px; border-radius: 5px;">
                        ${code}
                    </p>
                    <p>Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>.</p>
                </div>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
}


async function sendPasswordResetEmail(to, token) {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to,
        subject: 'Permintaan Reset Password',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                 <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #0056b3;">Reset Password</h2>
                    <p>Halo,</p>
                    <p>Kamu menerima email ini karena ada permintaan untuk mereset password akunmu. Klik tombol di bawah untuk melanjutkan:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Link ini akan kedaluwarsa dalam <strong>15 menit</strong>.</p>
                    <p style="font-size: 0.9em; color: #777;">Jika kamu tidak meminta reset password, kamu bisa mengabaikan email ini.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="text-align: center; font-size: 0.8em; color: #aaa;">&copy; ${new Date().getFullYear()} ${fromName}</p>
                </div>
            </div>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email reset password berhasil dikirim ke: ${to}`);
    } catch (error) {
        console.error(`❌ Gagal mengirim email reset password ke ${to}:`, error);
        throw new Error('Gagal mengirim email reset password.');
    }
}


async function sendPaymentDetectedEmail(to, { fullDetails }) {
    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to,
        subject: 'Notifikasi Pembayaran Diterima',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #17a2b8;">Pembayaran Terdeteksi</h2>
                    <p>Halo,</p>
                    <p>Sistem kami telah mendeteksi pembayaran baru yang masuk melalui QRIS-mu dengan detail sebagai berikut:</p>
                     <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; color: #555; width: 40%;">Tanggal & Waktu</td>
                            <td style="padding: 8px;"><strong>${fullDetails.tanggal || 'N/A'}</strong></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; color: #555;">Jumlah Kredit</td>
                            <td style="padding: 8px; color: #28a745;"><strong>Rp${parseInt(fullDetails.kredit.replace(/\./g, '')).toLocaleString('id-ID')}</strong></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; color: #555;">Keterangan</td>
                            <td style="padding: 8px;"><strong>${fullDetails.keterangan || 'N/A'}</strong></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; color: #555;">Saldo Akhir</td>
                            <td style="padding: 8px;"><strong>Rp${fullDetails.saldo_akhir || 'N/A'}</strong></td>
                        </tr>
                         <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 8px; color: #555;">ID Transaksi</td>
                            <td style="padding: 8px;"><strong>${fullDetails.id || 'N/A'}</strong></td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; font-size: 0.9em; color: #777;">Ini adalah notifikasi otomatis. Saldumu tidak diubah oleh sistem ini.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="text-align: center; font-size: 0.8em; color: #aaa;">&copy; ${new Date().getFullYear()} ${fromName}</p>
                </div>
            </div>
        `,
    };
     try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email notifikasi pembayaran terdeteksi dikirim ke: ${to}`);
    } catch (error) {
        console.error(`❌ Gagal mengirim email notifikasi pembayaran ke ${to}:`, error);
    }
}


module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendPaymentDetectedEmail, sendChangeEmailVerificationEmail, sendUsernameChangeEmail, sendPasswordChangeEmail };
