'use strict'

exports.perform = (res, err, httpCode) => {
    console.error(err);
    res.status(httpCode).end();
};

