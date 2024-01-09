const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Patient Update API Tests', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc4OTMwOSwiZXhwIjoxNzA0NzkyOTA5fQ.-zexmHZDceHfFsRLMmIyUhP0mWRdDKTeGo1DJ44l4JM';

    test('should update an existing patient with valid token and data', async () => {
        // Assuming you have an existing patient in your database
        const existingPatientId = '30aee0af-4a36-44bb-825f-b29edfbf288d';

        const response = await request(app)
            .put(`/patient/${existingPatientId}`)
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                patient_name: 'Updated Patient Name',
                patient_birthdate: '1990-01-01',
                patient_nik: '9876543210',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data.patient_id).toBe(existingPatientId);
        // Add more assertions based on your response structure and data
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app)
            .put('/patient/123')
            .send({
                patient_name: 'Updated Patient Name',
                patient_birthdate: '1990-01-01',
                patient_nik: '9876543210',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .put('/patient/123')
            .set('Authorization', 'Bearer invalid_token')
            .send({
                patient_name: 'Updated Patient Name',
                patient_birthdate: '1990-01-01',
                patient_nik: '9876543210',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});
