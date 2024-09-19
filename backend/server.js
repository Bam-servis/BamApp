const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Data = require("./models/Data"); // Модель для данных
const Driver = require("./models/Driver"); // Модель для водителей
const User = require("./models/User");
const authRoutes = require("./routes/auth"); // Маршруты для авторизации

const app = express();

// Подключение к базе данных
mongoose
  .connect("mongodb://localhost:27017/mydatabase", {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json()); // Используйте встроенный JSON парсер
app.delete("/api/data/:id", async (req, res) => {
  try {
    console.log(`Received request to delete item with ID: ${req.params.id}`);
    const result = await Data.findByIdAndDelete(req.params.id);
    if (!result) {
      console.log("No data found for ID:", req.params.id);
      return res.status(404).send("Data not found");
    }
    console.log("Successfully deleted data for ID:", req.params.id);
    res.status(200).send("Data deleted successfully");
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).send("Server error");
  }
});
app.get("/api/data/count", async (req, res) => {
  try {
    const count = await Data.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching count", error });
  }
});
// Маршруты для данных
app.get("/api/data", async (req, res) => {
  try {
    const data = await Data.find();
    console.log(data); // Логируем данные для проверки
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

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

// Маршруты для водителей
app.get("/api/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching drivers" });
  }
});
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching drivers" });
  }
});
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

// Подключение маршрутов для авторизации
app.use("/api", authRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
