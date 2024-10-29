const jwt = require("jsonwebtoken");

const SECRET_KEY = "your_secret_key"; // Замените на ваш секретный ключ

// Функция для создания токена
function generateToken(user) {
  return jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "1h" });
}

module.exports = { generateToken };
