const mongoose = require("mongoose");
const ChangeHistory = require("../models/changeHistory");

async function logChange(
  tableName,
  recordId,
  changeType,
  changedData,
  changedBy
) {
  if (!changedBy) {
    console.error("Field 'changedBy' is missing.");
    return;
  }

  try {
    const change = new ChangeHistory({
      tableName,
      recordId,
      changeType,
      changedData,
      changedBy,
    });
    await change.save();
  } catch (error) {
    console.error("Error logging change:", error);
  }
}

module.exports = logChange;
