const express = require('express');
const router = express.Router();
const db = require('./dbConnection');
const {registerValidation, loginValidation} = require('./validation');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

// AUTHENTICATION LOGIN
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
                                })
                            }
                        )
                    }
                })
            }
        }
    )
})

module.exports = router;