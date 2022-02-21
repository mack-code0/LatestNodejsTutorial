const mailgun = require("mailgun-js")


module.exports = (email, cb)=>{
    const DOMAIN = process.env.MAIL_DOMAIN;
    const api_key = process.env.API_KEY
    const receiverEmail = process.env.SEND_TO_MAIL

    const mg = mailgun({apiKey: api_key, domain: DOMAIN});
    const data = {
        from: 'Excited User <'+email+'>',
        to: [receiverEmail],
        subject: 'Hello',
        text: 'Testing some Mailgun awesomness!'
    };
    mg.messages().send(data, function (error, body) {
        cb(body);
    });
}