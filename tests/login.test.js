const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
require('bcryptjs');
require('jsonwebtoken');
const router = require('../router'); // Update this with the correct path to your router file
const app = express();

app.use(bodyParser.json());
app.use('/', router);

describe('Authentication API Tests', () => {
    test('should log in successfully with correct credentials', async () => {
        const testUser = {
            username: 'testuser',
            password: 'testpassword',
        };

        // Log in with correct credentials
        const response = await request(app)
            .post('/login')
            .send({
                username: testUser.username,
                password: 'testpassword', // Use the actual password for the test user
            });

        // Assuming the login is successful and returns a 200 status code
        expect(response.statusCode).toBe(200);
        expect(response.body.header.status).toBe('OK');
        expect(response.body.data.token).toBeDefined();
    });

    test('should return 401 for incorrect password', async () => {
        // Assuming you have a test user in your database
        const testUser = {
            username: 'testuser',
            password: 'testpassword',
        };

        // Log in with incorrect password
        const response = await request(app)
            .post('/login')
            .send({
                username: testUser.username,
                password: 'incorrectpassword',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.header.status).toBe('FAILED');
    });

    test('should return 400 for non-existing user', async () => {
        // Log in with a non-existing user
        const response = await request(app)
            .post('/login')
            .send({
                username: 'nonexistinguser',
                password: 'testpassword',
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.header.status).toBe('FAILED');
    });
});
