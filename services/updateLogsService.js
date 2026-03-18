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
 * API dagi mavjud logni yangilaydi (PUT).
 *
 * @param {number} logId    - Yangilanishi kerak bo'lgan logning ID si
 * @param {object} payload  - { student_id, step, status, unique_string }
 * @returns {Promise<number>} - Yangilangan logning ID si
 */
async function updateLogsService(logId, payload) {
    try {
        const token = await getToken();

        // student_id ni majburiy butun son (int) holatiga keltiramiz
        const cleanPayload = {
            ...payload,
            student_id: payload.student_id ? Number(payload.student_id) : undefined
        };

        console.log(`updateLogsService: Log ${logId} yangilanmoqda...`);

        const response = await axios.put(
            `${process.env.ISFT_BASE_URL}/uz/copy-student-grades-to-hemis-logs/${logId}`,
            cleanPayload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        const data = response.data;

        // Odatda status 1 yoki true bo'lsa muvaffaqiyatli hisoblanadi
        if (!data || (data.status !== 1 && data.status !== true)) {
            throw new Error(`updateLogsService: Noto'g'ri javob: ${JSON.stringify(data)}`);
        }

        console.log(`updateLogsService: Log yangilandi. ID: ${logId}`);
        return logId;

    } catch (error) {
        // 422 Validatsiya xatosi bo'lsa, serverdan aniq xabarni ko'rsatamiz
        if (error.response && error.response.status === 422) {
            console.error("❌ VALIDATION XATOSI (422):", JSON.stringify(error.response.data, null, 2));
        }

        // Token muddati o'tgan bo'lsa (401), qayta urinish
        if (error.response && error.response.status === 401) {
            console.log("updateLogsService: Token eskirgan, qayta login qilinmoqda...");
            _token = null;
            return await updateLogsService(logId, payload); // Rekursiv chaqiruv
        }

        console.error("updateLogsService: Log yangilashda xatolik:", error.message);
        throw error;
    }
}

module.exports = updateLogsService;
