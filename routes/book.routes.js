const express = require("express");
const mongoose = require("mongoose");



const router = express.Router();

const Book = require("../models/Book.model");
/* const { response } = require("../app");
 */
/** ROUTES  Post - Created a New Book*/
router.post("/book", (req, res) => {
    const {
        title,
        author,
        description,
        year,
        ratings,
        image } = req.body;

    Book.create({ title, author, description, year, ratings, image_placeholder:image })
        .then((response) => res.json(response))
        .catch((error) => res.json(error));
});

/* 2nd ROUTE --> Will Get and Read all Books*/
router.get("/books", (req, res) => {
    Book.find()
/*         .populate('tasks')
 */        .then((allBooks) => res.json(allBooks))
        .catch((error) => res.json(error));
});

/** 3rd ROUTE --> Is Gonna Find BooksById --> Meaning it reads and get a specific book */
router.get("/books/:bookId", (req, res) => {
    const { bookId } = req.params;
    Book.findById(bookId)
        /* .populate('tasks') */
        .then((book) => res.json(book))
        .catch((error) => res.json(error));
});

/** 4th ROUTE --> Updates a book */
router.put("/books/:bookId", (req, res) => {
    // Object destructuring
    const { bookId } = req.params;
    const {

        title,
        author,
        description,
        year,
        ratings,
        image_placeholder } = req.body;

    Book.findByIdAndUpdate(bookId, {
        title,
        author,
        description,
        year,
        ratings,
        image_placeholder
    }, { new: true })
        .then(() => {
            res.json({ message: "Book Updated!" });
        })
        .catch((error) => {
            res.json({ message: "Failed to Update Book." });
        });

});

/** 5th ROUTE --> Well this DELETES a Specific Book */
router.delete('/books/:bookId', (req, res) => {
    const { bookId } = req.params;

    Book.findByIdAndDelete(bookId)
        .then(() => {
            res.json({ message: 'Book deleted' });
        })
        .catch(() => {
            res.json({ error: 'Failed to delete a Book' });
        });
});





module.exports = router;