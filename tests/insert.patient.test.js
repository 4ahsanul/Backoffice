const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router');
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Patient Registration API Tests', () => {
    // Change to valid token
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc4ODM3MSwiZXhwIjoxNzA0NzkxOTcxfQ.OVlm3FrafP_XAIaSiuFyoCYt4gYS8_YQ_sxOBKq_YtA';

    /* Still error because of the generateMedicalRecordNumber() function, so if
     * want to test this part should uncheck the NN and UQ on Patient Table Database
     */
    test('should register a new patient with valid token and data', async () => {
        const response = await request(app)
            .post('/patient')
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                patient_name: 'John Doe',
                patient_birthdate: '1990-01-01',
                patient_nik: '1234567890',
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data.icd_tens_id).toBeDefined();
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app)
            .post('/patient')
            .send({
                patient_name: 'Test Patient',
                patient_birthdate: '1990-01-01',
                patient_nik: '1233413423',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .post('/patient')
            .set('Authorization', 'Bearer invalid_token')
            .send({
                patient_name: 'Test Patient',
                patient_birthdate: '1990-01-01',
                patient_nik: '1233413423',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});
