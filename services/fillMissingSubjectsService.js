const fs = require('fs');
const axios = require('axios');
const getStudentSubjectsService = require('./getStudentSubjectsService');

async function fillMissingSubjectsService(students) {
    const missingSubjectsCount = students.reduce((acc, student) => {
        if (student.subjects) {
            return acc + student.subjects.filter(s => !s.subject_id).length;
        }
        return acc;
    }, 0);

    if (missingSubjectsCount === 0) {
        return students;
    }

    console.log(`\nDIQQAT: Ayrim talabalarning fanlarida subject_id qatori bo'sh (null).`);
    console.log(`Ularni to'ldirishga harakat qilinmoqda...`);

    let token = null;

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
        return students;
    }

    if (token) {
        for (const student of students) {
            if (!student.subjects) continue;

            const studentMissingSubjects = student.subjects.filter(s => !s.subject_id);
            if (studentMissingSubjects.length === 0) continue;

            const years = [...new Set(studentMissingSubjects.map(s => s.year))];

            for (const year of years) {
                console.log(`Student ${student.name} uchun ${year}-yil fanlari olinmoqda...`);
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
                                console.log(`  - ${subject.subject_name} uchun subject_id topildi: ${match.id}`);
                            }
                        }
                    }
                }
            }
        }

        // Yangilangan studentlarni faylga qayta yozish
        fs.writeFileSync(
            './data/students.json',
            JSON.stringify(students, null, 2)
        );
        console.log("students.json fayli yangilandi.");

        // Qayta tekshirish
        const stillMissing = [];
        for (const student of students) {
            if (student.subjects) {
                for (const subject of student.subjects) {
                    if (!subject.subject_id) {
                        stillMissing.push({
                            studentId: student.id,
                            studentName: student.name,
                            subject: subject
                        });
                    }
                }
            }
        }

        if (stillMissing.length > 0) {
            if (!fs.existsSync('./logs')) {
                fs.mkdirSync('./logs');
            }
            const logFilePath = './logs/missing_subject_ids.json';
            fs.writeFileSync(logFilePath, JSON.stringify(stillMissing, null, 2));
            console.log(`\nDIQQAT: Ayrim talabalarning fanlarida subject_id hali ham bo'sh (null).`);
            console.log(`Ushbu kamchiliklar ${logFilePath} fayliga yozildi.\n`);
        } else {
            console.log("\nBarcha subject_id'lar muvaffaqiyatli to'ldirildi!\n");
        }
    }

    return students;
}

module.exports = fillMissingSubjectsService;
