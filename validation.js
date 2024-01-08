const { check } = require('express-validator');

exports.registerValidation = [
    check('username', 'Name must be 6 or more characters').isLength({ min: 6 }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

exports.loginValidation = [
    check('username', 'Please include a valid username').isLength({ min: 6 }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

exports.ICDValidation = [
    check('icd_tens_name_english', 'ICD Name (English) is required').not().isEmpty().isString(),
    check('icd_tens_name_bahasa', 'ICD Name (Bahasa) is required').not().isEmpty().isString(),
    check('icd_tens_code', 'ICD Code is required').not().isEmpty().isString(),
    check('icd_tens_type', 'ICD Type is required').not().isEmpty().isString(),
]

exports.patientValidation = [
    check('patient_name', 'Patient Name is required').not().isEmpty().isString(),
    check('patient_birthdate', 'Patient Birthdate is required').not().isEmpty().isDate(),
    check('patient_nik','Patient NIK is required').not().isEmpty().isString()
]