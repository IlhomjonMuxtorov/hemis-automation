async function approvePttService(page, student, pttId) {
    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt`);

    try {
        await page.goto(
            `https://hemis.isft.uz/performance/ptt`,
            {waitUntil: 'domcontentloaded'}
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");
        }

        console.log("Ma'lumotlar to'ldirilmoqda...");

        // Talabani qidirish
        const searchInput = page.locator('#estudentptt-search');
        await searchInput.fill(student.pin);

        await Promise.all([
            page.waitForLoadState('networkidle'),
            searchInput.press('Enter')
        ]);

        // Qaydnomani topish
        const row = page.locator(`tr[data-key="${pttId}"]`);

        if (await row.count() === 0) {
            return {success: true, pttId: pttId, message: `Bunday qaydnoma topilmadi`};
        }

        page.once('dialog', async dialog => {
            await dialog.accept();
        });

        await Promise.all([
            page.waitForLoadState('networkidle'),
            row.locator('a.btn.btn-flat').click()
        ]);
    } catch (error) {
        console.error(`PTT yaratishda xatolik (${student.id}):`, error);

        throw error;
    }

    return {success: true, pttId: pttId, message: "OK"};
}

module.exports = approvePttService;
