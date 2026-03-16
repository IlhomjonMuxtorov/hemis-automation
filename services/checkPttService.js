async function checkPttService(page, studentId, pttId) {
    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt-check?code=${pttId}&view=1`);

    try {
        await page.goto(
            `https://hemis.isft.uz/performance/ptt-check?code=${pttId}&view=1`,
            {waitUntil: 'domcontentloaded'}
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {
            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");
        }

        console.log("Qaydnomani tasdiqlash sahifasi ochildi");

        page.once('dialog', async dialog => {
            await dialog.accept();
        });

        await Promise.all([
            page.waitForLoadState('networkidle'),
            page.locator('.box-footer a.btn.btn-info.btn-flat').click()
        ]);

        // await page.waitForTimeout(3000);
    } catch (error) {

        console.error(`Qaydnomani tasdiqlashda xatolik (${studentId}):`, error);

        throw error;

    }

    return {success: true, pttId: pttId, message: "OK"};
}

module.exports = checkPttService;