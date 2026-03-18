require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function getStudentsMockService(edu_plan_id, semester_id) {
    console.log("Vaqtinchalik mock ma'lumotlar olinmoqda (data/students_fake_json.json)...");

    try {
        const filePath = path.join(__dirname, '../data/students_fake_json.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        const allStudents = jsonData.data.items;

        console.log(`Jami ${allStudents.length} ta student mock fayldan yuklandi`);

        return {
            success: true,
            students: allStudents
        };

    } catch (error) {
        console.error("Studentlarni mock fayldan olishda xatolik:", error);
        throw error;
    }
}

module.exports = getStudentsMockService;
