# WAI WebApp - Water Adaptive Intelligence

## Project Description

WAI stands for Water Adaptive Intelligence.

This project is a full-stack web application for a smart rainwater and energy monitoring system. The WAI system helps households in Suriname monitor rainwater storage, water usage, generated energy, battery level and maintenance requests.

The data in this version is simulated from a MariaDB/MySQL database. No real sensors are connected in this school version.

## Technologies Used

Frontend:
- HTML
- CSS
- JavaScript
- Chart.js

Backend:
- Node.js
- Express.js
- JSON Web Token (JWT)
- MySQL2
- bcryptjs
- dotenv
- cors
- express-validator

Database:
- MariaDB / MySQL
- SQL seed data
- HeidiSQL

## Requirements for Running the Project

Install:

- Node.js LTS
- MariaDB or MySQL
- HeidiSQL
- Visual Studio Code
- A browser such as Google Chrome or Microsoft Edge

## Project Structure

```text
config/
  db.js

middlewares/
  authMiddleware.js
  validationMiddleware.js

routes/
  authRoutes.js
  userRoutes.js
  adminRoutes.js

public/
  css/
    style.css
  js/
    app.js
    auth.js
    user.js
    admin.js
  img/
    WAI image files
  auth/
    login.html
    register.html
  user/
    dashboard.html
    history.html
    services.html
  admin/
    dashboard.html
    users.html
    requests.html
  index.html

scripts/
  db-setup.js

sql/
  wai_system_structure_seed.sql
  create_wai_database_user.sql

server.js
package.json
package-lock.json
.env.example
.gitignore
```

## Installation Instructions

### 1. Open the Project

Open the project folder in Visual Studio Code.

### 2. Install Packages

Open the VS Code terminal and run:

```bash
npm install
```

### 3. Set Up the Database

Open HeidiSQL and connect to your MariaDB/MySQL server.

Import this file:

```text
sql/wai_system_structure_seed.sql
```

This creates the database structure and seed data.

### 4. Create the Database User

Run this SQL file in HeidiSQL:

```text
sql/create_wai_database_user.sql
```

Or run manually:

```sql
CREATE USER IF NOT EXISTS 'wai_user'@'localhost' IDENTIFIED BY 'wai123';
GRANT ALL PRIVILEGES ON wai_system_db.* TO 'wai_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Create the Environment File

Copy:

```text
.env.example
```

Rename the copy to:

```text
.env
```

Use this content:

```env
DB_HOST=localhost
DB_USER=wai_user
DB_PASSWORD=wai123
DB_NAME=wai_system_db
DB_PORT=3306
PORT=3000
JWT_SECRET=change_this_secret_for_your_group
```

### 6. Start the Server

Run:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Usage Instructions

### Admin Login

```text
Email: admin@wai.local
Password: admin123
```

Admin can:

- View dashboard statistics
- View all users
- Search users by name
- Filter users by district and status
- Manage service requests
- Update request status
- View system data

### User Login

Use a seeded database user, for example:

```text
Email: caleb.mohan@example.com
Password: demo123
```

User can:

- View water level
- View battery and energy level
- View water and energy history graphs
- Submit service requests
- View request status
- View notifications

## Authentication

Authentication is implemented using JWT.

When a user logs in, the backend returns a token. The frontend stores this token in local storage and sends it with protected API requests.

Protected routes use:

```text
middlewares/authMiddleware.js
```

## Data Validation

Data validation is implemented in:

```text
middlewares/validationMiddleware.js
```

Validation is used for:

- Register
- Login
- Service requests
- Admin status updates
- Maintenance logs
- Notifications

Validation uses `express-validator` with schema checks on incoming request data.

## Database

SQL files are located in:

```text
sql/
```

The main SQL file contains:

- Database structure
- Tables
- Seed data
- Users
- Water history
- Energy history
- Service requests
- Notifications
- Maintenance logs

## Note

The WAI data in this project is simulated. Water levels, battery readings, energy history and notifications come from seed data in the MariaDB/MySQL database. No real IoT sensors are connected in this version.