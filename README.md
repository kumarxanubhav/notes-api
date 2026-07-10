# 📝 Notes API

This is a simple Notes API built using **Node.js** and **Express.js** as part of my backend development learning journey.

The main goal of this project was to understand how REST APIs work and to get hands-on experience with CRUD operations, routing, middleware, request handling, and connecting a simple frontend with a backend.

---

## ✨ Features

- Create a new note
- View all notes
- Update an existing note
- Delete a note
- Basic input validation
- Proper HTTP status codes
- Simple frontend to interact with the API

---

## 🛠 Tech Stack

- Node.js
- Express.js
- HTML
- CSS
- JavaScript

---

## 📁 Project Structure

```
notes-api/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── server.js
├── package.json
└── README.md
```

---

## 📌 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Check if the server is running |
| GET | /notes | Get all notes |
| POST | /notes | Create a new note |
| PATCH | /notes/:id | Update a note |
| DELETE | /notes/:id | Delete a note |

---

## 🚀 Getting Started

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Start the server

```bash
node server.js
```

Open your browser and visit:

```
http://localhost:3000
```

---

## 📚 What I Learned

While building this project, I practiced:

- Express.js fundamentals
- REST API development
- CRUD operations
- Routing
- Middleware
- Request and response handling
- HTTP status codes
- Connecting a frontend with backend APIs using Fetch API

---

## 🔮 Future Improvements

Some features I'd like to add in the future:

- MongoDB database integration
- User authentication (JWT)
- Better validation and error handling
- Search and filtering
- Pagination
- API documentation

---

## 👨‍💻 About This Project

This project is part of my backend development learning journey. I'm building small projects to strengthen my understanding of Node.js, Express.js, and backend concepts before moving on to larger, production-ready applications.

Feedback and suggestions are always welcome!
