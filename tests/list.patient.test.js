const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('jsonwebtoken');
require('uuid');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Patient List API Tests', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1NmQ1MWFkLTc2MjgtNDAyOS1hZWY3LTU0MTAzYTQ1YjlhZSIsImlhdCI6MTcwNDc4OTMwOSwiZXhwIjoxNzA0NzkyOTA5fQ.-zexmHZDceHfFsRLMmIyUhP0mWRdDKTeGo1DJ44l4JM';

    test('should get a list of patients with valid token', async () => {
        const response = await request(app)
            .get('/patient')
            .set('Authorization', `Bearer ${validToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data).toBeDefined();
    });

    test('should return 422 for missing token', async () => {
        const response = await request(app).get('/patient');

        expect(response.statusCode).toBe(422);
        expect(response.body.msg).toBe('Please provide the token');
    });

    test('should return 401 for invalid token', async () => {
        const response = await request(app)
            .get('/patient')
            .set('Authorization', 'Bearer invalid_token');

        expect(response.statusCode).toBe(401);
        expect(response.body.msg).toBe('Invalid token');
    });
});
