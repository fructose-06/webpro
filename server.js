require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware พื้นฐาน
app.use(cors());
app.use(express.json({ limit: "10mb" })); // ให้อ่านข้อมูล JSON ที่ส่งมาจากหน้าเว็บได้
app.use(express.static(path.join(__dirname, "public"))); // ให้เปิดไฟล์ HTML ในโฟลเดอร์ public ได้

// 1. เชื่อมต่อ PostgreSQL (SQL)
const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
});

pgPool
    .connect()
    .then((client) => {
        console.log("Connected to PostgreSQL (internsight_db)");
        client.release();
    })
    .catch((err) => {
        console.error("PostgreSQL connection error:", err.message);
    });

// 2. เชื่อมต่อ MongoDB (NoSQL)
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB (internsight_nosql)");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
    });

// เริ่มรัน Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/login.html`);
});