const PROCESS_STEPS = Object.freeze({
    PREPARING_TO_START: 0,
    FIRST_STEP: 1,
    SECOND_STEP: 2,
    THIRD_STEP: 3,
    FOURTH_STEP: 4,
    FIFTH_STEP: 5,
});

const PROCESS_STATUS = Object.freeze({
    ERROR: 0,
    START: 1,
    FINISH: 2
});

module.exports = {
    PROCESS_STEPS,
    PROCESS_STATUS
};