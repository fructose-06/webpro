const mongoose = require("mongoose");

// Collection: jobroles (ตรงกับตาราง JOB_ROLE ใน ER Diagram)
const jobRoleSchema = new mongoose.Schema(
    {
        job_id: { type: Number, required: true, unique: true },
        job_name: { type: String, required: true, trim: true }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("JobRole", jobRoleSchema);
