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

        const rows = page.locator('#ptt-form table tbody tr[data-key]');
        const rowsCount = await rows.count();

        for (let i = 0; i < rowsCount; i++) {

            const id = 2 * i + 1;

            // Agar qo'lda tanlangan bo'lsa, uni tashlab o'tib ketish.
            const selected = await page.locator('#w' + id)
                .locator('..') // parent td
                .locator('.selectize-input .item')
                .count();

            if (selected > 0) {
                continue;
            }

            const input = page.locator('#w' + id + '-selectized');

            await input.click();

            await input.type('ABDUSHARIFOV');

            const option = page.locator(
                '.selectize-dropdown-content [data-selectable]:has-text("ABDUSHARIFOV ZAFARBEK ILXOMOVICH")'
            );

            await option.waitFor({ state: 'visible' });

            await option.click();
        }

        const confirmed = await page.evaluate(() => {
            return new Promise((resolve) => {

                const wrapper = document.createElement('div');
                wrapper.id = "playwright-confirm";

                wrapper.innerHTML = `
                <div style="
                    position:fixed;
                    top:0;
                    left:0;
                    width:100%;
                    height:100%;
                    background:rgba(0,0,0,0.4);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    z-index:999999;
                ">
                    <div style="background:white;padding:20px;border-radius:8px;text-align:center">
                        <p>Formani yuborishni tasdiqlaysizmi?</p>
                        <button id="confirmYes">Ha</button>
                        <button id="confirmNo">Yo‘q</button>
                    </div>
                </div>
                `;

                document.body.appendChild(wrapper);

                document.getElementById('confirmYes').onclick = () => {
                    wrapper.remove();
                    resolve(true);
                };

                document.getElementById('confirmNo').onclick = () => {
                    wrapper.remove();
                    resolve(false);
                };

            });
        });

        if (!confirmed) {
            console.log("Foydalanuvchi bekor qildi");
            return { success: false, pttId: pttId, message: "Foydalanuvchi bekor qildi" };
        }

        await Promise.all([
            page.waitForNavigation(),
            page.locator('button[type="submit"]').click()
        ]);
    } catch (error) {
        console.error(`PTT yaratishda xatolik (${student.id}):`, error);

        throw error;
    }

    return { success: true, pttId: pttId, message: "OK"};
}

module.exports = editPttService;
