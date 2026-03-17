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
5. Baxo qo'yish jarayonini ishlatish uchun:
```bash
node main.js --edu_plan_id=14 --semester_id=2
```
- edu_plan_id - bu ta'lim reja IDsi
- semester_id - dasturdagi semestr IDsi

6. Fayllar va loglar:
- `data/students.json` - talabalar ro'yxati, dastur ishga tushirilganda bu ma'lumotlar tizimdan yuklab olinadi, to'liq ishga tushirishdan oldin
ma'lumot yuklab olingach uni tekshirib chiqish tavisya etiladi!
- `logs/created_ptt.jsonl` - qaydnoma yaratilgan talabalar
7. `data/students.json` faylini ko'ring. To'g'ri ma'lumot quyidagicha bo'lishi kerak:
```json
[
  {
    "id": "138183",
    "semester_name": "8-semestr",
    "pin": "41303890221700",
    "subjects" : [
      {
        "subject_id": 485927,
        "subject_name": "Faoliyatni boshqarish II",
        "semester_name": "8-semestr",
        "credit": 6,
        "grade": 48
      },
      {
        "subject_id": 485928,
        "subject_name": "Audit II",
        "semester_name": "8-semestr",
        "credit": 6,
        "grade": 67
      },
      {
        "subject_id": 439566,
        "subject_name": "Korporativ va Biznes huquqi II",
        "semester_name": "7-semestr",
        "credit": 4,
        "grade": 67
      }
    ]
  }
]
```