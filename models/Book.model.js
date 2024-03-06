const mongoose = require("mongoose");
const { Schema, model } = mongoose; // Import the 'model' function

const bookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    year: { type: Number, default: 1111 },
    ratings: { type: Number, default: 4.6 },
    image_placeholder: { type: String, required: true }
});

const Book = model('Book', bookSchema); // Using the 'model' function


module.exports = Book;
