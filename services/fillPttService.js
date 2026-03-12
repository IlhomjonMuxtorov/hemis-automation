async function fillPttService(page, studentId) {

    console.log(`Baxolarni qo'yish sahifasi ochilmoqda... (${studentId})`);

    try {

        await page.goto(
            'https://hemis.isft.uz/performance/ptt-fill',
            { waitUntil: 'domcontentloaded' }
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");

        }

        console.log("Baxolarni qo'yish sahifasi ochildi");

        await page.waitForTimeout(10000);

    } catch (error) {

        console.error(`Baxolarni qo'yishda xatolik (${studentId}):`, error);

        throw error;

    }

}

module.exports = fillPttService;