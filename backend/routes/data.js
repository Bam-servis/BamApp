const express = require("express");
const router = express.Router();
const Data = require("../models/Data");

// POST request to add new data
router.post("/api/data", async (req, res) => {
  try {
    const {
      doneCheck,
      date,
      brand,
      createdBy,
      driver,
      user,
      customer,
      routeNumber,
      hours,
      status,
      licensePlate,
      price,
      colorData,
      calcPay,
      comment,
      colorClass,
      updatedBy, // Добавляем это поле
    } = req.body;

    // Convert date string to Date object
    const formattedDate = new Date(date);

    const newData = new Data({
      doneCheck,
      date: formattedDate,
      brand,
      createdBy,
      driver,
      user,
      customer,
      routeNumber,
      hours,
      status,
      licensePlate,
      price,
      colorData,
      calcPay,
      comment,
      colorClass,
      updatedBy, // Сохраняем информацию о том, кто редактирует
    });

    const savedData = await newData.save();
    res.json(savedData);
  } catch (error) {
    console.error("Error adding data:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
