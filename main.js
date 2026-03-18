const {chromium} = require('playwright');
const fs = require('fs');
const {PROCESS_STEPS, PROCESS_STATUS} = require('./constants');

const getStudentsService = require('./services/getStudentsService');
const getStudentsMockService = require('./services/getStudentsMockService');
const getStudentSubjectsService = require('./services/getStudentSubjectsService');
const fillMissingSubjectsService = require('./services/fillMissingSubjectsService');
const fillStudentMissingSubjectsService = require('./services/fillStudentMissingSubjectsService');
const checkMissingSubjectsService = require('./services/checkMissingSubjectsService');
const createPttService = require('./services/createPttService');
const editPttService = require('./services/editPttService');
const approvePttService = require('./services/approvePttService');
const checkPttService = require('./services/checkPttService');
const fillGradesService = require('./services/fillGradesService');
const writeLogsService = require('./services/writeLogsService');
const updateLogsService = require('./services/updateLogsService');
const gradeLogsService = require('./services/gradeLogsService');
const updateGradeLogsService = require('./services/updateGradeLogsService');

(async () => {
    const args = process.argv.slice(2);
    let edu_plan_id = null;
    let semester_id = null;

    args.forEach(arg => {
        if (arg.startsWith('--edu_plan_id=')) {
            edu_plan_id = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--semester_id=')) {
            semester_id = parseInt(arg.split('=')[1], 10);
        }
    });

    if (!edu_plan_id || !semester_id) {
        console.error("Iltimos, edu_plan_id va semester_id parametrlarni nomi bilan kiriting.\nMisol uchun: node main.js --edu_plan_id=14 --semester_id=11");
        process.exit(1);
    }

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const proceed = await new Promise(resolve => {
        readline.question(`Siz edu_plan_id=${edu_plan_id} va semester_id=${semester_id} larni kiritdingiz. Rostdan ham ma'lumotlarni yuklab olmoqchimisiz? (yes/no): `, answer => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            readline.close();
        });
    });

    if (!proceed) {
        console.log("Jarayon to'xtatildi.");
        process.exit(0);
    }

    const browser = await chromium.launch({
        headless: false,
        channel: "chrome"
    });

    try {
        let students = [];

        if (fs.existsSync('./data/students.json')) {

            console.log("students.json faylidan yuklanmoqda...");

            students = JSON.parse(
                fs.readFileSync('./data/students.json', 'utf8')
            );

        } else {

            console.log("API dan studentlar olinmoqda...");

            // const studentsResult = await getStudentsService(edu_plan_id, semester_id);
            const studentsResult = await getStudentsMockService(edu_plan_id, semester_id);

            if (!studentsResult.success) {
                console.log("Studentlarni olishda xatolik");
                process.exit();
            }

            students = studentsResult.students;

            // faylga yozish
            fs.writeFileSync(
                './data/students.json',
                JSON.stringify(students, null, 2)
            );

            console.log("students.json fayliga saqlandi");
        }

        // const missingSubjects = [];
        // for (const student of students) {
        //     if (student.subjects) {
        //         for (const subject of student.subjects) {
        //             if (!subject.subject_id) {
        //                 missingSubjects.push({
        //                     studentId: student.id,
        //                     studentName: student.name,
        //                     subject: subject
        //                 });
        //             }
        //         }
        //     }
        // }
        //
        // if (missingSubjects.length > 0) {
        //     students = await fillMissingSubjectsService(students);
        // }

        const checkDataProceed = await new Promise(resolve => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            readline.question(`Talaba ma'lumotlari tayyor. Ularni ko'rib chiqishni tavsiya qilaman.\nIltimos, ./data/students.json faylini tekshirib chiqing.\nDavom etmoqchimisiz? (yes/no): `, answer => {
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
                readline.close();
            });
        });

        if (!checkDataProceed) {
            console.log("Jarayon to'xtatildi.");
            await browser.close();
            process.exit(0);
        }

        // 3 ta user uchun context
        const adminContext = await browser.newContext({
            storageState: 'sessions/auth_admin.json'
        });

        const checkContext = await browser.newContext({
            storageState: 'sessions/auth_check.json'
        });

        const teacherContext = await browser.newContext({
            storageState: 'sessions/auth_teacher.json'
        });

        // 3 ta page
        const adminPage = await adminContext.newPage();
        const checkPage = await checkContext.newPage();
        const teacherPage = await teacherContext.newPage();

        const processedStudents = new Map();

        if (fs.existsSync('logs/created_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/created_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                processedStudents.set(data.studentId, {
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    subjects: data.subjects,
                    logId: data.logId || null
                });
            }
        }

        const editedPTTsList = new Map();

        if (fs.existsSync('logs/edited_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/edited_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                editedPTTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    editedSubjects: data.editedSubjects,
                });
            }
        }

        const approvedPTTsList = new Map();

        if (fs.existsSync('logs/approved_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/approved_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                approvedPTTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber
                });
            }
        }

        const checkedPTTsList = new Map();

        if (fs.existsSync('logs/checked_ptt.jsonl')) {
            const lines = fs.readFileSync('logs/checked_ptt.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                checkedPTTsList.set(data.pttId, {
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber
                });
            }
        }

        const studentGradesList = new Map();

        if (fs.existsSync('logs/student_grades.jsonl')) {
            const lines = fs.readFileSync('logs/student_grades.jsonl', 'utf8').split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const data = JSON.parse(line);

                studentGradesList.set(data.id, {
                    id: data.id,
                    studentId: data.studentId,
                    pttId: data.pttId,
                    pttNumber: data.pttNumber,
                    logId: data.logId,
                    gradeLogId: data.gradeLogId,
                    subject: data.subject,
                });
            }
        }

        let lmsToken = null;

        for (const student of students) {

            console.log("-------------");
            console.log(`Talaba: ${student.id}`);
            let pttId = null;
            let pttNumber = null;
            let logId = null;
            let subjects = [];
            let editedSubjects = [];

            if (!processedStudents.has(student.id)) {
                try {
                    logId = await writeLogsService({
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.PREPARING_TO_START,
                        status: PROCESS_STATUS.START,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`writeLogsService xatolik (student ${student.id}):`, logError.message);
                }
            } else {
                const existing = processedStudents.get(student.id);

                logId = existing.logId
            }

            // subject_id bo'sh bo'lgan fanlarni to'ldirishga harakat qilamiz
            const fillResult = await fillStudentMissingSubjectsService(student, lmsToken);
            lmsToken = fillResult.token;

            // subject_id si yo'q bo'lgan fani bor yo'qligini tekshiramiz
            const checkResult = await checkMissingSubjectsService(student, logId, pttId);
            logId = checkResult.logId;
            if (checkResult.hasMissing) {
                continue;
            }

            // O'zgarish bo'lgan bo'lsa, students.json ni yangilaymiz
            fs.writeFileSync(
                './data/students.json',
                JSON.stringify(students, null, 2)
            );

            // 1-bosqich - Qaydnoma yaratish
            if (!processedStudents.has(student.id)) {
                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.FIRST_STEP,
                        status: PROCESS_STATUS.START,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const createResult = await createPttService(adminPage, student);

                if (!createResult.success) {
                    console.log(`PTT yaratilmadi: ${student.id}`);

                    const log = {
                        studentId: student.id,
                        reason: createResult.message,
                        time: new Date().toISOString()
                    };

                    try {
                        logId = await updateLogsService(logId, {
                            student_id: Number(student.student_id),
                            step: PROCESS_STEPS.FIRST_STEP,
                            status: PROCESS_STATUS.ERROR,
                            unique_string: `student_${student.id}_ptt_${pttId}`
                        });
                    } catch (logError) {
                        console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                    }

                    fs.appendFileSync(
                        'logs/failed_students_first_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                pttId = createResult.pttId;
                pttNumber = createResult.pttNumber;
                subjects = createResult.subjects;

                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.FIRST_STEP,
                        status: PROCESS_STATUS.FINISH,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    subjects: subjects,
                    logId: logId,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/created_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                processedStudents.set(student.id, {
                    pttId,
                    pttNumber,
                    subjects: subjects,
                    logId: logId
                });

            } else {
                const existing = processedStudents.get(student.id);

                pttId = existing.pttId;
                pttNumber = existing.pttNumber;
                subjects = existing.subjects;

                console.log(`1-bosqich tashlab o'tildi, sababi bu talaba uchun qaydnoma allaqachon yaratilgan edi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber} Log IDsi: ${logId}`);
            }

            // 2-bosqich - Qaydnomaga o'qituvchi biriktirish
            if (!editedPTTsList.has(pttId)) {
                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.SECOND_STEP,
                        status: PROCESS_STATUS.START,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const editResult = await editPttService(adminPage, student, pttId);

                if (!editResult.success) {
                    console.log(`Qaydnomaga o'qituvchi biriktirishda xatolik sodir bo'ldi: ${student.id}`);

                    try {
                        logId = await updateLogsService(logId, {
                            student_id: Number(student.student_id),
                            step: PROCESS_STEPS.SECOND_STEP,
                            status: PROCESS_STATUS.ERROR,
                            unique_string: `student_${student.id}_ptt_${pttId}`
                        });
                    } catch (logError) {
                        console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                    }

                    const log = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        editedSubjects: editResult.subjects,
                        reason: editResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_second_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                editedSubjects = editResult.subjects;

                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.SECOND_STEP,
                        status: PROCESS_STATUS.FINISH,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    editedSubjects: editedSubjects,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/edited_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                editedPTTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    editedSubjects: editedSubjects,
                });

                console.log(`Qaydnomaga o'qituvchi biriktirish tugatildi: ${editResult.message}`);
            } else {
                const existing = editedPTTsList.get(pttId);

                editedSubjects = existing.editedSubjects;

                console.log(`2-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 3-bosqich - Qaydnomani tasdiqlab, rahbariyatga yuborish.
            if (!approvedPTTsList.has(pttId)) {
                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.THIRD_STEP,
                        status: PROCESS_STATUS.START,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const approveResult = await approvePttService(adminPage, student, pttId);

                if (!approveResult.success) {
                    console.log(`Qaydnomani tasdiqlashda xatolik sodir bo'ldi: ${student.id}`);

                    try {
                        logId = await updateLogsService(logId, {
                            student_id: Number(student.student_id),
                            step: PROCESS_STEPS.THIRD_STEP,
                            status: PROCESS_STATUS.ERROR,
                            unique_string: `student_${student.id}_ptt_${pttId}`
                        });
                    } catch (logError) {
                        console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                    }

                    const log = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        reason: approveResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_third_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.THIRD_STEP,
                        status: PROCESS_STATUS.FINISH,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/approved_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                approvedPTTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber
                });

                console.log(`Qaydnomani tasdiqlash: ${approveResult.message}`);
            } else {
                // const existing = editedPTTsList.get(pttId);
                //
                // pttId = existing.pttId;
                // pttNumber = existing.pttNumber;

                console.log(`3-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 4-bosqich - Qaydnomani tasdiqlab, o'qituvchiga yuborish
            if (!checkedPTTsList.has(pttId)) {
                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.FOURTH_STEP,
                        status: PROCESS_STATUS.START,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const checkResult = await checkPttService(checkPage, student.id, pttId);

                if (!checkResult.success) {
                    console.log(`Qaydnomani tasdiqlashda xatolik sodir bo'ldi: ${student.id}`);

                    try {
                        logId = await updateLogsService(logId, {
                            student_id: Number(student.student_id),
                            step: PROCESS_STEPS.FOURTH_STEP,
                            status: PROCESS_STATUS.ERROR,
                            unique_string: `student_${student.id}_ptt_${pttId}`
                        });
                    } catch (logError) {
                        console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                    }

                    const log = {
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        reason: checkResult.message,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/failed_students_fourth_step.jsonl',
                        JSON.stringify(log) + "\n"
                    );

                    continue;
                }

                try {
                    logId = await updateLogsService(logId, {
                        student_id: Number(student.student_id),
                        step: PROCESS_STEPS.FOURTH_STEP,
                        status: PROCESS_STATUS.FINISH,
                        unique_string: `student_${student.id}_ptt_${pttId}`
                    });
                } catch (logError) {
                    console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                }

                const successLog = {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                    time: new Date().toISOString()
                };

                fs.appendFileSync(
                    'logs/checked_ptt.jsonl',
                    JSON.stringify(successLog) + "\n"
                );

                checkedPTTsList.set(pttId, {
                    studentId: student.id,
                    pttId: pttId,
                    pttNumber: pttNumber,
                });

                console.log(`Qaydnomani tasdiqlash: ${checkResult.message}`);
            } else {
                // const existing = checkedPTTsList.get(pttId);
                //
                // pttId = existing.pttId;
                // pttNumber = existing.pttNumber;

                console.log(`4-bosqich tashlab o'tildi. Talaba IDsi: ${student.id} Qaydnoma IDsi: ${pttId} Qaydnoma raqami: ${pttNumber}`);
            }

            // 5-bosqich - Baxolarni qo'yish
            for (const [index, selectedSubject] of subjects.entries()) {
                if (!studentGradesList.has(selectedSubject.pttFillId)) {
                    if (index === 0) {
                        try {
                            logId = await updateLogsService(logId, {
                                student_id: Number(student.student_id),
                                step: PROCESS_STEPS.FIFTH_STEP,
                                status: PROCESS_STATUS.START,
                                unique_string: `student_${student.id}_ptt_${pttId}`
                            });
                        } catch (logError) {
                            console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                        }
                    }

                    let gradeLogId = null;
                    try {
                        gradeLogId = await gradeLogsService(logId, {
                            student_semestr_subject_id: selectedSubject.id,
                            grade: selectedSubject.grade,
                            status: PROCESS_STATUS.START
                        });
                    } catch (logError) {
                        console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                    }

                    const fillGradesResult = await fillGradesService(teacherPage, selectedSubject);

                    if (!fillGradesResult.success) {
                        console.log(`Qaydnomaga baxoni ko'chirishda xatolik sodir bo'ldi: ${selectedSubject.pttFillId}`);

                        try {
                            logId = await updateLogsService(logId, {
                                student_id: Number(student.student_id),
                                step: PROCESS_STEPS.FIFTH_STEP,
                                status: PROCESS_STATUS.ERROR,
                                unique_string: `student_${student.id}_ptt_${pttId}`
                            });
                        } catch (logError) {
                            console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                        }

                        try {
                            gradeLogId = await updateGradeLogsService(gradeLogId, {
                                grade: selectedSubject.grade,
                                status: PROCESS_STATUS.ERROR
                            });
                        } catch (logError) {
                            console.error(`updateGradeLogsService xatolik (student ${student.id}):`, logError.message);
                        }

                        const log = {
                            id: selectedSubject.pttFillId,
                            studentId: student.id,
                            pttId: pttId,
                            pttNumber: pttNumber,
                            subject: selectedSubject,
                            logId: logId,
                            gradeLogId: gradeLogId,
                            reason: fillGradesResult.message,
                            time: new Date().toISOString()
                        };

                        fs.appendFileSync(
                            'logs/failed_students_fifth_step.jsonl',
                            JSON.stringify(log) + "\n"
                        );

                        continue;
                    }

                    if (index === subjects.length - 1) {
                        try {
                            logId = await updateLogsService(logId, {
                                student_id: Number(student.student_id),
                                step: PROCESS_STEPS.FIFTH_STEP,
                                status: PROCESS_STATUS.FINISH,
                                unique_string: `student_${student.id}_ptt_${pttId}`
                            });
                        } catch (logError) {
                            console.error(`updateLogsService xatolik (student ${student.id}):`, logError.message);
                        }
                    }

                    try {
                        gradeLogId = await updateGradeLogsService(gradeLogId, {
                            grade: selectedSubject.grade,
                            status: PROCESS_STATUS.FINISH
                        });
                    } catch (logError) {
                        console.error(`updateGradeLogsService xatolik (student ${student.id}):`, logError.message);
                    }

                    const successLog = {
                        id: selectedSubject.pttFillId,
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        subject: selectedSubject,
                        logId: logId,
                        gradeLogId: gradeLogId,
                        time: new Date().toISOString()
                    };

                    fs.appendFileSync(
                        'logs/student_grades.jsonl',
                        JSON.stringify(successLog) + "\n"
                    );

                    studentGradesList.set(selectedSubject.pttFillId, {
                        id: selectedSubject.pttFillId,
                        studentId: student.id,
                        pttId: pttId,
                        pttNumber: pttNumber,
                        logId: logId,
                        gradeLogId: gradeLogId,
                        subject: selectedSubject,
                    });

                    console.log(`Baxo ko'chirib qo'yildi: ${fillGradesResult.message}`);
                } else {
                    console.log(
                        `5-bosqich tashlab o'tildi.
                        Talaba IDsi: ${student.id}
                        Qaydnoma IDsi: ${pttId}
                        Qaydnoma raqami: ${pttNumber}
                        Fan nomi: ${selectedSubject.name}
                        Semestr nomi: ${selectedSubject.semesterName}
                        Baxo sahifasi IDsi: ${selectedSubject.pttFillId}
                    `);
                }
            }
        }

        console.log("Jarayon tugadi");

    } catch (err) {
        console.error("Xatolik:", err);

        const log = `[${new Date().toLocaleString()}] ERROR: ${err.message}\n`;

        fs.appendFileSync(
            'logs/system_errors.log',
            log
        );

        if (err.message === "SESSION_EXPIRED") {

            console.log("Sessiya tugagan. Iltimos qayta login qiling.");

            fs.appendFileSync(
                'logs/system_errors.log',
                `[${new Date().toLocaleString()}] SESSION_EXPIRED -> login.js ni qayta ishga tushirish kerak\n`
            );

            process.exit();
        }
    }

    await browser.close();
})();
