async function fillGradesService(page, subject) {
    console.log(`Baxolarni qo'yish sahifasi ochilmoqda... (${subject.pttFillId})`);

    try {

        await page.goto(
            `https://hemis.isft.uz/performance/ptt-fill?code=${subject.pttFillId}&fill=1`,
            {waitUntil: 'domcontentloaded'}
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");

        }

        console.log("Baxolarni qo'yish sahifasi ochildi");

        const rows = page.locator('#subjects-grid table tbody tr[data-key]');
        const rowsCount = await rows.count();

        console.log("Baxolar to'ldirilmoqda...");

        for (let i = 0; i < rowsCount; i++) {
            const row = rows.nth(i);
            const subjectId = await row.getAttribute('data-key');
            const subjectName = await row.locator('td').nth(1).textContent();
            const semesterName = await row.locator('td').nth(2).textContent();

            if (subjectId === subject.pttFillId && subjectName === subject.name && semesterName === subject.semesterName) {
                const input = row.locator('input.acr');
                await input.fill(String(subject.grade));
            }
        }

        await Promise.all([
            page.waitForLoadState('networkidle'),
            page.locator('#subjects-grid button[type="submit"]').click()
        ]);

        // await page.waitForTimeout(15000);
    } catch (error) {

        console.error(`Baxolarni qo'yishda xatolik (${subject.pttFillId}):`, error);

        throw error;

    }

    return {success: true, message: "OK"};
}

module.exports = fillGradesService;