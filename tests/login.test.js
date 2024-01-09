const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Login API Tests', () => {
    test('should return 409 for existing user', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'existinguser',
                password: 'testpassword'
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.msg).toBe('This user is already in registered');
    });
});
