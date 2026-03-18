const fs = require('fs');
const axios = require('axios');
const getStudentSubjectsService = require('./getStudentSubjectsService');

/**
 * Bitta talaba uchun yetishmayotgan subject_id larni to'ldirishga harakat qiladi.
 * 
 * @param {Object} student - Talaba ma'lumoti
 * @param {string} token - LMS API tokini (agar bo'lmasa, yangi olinadi)
 * @returns {Promise<{student: Object, token: string}>}
 */
async function fillStudentMissingSubjectsService(student, token = null) {
    if (!student.subjects) return { student, token };

    const missingSubjects = student.subjects.filter(s => !s.subject_id);
    if (missingSubjects.length === 0) return { student, token };

    console.log(`Talaba ${student.name} (${student.id}) uchun yetishmayotgan subject_id larni to'ldirishga harakat qilinmoqda...`);

    // Agar token bo'lmasa, yangi olamiz
    if (!token) {
        try {
            const loginResponse = await axios.post(
                `${process.env.ISFT_BASE_URL}/uz/auth/login`,
                {
                    username: process.env.ISFT_LOGIN,
                    password: process.env.ISFT_PASSWORD,
                    is_main: 1
                }
            );
            token = loginResponse.data.data.access_token;
        } catch (e) {
            console.error("Token olishda xatolik, subject_id'larni to'ldirib bo'lmadi.");
            return { student, token: null };
        }
    }

    if (token) {
        const years = [...new Set(missingSubjects.map(s => s.year))];

        for (const year of years) {
            console.log(`  - ${year}-yil fanlari HEMIS API dan olinmoqda...`);
            const hemisSubjects = await getStudentSubjectsService(token, student.hemis_student_id, year);

            if (hemisSubjects) {
                for (const subject of student.subjects) {
                    if (!subject.subject_id && subject.year === year) {
                        // semester_code ni semester_name dan ajratib olish (masalan "1 - semestr" -> "1")
                        const semesterCodeMatch = subject.semester_name.match(/(\d+)/);
                        const semesterCode = semesterCodeMatch ? semesterCodeMatch[1] : null;

                        const match = hemisSubjects.find(hs =>
                            hs.subject_id === subject.hemis_subject_id &&
                            (semesterCode ? hs.semester_code === (parseInt(semesterCode) + 10).toString() : true)
                        );

                        if (match) {
                            subject.subject_id = match.id;
                            console.log(`    ✅ ${subject.subject_name} uchun subject_id topildi: ${match.id}`);
                        }
                    }
                }
            }
        }
    }

    return { student, token };
}

module.exports = fillStudentMissingSubjectsService;
