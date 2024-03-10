const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const sendPasswordResetEmail = require("../mailservices/mailer.js");

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model to interact with the database
const User = require("../models/User.model");

// Require necessary (isAuthenticated) middleware to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", (req, res) => {
  const { email, password, name } = req.body;

  // Check if email or password or name are provided as empty strings
  if (email === "" || password === "" || name === "") {
    res.status(400).json({ message: "Provide email, password, and name" });
    return;
  }

  // This regular expression checks that the email is of a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // This regular expression checks the password for special characters and minimum length
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message: "Password must have at least 6 characters and contain at least one number, one lowercase, and one uppercase letter.",
    });
    return;
  }

  // Check the users collection if a user with the same email already exists
  User.findOne({ email })
    .then((foundUser) => {
      // If the user with the same email already exists, send an error response
      if (foundUser) {
        res.status(400).json({ message: "User already exists." });
        return;
      }

      // If email is unique, proceed to hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create the new user in the database
      // We return a pending promise, which allows us to chain another `then`
      return User.create({ email, password: hashedPassword, name });
    })
    .then((createdUser) => {
      // Deconstruct the newly created user object to omit the password
      // We should never expose passwords publicly
      const { email, name, _id } = createdUser;

      // Create a new object that doesn't expose the password
      const user = { email, name, _id };

      // Send a JSON response containing the user object
      res.status(201).json({ user: user });
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// POST  /auth/login - Verifies email and password and returns a JWT
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are provided as an empty string
  if (email === "" || password === "") {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        res.status(401).json({ message: "User not found." });
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, name } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, name };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// POST /auth/forgot-password - Initiates the password reset process
router.post("/forgot-password", (req, res, next) => {
  const { email } = req.body;

  // Validate the email
  if (!email) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // Find the user by email
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      // Generate a unique token for password reset
      const resetToken = crypto.randomBytes(20).toString("hex");
      // Set the expiration time for the reset token (e.g., 1 hour)
      const resetTokenExpires = Date.now() + 3600000; // 1 hour

      // Update the user's record in the database with the reset token and expiration time
      user.resetToken = resetToken;
      user.resetTokenExpires = resetTokenExpires;
      return user.save();
    })
    .then((user) => {
      // Send an email to the user with the password reset link/token
      const resetLink = `${frontendURL}/reset-password/${user.resetToken}`;
      sendPasswordResetEmail(user.email, resetLink);

      // Respond with success
      res.status(200).json({ message: "Password reset instructions sent to your email." });
    })
    .catch((err) => next(err));
});

// GET /auth/reset-password/:token - Renders the password reset form
router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;

  console.log("Received token", token);

  // Validate the token and render the password reset form
  User.findOne({
    resetToken: token,
    resetTokenExpires: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "Invalid or expired reset token." });
        return;
      }
      // Render your password reset form here
      // Example: res.render("reset-password", { token });
    })
    .catch((err) => res.status(500).json({ message: "Internal server error.", err }));
});

// POST /auth/reset-password/:token - Handles the password reset submission
router.post("/reset-password/:token", (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Validate the token
  User.findOne({
    resetToken: token,
    resetTokenExpires: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "Invalid or expired reset token." });
        return;
      }

      // Update the user's password in the database
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpires = null;

      return user.save();
    })
    .then(() => {
      // Respond with success
      res.status(200).json({ message: "Password successfully reset." });
    })
    .catch((err) => next(err));
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

module.exports = router;
