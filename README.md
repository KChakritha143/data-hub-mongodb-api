# Data Strom (Data Hub MongoDB API)

A RESTful API built with **Node.js**, **Express.js**, **MongoDB Atlas**, and **Mongoose ODM**. This project demonstrates cloud-based NoSQL database integration, persistent data storage, and full CRUD operations for managing posts.

## Features

* Create, Read, Update, and Delete (CRUD) posts
* MongoDB Atlas cloud database integration
* Mongoose ODM schema modeling
* RESTful API architecture
* JSON request/response handling
* Automated API integration testing
* Error handling and validation

## Tech Stack

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JavaScript (ES Modules)

## Project Structure

```text
.
├── server.js
├── post.js
├── test-api.js
├── package.json
├── .env
└── node_modules/
```

## Installation

1. Clone the repository

```bash
git clone https://github.com/KChakritha143/data-hub-mongodb-api.git
cd data-hub-mongodb-api
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

4. Start the server

```bash
node server.js
```

## API Endpoints

### Health Check

```http
GET /health
```

### Get All Posts

```http
GET /posts
```

### Get Single Post

```http
GET /posts/:id
```

### Create Post

```http
POST /posts
```

Request Body:

```json
{
  "title": "First Post",
  "content": "Hello MongoDB Atlas"
}
```

### Update Post

```http
PUT /posts/:id
```

### Delete Post

```http
DELETE /posts/:id
```

## Testing

Run integration tests:

```bash
node test-api.js
```

The test suite validates:

* Database connection
* Create operation
* Read operations
* Update operation
* Delete operation
* Error handling

## Learning Objectives

* MongoDB Atlas cloud provisioning
* Mongoose ODM integration
* Schema design and validation
* Persistent NoSQL storage
* REST API development
* Automated API testing
