import { transporter } from "../config/email";
import {
  EMAIL_VERIFICATION_SUCCESS_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "../templates/email.templates";

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
) => {
  const emailHtml = VERIFICATION_EMAIL_TEMPLATE.replace(
    "{verificationCode}",
    verificationToken
  );

  const mailOptions = {
    from: '"GTextSuite Support" <no-reply@gtextsuite.com>',
    to: email,
    subject: "Verify Your Email - GTextSuite",
    html: emailHtml,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string,
  lastName: string
) => {
  const emailHtml = EMAIL_VERIFICATION_SUCCESS_TEMPLATE.replace(
    "{firstName}",
    firstName
  ).replace("{lastName}", lastName);
  try {
    const mailOptions = {
      from: '"GTextSuite Support" <no-reply@gtextsuite.com>',
      to: email,
      subject: "Welcome Email - GTextSuite",
      html: emailHtml,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending welcome email`, error);

    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  verificationLink: string
) => {
  const emailHtml = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
    "{resetURL}",
    verificationLink
  );
  try {
    const mailOptions = {
      from: '"GTextSuite Support" <no-reply@gtextsuite.com>',
      to: email,
      subject: "Password Reset - GTextSuite",
      html: emailHtml,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending password reset email`, error);

    throw new Error(`Error sending password reset email: ${error}`);
  }
};

export const sendResetSuccessEmail = async (email: string) => {
  try {
    const mailOptions = {
      from: '"GTextSuite Support" <no-reply@gtextsuite.com>',
      to: email,
      subject: "Password Reset Successful - GTextSuite",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);

    throw new Error(`Error sending password reset success email: ${error}`);
  }
};
