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
4. Dasturni ishga tushirish uchun avval avtorizatsiyadan o'tib olish kerak. Avtorizatsiya 3 ta foydalanuvchi uchun bajariladi:
```bash
node login.js 
```
Agar hammasi to'g'ri bo'lsa, brauzer oynasi ochiladi va captchani kiritish talab etiladi.
Captcha kiritilgach har bir user uchun aloxidadan sessiya fayllari yaratiladi, ular ``sessions/*.json`` papkasidagi `.json` fayllarda saqlanadi.
5. Keyin esa, `data/students.json` faylini to'ldirish kerak. Hozircha mana bunaqa ko'rinishda foydalanilyapti:
```json
[
  {
    "id": "117968"
  },
  {
    "id": "117958"
  }
]
```
6. Baxo qo'yish jarayonini ishlatish uchun:
```bash
node main.js
```
7. Fayllar va loglar:
- `data/students.json` - talabalar ro'yxati
- `logs/created_ptt.jsonl` - qaydnoma yaratilgan talabalar