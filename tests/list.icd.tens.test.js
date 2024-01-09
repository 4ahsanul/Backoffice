const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router');
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('ICD Tens List API Tests', () => {
    // Change to valid token
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc4Njg0NCwiZXhwIjoxNzA0NzkwNDQ0fQ.F0tUkXAF46sAS-7pNyOuYdsJ2v93ZmtkgJI2xRxrkpo';

    test('should get a list of ICD Tens with valid token', async () => {
        const response = await request(app)
            .get('/icd')
            .set('Authorization', `Bearer ${validToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data).toBeDefined();
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app).get('/icd');

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .get('/icd')
            .set('Authorization', 'Bearer invalid_token');

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});