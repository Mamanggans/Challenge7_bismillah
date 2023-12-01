require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { ResponseTemplate } = require("../helper/template_helper");
const nodemailer = require("nodemailer");
const { format, parseISO } = require("date-fns");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SMTP,
    pass: process.env.PASS_SMTP,
  },
});

async function createUser(req, res, next) {
  try {
    const { firstName, lastName, email, password, age, dateOfBirth, address } = req.body;

    const formattedDate = parseISO(format(new Date(dateOfBirth), "yyyy-MM-dd"));
    formattedDate.setDate(formattedDate.getDate() + 1);
    const newformattedDate = formattedDate.toISOString();

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      const resp = ResponseTemplate(null, "User already exists", null, 400);
      res.json(resp);
      return;
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: encryptedPassword,
        age: parseInt(age),
        dateOfBirth: newformattedDate,
        profile_picture: "default.jpg",
        is_verified: false,
        address,
      },
      select: {
        id: false,
        firstName: true,
        lastName: true,
        email: true,
        age: true,
        dateOfBirth: true,
        profile_picture: true,
        is_verified: true,
        address: true,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.SECRET_KEY
    );

    const baseURL = process.env.BASE_URL;
    const verificationLink = `${baseURL}/auth/verify?token=${token}`;

    const mailOptions = await transporter.sendMail({
      from: process.env.EMAIL_SMTP,
      to: email,
      subject: "Verification Email",
      html: `<a href="${verificationLink}">Verify your email</a>`,
    });

    console.log("Email sent: " + mailOptions.response);

    const resp = ResponseTemplate(newUser, "User created successfully", null, 200);
    res.json(resp);
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      let resp = ResponseTemplate(
        null,
        "Invalid email or password. Please check your credentials.",
        null,
        401
      );
      res.json(resp);
      return;
    }

    if (!user.is_verified) {
      let resp = ResponseTemplate(
        null,
        "Email not verified. Please check your email for verification instructions.",
        null,
        401
      );
      res.json(resp);
      return;
    }

    // User successfully authenticated, generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET
    );

    let resp = ResponseTemplate({ token }, "Login successful", false, 200);
    res.json(resp);
  } catch (error) {
    let resp = ResponseTemplate(
      false,
      "Internal Server Error. Please try again later.",
      null,
      500
    );
    // Sentry.captureException(error);
    res.json(resp);
  }
}

async function processAccountVerification(req, res, next) {
  try {
    const verificationToken = req.query.token;

    jwt.verify(verificationToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        let resp = ResponseTemplate(false, "Invalid or expired verification token. Please request a new one.", null, 401);
        return res.json(resp);
      }

      const userEmail = decoded.email;
      const updatedUser = await prisma.user.update({
        where: { email: userEmail },
        data: { is_verified: true },
        select: {
          id: false,
          firstName: true,
          lastName: true,
          email: true,
          age: true,
          dateOfBirth: true,
          profile_picture: true,
          is_verified: true,
        },
      });

      let response = ResponseTemplate(
        updatedUser,
        "Your account has been successfully verified. Welcome aboard!",
        null,
        200
      );
      res.json(response);
    });
  } catch (error) {
    let response = ResponseTemplate(
      false,
      "Internal Server Error. Please contact support for assistance.",
      null,
      500
    );
    next(error);
  }
}

async function initiatePasswordReset(req, res, next) {
  const { email } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      let resp = ResponseTemplate(null, "User not found. Please check your email address.", null, 404);
      res.json(resp);
      return;
    }

    if (!existingUser.is_verified) {
      let resp = ResponseTemplate(
        null,
        "Account not verified. Please verify your email before resetting the password.",
        null,
        401
      );
      res.json(resp);
      return;
    }

    // Generate token for password reset
    const resetToken = jwt.sign(
      { id: existingUser.id, email: existingUser.email, action: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.BASE_URL}/auth/resetPassword?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_SMTP,
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);

    let resp = ResponseTemplate(
      null,
      "Password reset instructions have been sent to your email. Please check your inbox.",
      null,
      200
    );
    res.json(resp);
  } catch (error) {
    let resp = ResponseTemplate(
      false,
      "Failed to initiate password reset. Please try again later.",
      null,
      500
    );
    next(error);
  }
}
async function initiatePasswordReset(req, res, next) {
  const { email } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      let resp = ResponseTemplate(null, "User not found. Please check your email address.", null, 404);
      res.json(resp);
      return;
    }

    if (!existingUser.is_verified) {
      let resp = ResponseTemplate(
        null,
        "Account not verified. Please verify your email before resetting the password.",
        null,
        401
      );
      res.json(resp);
      return;
    }

    // Generate token for password reset
    const resetToken = jwt.sign(
      { id: existingUser.id, email: existingUser.email, action: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.BASE_URL}/auth/resetPassword?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_SMTP,
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);

    let resp = ResponseTemplate(
      null,
      "Password reset instructions have been sent to your email. Please check your inbox.",
      null,
      200
    );
    res.json(resp);
  } catch (error) {
    let resp = ResponseTemplate(
      false,
      "Failed to initiate password reset. Please try again later.",
      null,
      500
    );
    next(error);
  }
}
module.exports = { createUser, loginUser, processAccountVerification, initiatePasswordReset, initiatePasswordReset };
