require('dotenv').config();
const loginService = require('./services/loginService.js');

(async () => {

    await loginService(
        process.env.ADMIN_LOGIN,
        process.env.ADMIN_PASSWORD,
        'sessions/auth_admin.json'
    );

    await loginService(
        process.env.APPROVER_LOGIN,
        process.env.APPROVER_PASSWORD,
        'sessions/auth_approver.json'
    );

    await loginService(
        process.env.TEACHER_LOGIN,
        process.env.TEACHER_PASSWORD,
        'sessions/auth_teacher.json'
    );

    console.log("Barcha userlar uchun yangi sessiya yaratildi");

})();
