const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  doneCheck: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  brand: { type: String, default: "" },
  createdBy: { type: String, default: "" },
  driver: { type: String, default: "" },
  user: { type: String, default: "" },
  customer: { type: String, default: "" },
  routeNumber: { type: String, default: "" },
  hours: { type: Number, default: 0 },
  isTrue: { type: Boolean, default: false },
  vehicleNumber: { type: String, default: "" },
  price: { type: Number, default: 0 },
  colorClass: { type: String, default: "" },
  colorData: { type: String, default: "" },
  comment: { type: String, default: "" },
  calcPay: { type: String, default: "" },
  updatedBy: { type: String, default: "" }, // Новое поле для отслеживания редактирования
});

const Data = mongoose.model("Data", dataSchema);

module.exports = Data;
