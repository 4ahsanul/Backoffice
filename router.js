const express = require('express');
const router = express.Router();
const db = require('./dbConnection');
const {registerValidation, loginValidation, insertICDValidation, ICDValidation} = require('./validation');
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
            if (err) {
                return res.status(400).send({
                    header: {
                        status: 'FAILED',
                        message: 'Bad Request',
                        status_code: 400,
                        error_code: null,
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
                                error_code: null,
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
                                trace_id: result[0].trace_id
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
                    return res.status(401).send({
                        msg: 'Username or password is incorrect!'
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

    // ICD data validation (you can replace this with your specific validation)
    const {icd_tens_name_english, icd_tens_name_bahasa, icd_tens_code, icd_tens_type} = req.body;

    // Insert the ICD data into the database
    db.query(
        `INSERT INTO icd_tens (id, icd_tens_name_english, icd_tens_name_bahasa, icd_tens_code, icd_tens_type) VALUES ('${id}', ${db.escape(icd_tens_name_english)}, ${db.escape(icd_tens_name_bahasa)}, ${db.escape(icd_tens_code)}, ${db.escape(icd_tens_type)})`,
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    msg: err
                });
            }

            return res.status(201).json({
                msg: 'The ICD Tens has been registered successfully!',
                data: result[0]
            });
        }
    );
});


module.exports = router;