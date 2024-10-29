const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");

// Получение всех водителей
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching drivers" });
  }
});

module.exports = router;
