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
        // Assuming you have a test user in your database
        const testUser = {
            username: 'testuser',
            password: 'testpassword', // Assuming you've hashed this password before storing it in the database
        };

        // Insert the test user into the database before testing (if needed)

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
        // Add more assertions based on your response structure
    });

    test('should return 401 for incorrect password', async () => {
        // Assuming you have a test user in your database
        const testUser = {
            username: 'testuser',
            password: 'testpassword', // Assuming you've hashed this password before storing it in the database
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
        // Add more assertions based on your response structure
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
        // Add more assertions based on your response structure
    });
});
