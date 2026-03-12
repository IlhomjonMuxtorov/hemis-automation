async function createPtt(page, studentId) {

    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`);

    try {

        await page.goto(
            `https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`,
            { waitUntil: 'domcontentloaded' }
        );

        const currentUrl = page.url();

        if (currentUrl.includes('/dashboard/login')) {

            console.error("Sessiya tugagan. login.js ni qayta ishga tushiring.");

            throw new Error("SESSION_EXPIRED");

        }

        console.log("Ma'lumotlar to'ldirilmoqda...");

        // 1. Qaydnoma raqami
        await page.fill('#estudentptt-number', studentId);
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
        const options = await page.$$('#estudentptt-_semester option');

        const lastOption = await options[options.length - 1].getAttribute('value');

        await page.selectOption('#estudentptt-_semester', lastOption);

        console.log("Semestr tanlandi");

        // Ajax yuklanishini kutish
        await page.waitForTimeout(3000);

        // Fanlarni tanlash
        const checkboxes = page.locator('.ptt-items');
        const checkboxesCount = await checkboxes.count();
        let disabledItemsCount = 0;

        for (let i = 0; i < checkboxesCount; i++) {

            const checkbox = checkboxes.nth(i);

            const isDisabled = await checkbox.isDisabled();

            if (!isDisabled) {
                await checkbox.check();
            } else {
                disabledItemsCount++;
            }
        }

        if (checkboxesCount !== disabledItemsCount) {
            console.log(`PTT tayyor: ${studentId}`);

            // Agar kerak bo‘lsa
            // await page.locator('button[type="submit"]').click();
        } else {
            console.log(`disabledItemsCount: ${disabledItemsCount}`);
            return false;
        }

    } catch (error) {
        console.error(`PTT yaratishda xatolik (${studentId}):`, error);

        throw error;
    }

    return true;
}

module.exports = createPtt;
