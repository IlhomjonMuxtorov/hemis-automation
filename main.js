const {chromium} = require('playwright');
const fs = require('fs');
const students = require('./data/students.json');

const createPttService = require('./services/createPttService');
const editPttService = require('./services/editPttService');
const approvePttService = require('./services/approvePttService');
const checkPttService = require('./services/checkPttService');
const fillGradesService = require('./services/fillGradesService');

(async () => {

    const browser = await chromium.launch({
        headless: false,
        channel: "chrome"
    });

    // 3 ta user uchun context
    const adminContext = await browser.newContext({
        storageState: 'sessions/auth_admin.json'
    });

    const checkContext = await browser.newContext({
        storageState: 'sessions/auth_check.json'
    });

    const teacherContext = await browser.newContext({
        storageState: 'sessions/auth_teacher.json'
    });

    // 3 ta page
    const adminPage = await adminContext.newPage();
    const checkPage = await checkContext.newPage();
    const teacherPage = await teacherContext.newPage();

    try {
        const processedStudents = new Map();

        if (fs.existsSync('logs/created_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/created_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                processedStudents.set(data.studentId, {
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    subjects: data.subjects
                });
            }
        }

        const editedPTTsList = new Map();

        if (fs.existsSync('logs/edited_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/edited_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                editedPTTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    editedSubjects: data.editedSubjects,
                });
            }
        }

        const approvedPTTsList = new Map();

        if (fs.existsSync('logs/approved_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/approved_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                approvedPTTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber
                });
            }
        }

        const checkedPTTsList = new Map();

        if (fs.existsSync('logs/checked_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/checked_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                checkedPTTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber
                });
            }
        }

        const studentGradesList = new Map();

        if (fs.existsSync('logs/student_grades.jsonl')) {
            const lines = fs.readFileSync('logs/student_grades.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                studentGradesList.set(data.editedSubjectId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    editedSubjectId: data.editedSubjectId,
                });
            }
        }

        for (const student of students) {

            console.log("-------------");
            console.log(`Talaba: ${student.id}`);
            let pttId = null;
            let pttNumber = null;
            let subjects = [];
            let editedSubjects = [];

            // 1-bosqich - Qaydnoma yaratish
            if (!processedStudents.has(student.id)) {
                const createResult = await createPttService(adminPage, student);

                if (!createResult.success) {
                    console.log(`PTT yaratilmadi: ${student.id}`);

                    const log = {
                        studentId: student.id,
                        reason: createResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_first_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                pttId = createResult.pttId;
                pttNumber = createResult.pttNumber;
                subjects = createResult.subjects;

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    subjects: subjects,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/created_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                processedStudents.set(student.id, {
                    pttId,
                    pttNumber,
                    subjects: subjects
                });

            } else {
                const existing = processedStudents.get(student.id);

                pttId = existing.pttId;
                pttNumber = existing.pttNumber;
                subjects = existing.subjects;

                console.log(`1-bosqich tashlab o'tildi, sababi bu talaba uchun qaydnoma allaqachon yaratilgan edi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 2-bosqich - Qaydnomaga o'qituvchi biriktirish
            if (!editedPTTsList.has(pttId)) {
                const editResult = await editPttService(adminPage, student, pttId);

                if (!editResult.success) {
                    console.log(`Qaydnomaga o'qituvchi biriktirishda xatolik sodir bo'ldi: ${student.id}`);

                    const log = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        editedSubjects: editResult.subjects,
                        reason: editResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_second_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                editedSubjects = editResult.subjects;

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    editedSubjects: editedSubjects,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/edited_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                editedPTTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    editedSubjects: editedSubjects,
                });

                console.log(`Qaydnomaga o'qituvchi biriktirish tugatildi: ${editResult.message}`);
            } else {
                const existing = editedPTTsList.get(pttId);

                editedSubjects = existing.editedSubjects;

                console.log(`2-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 3-bosqich - Qaydnomani tasdiqlab, rahbariyatga yuborish.
            if (!approvedPTTsList.has(pttId)) {
                const approveResult = await approvePttService(adminPage, student, pttId);

                if (!approveResult.success) {
                    console.log(`Qaydnomani tasdiqlashda xatolik sodir bo'ldi: ${student.id}`);

                    const log = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        reason: approveResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_third_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/approved_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                approvedPTTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber
                });

                console.log(`Qaydnomani tasdiqlash: ${approveResult.message}`);
            } else {
                // const existing = editedPTTsList.get(pttId);
                //
                // pttId = existing.pttId;
                // pttNumber = existing.pttNumber;

                console.log(`3-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 4-bosqich - Qaydnomani tasdiqlab, o'qituvchiga yuborish
            if (!checkedPTTsList.has(pttId)) {
                const checkResult = await checkPttService(checkPage, student.id, pttId);

                if (!checkResult.success) {
                    console.log(`Qaydnomani tasdiqlashda xatolik sodir bo'ldi: ${student.id}`);

                    const log = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        reason: checkResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_fourth_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/checked_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                checkedPTTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                });

                console.log(`Qaydnomani tasdiqlash: ${checkResult.message}`);
            } else {
                // const existing = checkedPTTsList.get(pttId);
                //
                // pttId = existing.pttId;
                // pttNumber = existing.pttNumber;

                console.log(`4-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            console.log(pttId);
            console.log(pttNumber);
            console.log(subjects);
            console.log(editedSubjects);
            console.log(typeof editedSubjects);

            // 5-bosqich - Baxolarni qo'yish
            for (const editedSubject of editedSubjects) {
                console.log(editedSubject.id);
                console.log(editedSubject.name);
                console.log(editedSubject.semesterName);

                if (!studentGradesList.has(editedSubject.id)) {
                    const fillGradesResult = await fillGradesService(teacherPage, editedSubject.id);

                    if (!fillGradesResult.success) {
                        console.log(`Qaydnomani tasdiqlashda xatolik sodir bo'ldi: ${editedSubject.id}`);

                        const log = {
                            studentId: student.id,
                            pttId: pttId,
                            pttNumber: pttNumber,
                            editedSubjectId: editedSubject.id,
                            reason: fillGradesResult.message,
                            time: new Date().toISOString()
                        };

                        fs.appendFileSync(
                            'logs/failed_students_fifth_step.jsonl',
                            JSON.stringify(log) + "\n"
                        );

                        continue;
                    }

                    const successLog = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        editedSubjectId: editedSubject.id,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/student_grades.jsonl',
                        JSON.stringify(successLog) + "\n"
                    );

                    studentGradesList.set(pttId, {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        editedSubjectId: editedSubject.id,
                    });

                    console.log(`Qaydnomani tasdiqlash: ${fillGradesResult.message}`);
                } else {
                    // const existing = studentGradesList.get(pttId);
                    //
                    // pttId = existing.pttId;
                    // pttNumber = existing.pttNumber;

                    console.log(`5-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
                }


            }

            // await page.waitForTimeout(3000);

            // // 3 bosqich
            // await fillPttService(teacherPage, student.id);

        }

        console.log("Jarayon tugadi");

    } catch (err) {
        console.error("Xatolik:", err);

        const log = `[${new Date().toLocaleString()}] ERROR: ${err.message}\n`;

        fs.appendFileSync(
            'logs/system_errors.log',
            log
        );

        if (err.message === "SESSION_EXPIRED") {

            console.log("Sessiya tugagan. Iltimos qayta login qiling.");

            fs.appendFileSync(
                'logs/system_errors.log',
                `[${new Date().toLocaleString()}] SESSION_EXPIRED -> login.js ni qayta ishga tushirish kerak\n`
            );

            process.exit();

        }
    }

    await browser.close();
})();
