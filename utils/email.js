
const config = require('config');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

  // TODO provisoire à supprimer
  // vf. Self-Signed Certificate in Chain Issues on Node.js
// eslint-disable-next-line no-undef
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let mailSender = function () {
}

mailSender.prototype.send = async function (recipient, subject, text) {

    let mailOptions = {
        from: config.email.from,
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