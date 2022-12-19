const book = require('../model/api_model');
const crypto = require('crypto');

//get all books
exports.getAllBooks = async(req, res, next)=>{
    let token = req.header('authorization').split(' ')[1];
    let books = await book.getAll(token);
    res.send(books);
}
//get single book
exports.getSingleBook = async(req, res, next)=>{
    let token = req.header('authorization').split(' ')[1];
    let books = await book.getOne(req.params.id, token);
    if(books.length > 0){
        res.send(books);
    }
    else{
        res.send('No book Available on this id');
    }
   
}
// add new book
exports.addNewBook = async(req, res, next)=>{
    let books = await book.addOne(req.body.name, req.body.author, req.body.price, req.body.adminid);
    if(books){
        res.send('New Book Added Successfully');
    }
    else{
        res.send('New book added Failed');
    }
}
//update single book
exports.updateBook = async(req, res, next)=>{
    let token = req.header('authorization').split(' ')[1];
    let books = await book.updateOne(req.body.name, req.body.author, req.body.price, req.params.id, token);
    if(books){
        res.send('Updated Successfully');
    }
    else{
        res.send('Update Failed');
    }
}
//delete a book
exports.deleteBook = async(req, res, next)=>{
    let token = req.header('authorization').split(' ')[1];
    let books = await book.deleteOne(req.params.id, token);
    if(books){
        res.send('Book Deleted Successfully');
    }
    else{
        res.send('Delete Failed');
    }
}