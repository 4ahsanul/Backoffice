const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Register API Tests', () => {
    test('should register a new user', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser1',
                password: 'testpassword1'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Thank you... the user has been registered');
    });
});
