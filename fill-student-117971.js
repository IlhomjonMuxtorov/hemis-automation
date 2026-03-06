const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // Brauzerni vizual ko'rinishda ochamiz
    const browser = await chromium.launch({ headless: false });
    const sessionFile = 'auth_admin.json';

    if (!fs.existsSync(sessionFile)) {
        console.log("Sessiya topilmadi. Avval login qiling.");
        await browser.close();
        return;
    }

    const context = await browser.newContext({ storageState: sessionFile });
    const page = await context.newPage();
    const studentId = '117971';

    console.log(`Talaba sahifasiga o'tilmoqda (ID: ${studentId})...`);

    try {
        await page.goto(`https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`, { waitUntil: 'domcontentloaded' });

        console.log("Ma'lumotlar to'ldirilmoqda...");

        // 1. Qaydnoma raqami
        await page.waitForSelector('input#estudentptt-number');
        await page.fill('input#estudentptt-number', '1221');
        console.log("Qaydnoma raqami yozildi: 1221");

        // 2. Sana
        await page.evaluate(() => {
            const input = document.querySelector('input#estudentptt-date');
            if (input) input.value = '2026-02-02';
        });
        await page.fill('input#estudentptt-date', '2026-02-02');
        console.log("Sana yozildi: 2026-02-02");

        // 3. Buyruq
        await page.selectOption('select#estudentptt-_decree', { label: 'B / 2024-10-18 / 704/T / 704/T Shaxsiy grafik' });
        console.log("Buyruq tanlandi");

        // 4. Mas'ul rahbar (Dastur katta harflarda bo'lishini kutadi)
        await page.selectOption('select#estudentptt-_admin', { label: 'RAVSHAN ISMATOV' });
        console.log("Mas'ul rahbar tanlandi: RAVSHAN ISMATOV");

        // 5. Semestr tanlash (talaba hozirda 7-semestrda ekani aniqlangan, fanlar chiqishi uchun semestr tanlanishi kerak)
        await page.selectOption('select#estudentptt-_semester', { label: '7-semestr' });
        console.log("Semestr tanlandi va fanlar yuklanishi kutilmoqda...");

        // Fanlar ro'yxati ajax orqali yuklanishini kutamiz
        await page.waitForTimeout(3000);

        // Barcha fanlarni tanlash (chekboxlar)
        const checkboxes = await page.$$('input.ptt-items');
        if (checkboxes.length > 0) {
            console.log(`${checkboxes.length} ta fan topildi, barchasi tanlanmoqda...`);
            for (const checkbox of checkboxes) {
                // Agar checkbox belgilanmagan bo'lsa uni belgilaymiz
                const isChecked = await checkbox.isChecked();
                if (!isChecked) {
                    await checkbox.check();
                }
            }
        } else {
            console.log("Fanlar ro'yxati topilmadi (chekboxlar yo'q).");
        }

        // --- Saqlash ---
        // Avtomatik saqlashni yoqish bo'lsangiz quyidagi 2 qatorni izohdan chiqaring

        console.log("Ma'lumotlar Saqlanmoqda...");
        await page.locator('button[type="submit"]').click();

        // Natija yuklanishini biroz kutamiz
        await page.waitForTimeout(3000);
        console.log("Muvaffaqiyatli saqlandi! Brauzer birozdan so'ng yopiladi...");
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
    }

    // await browser.close(); // Ishlashini doimiy ko'rish uchun hozircha izohda
})();
