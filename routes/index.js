var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const bookController = require('../controllers/bookController');

//get all books
router.get('/getAllbooks', bookController.getAllBooks);

//get single book
router.get('/getOne/:id', bookController.getSingleBook);

//add new book
router.post('/addBook', bookController.addNewBook);

//update book
router.put('/updateBook/:id', bookController.updateBook);

//delete book
router.delete('/deleteBook/:id', bookController.deleteBook);

module.exports = router;