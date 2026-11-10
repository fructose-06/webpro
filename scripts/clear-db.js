/**
 * สคริปต์สำหรับล้างข้อมูลในฐานข้อมูล (Clear Database)
 * - ล้างข้อมูลรีวิวทั้งหมดใน MongoDB (Collection: internshipreviews)
 * - หากใส่พารามิเตอร์ --all จะล้างข้อมูลผู้ใช้ใน PostgreSQL (public.users) ด้วย
 *
 * วิธีรัน:
 *   node scripts/clear-db.js          (ล้างเฉพาะรีวิวใน MongoDB)
 *   node scripts/clear-db.js --all    (ล้างทั้งรีวิวใน MongoDB และผู้ใช้ใน PostgreSQL)
 */

require("dotenv").config();
const { Pool } = require("pg");
const mongoose = require("mongoose");
const Review = require("../models/review");

const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
});

async function clearDatabase() {
    const clearAll = process.argv.includes("--all");
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const delResult = await Review.deleteMany({});
        console.log(`🗑️ ลบข้อมูลรีวิวใน MongoDB เรียบร้อยแล้ว (${delResult.deletedCount} รายการ)`);

        if (clearAll) {
            await pgPool.query("TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;");
            console.log("🗑️ ล้างข้อมูลตาราง public.users ใน PostgreSQL และรีเซ็ต user_id เป็น 1 เรียบร้อยแล้ว");
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการล้างข้อมูล:", error);
    } finally {
        await mongoose.disconnect();
        await pgPool.end();
    }
}

clearDatabase();

