const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Pre-Assessment API Tests', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc5MjcwNiwiZXhwIjoxNzA0Nzk2MzA2fQ.fWCFQ1eDO2-ELdzdCK7aILjV1EGMUGoz54GbuIQM1pM'; // Replace with a valid token for testing

    test('should get a list of pre-assessments with valid token', async () => {
        const response = await request(app)
            .get('/pre_assessment')
            .set('Authorization', `Bearer ${validToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data).toBeDefined();
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app).get('/pre_assessment');

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .get('/pre_assessment')
            .set('Authorization', 'Bearer invalid_token');

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});