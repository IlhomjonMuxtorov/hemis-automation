const {chromium} = require('playwright');
const fs = require('fs');
const students = require('./data/students.json');

const createPttService = require('./services/createPttService');
const editPttService = require('./services/editPttService');
const checkPttService = require('./services/checkPttService');
const fillPttService = require('./services/fillPttService');

(async () => {

    const browser = await chromium.launch({
        headless: false,
        channel: "chrome"
    });

    // 3 ta user uchun context
    const adminContext = await browser.newContext({
        storageState: 'sessions/auth_admin.json'
    });

    // const approverContext = await browser.newContext({
    //     storageState: 'sessions/auth_approver.json'
    // });
    //
    // const teacherContext = await browser.newContext({
    //     storageState: 'sessions/auth_teacher.json'
    // });

    // 3 ta page
    const adminPage = await adminContext.newPage();
    // const approverPage = await approverContext.newPage();
    // const teacherPage = await teacherContext.newPage();

    try {
        const processedStudents = new Map();

        if (fs.existsSync('logs/created_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/created_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                processedStudents.set(data.studentId, {
                    pttId: data.pttId,
                    pttNumber: data.pttNumber
                });
            }
        }

        const editedPPTsList = new Map();

        if (fs.existsSync('logs/edited_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/edited_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                editedPPTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber
                });
            }
        }

        for (const student of students) {

            console.log("-------------");
            console.log(`Talaba: ${student.id}`);
            let pttId = null;
            let pttNumber = null;

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

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/created_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                processedStudents.set(student.id, {
                    pttId,
                    pttNumber
                });

            } else {
                const existing = processedStudents.get(student.id);

                pttId = existing.pttId;
                pttNumber = existing.pttNumber;

                console.log(`1-bosqich tashlab o'tildi, sababi bu talaba uchun qaydnoma allaqachon yaratilgan edi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 2-bosqich - Qaydnomaga o'qituvchi biriktirish
            if (!editedPPTsList.has(pttId)) {
                const editResult = await editPttService(adminPage, student, pttId);

                if (!editResult.success) {
                    console.log(`PTT yaratilmadi: ${student.id}`);

                    const log = {
                        studentId: student.id,
                        reason: editResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_second_step.jsonl',
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
                    'logs/edited_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                editedPPTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber
                });

                console.log(`PTT editResult: ${editResult.message}`);
            } else {
                // const existing = editedPPTsList.get(pttId);
                //
                // pttId = existing.pttId;
                // pttNumber = existing.pttNumber;

                console.log(`2-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 3-bosqich - Qaydnomani tasdiqlab, rahbariyatga yuborish.
            // 2 bosqich
            // await checkPttService(approverPage, student.id);
            //
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
