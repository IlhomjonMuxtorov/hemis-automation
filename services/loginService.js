require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function loginService(login, password, sessionFile) {

    // Eski sessiyani o'chiramiz
    if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
        console.log(`${sessionFile} o'chirildi. Yangi login qilinadi...`);
    }

    const browser = await chromium.launch({
        headless: false,
        channel: "chrome"
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://hemis.isft.uz/dashboard/login');

    await page.fill('#formadminlogin-login', login);
    await page.fill('#formadminlogin-password', password);

    console.log("Captcha kiriting...");

    await page.waitForURL('https://hemis.isft.uz', { timeout: 0 });

    await context.storageState({ path: sessionFile });

    console.log(`${sessionFile} sessiya saqlandi`);

    await browser.close();
}

module.exports = loginService;
