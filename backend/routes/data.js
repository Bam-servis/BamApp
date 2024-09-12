// backend/routes/data.js
const express = require("express");
const router = express.Router();
const Data = require("../models/data");

// POST request to add new data
router.post("/api/data", async (req, res) => {
  try {
    const {
      date,
      brand,
      driver,
      customer,
      routeNumber,
      hours,
      status,
      licensePlate,
      price,
      colorClass,
    } = req.body;

    // Convert date string to Date object
    const formattedDate = new Date(date);

    const newData = new Data({
      date: formattedDate,
      brand,
      driver,
      customer,
      routeNumber,
      hours,
      status,
      licensePlate,
      price,
      colorClass,
    });

    const savedData = await newData.save();
    res.json(savedData);
  } catch (error) {
    console.error("Error adding data:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
