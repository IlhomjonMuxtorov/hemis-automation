async function createPtt(page, studentId) {

    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`);

    try {

        await page.goto(
            `https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`,
            { waitUntil: 'domcontentloaded' }
        );

        console.log("Ma'lumotlar to'ldirilmoqda...");

        // 1. Qaydnoma raqami
        await page.fill('#estudentptt-number', '1221');
        console.log("Qaydnoma raqami yozildi");

        // 2. Sana
        await page.evaluate(() => {

            const input = document.querySelector('#estudentptt-date');

            if (input) {
                input.value = '2026-02-02';

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }

        });

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
            { label: 'RAVSHAN ISMATOV' }
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

        const count = await checkboxes.count();

        for (let i = 0; i < count; i++) {

            await checkboxes.nth(i).check();

        }

        console.log(`PTT tayyor: ${studentId}`);

        // Agar kerak bo‘lsa
        // await page.locator('button[type="submit"]').click();

    } catch (error) {

        console.error(`PTT yaratishda xatolik (${studentId}):`, error);

        throw error;

    }

}

module.exports = createPtt;
