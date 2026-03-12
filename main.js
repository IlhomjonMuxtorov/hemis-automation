const { chromium } = require('playwright');
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

        for (const student of students) {

            console.log("-------------");
            console.log(`Talaba: ${student.id}`);

            // 1 bosqich
            // const createResult = await createPttService(adminPage, student);
            //
            // if (!createResult.success) {
            //     console.log(`PTT yaratilmadi: ${student.id}`);
            //
            //     const log = {
            //         studentId: student.id,
            //         reason: createResult.message,
            //         time: new Date().toISOString()
            //     };
            //
            //     fs.appendFileSync(
            //         'logs/failed_students_first_step.jsonl',
            //         JSON.stringify(log) + "\n"
            //     );
            //
            //     continue;
            // }
            //
            // const editResult = await editPttService(adminPage, student, createResult.pttId);
            const editResult = await editPttService(adminPage, student, 884);

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

            console.log(`PTT editResult: ${editResult.message}`);


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
