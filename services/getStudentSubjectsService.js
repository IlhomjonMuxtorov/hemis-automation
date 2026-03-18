require('dotenv').config();
const axios = require('axios');

async function getStudentSubjectsService(token, hemis_student_id, year) {
    try {
        const response = await axios.get(
            `${process.env.ISFT_BASE_URL}/uz/hemis/student-subjects-list`,
            {
                params: {
                    hemis_student_id: hemis_student_id,
                    year: year
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data && response.data.status === 1) {
            return response.data.data;
        } else {
            console.error(`Xatolik: ${response.data ? response.data.message : 'Noma\'lum xatolik'}`);
            return null;
        }

    } catch (error) {
        console.error(`Student subjects olishda xatolik (ID: ${hemis_student_id}, Year: ${year}):`, error.message);
        return null;
    }
}

module.exports = getStudentSubjectsService;
