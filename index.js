require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // Brauzerni ochamiz (headless: false bo'lishi shart, bizga UI kerak)
    const browser = await chromium.launch({
        headless: false,
        channel: "chrome"
    });
    const sessionFile = 'auth_admin.json';
    let context;
    let page;

    if (fs.existsSync(sessionFile)) {
        console.log("Sessiya mavjud! Saqlangan sessiya orqali kirilmoqda...");
        context = await browser.newContext({ storageState: sessionFile });
        page = await context.newPage();

        // To'g'ridan-to'g'ri tizim ichkarisiga kirish
        await page.goto('https://hemis.isft.uz/');
    } else {
        console.log("Sessiya topilmadi. Tizimga kirish uchun sahifa ochilmoqda...");
        context = await browser.newContext();
        page = await context.newPage();

        await page.goto('https://hemis.isft.uz/dashboard/login');

        // Login va parolni avtomatik to'ldirish
        if (process.env.ADMIN_LOGIN) await page.fill('#formadminlogin-login', process.env.ADMIN_LOGIN);
        if (process.env.ADMIN_PASSWORD) await page.fill('#formadminlogin-password', process.env.ADMIN_PASSWORD);

        console.log("Iltimos, Captchani kiriting va tizimga kiring...");

        // Tizimga kirguncha kutadi (masalan, dashboard sahifasi yuklanguncha)
        await page.waitForURL('https://hemis.isft.uz', { timeout: 0 });

        // Sessiyani faylga saqlaymiz
        await context.storageState({ path: sessionFile });
        console.log(`Sessiya '${sessionFile}' fayliga muvaffaqiyatli saqlandi!`);
    }

    // Keyingi ishlaringizni shu yerda davom ettirasiz...
    // await browser.close();
})();