const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router');
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('ICD Tens API Tests', () => {
    // Change to valid token
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc4NTUyMSwiZXhwIjoxNzA0Nzg5MTIxfQ.t3g1v0-cRJD2nYYSs_IzgEhces2fJmogFNF96vGpR4s'; // Replace with a valid token for testing

    test('should register a new ICD Tens with valid token and data', async () => {
        const response = await request(app)
            .post('/icd')
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                icd_tens_name_english: 'Test ICD English',
                icd_tens_name_bahasa: 'Test ICD Bahasa',
                icd_tens_code: 'ICD001',
                icd_tens_type: 'Type A',
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data.icd_tens_id).toBeDefined();
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app)
            .post('/icd')
            .send({
                icd_tens_name_english: 'Test ICD English',
                icd_tens_name_bahasa: 'Test ICD Bahasa',
                icd_tens_code: 'ICD001',
                icd_tens_type: 'Type A',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .post('/icd')
            .set('Authorization', 'Bearer invalid_token')
            .send({
                icd_tens_name_english: 'Test ICD English',
                icd_tens_name_bahasa: 'Test ICD Bahasa',
                icd_tens_code: 'ICD001',
                icd_tens_type: 'Type A',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});
