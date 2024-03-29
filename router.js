const express = require('express');
const router = express.Router();
const db = require('./dbConnection');
const {
    registerValidation,
    loginValidation,
    ICDValidation,
    patientValidation,
    assessmentValidation
} = require('./validation');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// ===== AUTHENTICATION LOGIN =====
// REGISTER FIRST OKAY TO USE FORM
router.post('/register', registerValidation, (req, res, next) => {
    // UUID
    const id = uuid.v4();

    db.query(
        `SELECT * FROM users WHERE LOWER(username) = LOWER(${db.escape(req.body.username)});`,
        (err, result) => {
            if (result.length) {
                return res.status(409).send({
                    msg: 'This user is already in registered'
                });
            } else {
                // User is available
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else {
                        // Has hashed pw => Add to db
                        db.query(
                            `INSERT INTO users (id, username, password) VALUES ('${id}', ${db.escape(
                                req.body.username
                            )}, ${db.escape(hash)})`,
                            (err) => {
                                if (err) {
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }

                                return res.status(201).send({
                                    msg: 'Thank you... the user has been registered'
                                });
                            }
                        );
                    }
                });
            }
        }
    );
});

// LOGIN
router.post('/login', loginValidation, (req, res,) => {
    const id = uuid.v4();
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    db.query(
        `SELECT * FROM users WHERE username = ${db.escape(jsonData.username)};`,
        (err, result) => {
            // User doesn't exist
            if (err || result.length === 0) {
                return res.status(400).json({
                    header: {
                        status: "FAILED",
                        message: "Bad Request",
                        status_code: 400,
                        error_code: err ? err.code || null : null,
                        trace_id: id
                    },
                    data: null
                });
            }

            // Check Password
            bcrypt.compare(
                jsonData.password,
                result[0]['password'],
                (bErr, bResult) => {
                    if (bErr) {
                        return res.status(401).send({
                            // msg: 'Email or password is incorrect!'
                            header: {
                                status: 'FAILED',
                                message: 'Unauthorized',
                                status_code: 401,
                                error_code: bErr.code || null,
                            },
                            data: null
                        });
                    }
                    if (bResult) {
                        const token = jwt.sign({id: result[0].id}, 'the-super-strong-secret', {expiresIn: '1h'});
                        // Update log last_login
                        db.query(
                            `UPDATE users SET last_login = NOW() WHERE id = '${result[0].id}'`
                        );

                        // Insert user log to trace
                        db.query(
                            `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${result[0].id}', '${token}', now(), 'login')`
                        );

                        // Update users token for login
                        db.query(
                            `UPDATE users SET token = '${token}' WHERE id = '${result[0].id}'`
                        );
                        return res.status(200).send({
                            header: {
                                status: 'OK',
                                msg: 'Logged in!',
                                status_code: 200,
                                error_code: null,
                                trace_id: id,
                            },
                            data: {
                                username: result[0].name,
                                last_login: result[0].last_login,
                                token: token,
                                user_detail: {
                                    user_id: result[0].id,
                                    username: result[0].username,
                                },
                            },
                        });
                    }
                    return res.status(401).json({
                        header: {
                            status: 'FAILED',
                            message: 'Unauthorized',
                            status_code: 401,
                            error_code: null,
                            trace_id: id,
                        },
                        data: null,
                    });
                }
            );
        }
    );
});

// ===== END OF AUTHENTICATION PART =====

// ===== MASTER DATA =====
// INSERT ICD TENS
router.post('/icd', ICDValidation, (req, res, next) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    // If the token is valid, you can proceed with the ICD data validation and insertion
    const id = uuid.v4();
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    // ICD data validation
    const {icd_tens_name_english, icd_tens_name_bahasa, icd_tens_code, icd_tens_type} = req.body;

    // Insert the ICD data into the database
    db.query(
        `INSERT INTO icd_tens (id, icd_tens_name_english, icd_tens_name_bahasa, icd_tens_code, icd_tens_type) VALUES ('${id}', ${db.escape(icd_tens_name_english)}, ${db.escape(icd_tens_name_bahasa)}, ${db.escape(icd_tens_code)}, ${db.escape(icd_tens_type)})`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    header: {
                        status: 'FAILED',
                        message: 'Error registering ICD Tens',
                        status_code: 500,
                        error_code: err.code || null,
                    },
                    data: null,
                });
            }

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'insert_icd')`
            );

            const insertedICD = {
                icd_tens_id: id,
                icd_tens_name_english,
                icd_tens_name_bahasa,
                icd_tens_code,
                icd_tens_type,
            };

            return res.status(201).json({
                header: {
                    status: 'OK',
                    message: 'The ICD Tens has been registered successfully!',
                    status_code: 201,
                    error_code: null,
                    trace_id: id,
                },
                data: insertedICD,
            });
        }
    );
});

// UPDATE ICD TENS
router.put('/icd/:icdId', ICDValidation, (req, res, next) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const id = uuid.v4();
    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    // If the token is valid, you can proceed with the ICD data validation and update
    const icdId = req.params.icdId; // Extract ICD ID from the URL parameter
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    // ICD data validation
    const {icd_tens_name_english, icd_tens_name_bahasa, icd_tens_code, icd_tens_type} = req.body;

    // Update the ICD data in the database
    db.query(
        `UPDATE icd_tens 
         SET 
            icd_tens_name_english = ${db.escape(icd_tens_name_english)},
            icd_tens_name_bahasa = ${db.escape(icd_tens_name_bahasa)},
            icd_tens_code = ${db.escape(icd_tens_code)},
            icd_tens_type = ${db.escape(icd_tens_type)}
         WHERE id = '${icdId}'`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    header: {
                        status: 'FAILED',
                        message: 'Error updating ICD Tens',
                        status_code: 500,
                        error_code: err.code || null,
                    },
                    data: null,
                });
            }

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'update_icd')`
            );

            const updatedICD = {
                icd_tens_id: icdId,
                icd_tens_name_english,
                icd_tens_name_bahasa,
                icd_tens_code,
                icd_tens_type,
            };

            return res.status(200).json({
                header: {
                    status: 'OK',
                    message: 'The ICD Tens has been updated successfully!',
                    status_code: 200,
                    error_code: null,
                    trace_id: id,
                },
                data: updatedICD,
            });
        }
    )
});

// LIST ICD TENS
router.get('/icd', (req, res,) => {
    const {page = 1} = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    const id = uuid.v4();

    new Promise((resolve, reject) => {
        db.query('SELECT * FROM icd_tens LIMIT ? OFFSET ?', [limit, offset], (error, results) => {
            if (error) {
                reject({error: true, message: 'Error fetching data'});
            } else {
                resolve(results);
            }
        });
    })
        .then((results) => {
            // Count total rows in the table for pagination
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS total_rows FROM icd_tens', (countError, countResults) => {
                    if (countError) {
                        reject({error: true, message: 'Error fetching count'});
                    } else {
                        resolve({results, countResults});
                    }
                });
            });
        })
        .then(({results, countResults}) => {
            const totalRows = countResults[0].total_rows;
            const lastPage = Math.ceil(totalRows / limit);
            const actualPageSize = results.length;

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'get_list_icd')`
            );

            return res.status(200).json({
                header: {
                    status: 'OK',
                    message: 'Fetch Successfully.',
                    status_code: 200,
                    error_code: null,
                    trace_id: id,
                },
                data: {
                    total: totalRows,
                    per_page: actualPageSize,
                    page: page,
                    last_page: lastPage,
                    data: results
                }
            });
        })
        .catch((error) => {
            res.status(500).json(error);
        });
});
// ===== END OF DATA ICD PART =====

// INSERT PATIENT
router.post('/patient', patientValidation, (req, res) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    // If the token is valid, you can proceed with the ICD data validation and insertion
    const id = uuid.v4();
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    // Generate a default value for patient_medical_record_number
    const patientMedicalRecordNumber = generateMedicalRecordNumber();

    // Patient data validation
    const {patient_name, patient_birthdate, patient_nik} = req.body;

    // Insert the ICD data into the database
    db.query(
        `INSERT INTO patient (id, patient_medical_record_number, patient_name, patient_birthdate, patient_nik) VALUES ('${id}', '${patientMedicalRecordNumber}', ${db.escape(patient_name)}, ${db.escape(patient_birthdate)}, ${db.escape(patient_nik)})`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    header: {
                        status: 'FAILED',
                        message: 'Error registering Patient',
                        status_code: 500,
                        error_code: err.code || null,
                    },
                    data: null,
                });
            }

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'insert_patient')`
            );

            const insertedPatient = {
                icd_tens_id: id,
                patient_medical_record_number: patientMedicalRecordNumber,
                patient_name,
                patient_birthdate,
                patient_nik
            };

            return res.status(201).json({
                header: {
                    status: 'OK',
                    message: 'Patient has been registered successfully!',
                    status_code: 201,
                    error_code: null,
                    trace_id: id,
                },
                data: insertedPatient,
            });
        }
    );
});

// UPDATE PATIENT
router.put('/patient/:patientId', patientValidation, (req, res) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const id = uuid.v4();
    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    // If the token is valid, you can proceed with the ICD data validation and update
    const patientId = req.params.patientId; // Extract ICD ID from the URL parameter
    const jsonData = req.body;

    // Patient data validation
    const {patient_name, patient_birthdate, patient_nik} = req.body;

    // Update the patient record in the database
    db.query(
        `UPDATE patient SET patient_name = ${db.escape(patient_name)}, patient_birthdate = ${db.escape(patient_birthdate)}, patient_nik = ${db.escape(patient_nik)} WHERE id = '${patientId}'`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    header: {
                        status: 'FAILED',
                        message: 'Error updating Patient',
                        status_code: 500,
                        error_code: err.code || null,
                    },
                    data: null,
                });
            }

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'update_patient')`
            );

            const updatedPatient = {
                patient_id: patientId,
                patient_name,
                patient_birthdate,
                patient_nik
            };

            return res.status(200).json({
                header: {
                    status: 'OK',
                    message: 'Patient has been updated successfully!',
                    status_code: 200,
                    error_code: null,
                    trace_id: id
                },
                data: updatedPatient,
            });
        }
    )
});

// LIST PATIENT
router.get('/patient', (req, res) => {
    const {page = 1} = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    const id = uuid.v4();

    new Promise((resolve, reject) => {
        db.query('SELECT * FROM patient LIMIT ? OFFSET ?', [limit, offset], (error, results) => {
            if (error) {
                reject({error: true, message: 'Error fetching data'});
            } else {
                resolve(results);
            }
        });
    })
        .then((results) => {
            // Count total rows in the table for pagination
            return new Promise((resolve, reject) => {
                db.query('SELECT COUNT(*) AS total_rows FROM patient', (countError, countResults) => {
                    if (countError) {
                        reject({error: true, message: 'Error fetching count'});
                    } else {
                        resolve({results, countResults});
                    }
                });
            });
        })
        .then(({results, countResults}) => {
            const totalRows = countResults[0].total_rows;
            const lastPage = Math.ceil(totalRows / limit);
            const actualPageSize = results.length;

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'get_list_patient')`
            );

            return res.status(200).json({
                header: {
                    status: 'OK',
                    message: 'Fetch Successfully.',
                    status_code: 200,
                    error_code: null,
                    trace_id: id,
                },
                data: {
                    total: totalRows,
                    per_page: actualPageSize,
                    page: page,
                    last_page: lastPage,
                    data: results
                }
            });
        })
        .catch((error) => {
            res.status(500).json(error);
        });
});
// ===== END OF DATA PATIENT PART AND MASTER DATA =====

// ===== TRANSACTION =====
// INSERT PRE-ASSESSMENT
router.post('/pre_assessment', assessmentValidation, (req, res) => {
    // Check for the presence of a valid token in the headers
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    // If the token is valid, you can proceed with the pre-assessment data validation and insertion
    const id = uuid.v4();
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    // Pre-assessment data validation
    const {patient_id} = req.body;

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }

    // Insert the pre-assessment data into the database
    const pre_assessment_id = uuid.v4();
    db.query(
        `INSERT INTO pre_assessment (id, patient_id, subject_pre_assessment, object_pre_assessment, assessment_pre_assessment, plan_pre_assessment, assessment_date) VALUES ('${pre_assessment_id}', '${jsonData.patient_id}', '${jsonData.subject_pre_assessment}', '${jsonData.object_pre_assessment}', '${jsonData.assessment_pre_assessment}', '${jsonData.plan_pre_assessment}', '${jsonData.assessment_date}')`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    header: {
                        status: 'FAILED',
                        message: 'Error registering Pre-Assessment',
                        status_code: 500,
                        error_code: err.code || null,
                    },
                    data: null,
                });
            }

            // Process each JSON object in the array
            for (const jsonObject of jsonData.icd_tens_id) {
                // Perform actions on each jsonObject
                //console.log('Processing JSON:', jsonObject);
                // Add your logic here
                const icd_tens_detail_id = uuid.v4();
                db.query(
                    `INSERT INTO icd_tens_detail (id, pre_assessment_id, icd_tens_id) VALUES ('${icd_tens_detail_id}', '${pre_assessment_id}', '${jsonObject}')`
                );
            }

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'insert_pre_assessment')`
            );


            const insertedPreAssessment = {
                pre_assessment_id: pre_assessment_id,
                patient_id,
            };

            return res.status(201).json({
                header: {
                    status: 'OK',
                    message: 'Pre-Assessment has been registered successfully!',
                    status_code: 201,
                    error_code: null,
                    trace_id: id,
                },
                data: insertedPreAssessment,
            });
        }
    );
});

// UPDATE PRE-ASSESSMENT
router.put('/update_pre_assessment/:pre_assessment_id', assessmentValidation, (req, res) => {
    // Check for the presence of a valid token in the headers
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    // If the token is valid, you can proceed with the pre-assessment data validation and update
    const preAssessmentId = req.params.pre_assessment_id;
    const jsonData = req.body;
    console.log('Received JSON:', jsonData);

    // Pre-assessment data validation
    const {patient_id} = req.body;

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }

    db.query(
        `UPDATE pre_assessment SET patient_id = '${jsonData.patient_id}', subject_pre_assessment = '${jsonData.subject_pre_assessment}', object_pre_assessment = '${jsonData.object_pre_assessment}', assessment_pre_assessment = '${jsonData.assessment_pre_assessment}', plan_pre_assessment = '${jsonData.plan_pre_assessment}', assessment_date = '${jsonData.assessment_date}' WHERE id = '${preAssessmentId}';`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    header: {
                        status: 'FAILED',
                        message: 'Error updating Pre-Assessment',
                        status_code: 500,
                        error_code: err.code || null,
                    },
                    data: null,
                });
            }

            // Process each JSON object in the array and insert new icd_tens_detail records
            for (const jsonObject of jsonData.icd_tens_id) {
                const icd_tens_detail_id = uuid.v4();
                db.query(
                    `INSERT INTO icd_tens_detail (id, pre_assessment_id, icd_tens_id) VALUES ('${icd_tens_detail_id}', '${preAssessmentId}', '${jsonObject}')`
                );
            }

            // Insert user log to trace
            const id = uuid.v4();
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'update_pre_assessment')`
            );

            const updatedPreAssessment = {
                pre_assessment_id: preAssessmentId,
                patient_id,
            };

            return res.status(200).json({
                header: {
                    status: 'OK',
                    message: 'Pre-Assessment has been updated successfully!',
                    status_code: 200,
                    error_code: null,
                    trace_id: id,
                },
                data: updatedPreAssessment,
            });
        }
    );
});

router.get('/pre_assessment', (req, res,) => {
    const {page = 1} = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
        return res.status(422).json({
            msg: "Please provide the token"
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(theToken, 'the-super-strong-secret');
    } catch (err) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }

    const id = uuid.v4();

    new Promise((resolve, reject) => {
        db.query('SELECT * FROM pre_assessment LIMIT ? OFFSET ?', [limit, offset], (error, results) => {
            if (error) {
                reject({error: true, message: 'Error fetching data'});
            } else {
                resolve(results);
            }
        });
    })
        .then((results) => {
            // Count total rows in the table for pagination
            return new Promise((resolve, reject) => {
                db.query(`SELECT * 
                          FROM icd_tens_detail
                          JOIN pre_assessment ON pre_assessment.id = icd_tens_detail.pre_assessment_id
                          JOIN patient ON patient.id = pre_assessment.patient_id
                          JOIN icd_tens ON icd_tens.id = icd_tens_detail.icd_tens_id
                          LIMIT ? OFFSET ?`, [limit, offset], (error, results) => {
                    if (error) {
                        reject({error: true, message: 'Error fetching data'});
                    } else {
                        // Assuming you still want to get the total count of rows from the pre_assessment table
                        db.query('SELECT COUNT(*) AS total_rows FROM pre_assessment', (countError, countResults) => {
                            if (countError) {
                                reject({error: true, message: 'Error fetching count'});
                            } else {
                                resolve({results, countResults});
                            }
                        });
                    }
                });

            });
        })
        .then(({results, countResults}) => {
            const totalRows = countResults[0].total_rows;
            const lastPage = Math.ceil(totalRows / limit);
            const actualPageSize = results.length;

            // Insert user log to trace
            db.query(
                `INSERT INTO trace (id, user_id, token, log_time, action) VALUES ('${id}', '${decoded.id}', '${theToken}', NOW(), 'get_list_assessment')`
            );

            return res.status(200).json({
                header: {
                    status: 'OK',
                    message: 'Fetch Successfully.',
                    status_code: 200,
                    error_code: null,
                    trace_id: id,
                },
                data: {
                    total: totalRows,
                    per_page: actualPageSize,
                    page: page,
                    last_page: lastPage,
                    data: results.map(result => ({
                        pre_assessment_id: result.id,
                        subject_pre_assessment: result.subject_pre_assessment,
                        object_pre_assessment: result.object_pre_assessment,
                        assessment_pre_assessment: result.assessment_pre_assessment,
                        plan_pre_assessment: result.plan_pre_assessment,
                        patient_details: {
                            patient_id: result.patient_id,
                            patient_medical_record_number: result.patient_medical_record_number,
                            patient_name: result.patient_name,
                            patient_birthdate: result.patient_birthdate,
                            patient_nik: result.patient_nik,
                        },
                        icd_tens_details: [
                            {
                                icd_tens_id: result.icd_tens_id,
                                icd_tens_name_english: result.icd_tens_name_english,
                                icd_tens_name_bahasa: result.icd_tens_name_bahasa,
                                icd_tens_code: result.icd_tens_code,
                                icd_tens_type: result.icd_tens_type,
                            }
                            // Add more properties if needed
                        ]
                    }))
                }
            });
        })
        .catch((error) => {
            res.status(500).json(error);
        });
});

// ===== END OF TRANSACTION PART =====

// Function to generate medical record number
function generateMedicalRecordNumber() {
    const nextMedicalRecordNumber = getNextMedicalRecordNumber();
    return nextMedicalRecordNumber.toString().padStart(6, '0');
}

let medicalRecordCounter = 1; // Initial value

function getNextMedicalRecordNumber() {
    return medicalRecordCounter++;
}

module.exports = router;