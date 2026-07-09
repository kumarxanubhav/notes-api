const express = require("express");

const app = express();

const path = require("path");

app.use(express.json());

// Serve static frontend from the public folder
app.use(express.static(path.join(__dirname, "public")));

const notes = [
  {
    id: 1,
    title: "Bob",
    content: "Dog",
  },
  {
    id: 2,
    title: "Oggy",
    content: "Cat",
  },
];

app.get("/", (req, res) => {
  res.send("Notes API Working");
});

app.get("/notes", (req, res) => {
  res.send(notes);
});

app.post("/notes", (req, res) => {
  const { id, title, content } = req.body;

  if (!id || !title || !content) {
    return res.status(400).send("All fields are required");
  }

  const newNote = {
    id,
    title,
    content,
  };

  notes.push(newNote);

  res.status(201).send("Note added successfully");
});

app.delete("/notes/:id", (req, res) => {
  const noteId = parseInt(req.params.id);

  const noteIndex = notes.findIndex((note) => {
    return note.id === noteId;
  });

  if (noteIndex === -1) {
    return res.send("Note not found");
  }

  notes.splice(noteIndex, 1);

  res.send(notes);
});

app.patch("/notes/:id", (req, res) => {
  const noteId = parseInt(req.params.id);

  const note = notes.find((note) => {
    return note.id === noteId;
  });

  if (!note) {
    return res.send("Note not found");
  }

  if (req.body.title) {
    note.title = req.body.title;
  }

  if (req.body.content) {
    note.content = req.body.content;
  }

  res.send(notes);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
