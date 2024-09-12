const mongoose = require("mongoose");

const dbURI = "mongodb://localhost:27017/mydatabase"; // Убедитесь, что URI правильный

// Удалите useNewUrlParser и useUnifiedTopology, так как они больше не нужны
mongoose.connect(dbURI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to the database");
});

module.exports = db;
