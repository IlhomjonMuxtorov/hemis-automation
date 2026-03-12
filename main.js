const { chromium } = require('playwright');
const students = require('./data/students.json');

const createPttService = require('./services/createPttService');
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

    const approverContext = await browser.newContext({
        storageState: 'sessions/auth_approver.json'
    });

    const teacherContext = await browser.newContext({
        storageState: 'sessions/auth_teacher.json'
    });

    // 3 ta page
    const adminPage = await adminContext.newPage();
    const approverPage = await approverContext.newPage();
    const teacherPage = await teacherContext.newPage();

    try {

        for (const student of students) {

            console.log("-------------");
            console.log(`Talaba: ${student.id}`);

            // 1 bosqich
            await createPttService(adminPage, student.id);

            // 2 bosqich
            await checkPttService(approverPage, student.id);

            // 3 bosqich
            await fillPttService(teacherPage, student.id);

        }

        console.log("Jarayon tugadi");

    } catch (err) {

        console.error("Xatolik:", err);

    }

    await browser.close();

})();
