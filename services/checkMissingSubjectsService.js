const {PROCESS_STEPS, PROCESS_STATUS} = require('../constants');
const updateLogsService = require('./updateLogsService');

/**
 * Talaba fanlarida subject_id yo'q bo'lgan holatlarni tekshiradi
 * va kerak bo'lsa loglarni yangilab, xabar beradi.
 * 
 * @param {Object} student - Talaba ma'lumoti
 * @param {Number|String} logId - Joriy log ID
 * @param {Number|String} pttId - PTT ID
 * @returns {Promise<{hasMissing: boolean, logId: Number|String}>}
 */
async function checkMissingSubjectsService(student, logId, pttId) {
    let hasMissingSubjectId = false;
    
    if (student.subjects) {
        for (const subject of student.subjects) {
            if (!subject.subject_id) {
                hasMissingSubjectId = true;
                break;
            }
        }
    }

    if (hasMissingSubjectId) {
        try {
            logId = await updateLogsService(logId, {
                student_id: Number(student.student_id),
                step: PROCESS_STEPS.PREPARING_TO_START,
                status: PROCESS_STATUS.ERROR,
                unique_string: `student_${student.id}_ptt_${pttId}`
            });
        } catch (logError) {
            console.error(`updateLogsService(logId xatolik (student ${student.id}):`, logError.message);
        }
        
        console.log(`DIQQAT: Talaba ${student.id} dagi fanda subject_id yo'q. Ushbu talaba o'tkazib yuborilmoqda...`);
        return { hasMissing: true, logId };
    }

    return { hasMissing: false, logId };
}

module.exports = checkMissingSubjectsService;
