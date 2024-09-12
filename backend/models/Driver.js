const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Поле с именем водителя
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;
