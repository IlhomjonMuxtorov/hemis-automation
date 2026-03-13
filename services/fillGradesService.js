async function fillGradesService(page, id, grades = []) {

    console.log(`Baxolarni qo'yish sahifasi ochilmoqda... (${id})`);

    try {

        await page.goto(
            `https://hemis.isft.uz/performance/ptt-fill?code=${id}&fill=1`,
            {waitUntil: 'domcontentloaded'}
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");

        }

        console.log("Baxolarni qo'yish sahifasi ochildi");

        await page.waitForTimeout(10000);

    } catch (error) {

        console.error(`Baxolarni qo'yishda xatolik (${id}):`, error);

        throw error;

    }

    return {success: true, message: "OK"};
}

module.exports = fillGradesService;