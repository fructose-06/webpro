/**
 * สคริปต์สำหรับเพิ่มข้อมูลตั้งต้น (Seed Data) ลงในฐานข้อมูลจริง
 * - PostgreSQL (ตาราง public.users)
 * - MongoDB (Collection: internshipreviews ตาม ER Diagram)
 *
 * วิธีรัน:
 *   node scripts/seed.js
 * หรือ:
 *   npm run seed
 */

require("dotenv").config();
const { Pool } = require("pg");
const mongoose = require("mongoose");
const { argon2, randomBytes } = require("node:crypto");
const { promisify } = require("node:util");
const Review = require("../models/review");

const deriveKey = promisify(argon2);

const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
});

async function hashPassword(password) {
    const salt = randomBytes(16);
    const digest = await deriveKey("argon2id", {
        message: Buffer.from(password),
        nonce: salt,
        memory: 19456,
        passes: 2,
        parallelism: 1,
        tagLength: 32
    });
    const encode = (bytes) => bytes.toString("base64").replace(/=+$/, "");
    return `$argon2id$v=19$m=19456,t=2,p=1$${encode(salt)}$${encode(digest)}`;
}

async function seedDatabase() {
    try {
        console.log("⏳ กำลังเชื่อมต่อ PostgreSQL และ MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ เชื่อมต่อ MongoDB สำเร็จ");

        // 1. ตรวจสอบและสร้างตาราง public.users ใน PostgreSQL ตาม ER Diagram
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS public.users (
                user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                student_code VARCHAR(20) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                admission_year INTEGER NOT NULL,
                user_name TEXT,
                profile_image TEXT
            );
        `);

        // 2. เพิ่มข้อมูลผู้ใช้ตั้งต้น (USER) ลงใน PostgreSQL
        const defaultPasswordHash = await hashPassword("password123");
        const sampleUsers = [
            {
                student_code: "67090500400",
                email: "67090500400@st.sit.kmutt.ac.th",
                admission_year: 2567,
                user_name: "สมชาย สายโค้ด",
                profile_image: null
            },
            {
                student_code: "67090500401",
                email: "67090500401@st.sit.kmutt.ac.th",
                admission_year: 2567,
                user_name: "พิมพ์ชนก รักดีไซน์",
                profile_image: null
            },
            {
                student_code: "67090500402",
                email: "67090500402@st.sit.kmutt.ac.th",
                admission_year: 2567,
                user_name: "กิตติพงศ์ เดต้า",
                profile_image: null
            }
        ];

        const insertedUsers = [];
        for (const u of sampleUsers) {
            const res = await pgPool.query(
                `INSERT INTO public.users (student_code, password_hash, email, admission_year, user_name, profile_image)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (student_code) DO UPDATE
                 SET user_name = EXCLUDED.user_name,
                     email = EXCLUDED.email
                 RETURNING user_id, student_code, user_name`,
                [u.student_code, defaultPasswordHash, u.email, u.admission_year, u.user_name, u.profile_image]
            );
            insertedUsers.push(res.rows[0]);
        }
        console.log(`✅ เตรียมข้อมูล USER ใน PostgreSQL สำเร็จ (${insertedUsers.length} บัญชี, รหัสผ่าน: password123)`);

        const user1 = insertedUsers[0]?.user_id || 1;
        const user2 = insertedUsers[1]?.user_id || 2;
        const user3 = insertedUsers[2]?.user_id || 3;

        // 3. ล้างข้อมูลรีวิวเก่าใน MongoDB แล้วเพิ่มข้อมูลจริงตาม ER Diagram
        await Review.deleteMany({});

        const sampleReviews = [
            {
                review_id: 1,
                user_id: user1,
                author_name: "สมชาย สายโค้ด",
                company_id: 1,
                company_name: "LINE MAN Wongnai",
                industry_type: "เทคโนโลยี / สตาร์ทอัพ",
                job_id: 1,
                job_name: "Frontend Developer Intern",
                skills: ["React", "TypeScript", "TailwindCSS"],
                is_anonymous: false,
                description: "ได้ร่วมทีมทำฟีเจอร์หน้าเว็บหลักของระบบสั่งอาหาร พี่ๆ ในทีมเปิดโอกาสให้ลองเสนอไอเดียและทำ Code Review ให้ละเอียดมาก ได้เรียนรู้การทำงานแบบ Agile Scrum จริงๆ",
                work_mode: "Hybrid",
                rating_culture: 5,
                rating_workload: 4,
                rating_mentor: 5,
                pros: "พี่เลี้ยงสอนงานดีมาก มีขนมและเครื่องดื่มฟรี ออฟฟิศเดินทางสะดวกติด BTS",
                cons: "ช่วงปล่อยฟีเจอร์ใหญ่งานจะค่อนข้างเร่ง ต้องบริหารเวลาให้ดี",
                daily_pay: "500",
                likes: 2,
                upvoted_by: [user2, user3],
                bookmarked_by: [{ user_id: user1, created_at: new Date() }],
                interview_questions: [
                    { question_no: 1, question_title: "ให้อธิบายความแตกต่างระหว่าง Props กับ State ใน React และยกตัวอย่างการใช้งาน", difficulty: "ง่าย" },
                    { question_no: 2, question_title: "โจทย์ Live Coding จัดการข้อมูล Array และแก้ปัญหา Re-render ที่ไม่จำเป็น", difficulty: "ปานกลาง" }
                ],
                comments: [
                    {
                        comment_no: 1,
                        parent_comment_no: null,
                        author_id: user2,
                        author_name: "พิมพ์ชนก รักดีไซน์",
                        content: "ขอบคุณสำหรับรีวิวค่ะ สัมภาษณ์เป็นภาษาไทยหรือภาษาอังกฤษคะ?"
                    },
                    {
                        comment_no: 2,
                        parent_comment_no: 1,
                        author_id: user1,
                        author_name: "สมชาย สายโค้ด",
                        content: "สัมภาษณ์เป็นภาษาไทยครับ แต่โจทย์โค้ดดิ้งเป็นภาษาอังกฤษ"
                    }
                ]
            },
            {
                review_id: 2,
                user_id: user2,
                author_name: "พิมพ์ชนก รักดีไซน์",
                company_id: 2,
                company_name: "KBTG (Kasikorn Business-Technology Group)",
                industry_type: "การเงิน / ธนาคาร",
                job_id: 2,
                job_name: "UX/UI Designer Intern",
                skills: ["Figma", "Design System", "User Research"],
                is_anonymous: false,
                description: "ได้ออกแบบหน้าจอแอปพลิเคชันและทำ Usability Testing กับผู้ใช้จริง มีระบบ Design System ที่เป็นมาตรฐานระดับองค์กรขนาดใหญ่ ทำให้เข้าใจกระบวนการทำงานร่วมกับทีม Developer ได้ดีขึ้นมาก",
                work_mode: "Hybrid",
                rating_culture: 5,
                rating_workload: 4,
                rating_mentor: 5,
                pros: "ได้เรียนรู้ระบบ Design System ขนาดใหญ่ พี่ Mentor คอยแนะนำทุกสัปดาห์",
                cons: "ตึกอยู่ที่เมืองทองธานี ถ้าไม่ได้อยู่แถวนั้นต้องเผื่อเวลาเดินทาง",
                daily_pay: "500",
                likes: 1,
                upvoted_by: [user1],
                bookmarked_by: [{ user_id: user1, created_at: new Date() }],
                interview_questions: [
                    { question_no: 1, question_title: "ให้นำเสนอ Portfolio โปรเจกต์ที่ภูมิใจที่สุด และอธิบาย Design Process ตั้งแต่ออกแบบจนถึงทดสอบ", difficulty: "ปานกลาง" },
                    { question_no: 2, question_title: "ถ้า Developer บอกว่าดีไซน์ที่เราออกแบบทำยากและใช้เวลานาน จะมีวิธีพูดคุยและแก้ไขอย่างไร", difficulty: "ง่าย" }
                ],
                comments: [
                    {
                        comment_no: 1,
                        parent_comment_no: null,
                        author_id: user3,
                        author_name: "กิตติพงศ์ เดต้า",
                        content: "ใน Portfolio ต้องใส่กี่โปรเจกต์ดีครับถึงจะกำลังดี?"
                    }
                ]
            },
            {
                review_id: 3,
                user_id: user3,
                author_name: "นักศึกษาฝึกงาน (ไม่ระบุตัวตน)",
                company_id: 3,
                company_name: "SCB TechX",
                industry_type: "การเงิน / ธนาคาร",
                job_id: 3,
                job_name: "Data Engineer Intern",
                skills: ["Python", "SQL", "Apache Airflow", "BigQuery"],
                is_anonymous: true,
                description: "ได้ทำ Data Pipeline และเขียน SQL จัดการข้อมูลขนาดใหญ่บน Cloud ได้ลองจับเครื่องมือจริงที่ไม่มีสอนในห้องเรียน พี่ๆ ในทีมให้คำแนะนำเรื่องการทำ Query Optimization ดีมาก",
                work_mode: "WFH",
                rating_culture: 4,
                rating_workload: 3,
                rating_mentor: 5,
                pros: "ทำงานแบบ WFH เกือบทั้งหมด ประหยัดค่าเดินทางและได้จับ Cloud จริง",
                cons: "ต้องมีความรับผิดชอบสูงเพราะทำงานออนไลน์เป็นหลัก",
                daily_pay: "450",
                likes: 1,
                upvoted_by: [user1],
                bookmarked_by: [],
                interview_questions: [
                    { question_no: 1, question_title: "เขียนคำสั่ง SQL JOIN และใช้ Window Function (ROW_NUMBER / RANK) เพื่อดึงยอดขายสูงสุดของแต่ละหมวดหมู่", difficulty: "ปานกลาง" },
                    { question_no: 2, question_title: "อธิบายแนวคิด ETL และ ELT ว่าแตกต่างกันอย่างไร", difficulty: "ง่าย" }
                ],
                comments: []
            },
            {
                review_id: 4,
                user_id: user1,
                author_name: "สมชาย สายโค้ด",
                company_id: 4,
                company_name: "Agoda",
                industry_type: "เทคโนโลยี / ท่องเที่ยว",
                job_id: 4,
                job_name: "Backend Software Engineer Intern",
                skills: ["Node.js", "PostgreSQL", "Docker", "REST API"],
                is_anonymous: false,
                description: "สภาพแวดล้อมการทำงานเป็นนานาชาติ ใช้ภาษาอังกฤษในการสื่อสารทั้งหมด ได้ฝึกเขียน Unit Test และดูแล Microservices ที่รองรับผู้ใช้งานจำนวนมาก",
                work_mode: "Hybrid",
                rating_culture: 5,
                rating_workload: 4,
                rating_mentor: 4,
                pros: "ค่าตอบแทนสูง ได้ฝึกภาษาอังกฤษทุกวัน สวัสดิการอาหารและฟิตเนสครบ",
                cons: "การสัมภาษณ์ค่อนข้างเข้มข้น ต้องเตรียมตัวเรื่อง Data Structures & Algorithms มาอย่างดี",
                daily_pay: "800",
                likes: 2,
                upvoted_by: [user2, user3],
                bookmarked_by: [],
                interview_questions: [
                    { question_no: 1, question_title: "โจทย์ Algorithm บน LeetCode ระดับ Medium เรื่อง Hash Map และ Sliding Window", difficulty: "ยาก" },
                    { question_no: 2, question_title: "การออกแบบ Database Schema สำหรับระบบจองโรงแรมเพื่อไม่ให้เกิดการจองซ้ำ (Double Booking)", difficulty: "ยาก" }
                ],
                comments: []
            }
        ];

        await Review.insertMany(sampleReviews);
        console.log(`✅ เพิ่มข้อมูลรีวิว (INTERNSHIP_REVIEW) ลงใน MongoDB สำเร็จจำนวน ${sampleReviews.length} รายการ!`);
        console.log("\n🎉 เสร็จสมบูรณ์! คุณสามารถเข้าสู่ระบบด้วยบัญชีต่อไปนี้:");
        console.log("   - รหัสนักศึกษา: 67090500400 | รหัสผ่าน: password123");
        console.log("   - รหัสนักศึกษา: 67090500401 | รหัสผ่าน: password123");
        console.log("   - รหัสนักศึกษา: 67090500402 | รหัสผ่าน: password123");
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการ Seed ข้อมูล:", error);
    } finally {
        await mongoose.disconnect();
        await pgPool.end();
    }
}

seedDatabase();

