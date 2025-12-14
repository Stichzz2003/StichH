import nodemailer from 'nodemailer';

const createTransporter = () => {
  console.log('🔍 Checking Gmail configuration...');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configured' : '❌ MISSING!');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER or EMAIL_PASS is not configured in .env file');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async (email, username, verificationToken) => {
  try {
    console.log('');
    console.log('📧 ============= SENDING EMAIL =============');
    console.log('To:', email);
    console.log('Username:', username);
    console.log('From:', process.env.EMAIL_USER);
    
    const transporter = createTransporter();

    console.log(' Verifying SMTP connection...');
    await transporter.verify();
    console.log(' SMTP connection successful!');
    
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✉️ Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome ${username}! 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up! Please click the button below to verify your email address:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 14px 40px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;
                        font-weight: bold; font-size: 16px;">
                ✅ Verify Email
              </a>
            </div>
            <p style="color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              ⏰ This link will expire in 24 hours.<br>
              ℹ️ If you didn't create this account, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 15px; word-break: break-all;">
              Or copy this link to your browser:<br>
              <span style="color: #007bff;">${verificationUrl}</span>
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This email was sent automatically. Please do not reply.</p>
          </div>
        </div>
      `,
      text: `Welcome ${username}!\n\nPlease verify your email by visiting this link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, please ignore this email.`,
    };

    console.log(' Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to real Gmail inbox!');
    console.log('Message ID:', info.messageId);
    console.log('Email delivered to:', email);
    
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.error(' Error sending email:');
    console.error('   Name:', error.name);
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('');
      console.error('GMAIL AUTHENTICATION ERROR:');
      console.error('   1. Check if EMAIL_USER is correct');
      console.error('   2. Check if EMAIL_PASS is App Password (16 characters)');
      console.error('   3. Make sure 2-Step Verification is enabled');
      console.error('   4. Create App Password at: https://myaccount.google.com/apppasswords');
    }
    
    throw new Error('Unable to send verification email. Please try again later.');
  }
};