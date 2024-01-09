const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router');
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Pre-Assessment API Tests', () => {
    // Change to valid token
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc5MDU5MywiZXhwIjoxNzA0Nzk0MTkzfQ.fTQ-CX2kP_BPV_BmzEYKcQH_mdAMcFGBh714AzWfD1g';

    test('should create a pre-assessment with valid data and token', async () => {
        const preAssessmentData = {
            // Change to patient_id and icd_tens_id
            patient_id: '30aee0af-4a36-44bb-825f-b29edfbf288d',
            icd_tens_id: ['06ea3e49-bc7b-4d39-a4ef-38d59081042c", "1602df5b-65a4-4bb5-8b21-cd83f7dc0e16'],
            subject_pre_assessment: 'subject',
            object_pre_assessment: 'object',
            assessment_pre_assessment: 'assessment',
            plan_pre_assessment: 'plan',
            assessment_date: '2022-01-01'
        };

        const response = await request(app)
            .post('/pre_assessment')
            .set('Authorization', `Bearer ${validToken}`)
            .send(preAssessmentData);

        expect(response.statusCode).toBe(201);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data).toBeDefined();
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app)
            .post('/pre_assessment')
            .send({});

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .post('/pre_assessment')
            .set('Authorization', 'Bearer invalid_token')
            .send({});

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});
