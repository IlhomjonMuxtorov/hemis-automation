async function createPttService(page, student) {
    let pttId = null;
    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt-edit?student=${student.id}`);

    try {

        await page.goto(
            `https://hemis.isft.uz/performance/ptt-edit?student=${student.id}`,
            { waitUntil: 'domcontentloaded' }
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");
        }

        console.log("Ma'lumotlar to'ldirilmoqda...");

        // 1. Qaydnoma raqami
        await page.fill('#estudentptt-number', student.id);
        console.log("Qaydnoma raqami yozildi");

        // 2. Sana
        const today = new Date().toISOString().split('T')[0];

        await page.evaluate((date) => {

            const input = document.querySelector('#estudentptt-date');

            if (input) {
                input.value = date;

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }

        }, today);

        console.log("Sana tanlandi");

        // 3. Buyruq
        await page.selectOption(
            '#estudentptt-_decree',
            { label: 'B / 2024-10-18 / 704/T / 704/T Shaxsiy grafik' }
        );

        console.log("Buyruq tanlandi");

        // 4. Mas'ul rahbar
        await page.selectOption(
            '#estudentptt-_admin',
            { label: 'ANVAR TEMIROV' }
        );

        console.log("Mas'ul rahbar tanlandi");

        // 5. Oxirgi semestrni tanlash
        await page.selectOption('select#estudentptt-_semester', { label: student?.semester_name });

        // const options = await page.$$('#estudentptt-_semester option');
        // const lastOption = await options[options.length - 1].getAttribute('value');
        //
        // await page.selectOption('#estudentptt-_semester', lastOption);

        console.log("Semestr tanlandi");

        // Ajax yuklanishini kutish
        await page.waitForSelector('.ptt-items');

        // Fanlarni tanlash
        const rows = page.locator('tr[data-key]', {
            has: page.locator('td', { hasText: student.semester_name })
        });
        const rowsCount = await rows.count();
        let disabledItemsCount = 0;

        console.log(rowsCount);

        for (let i = 0; i < rowsCount; i++) {

            const row = rows.nth(i);

            const checkbox = row.locator('.ptt-items');

            const isDisabled = await checkbox.isDisabled();

            if (!isDisabled) {
                await checkbox.check();
            } else {
                disabledItemsCount++;
            }
        }

        if (rowsCount > disabledItemsCount) {
            console.log(`PTT tayyor: ${student.id}`);

            page.once('dialog', async dialog => {
                await dialog.accept();
            });

            await Promise.all([
                page.waitForURL('**ptt-edit?ptt=*'),
                page.locator('button[type="submit"]').click()
            ]);

            const url = page.url();

            pttId = new URL(url).searchParams.get('ptt');

            if (!pttId) {
                return {
                    success: false,
                    pttId: null,
                    message: "PTT ID aniqlanmadi"
                };
            }

            console.log("PTT ID:", pttId);
        } else {
            console.log(`disabledItemsCount: ${disabledItemsCount}`);
            return { success: false, pttId: null, message: "Bu talaba uchun qaydnoma yaratib bo'lmaydi"};
        }

    } catch (error) {
        console.error(`PTT yaratishda xatolik (${student.id}):`, error);

        throw error;
    }

    return { success: true, pttId: pttId, message: "OK"};
}

module.exports = createPttService;
