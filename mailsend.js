const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(
    {
        secure:true,
        host:'smtp.gmail.com',
        port: 465,
        auth:{
            user:'gauravkhadka111111@gmail.com',
            pass:'catgfxsmwkqrdknh',
        }
    }
);

function sendMail(to,sub,msg){
    transporter.sendMail({
        to:to,
        subject:sub,
        html:msg
    });
    console.log("Email Sent")
}

sendMail("gaurav@webtech.com.np", "This is subject", "this is message");