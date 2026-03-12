async function editPttService(page, student, pttId) {
    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt-edit?ptt=${pttId}`);

    try {

        await page.goto(
            `https://hemis.isft.uz/performance/ptt-edit?ptt=${pttId}`,
            { waitUntil: 'domcontentloaded' }
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");
        }

        console.log("Ma'lumotlar to'ldirilmoqda...");

        await page.waitForTimeout(5000);

    } catch (error) {
        console.error(`PTT yaratishda xatolik (${student.id}):`, error);

        throw error;
    }

    return { success: true, pttId: pttId, message: "OK"};
}

module.exports = editPttService;
