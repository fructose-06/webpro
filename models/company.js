const mongoose = require("mongoose");

// Collection: companies (ตรงกับตาราง COMPANY ใน ER Diagram)
const companySchema = new mongoose.Schema(
    {
        company_id: { type: Number, required: true, unique: true },
        company_name: { type: String, required: true, trim: true },
        industry_type: { type: String, default: "", trim: true }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("Company", companySchema);
