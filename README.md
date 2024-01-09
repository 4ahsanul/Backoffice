# Backend Coding Test - Ananda ![JavaScript Icon](https://img.icons8.com/color/24/000000/javascript.png)

## About This Repository

This repository is created to fulfill the Coding Test requirements for the position of Staff IT - Backend Engineer at
RSU Ananda Purwokerto.

**Notes:**
Given my limited experience with JavaScript, it's possible that the current code structure may not fully align with
established conventions for readability. Despite this, I aim to maintain a level of clarity in the code. I continue to
familiarize myself with best practices, with a commitment to improving code readability in future iterations.

## Position

**Position:** Staff IT - Backend Engineer

## Coding Test Overview

The coding test is to make an API Contract based on the PDF File.

## Procedures

<details>
<summary><strong>Programming Language Requirements</strong></summary>

- **NodeJs (v18) / Typescript (v5.2):**
  Ensure that the codebase is written using NodeJS version 18 or Typescript version 5.2.

</details>

<details>
<summary><strong>Automation Testing</strong></summary>

- **Automation Testing:**
  Include automated testing procedures to ensure the reliability and correctness of the code.

</details>

<details>
<summary><strong>Error Logging</strong></summary>

- **Error Logging:**
  Implement error logging mechanisms to capture and log errors for effective debugging and monitoring.

</details>

<details>
<summary><strong>User Activity Tracking</strong></summary>

- **User Activity:**
  Track and log user activity to monitor and analyze user interactions with the application.

</details>

## Technologies Used

| Technology                                                                         | Description                                                        |
|------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| NodeJS ![Node.js Icon](https://img.icons8.com/?size=24&id=hsPbhkOH4FMe&format=png) | JavaScript runtime                                                 |
| Express ![Express.js](https://img.icons8.com/?size=24&id=kg46nzoJrmTR&format=png)  | Web application framework                                          |
| Express-validator ![NPM](https://img.icons8.com/?size=24&id=24895&format=png)      | Middleware for input validation                                    |
| MySQL ![MySQL](https://img.icons8.com/?size=24&id=UFXRpPFebwa2&format=png)         | Relational database management system                              |
| body-parser ![NPM](https://img.icons8.com/?size=24&id=24895&format=png)            | Parse incoming request bodies                                      |
| jsonwebtoken ![JWT](https://img.icons8.com/?size=24&id=rHpveptSuwDz&format=png)    | Authentication and token generation                                |
| bcryptjs ![NPM](https://img.icons8.com/?size=24&id=24895&format=png)               | Hashing library for password security                              |
| nodemon ![Nodemon](https://img.icons8.com/?size=24&id=8e6sgfGHgI9t&format=png)     | Monitor for changes in files and automatically restarts the server |
| uuid ![NPM](https://img.icons8.com/?size=24&id=24895&format=png)                   | Library for generating unique identifiers                          |
| cors ![NPM](https://img.icons8.com/?size=24&id=24895&format=png)                   | Middleware for handling Cross-Origin Resource Sharing (CORS)       |
| jest ![Jest]( https://img.icons8.com/?size=24&id=bp24DwGXJDyT&format=png)          | JavaScript testing framework with a focus on simplicity            |                                                                          

## Getting Started

To get started with the project file, follow these steps:

1. Clone the repository to your local machine.
   ```bash
   git clone https://github.com/4ahsanul/Backoffce.git
2. Navigate to the project directory
   ```bash
   cd Backoffice
3. Initialize the project
   ```bash
   npm init -y
4. Settings the database
   ```javascript
   var mysql = require('mysql');
   var conn = mysql.createConnection({
   host: 'localhost', // Replace with your host name
   user: 'root',      // Replace with your database username
   password: '',      // Replace with your database password
   database: ''       // Replace with your database Name
   });
   
   conn.connect(function(err) {
   if (err) throw err;
   console.log('Database is connected successfully !');
   });
   module.exports = conn;
   ```
4. Download the database that I use is in the repository.
5. Run nodemon.
   ```bash
   nodemon server.js
   
## Postman Test
After everything has been prepared, run the project in Postman or test the code on existing unit test.

#### API Contract
- Register : http://localhost:3000/v1/register/
- Login : http://localhost:3000/v1/login/
- Insert ICD : http://localhost:3000/v1/icd/
- Update ICD : http://localhost:3000/v1/icd/:icd_id
- Get List ICD : http://localhost:3000/v1/icd?page=1
- Insert Patient : http://localhost:3000/v1/patient/
- Update Patient : http://localhost:3000/v1/patient/:patient_id
- List Patient : http://localhost:3000/v1/patient?page=1
- Insert Pre-Assessment : http://localhost:3000/v1/pre_assessment/
- Update Pre-Assessment : http://localhost:3000/v1/update_pre_assessment/:pre_assessment_id
- List Pre-Assessment : http://localhost:3000/v1/pre_assessment?page=1
