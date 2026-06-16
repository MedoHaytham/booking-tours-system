const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor (user, url) {
    this.to = user.email;
    this.from = `Mohamed Haytham <${process.env.EMAIL_FROM}>`;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
  }

  // 1) Create transporter
  newTransport () {
    if (process.env.NODE_ENV === 'production') {
      // sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAM,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    // Development
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // 2) Send actual email
  async send (template, subject) {
    // 1) Render html template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html)
    };

    // 3) Create transporter and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome (){
    await this.send('welcome', 'Welcome to the Natours family!');
  }

  async sendResetPassword (){
    await this.send('passwordReset', `Your password reset token (valid for only ${process.env.PASSWORD_RESET_EXPIRES} min)`);
  }
}

// const sendEmail = async options => {
//   // 1) Create a transporterT
//   const transporter = nodemailer.createTransport({
//     // service: 'Gmail',
//     // auth: {
//     //   user: process.env.EMAIL_USERNAME,
//     //   pass: process.env.EMAIL_PASSWORD
//     // },
//     // activate a less secure app to send email
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   })

//   // 2) Define email options
//   const mailOptions = {
//     from: 'Mohamed Gamal <medo@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:,
//   }

//   // 3) send the email
//   await transporter.sendMail(mailOptions);
// }

// module.exports = sendEmail;

// const sendEmail = async options => {
//   // 1) create transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   });
//   // 2) Define email options
  // const mailOptions = {
  //   from: 'Mohamed Haytham <medo@gmail.com>',
  //   to: options.email,
  //   subject: options.subject,
  //   text: options.message
  // }
//   // 3) send the email
//   await transporter.sendMail(mailOptions);
// }

// module.exports = sendEmail;

