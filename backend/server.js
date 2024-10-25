require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Data = require("./models/Data"); // Модель для данных
const Driver = require("./models/Driver"); // Модель для водителей
const User = require("./models/User");
const authRoutes = require("./routes/auth"); // Маршруты для авторизации
const { MongoClient } = require("mongodb");
const path = require("path");
const WebSocket = require("ws"); // Импортируем библиотеку WebSocket

// Подставь свои данные
const uri =
  process.env.NODE_ENV === "production"
    ? "mongodb+srv://Web-gpy:AQ626Daven@bam-servis.fjflq.mongodb.net/sample_mflix?retryWrites=true&w=majority"
    : "mongodb://localhost:27017/mydatabase"; // Локальная база данных

const client = new MongoClient(uri);
const app = express();

// Подключение к базе данных
mongoose
  .connect(uri, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware для статической папки
app.use(express.static(path.join(__dirname, "../build")));
app.use(cors());
app.use(express.json()); // Используйте встроенный JSON парсер

// Создаем WebSocket-сервер
const wss = new WebSocket.Server({ noServer: true });

// Обрабатываем подключения WebSocket
wss.on("connection", (ws) => {
  console.log("New client connected");

  // Отправляем сообщение клиенту при подключении
  ws.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));

  ws.on("message", (message) => {
    console.log("Received message from client:", message);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Функция для уведомления клиентов
const notifyClients = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.delete("/api/data/:id", async (req, res) => {
  try {
    const result = await Data.findByIdAndDelete(req.params.id);
    if (!result) {
      console.log("No data found for ID:", req.params.id);
      return res.status(404).send("Data not found");
    }
    console.log("Successfully deleted data for ID:", req.params.id);
    notifyClients({ action: "delete", id: req.params.id }); // Уведомляем клиентов
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

app.get("/api/data", async (req, res) => {
  try {
    const data = await Data.find().sort({ orderIndex: 1 });
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
    notifyClients({ action: "add", item: newItem }); // Уведомляем клиентов
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
    notifyClients({ action: "update", item: updatedItem }); // Уведомляем клиентов
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
    res.status(500).json({ error: "Error fetching users" });
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

// Обработка WebSocket-подключений в express
const server = app.listen(port, () => {});

// Перенаправляем WebSocket-соединения
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});
