const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    brand: { type: String, default: "" },
    driver: { type: String, default: "" },
    customer: { type: String, default: "" },
    routeNumber: { type: String, default: "" },
    hours: { type: Number, default: 0 },
    isTrue: { type: Boolean, default: false },
    vehicleNumber: { type: String, default: "" },
    price: { type: Number, default: 0 },
    colorClass: { type: String, default: "" },
    updatedBy: { type: String, default: "" }, // Новое поле для отслеживания редактирования
  },
  { timestamps: true }
); // Добавьте timestamps для автоматического обновления полей createdAt и updatedAt

const Data = mongoose.model("Data", dataSchema);

module.exports = Data;
