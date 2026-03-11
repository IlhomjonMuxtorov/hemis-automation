# HEMIS AUTOMATION

## Ishga tushirish ketma-ketligi
1. ``.env`` faylini yaratish
2. ``npm install`` buyrug'ini yurgizish
3. Agar Google Chrome ishlatmaydigan bo'lsangiz va Chromium ishlatmoqchi bo'lsangiz, mana bu joyni o'zgartirish kerak. Hamda ``channel: "chrome"`` ni kommentga olish kerak:
```js
const browser = await chromium.launch({
    headless: false,
    // channel: "chrome"
});
```
4. Dasturni ishga tushirish uchun avval avtorizatsiyadan o'tib olish kerak. Avtorizatsiya uchun:
```bash
node index.js 
```
Agar hammasi to'g'ri bo'lsa, brauzer oynasi ochiladi va captchani kiritish talab etiladi.
Captcha kiritilgach ``auth_admin.json`` fayliga cookie ma'lumotlari yozib qo'yiladi. 