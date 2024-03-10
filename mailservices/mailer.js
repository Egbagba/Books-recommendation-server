const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (email, resetToken, frontendURL) => {
  // Create a nodemailer transporter using your email provider's credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'eseegbas@gmail.com',
      pass: 'pbzc dywh xpbq fqkc',
    },
  });

  // Define the email content
  const mailOptions = {
    from: 'eseegbas@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: `Click the following link to reset your password: ${frontendURL}/reset-password/${resetToken}`,
  };

  // Send the email
  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = sendPasswordResetEmail;
