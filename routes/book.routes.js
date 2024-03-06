const express = require("express");
const mongoose = require("mongoose");



const router = express.Router();

const Book = require("../models/Book.model");
const { response } = require("../app");

/** ROUTES */
router.post("/book", (req, res)=>{
    const {
        title, 
        author, 
        description, 
        year, 
        ratings, 
        image_placeholder} = req.body;

        Book.create({ title, author, description, year, ratings, image_placeholder, tasks: [] })
        .then((response)=> res.json(response))
        .catch((error)=> res.json(error));
});

module.exports = router;