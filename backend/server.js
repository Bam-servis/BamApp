const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Data = require("./models/data"); // Модель для данных
const Driver = require("./models/Driver"); // Модель для водителей

const app = express();
const port = 5000;

// Подключение к базе данных
mongoose
  .connect("mongodb://localhost:27017/mydatabase", {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json()); // Используйте встроенный JSON парсер

// Получение данных
app.get("/api/data", async (req, res) => {
  try {
    const data = await Data.find();
    console.log(data); // Логируем данные для проверки
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

// Добавление данных
app.post("/api/data", async (req, res) => {
  try {
    console.log("Request body:", req.body); // Логируем тело запроса
    const newItem = new Data(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error adding data:", error);
    res.status(500).json({ error: "Error adding data" });
  }
});

// Обновление данных
app.put("/api/data/:id", async (req, res) => {
  try {
    const updatedItem = await Data.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ error: "Error updating data" });
  }
});

// Маршрут для получения списка водителей
app.get("/api/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching drivers" });
  }
});

// Маршрут для добавления нового водителя
app.post("/api/drivers", async (req, res) => {
  try {
    const newDriver = new Driver(req.body);
    await newDriver.save();
    res.status(201).json(newDriver);
  } catch (error) {
    console.error("Error adding driver:", error);
    res.status(500).json({ error: "Error adding driver" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
