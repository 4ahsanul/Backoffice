const express = require('express');
const router = express.Router();
const db = require('./dbConnection');
const {registerValidation, loginValidation} = require('./validation');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

// ===== AUTHENTICATION LOGIN =====
// REGISTER FIRST
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

    db.query(
        `SELECT * FROM users WHERE username = ${db.escape(req.body.username)};`,
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
                req.body.password,
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

module.exports = router;