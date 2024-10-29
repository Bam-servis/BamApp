// server/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Импорт модели пользователя
const { generateToken } = require("../utils/authService");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, name, password } = req.body;
    console.log("Incoming data:", { username, name, password }); // Логируем полученные данные

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      name,
      password: hashedPassword,
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error); // Логируем ошибку
    res.status(500).json({ error: "Error registering user" });
  }
});

// Логин пользователя
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Генерация токена
    const token = generateToken(user); // Генерация токена
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
});

module.exports = router;
