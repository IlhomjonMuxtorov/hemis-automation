require('dotenv').config();
const axios = require('axios');

let _token = null;

async function getToken() {
    if (_token) return _token;
    console.log("updateGradeLogsService: Avtorizatsiya qilinmoqda...");

    const loginResponse = await axios.post(
        `${process.env.ISFT_BASE_URL}/uz/auth/login`,
        {
            username: process.env.ISFT_LOGIN,
            password: process.env.ISFT_PASSWORD,
            is_main: 1
        }
    );

    const token = loginResponse.data.data.access_token;
    if (!token) throw new Error("updateGradeLogsService: Access token olinmadi");

    console.log("updateGradeLogsService: Token olindi");
    _token = token;
    return _token;
}

/**
 * Logga bahoni qo'shish (POST).
 * * @param {number} gradeLogId - Asosiy logning ID si (URL uchun)
 * @param gradeLogId
 * @param {object} payload - { student_semestr_subject_id, grade, status }
 * @returns {Promise<number>} - Yaratilgan baho yozuvining ID si
 */
async function updateGradeLogsService(gradeLogId, payload) {
    try {
        const token = await getToken();

        // Ma'lumot turlarini to'g'rilaymiz (Integer bo'lishi shart)
        const cleanPayload = {
            student_semestr_subject_id: Number(payload.student_semestr_subject_id),
            grade: Number(payload.grade),
            status: Number(payload.status)
        };

        console.log(`updateGradeLogsService: Log ${gradeLogId} uchun baho yuborilmoqda...`);

        const response = await axios.put(
            `${process.env.ISFT_BASE_URL}/uz/copy-student-grades-to-hemis-logs/update-grade/${gradeLogId}`,
            cleanPayload,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        const resData = response.data;

        // Serverdan muvaffaqiyatli javob kelsa (status: 1)
        if (resData && resData.status === 1) {
            const addedId = resData.data.id;
            console.log(`updateGradeLogsService: Baho saqlandi. New ID: ${addedId}`);
            return addedId;
        } else {
            throw new Error(`updateGradeLogsService: Noto'g'ri javob: ${JSON.stringify(resData)}`);
        }

    } catch (error) {
        // 422 Validatsiya xatosi (Ma'lumotlar noto'g'ri bo'lsa)
        if (error.response && error.response.status === 422) {
            console.error("❌ BAHOLASH VALIDATSIYA XATOSI:", JSON.stringify(error.response.data, null, 2));
        }

        // 401 Token eskirgan bo'lsa
        if (error.response && error.response.status === 401) {
            console.log("updateGradeLogsService: Token eskirgan, yangilanmoqda...");
            _token = null;
            return await updateGradeLogsService(gradeLogId, payload);
        }

        console.error("updateGradeLogsService xatosi:", error.message);
        throw error;
    }
}

module.exports = updateGradeLogsService;