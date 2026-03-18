require('dotenv').config();
const axios = require('axios');

let _token = null;

async function getToken() {
    if (_token) return _token;

    console.log("writeLogsService: Avtorizatsiya qilinmoqda...");

    const loginResponse = await axios.post(
        `${process.env.ISFT_BASE_URL}/uz/auth/login`,
        {
            username: process.env.ISFT_LOGIN,
            password: process.env.ISFT_PASSWORD,
            is_main: 1
        }
    );

    const token = loginResponse.data.data.access_token;

    if (!token) {
        throw new Error("writeLogsService: Access token olinmadi");
    }

    console.log("writeLogsService: Token olindi");
    _token = token;
    return _token;
}

/**
 * API ga log yozadi va qaytarilgan ID ni beradi.
 *
 * @param {object} payload  - { student_id, step, status, unique_string }
 * @returns {Promise<number>}  - Yaratilgan yozuvning ID si
 */
async function writeLogsService(payload) {
    try {
        const token = await getToken();
        console.log("writeLogsService: Token", token);
        console.log("writeLogsService: Token", payload);

        const response = await axios.post(
            `${process.env.ISFT_BASE_URL}/uz/copy-student-grades-to-hemis-logs`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Serverga JSON kutayotganimizni bildiramiz
                }
            }
        );

        const data = response.data;

        if (!data || data.status !== 1) {
            throw new Error(`writeLogsService: Noto'g'ri javob: ${JSON.stringify(data)}`);
        }

        const id = data.data.id;

        console.log(`writeLogsService: Log yozildi. ID: ${id}`);

        return id;

    } catch (error) {
        // Token muddati o'tgan bo'lsa, qayta login qilamiz
        if (error.response && error.response.status === 401) {
            console.log("writeLogsService: Token eskirgan, qayta login qilinmoqda...");
            _token = null;
            const token = await getToken();

            const retryResponse = await axios.post(
                `${process.env.ISFT_BASE_URL}/uz/copy-student-grades-to-hemis-logs`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' // Serverga JSON kutayotganimizni bildiramiz
                    }
                }
            );

            const id = retryResponse.data.data.id;
            console.log(`writeLogsService: Log yozildi (retry). ID: ${id}`);
            return id;
        }

        console.error("writeLogsService: Log yozishda xatolik:", error.message);
        throw error;
    }
}

module.exports = writeLogsService;
