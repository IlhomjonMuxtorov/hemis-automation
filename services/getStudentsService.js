require('dotenv').config();
const axios = require('axios');

async function getStudentsService(edu_plan_id, semester_id) {

    console.log("Avtorizatsiya qilinmoqda...");

    try {
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
            throw new Error("Access token olinmadi");
        }

        console.log("Token olindi");
        console.log(token);

        console.log("Login muvaffaqiyatli");

        let page = 1;
        let totalPages = 1;
        let allStudents = [];

        do {

            console.log(`Sahifa yuklanmoqda: ${page}`);

            const response = await axios.get(
                `${process.env.ISFT_BASE_URL}/uz/students/get-students-with-grades`,
                {
                    params: {
                        edu_plan_id: edu_plan_id,
                        semester_id: semester_id,
                        "per-page": 100,
                        page: page
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const students = response.data.data.items;
            const pagination = response.data.data.pagination;

            if (!students || students.length === 0) {
                break;
            }

            allStudents.push(...students);

            totalPages = Math.ceil(
                pagination.total_count / pagination.count
            );

            console.log(`Sahifa ${page}/${totalPages} yuklandi (${students.length} ta)`);

            page++;

        } while (page <= totalPages);

        console.log(`Jami ${allStudents.length} ta student yuklandi`);

        return {
            success: true,
            students: allStudents
        };

    } catch (error) {

        console.error("Studentlarni olishda xatolik:", error);

        throw error;
    }
}

module.exports = getStudentsService;
