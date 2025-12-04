# eLTER Data Harvester

The eLTER Data Harvester is a tool for harvesting data from several external repositories used previously by LTER. It collects data and synchronizes it with eLTER DAR.

## Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 12.0

## Installation

### 1. Clone the Repository

```bash
git clone git@gitlab.ics.muni.cz:514266/data-harvester.git
cd data-harvester
```

### 2. Install Backend Dependencies
```bash
cd shared
npm install
```


```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Environment Setup

### Backend Environment Variables

Copy the `.env.example` file into `.env` file in the `backend/` directory, and set up variables. You can set up your FIELDSITES_TOKEN at https://auth.fieldsites.se/login/. DEV_AUTH_TOKEN and PROD_AUTH_TOKEN need to use tokens for given DAR instances with write access to /external-datasets.

### Frontend Environment Variables

Copy the `.env.example` file into `.env` file in the `frontend/` directory, and set up variables. The `VITE_API_URL` must use the same port as `backend/.env`.

## Docker Setup
You can skip following steps if you wish to use Docker setup. After setting `.env` file run following commands. The container tests the setup in development mode against https://dar.dev.elter-ri.eu/, so you will need a token for the API in your `.env` file.

```bash
$ docker-compose up -d --build
$ docker-compose up
```

## Database Setup

### 1. Create PostgreSQL Database

Connect to PostgreSQL, and create a database. You can do it for example the following way:
```bash
$ sudo su postgres
$ psql
$ CREATE DATABASE data_harvester_dev; # or use what you put into DEV_DB_NAME in ./backend/.env
$ CREATE DATABASE data_harvester; # or use what you put into DB_NAME in ./backend/.env
```

### 2. Run Database Migrations

Migrations are located in `backend/migrations/`.

```bash
cd backend
# run all migrations
npm run migrate up
```

## Running the Application

### Development Mode

#### Start Backend Server
You can either setup environment in `.env` or run use `NODE_ENV` prefix.
```bash
cd backend
npm start
# or NODE_ENV=dev npm start / NODE_ENV=prod npm start
# https://dav.elter-ri.eu/ or https://dar.dev.elter-ri.eu/
```

The backend server will start the port specified in `PORT` environment variable.

#### Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev   # uses https://dar.dev.elter-ri.eu/ and dev database
npm start     # uses https://dar.elter-ri.eu/ and prod database
```
## API Documentation

When the backend server is running, API documentation is available at:

- Swagger UI: `http://localhost:3000/api-docs`

The API provides endpoints for:
- Records management
- Rules management
- Harvesting jobs
- OAR management
- DEIMS sites synchronization
