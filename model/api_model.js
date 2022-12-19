const con = require('../config/server');

module.exports = class books{
    constructor(){}
    static getAll(token){
        return new Promise((resolve, reject)=>{
            let selQuery = `SELECT bk.recid, bk.name, bk.author, bk.price
                                FROM books bk, admin ad
                                    WHERE bk.adminid = ad.recid
                                        AND ad.token = ?
                                            AND(bk.endeffdt = '0000-00-00' OR bk.endeffdt IS NULL OR bk.endeffdt > NOW())
                                                AND(ad.tokenExpiry IS NULL OR ad.tokenExpiry > NOW())`;
            con.query(selQuery, [token], (err, result)=>{
                if(result){
                    resolve(result);
                }
                else{
                    reject(err);
                }
            })
        })
    }

    static getOne(id, token){
        return new Promise((resolve, reject)=>{
            let selQuery = `SELECT bk.recid, bk.name, bk.author, bk.price
                                FROM books bk, admin ad
                                    WHERE bk.recid = ?
                                        AND bk.adminid = ad.recid
                                            AND ad.token = ?
                                                AND(bk.endeffdt = '0000-00-00' OR bk.endeffdt IS NULL OR bk.endeffdt > NOW())
                                                    AND(ad.tokenExpiry IS NULL OR ad.tokenExpiry > NOW())`
            con.query(selQuery, [id, token], (err, result)=>{
                if(result){
                    resolve(result);
                }
                else{
                    reject(err);
                }
            })
        })
        
    }

    static addOne(name, author, price, adminid){
        return new Promise((resolve, reject)=>{
            let insQuery = `INSERT INTO books(name, author, price, adminid) 
                                VALUES (?, ?, ?, ?)`;
                con.query(insQuery, [name, author, price, adminid], (err, result)=>{
                    if(result){
                        resolve('true');
                    }
                    else{
                        reject(err);
                    }
                })
        })
    }

    static updateOne(name, author, price, id, token){
        return new Promise((resolve, reject)=>{
            let selQuery = `SELECT *
                                FROM books bk, admin ad
                                WHERE bk.recid = ?
                                    AND bk.adminid = ad.recid
                                        AND ad.token = ?
                                            AND(bk.endeffdt = '0000-00-00' OR bk.endeffdt IS NULL OR bk.endeffdt > NOW())
                                                AND(ad.tokenExpiry IS NULL OR ad.tokenExpiry > NOW())`;
                con.query(selQuery, [id, token], (err, result)=>{
                    if(result.length > 0){
                        let updQuery = `UPDATE books SET name = ?, author = ?, price = ?
                                            WHERE recid = ?`;
                            con.query(updQuery, [name, author, price, id], (er, result)=>{
                                if(result){
                                    resolve('true');
                                }
                                else{
                                    reject(err);
                                }
                            })
                    }
                })
        })
    }

    static deleteOne(id, token){
        return new Promise((resolve, reject)=>{
            let selQuery = `SELECT *
                                FROM books bk, admin ad
                                WHERE bk.recid = ?
                                    AND bk.adminid = ad.recid
                                        AND ad.token = ?
                                            AND(bk.endeffdt = '0000-00-00' OR bk.endeffdt IS NULL OR bk.endeffdt > NOW())
                                                AND(ad.tokenExpiry IS NULL OR ad.tokenExpiry > NOW())`;
                con.query(selQuery, [id, token], (err, result)=>{
                    if(result.length > 0){
                        let updQuery = `UPDATE books SET endeffdt = NOW()
                                WHERE recid = ?`;
                            con.query(updQuery, [id], (er, result)=>{
                                if(result){
                                    resolve('true');
                                }
                                else{
                                    reject(err);
                                }
                            })
                    }
                }) 
        })
    }
}