
const nodemailer = require('nodemailer');




const sendEmail = async (options) =>{

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) ,
        secure: process.env.MAIL_PORT == 465 ,
        auth:{
            user: process.env.MAIL_USERNAME ,
            pass: process.env.MAIL_PASSWORD ,

        },
    });
    const message ={
        from : `${process.env.FROM_NAME || 'support'} <${process.env.FROM_EMAIL} || 'support@myapp.com'}`,
        to: options.to,
        subject: options.subject,
        text: options.text,
    };

    await transporter.sendMail(message);
};


module.exports = sendEmail;
