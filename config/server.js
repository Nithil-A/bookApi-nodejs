const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config({
    path : "/.env",
});

const con = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    database : 'nithil',
});

con.connect((err, res)=>{
    if(err){
        console.log("Databse connction failed" + err);
    }
    if(res){
        console.log("Databse Connected Successfully");
    }
});

module.exports = con;