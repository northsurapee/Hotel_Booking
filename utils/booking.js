const nodemailer = require('nodemailer')
// console.log("user:", process.env.GMAIL_EMAIL, " pass:", process.env.GMAIL_PASSWORD)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const sendEmail = (email, subject, text) => {

    const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: email,
        subject: subject,
        html: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        transporter.close()
        if (error) {
            console.log(error);
            return false;
        } else {
            console.log('Email sent: ' + info.response);
            return true;
        }
    });
}

module.exports = { sendEmail }