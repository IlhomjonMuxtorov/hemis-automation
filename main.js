const {chromium} = require('playwright');
const fs = require('fs');
const getStudentsService = require('./services/getStudentsService');
const createPttService = require('./services/createPttService');
const editPttService = require('./services/editPttService');
const approvePttService = require('./services/approvePttService');
const checkPttService = require('./services/checkPttService');
const fillGradesService = require('./services/fillGradesService');

(async () => {
    // let isShuttingDown = false;
    // let isProcessingStep = false;
    //
    // process.on('SIGINT', () => {
    //     console.log("Ctrl+C bosildi. Joriy jarayon tugashini kutyapmiz...");
    //     isShuttingDown = true;
    // });
    //
    // process.on('SIGTERM', () => {
    //     console.log("Server shutdown signali keldi. Joriy jarayon tugashini kutyapmiz...");
    //     isShuttingDown = true;
    // });


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
        let students = [];

        if (fs.existsSync('./data/students.json')) {

            console.log("students.json faylidan yuklanmoqda...");

            students = JSON.parse(
                fs.readFileSync('./data/students.json', 'utf8')
            );

        } else {

            console.log("API dan studentlar olinmoqda...");

            const studentsResult = await getStudentsService(14);

            if (!studentsResult.success) {
                console.log("Studentlarni olishda xatolik");
                process.exit();
            }

            students = studentsResult.students;

            // faylga yozish
            fs.writeFileSync(
                './data/students.json',
                JSON.stringify(students, null, 2)
            );

            console.log("students.json fayliga saqlandi");
        }

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

                studentGradesList.set(data.id, {
                    id: data.id,
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    subject: data.subject,
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
                // isProcessingStep = true;
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

            // 5-bosqich - Baxolarni qo'yish
            for (const selectedSubject of subjects) {
                if (!studentGradesList.has(selectedSubject.pttFillId)) {
                    const fillGradesResult = await fillGradesService(teacherPage, selectedSubject);

                    if (!fillGradesResult.success) {
                        console.log(`Qaydnomaga baxoni ko'chirishda xatolik sodir bo'ldi: ${selectedSubject.pttFillId}`);

                        const log = {
                            id: selectedSubject.pttFillId,
                            studentId: student.id,
                            pttId: pttId,
                            pttNumber: pttNumber,
                            subject: selectedSubject,
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
                        id: selectedSubject.pttFillId,
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        subject: selectedSubject,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/student_grades.jsonl',
                        JSON.stringify(successLog) + "\n"
                    );

                    studentGradesList.set(selectedSubject.pttFillId, {
                        id: selectedSubject.pttFillId,
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        subject: selectedSubject,
                    });

                    console.log(`Baxo ko'chirib qo'yildi: ${fillGradesResult.message}`);
                } else {
                    console.log(
                        `5-bosqich tashlab o'tildi.
                        Talaba IDsi: ${student.id}
                        Qaydnoma IDsi: ${pttId}
                        Qaydnoma raqami: ${pttNumber}
                        Fan nomi: ${selectedSubject.name}
                        Semestr nomi: ${selectedSubject.semesterName}
                        Baxo sahifasi IDsi: ${selectedSubject.pttFillId}
                    `);
                }
            }
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
