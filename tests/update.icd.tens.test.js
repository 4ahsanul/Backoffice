const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('ICD Tens Update API Tests', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc4Njg0NCwiZXhwIjoxNzA0NzkwNDQ0fQ.F0tUkXAF46sAS-7pNyOuYdsJ2v93ZmtkgJI2xRxrkpo';

    test('should update an existing ICD Tens with valid token and data', async () => {
        const existingICDId = '8d7e4ace-d02f-4da6-8c35-af62cfeeb07d'; // Replace with a real ICD Tens ID

        const response = await request(app)
            .put(`/icd/${existingICDId}`)
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                icd_tens_name_english: 'Updated ICD English',
                icd_tens_name_bahasa: 'Updated ICD Bahasa',
                icd_tens_code: 'ICD002',
                icd_tens_type: 'Type B',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data.icd_tens_id).toBe(existingICDId);
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app)
            .put('/icd/123')
            .send({
                icd_tens_name_english: 'Updated ICD English',
                icd_tens_name_bahasa: 'Updated ICD Bahasa',
                icd_tens_code: 'ICD002',
                icd_tens_type: 'Type B',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .put('/icd/123')
            .set('Authorization', 'Bearer invalid_token')
            .send({
                icd_tens_name_english: 'Updated ICD English',
                icd_tens_name_bahasa: 'Updated ICD Bahasa',
                icd_tens_code: 'ICD002',
                icd_tens_type: 'Type B',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});