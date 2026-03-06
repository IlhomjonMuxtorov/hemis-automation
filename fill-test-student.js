const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: false }); // Ko'rib turamiz
    const sessionFile = 'auth_admin.json';
    let context;

    if (fs.existsSync(sessionFile)) {
        context = await browser.newContext({ storageState: sessionFile });
    } else {
        console.log("Session topilmadi");
        await browser.close();
        return;
    }

    const page = await context.newPage();
    const studentId = '117971';
    console.log(`Sahifaga o'tilmoqda: https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`);

    try {
        await page.goto(`https://hemis.isft.uz/performance/ptt-edit?student=${studentId}`, { waitUntil: 'domcontentloaded' });

        console.log("Ma'lumotlar to'ldirilmoqda...");

        // 1. Qaydnoma raqami
        await page.fill('input#estudentptt-number', '1221');
        console.log("Qaydnoma raqami yozildi");

        // 2. Sana
        await page.evaluate(() => {
            const input = document.querySelector('input#estudentptt-date');
            if (input) {
                input.value = '2026-02-02';
            }
        });
        await page.fill('input#estudentptt-date', '2026-02-02');
        console.log("Sana tanlandi");

        // 3. Buyruq
        await page.selectOption('select#estudentptt-_decree', { label: 'B / 2024-10-18 / 704/T / 704/T Shaxsiy grafik' });
        console.log("Buyruq tanlandi");

        // 4. Mas'ul rahbar
        await page.selectOption('select#estudentptt-_admin', { label: 'RAVSHAN ISMATOV' });
        console.log("Mas'ul rahbar tanlandi");

        // 5. Semestr tanlashamizki formadagi subjectlar chiqsin. (Student uchun mavjudini tanlaymiz, masalan 7-semestr, test uchun)
        await page.selectOption('select#estudentptt-_semester', { label: '7-semestr' });
        console.log("Semestr tanlandi va fanlar yuklanishi kutilmoqda...");

        // Fanlar yuklanishini kutamiz (ajax grid).
        await page.waitForTimeout(3000);

        // Hozircha saqlashni izohda qoldiramiz. Kerak bo'lsa uncomment qilamiz:
        // await page.locator('button[type="submit"]').click();

        console.log("Muvaffaqiyatli yakunlandi. Sahifa 5 soniya davomida ochiq holda turadi...");
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
    }

    await browser.close();
})();
