const mongoose = require("mongoose");

// Collection: techskills (ตรงกับตาราง TECH_SKILL ใน ER Diagram)
const techSkillSchema = new mongoose.Schema(
    {
        skill_id: { type: Number, required: true, unique: true },
        skill_name: { type: String, required: true, trim: true }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("TechSkill", techSkillSchema);
