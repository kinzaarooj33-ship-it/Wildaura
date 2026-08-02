====================================================
                WILD AURA
        Where Adventure Meets Knowledge
====================================================

PROJECT STRUCTURE
------------------
The project consists of two separate modules:
1. Frontend (User + Admin Interface)
2. Backend (API Server)

Database Name   : wildaura
SQL File Name   : wildaura.sql


DATABASE SETUP
---------------
1. Open phpMyAdmin (localhost/phpmyadmin)
2. Create a new database named: wildaura
3. Go to the "Import" tab and import the file: wildaura.sql


BACKEND SETUP
--------------
1. Extract "Wild-aura Backend.zip"
2. Open the extracted folder in a code editor (e.g. VS Code)
3. Open a terminal in this folder and run:
      npm install
4. Ensure the .env file is present in the root directory with correct
   database credentials configured
5. Start the backend server:
      node index.js
6. On successful connection, the terminal will display:
      DB Connected!
   The backend server runs on port 3000.

   Note: If the terminal shows "DB Connection failed: ECONNREFUSED",
   ensure MySQL (via XAMPP/WAMP) is running before starting the backend.


FRONTEND SETUP
---------------
1. Extract "wild aura frontend.zip"
2. Open the extracted folder in a code editor
3. Open a terminal in this folder and run:
      npm install
4. Start the development server:
      npm run dev
5. The frontend will run at:
      http://localhost:5173/


RUNNING THE PROJECT
---------------------
Ensure all of the following are running simultaneously:
- Backend server        -> port 3000
- Frontend (User Panel)  -> port 5173
- Admin Panel            -> port 5174

User Panel   : http://localhost:5173/
Admin Panel  : http://localhost:5174/admin-login


ACCESS CREDENTIALS
--------------------
User Login:
This system does not use pre-shared demo credentials. To access the
user panel, please register a new account first:

   1. Go to http://localhost:5173/
   2. Click "Sign Up" and create a new account
   3. Log in using the same credentials you registered with

Admin Login:
The admin panel is accessed using a secret Admin Code instead of an
email/password combination. This code can be found in the "admins"
table of the "wildaura" database via phpMyAdmin.


TECHNOLOGIES USED
--------------------
Frontend : React (Vite)
Backend  : Node.js, Express
Database : MySQL

====================================================