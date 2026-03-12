async function checkPttService(page, studentId) {

    console.log(`PTT tekshirish sahifasi ochilmoqda... (${studentId})`);

    try {

        await page.goto(
            'https://hemis.isft.uz/performance/ptt-check',
            { waitUntil: 'domcontentloaded' }
        );

        console.log("PTT tekshirish sahifasi ochildi");

        await page.waitForTimeout(10000);

    } catch (error) {

        console.error(`PTT tekshirishda xatolik (${studentId}):`, error);

        throw error;

    }

}

module.exports = checkPttService;