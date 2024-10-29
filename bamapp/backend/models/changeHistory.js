const mongoose = require("mongoose");

const changeHistorySchema = new mongoose.Schema({
  tableName: { type: String, required: false },
  recordId: { type: mongoose.Schema.Types.ObjectId, required: false },
  changeType: { type: String, required: false },
  changedData: { type: mongoose.Schema.Types.Mixed, required: false },
  changedBy: { type: String, required: false },
  changedAt: { type: Date, default: Date.now },
});

const ChangeHistory = mongoose.model("ChangeHistory", changeHistorySchema);

module.exports = ChangeHistory;
