/* eslint-disable no-undef */
const nodemailer = require('nodemailer');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // TODO provisoire à supprimer
  // vf. Self-Signed Certificate in Chain Issues on Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let mailSender = function () {
}

mailSender.prototype.send = async function (recipient, subject, text) {
logger.info(`[${base}/mailSender.send()] - ${recipient}, ${subject}`);
    let mailOptions = {
        from: process.env.EMAIL_FROM,
        to: recipient,
        subject: subject,
        text: text
    };

    return new Promise(function (resolve, reject) {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });

}

module.exports = mailSender;