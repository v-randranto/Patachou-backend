'use strict'
require('dotenv').config();
const path = require('path');

const Member = require('./schemas/member');

const connectDb = (callback) => {
    let db = new sqlite3.Database(qualification_db_file, (err) => {
        if (err) return;
        callback(db);
    });
};


exports.get = (query) => {
    connectDb((db) => { 
        db.all(query.sqlStatement, (err, rows) => {
            query.done(err, rows);
        });
        db.close();
    });
};

exports.add = (query) => {
    connectDb(function(db) {        
        db.run(query.sqlStatement, query.params, function(err) {
            query.done(err, this.lastID);
        });
        db.close();
    });
};

exports.update = (query) => {
    connectDb((db) => {        
        db.run(query.sqlStatement, query.params, (err) => {
            query.done(err);
        });
        db.close();
    });
};


exports.delete = (query) => {
    connectDb((db) => {        
        db.run(query.sqlStatement, query.params, (err) => {
            if (err) console.error(err);
            query.done(err);
        });
        db.close();
    });
};


// const connectDb = (callback) => {
//     let db = new sqlite3.Database(qualification_db_file, (err) => {
//         if (err) return;
//         callback(db);
//     });
// };


// exports.get = (query) => {
//     connectDb((db) => { 
//         db.all(query.sqlStatement, (err, rows) => {
//             query.done(err, rows);
//         });
//         db.close();
//     });
// };

// exports.add = (query) => {
//     connectDb(function(db) {        
//         db.run(query.sqlStatement, query.params, function(err) {
//             query.done(err, this.lastID);
//         });
//         db.close();
//     });
// };

// exports.update = (query) => {
//     connectDb((db) => {        
//         db.run(query.sqlStatement, query.params, (err) => {
//             query.done(err);
//         });
//         db.close();
//     });
// };


// exports.delete = (query) => {
//     connectDb((db) => {        
//         db.run(query.sqlStatement, query.params, (err) => {
//             if (err) console.error(err);
//             query.done(err);
//         });
//         db.close();
//     });
// };
