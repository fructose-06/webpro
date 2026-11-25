/**
 * สคริปต์สำหรับเพิ่มข้อมูลตั้งต้น (Seed Data) ครอบคลุมทุก Scenario ของ Internsight
 * - PostgreSQL (ตาราง public.users)
 * - MongoDB (Collections: internshipreviews, companies, jobroles, techskills)
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
const Company = require("../models/company");
const JobRole = require("../models/jobRole");
const TechSkill = require("../models/techSkill");

const deriveKey = promisify(argon2);

const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
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

/** สร้างรูป Avatar แบบ SVG Data URI น้ำหนักเบา (ใช้งานได้ออฟไลน์ ไม่พึ่งลิงก์ภายนอก) */
function makeAvatarDataUri(initials, bgColor, fgColor = "#ffffff") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${bgColor}"/>
  <text x="64" y="75" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="700" fill="${fgColor}">${initials}</text>
</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** สร้างรูปประกอบรีวิวแบบ SVG Data URI น้ำหนักเบา สำหรับทดสอบแกลเลอรีรูปภาพ */
function makeReviewImageDataUri(title, subtitle, accentColor) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="16" fill="#f8fafc"/>
  <rect width="640" height="360" rx="16" fill="url(#bg)"/>
  <circle cx="540" cy="70" r="90" fill="${accentColor}" fill-opacity="0.12"/>
  <circle cx="90" cy="300" r="110" fill="${accentColor}" fill-opacity="0.1"/>
  <rect x="48" y="48" width="120" height="28" rx="14" fill="${accentColor}"/>
  <text x="108" y="67" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="#ffffff">INTERNSIGHT</text>
  <text x="48" y="175" font-family="sans-serif" font-size="30" font-weight="700" fill="#0f172a">${title}</text>
  <text x="48" y="215" font-family="sans-serif" font-size="18" fill="#475569">${subtitle}</text>
</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const COMPANIES = [
    { company_id: 1, company_name: "LINE MAN Wongnai", industry_type: "เทคโนโลยี / สตาร์ทอัพ" },
    { company_id: 2, company_name: "KBTG (Kasikorn Business-Technology Group)", industry_type: "การเงิน / ธนาคาร" },
    { company_id: 3, company_name: "SCB TechX", industry_type: "การเงิน / ธนาคาร" },
    { company_id: 4, company_name: "Agoda", industry_type: "เทคโนโลยี / ท่องเที่ยว" },
    { company_id: 5, company_name: "Shopee Thailand", industry_type: "อีคอมเมิร์ซ" },
    { company_id: 6, company_name: "True Digital Group", industry_type: "โทรคมนาคม / ดิจิทัล" },
    { company_id: 7, company_name: "Ascend Bit", industry_type: "การเงิน / บล็อกเชน" },
    { company_id: 8, company_name: "LSEG (Refinitiv)", industry_type: "การเงิน / ข้อมูลระดับโลก" },
    { company_id: 9, company_name: "Skooldio", industry_type: "เทคโนโลยีการศึกษา (EdTech)" },
    { company_id: 10, company_name: "BDMS Health Tech", industry_type: "สุขภาพ / การแพทย์" },
    { company_id: 11, company_name: "Sertis", industry_type: "AI / ดาต้า" },
    { company_id: 12, company_name: "Startup Lab Bangkok", industry_type: "เทคโนโลยี / สตาร์ทอัพ" }
];

const JOB_ROLES = [
    { job_id: 1, job_name: "Frontend Developer Intern" },
    { job_id: 2, job_name: "Backend Software Engineer Intern" },
    { job_id: 3, job_name: "Full Stack Developer Intern" },
    { job_id: 4, job_name: "UX/UI Designer Intern" },
    { job_id: 5, job_name: "Data Engineer Intern" },
    { job_id: 6, job_name: "Data Scientist Intern" },
    { job_id: 7, job_name: "QA / Software Tester Intern" },
    { job_id: 8, job_name: "Mobile Developer Intern" },
    { job_id: 9, job_name: "DevOps / Cloud Engineer Intern" },
    { job_id: 10, job_name: "Cybersecurity Intern" },
    { job_id: 11, job_name: "Product Manager Intern" }
];

const SAMPLE_USERS = [
    {
        key: "u1",
        student_code: "67090500400",
        email: "67090500400@st.sit.kmutt.ac.th",
        admission_year: 2567,
        user_name: "สมชาย สายโค้ด",
        profile_image: makeAvatarDataUri("SC", "#2563eb"),
        note: "บัญชีหลัก: มีรูปโปรไฟล์, มีรีวิวทั้งเปิดเผยและไม่ระบุตัวตน, มีหลาย Bookmark"
    },
    {
        key: "u2",
        student_code: "67090500401",
        email: "67090500401@st.sit.kmutt.ac.th",
        admission_year: 2567,
        user_name: "พิมพ์ชนก รักดีไซน์",
        profile_image: makeAvatarDataUri("PK", "#db2777"),
        note: "มีรูปโปรไฟล์, มีหลายรีวิว, คอมเมนต์และ Bookmark"
    },
    {
        key: "u3",
        student_code: "67090500402",
        email: "67090500402@st.sit.kmutt.ac.th",
        admission_year: 2567,
        user_name: "กิตติพงศ์ เดต้า",
        profile_image: null,
        note: "ไม่มีรูปโปรไฟล์ (ทดสอบ Fallback Icon), มีรีวิวทั้งเปิดเผยและไม่ระบุตัวตน"
    },
    {
        key: "u4",
        student_code: "66090500401",
        email: "66090500401@st.sit.kmutt.ac.th",
        admission_year: 2566,
        user_name: "ณัฐวุฒิ รุ่นพี่คลาวด์",
        profile_image: makeAvatarDataUri("NW", "#059669"),
        note: "รุ่นพี่ปี 2566 มีรูปโปรไฟล์และหลายรีวิว"
    },
    {
        key: "u5",
        student_code: "67090500403",
        email: "67090500403@st.sit.kmutt.ac.th",
        admission_year: 2567,
        user_name: "ชลธิชา ควอลิตี้",
        profile_image: null,
        note: "ไม่มีรูปโปรไฟล์, รีวิวสาย QA และ Product"
    },
    {
        key: "u6",
        student_code: "68090500405",
        email: "68090500405@st.sit.kmutt.ac.th",
        admission_year: 2568,
        user_name: null,
        profile_image: null,
        note: "ยังไม่ตั้งชื่อแสดง (user_name = null) และไม่มีรูปโปรไฟล์"
    },
    {
        key: "u7",
        student_code: "67090500404",
        email: "67090500404@st.sit.kmutt.ac.th",
        admission_year: 2567,
        user_name: "ปวริศ แอปโมบายล์",
        profile_image: makeAvatarDataUri("PW", "#7c3aed"),
        note: "มีเฉพาะรีวิวไม่ระบุตัวตน (ทดสอบ Public Profile ซ่อนรีวิวของคนอื่น แต่เจ้าของยังเห็น)"
    },
    {
        key: "u8",
        student_code: "68090500406",
        email: "68090500406@st.sit.kmutt.ac.th",
        admission_year: 2568,
        user_name: "นภัสสร มือใหม่",
        profile_image: null,
        note: "บัญชีว่าง: 0 รีวิว และ 0 Bookmark (ทดสอบ Empty State)"
    }
];

function buildSampleReviews(userByKey, companyById, jobById, skillIdByName) {
    const u1 = userByKey.u1;
    const u2 = userByKey.u2;
    const u3 = userByKey.u3;
    const u4 = userByKey.u4;
    const u5 = userByKey.u5;
    const u6 = userByKey.u6;
    const u7 = userByKey.u7;

    const makeReview = ({
        review_id,
        author,
        company_id,
        job_id,
        skills,
        is_anonymous = false,
        description,
        work_mode,
        rating_culture,
        rating_workload,
        rating_mentor,
        pros,
        cons,
        daily_pay,
        upvoted_by = [],
        bookmarked_by = [],
        images = [],
        interview_questions = [],
        comments = [],
        created_at
    }) => {
        const company = companyById.get(company_id);
        const job = jobById.get(job_id);
        const createdDate = new Date(created_at);
        return {
            review_id,
            user_id: author.user_id,
            author_name: is_anonymous
                ? "ผู้ไม่ประสงค์ออกนาม"
                : (author.user_name || "สมาชิก Internsight"),
            company_id: company.company_id,
            company_name: company.company_name,
            industry_type: company.industry_type,
            job_id: job.job_id,
            job_name: job.job_name,
            skills,
            skill_ids: skills.map((name) => skillIdByName.get(name)),
            images: images.map((img, idx) => ({ image_id: idx + 1, image: img })),
            is_anonymous,
            description,
            work_mode,
            rating_culture,
            rating_workload,
            rating_mentor,
            pros,
            cons,
            daily_pay,
            likes: upvoted_by.length,
            upvoted_by,
            bookmarked_by,
            interview_questions,
            comments,
            created_at: createdDate,
            updated_at: createdDate
        };
    };

    return [
        // 1. คะแนนสูง, Hybrid, 500 ฿ (300-500), มีรูปหลายรูป, มี Nested Comments + Edited + Comment Likes + Owner Reply
        makeReview({
            review_id: 1,
            author: u1,
            company_id: 1,
            job_id: 1,
            skills: ["React", "TypeScript", "TailwindCSS"],
            is_anonymous: false,
            description: "ได้ร่วมทีมทำฟีเจอร์หน้าเว็บหลักของระบบสั่งอาหาร พี่ๆ ในทีมเปิดโอกาสให้ลองเสนอไอเดียและทำ Code Review ให้ละเอียดมาก ได้เรียนรู้การทำงานแบบ Agile Scrum จริงๆ และได้ส่งโค้ดขึ้น Production ด้วย",
            work_mode: "Hybrid",
            rating_culture: 5,
            rating_workload: 4,
            rating_mentor: 5,
            pros: "พี่เลี้ยงสอนงานดีมาก มีขนมและเครื่องดื่มฟรี ออฟฟิศเดินทางสะดวกติด BTS",
            cons: "ช่วงปล่อยฟีเจอร์ใหญ่งานจะค่อนข้างเร่ง ต้องบริหารเวลาให้ดี",
            daily_pay: "500",
            upvoted_by: [u2.user_id, u3.user_id, u4.user_id, u5.user_id, u6.user_id],
            bookmarked_by: [
                { user_id: u1.user_id, created_at: new Date("2026-10-15T10:00:00Z") },
                { user_id: u2.user_id, created_at: new Date("2026-10-16T08:30:00Z") }
            ],
            images: [
                makeReviewImageDataUri("LINE MAN Wongnai", "บรรยากาศโซนทำงานทีม Frontend", "#00b14f"),
                makeReviewImageDataUri("Sprint Demo Day", "พรีเซนต์ฟีเจอร์ที่ทำต่อหน้าทีม Product", "#2563eb"),
                makeReviewImageDataUri("Pantry & Co-working", "มุมพักผ่อนและขนมฟรีตลอดวัน", "#f59e0b")
            ],
            interview_questions: [
                { question_no: 1, question_title: "อธิบายความแตกต่างระหว่าง Props กับ State ใน React และยกตัวอย่างการใช้งาน", difficulty: "ง่าย" },
                { question_no: 2, question_title: "โจทย์ Live Coding จัดการข้อมูล Array และแก้ปัญหา Re-render ที่ไม่จำเป็น", difficulty: "ปานกลาง" },
                { question_no: 3, question_title: "ออกแบบระบบ Cache ฝั่ง Client สำหรับหน้าค้นหาร้านอาหารที่มีผู้ใช้งานสูง", difficulty: "ยาก" }
            ],
            comments: [
                {
                    comment_no: 1,
                    parent_comment_no: null,
                    author_id: u2.user_id,
                    author_name: u2.user_name,
                    content: "ขอบคุณสำหรับรีวิวค่ะ สัมภาษณ์เป็นภาษาไทยหรือภาษาอังกฤษคะ?",
                    likes: 3,
                    liked_by: [u1.user_id, u3.user_id, u4.user_id],
                    is_edited: false,
                    created_at: new Date("2026-10-11T09:15:00Z"),
                    updated_at: new Date("2026-10-11T09:15:00Z")
                },
                {
                    comment_no: 2,
                    parent_comment_no: 1,
                    author_id: u1.user_id,
                    author_name: u1.user_name,
                    content: "สัมภาษณ์เป็นภาษาไทยครับ แต่โจทย์โค้ดดิ้งและเอกสารเทคนิคเป็นภาษาอังกฤษ (อัปเดตเพิ่มเติม: มีถามเรื่อง TypeScript ด้วยครับ)",
                    likes: 4,
                    liked_by: [u2.user_id, u3.user_id, u4.user_id, u5.user_id],
                    is_edited: true,
                    created_at: new Date("2026-10-11T10:00:00Z"),
                    updated_at: new Date("2026-10-11T10:30:00Z")
                },
                {
                    comment_no: 3,
                    parent_comment_no: 1,
                    author_id: u4.user_id,
                    author_name: u4.user_name,
                    content: "เสริมจากรุ่นพี่ครับ ถ้ามีโปรเจกต์ React บน GitHub แนะนำเตรียมเปิดอธิบายโค้ดด้วย",
                    likes: 2,
                    liked_by: [u1.user_id, u2.user_id],
                    is_edited: false,
                    created_at: new Date("2026-10-11T12:20:00Z"),
                    updated_at: new Date("2026-10-11T12:20:00Z")
                },
                {
                    comment_no: 4,
                    parent_comment_no: 1,
                    author_id: u2.user_id,
                    author_name: u2.user_name,
                    content: "ขอบคุณทั้งสองคนมากๆ เลยค่ะ เดี๋ยวจะลองเตรียม repo ไปโชว์ดูค่ะ",
                    likes: 1,
                    liked_by: [u1.user_id],
                    is_edited: false,
                    created_at: new Date("2026-10-11T14:00:00Z"),
                    updated_at: new Date("2026-10-11T14:00:00Z")
                },
                {
                    comment_no: 5,
                    parent_comment_no: null,
                    author_id: u6.user_id,
                    author_name: "สมาชิก Internsight",
                    content: "เข้าออฟฟิศสัปดาห์ละกี่วันครับ?",
                    likes: 0,
                    liked_by: [],
                    is_edited: false,
                    created_at: new Date("2026-10-12T16:45:00Z"),
                    updated_at: new Date("2026-10-12T16:45:00Z")
                }
            ],
            created_at: "2026-10-10T09:00:00Z"
        }),

        // 2. คะแนนเต็ม 5.0, Hybrid, 500 ฿, มี 1 รูป, มี Comment
        makeReview({
            review_id: 2,
            author: u2,
            company_id: 2,
            job_id: 4,
            skills: ["Figma", "Design System", "User Research"],
            is_anonymous: false,
            description: "ได้ออกแบบหน้าจอแอปพลิเคชันและทำ Usability Testing กับผู้ใช้จริง มีระบบ Design System ที่เป็นมาตรฐานระดับองค์กรขนาดใหญ่ ทำให้เข้าใจกระบวนการทำงานร่วมกับทีม Developer ได้ดีขึ้นมาก",
            work_mode: "Hybrid",
            rating_culture: 5,
            rating_workload: 5,
            rating_mentor: 5,
            pros: "ได้เรียนรู้ระบบ Design System ขนาดใหญ่ พี่ Mentor คอยแนะนำทุกสัปดาห์ กิจกรรม Bootcamp สนุกมาก",
            cons: "ตึกอยู่ที่เมืองทองธานี ถ้าไม่ได้อยู่แถวนั้นต้องเผื่อเวลาเดินทาง",
            daily_pay: "500",
            upvoted_by: [u1.user_id, u3.user_id, u4.user_id, u5.user_id],
            bookmarked_by: [
                { user_id: u1.user_id, created_at: new Date("2026-10-20T11:30:00Z") }
            ],
            images: [
                makeReviewImageDataUri("KBTG Bootcamp", "Workshop Design Thinking และ Usability Testing", "#138f2d")
            ],
            interview_questions: [
                { question_no: 1, question_title: "นำเสนอ Portfolio โปรเจกต์ที่ภูมิใจที่สุด และอธิบาย Design Process ตั้งแต่ออกแบบจนถึงทดสอบ", difficulty: "ปานกลาง" },
                { question_no: 2, question_title: "ถ้า Developer บอกว่าดีไซน์ที่เราออกแบบทำยากและใช้เวลานาน จะมีวิธีพูดคุยและแก้ไขอย่างไร", difficulty: "ง่าย" }
            ],
            comments: [
                {
                    comment_no: 1,
                    parent_comment_no: null,
                    author_id: u3.user_id,
                    author_name: u3.user_name,
                    content: "ใน Portfolio ต้องใส่กี่โปรเจกต์ดีครับถึงจะกำลังดี?",
                    likes: 1,
                    liked_by: [u2.user_id],
                    is_edited: false,
                    created_at: new Date("2026-10-06T11:00:00Z"),
                    updated_at: new Date("2026-10-06T11:00:00Z")
                },
                {
                    comment_no: 2,
                    parent_comment_no: 1,
                    author_id: u2.user_id,
                    author_name: u2.user_name,
                    content: "สัก 2–3 โปรเจกต์ที่เล่ากระบวนการคิดและผลลัพธ์ได้ละเอียดจะดีกว่าใส่เยอะแต่เล่าไม่ลึกค่ะ",
                    likes: 2,
                    liked_by: [u3.user_id, u1.user_id],
                    is_edited: false,
                    created_at: new Date("2026-10-06T13:10:00Z"),
                    updated_at: new Date("2026-10-06T13:10:00Z")
                }
            ],
            created_at: "2026-10-05T14:20:00Z"
        }),

        // 3. Anonymous, Remote, 450 ฿ (300-500), ถูก Bookmark โดย u1 (ทดสอบ Bookmark รีวิวไม่ระบุตัวตน)
        makeReview({
            review_id: 3,
            author: u3,
            company_id: 3,
            job_id: 5,
            skills: ["Python", "SQL", "Apache Airflow", "BigQuery"],
            is_anonymous: true,
            description: "ได้ทำ Data Pipeline และเขียน SQL จัดการข้อมูลขนาดใหญ่บน Cloud ได้ลองจับเครื่องมือจริงที่ไม่มีสอนในห้องเรียน พี่ๆ ในทีมให้คำแนะนำเรื่องการทำ Query Optimization ดีมาก",
            work_mode: "Remote",
            rating_culture: 4,
            rating_workload: 3,
            rating_mentor: 5,
            pros: "ทำงานแบบ WFH เกือบทั้งหมด ประหยัดค่าเดินทางและได้จับ Cloud จริง",
            cons: "ต้องมีความรับผิดชอบสูงเพราะทำงานออนไลน์เป็นหลัก บางช่วงต้องรอสิทธิ์เข้าถึงข้อมูลนาน",
            daily_pay: "450",
            upvoted_by: [u1.user_id, u2.user_id],
            bookmarked_by: [
                { user_id: u1.user_id, created_at: new Date("2026-10-25T15:00:00Z") }
            ],
            interview_questions: [
                { question_no: 1, question_title: "เขียนคำสั่ง SQL JOIN และใช้ Window Function (ROW_NUMBER / RANK) เพื่อดึงยอดขายสูงสุดของแต่ละหมวดหมู่", difficulty: "ปานกลาง" },
                { question_no: 2, question_title: "อธิบายแนวคิด ETL และ ELT ว่าแตกต่างกันอย่างไร", difficulty: "ง่าย" }
            ],
            comments: [],
            created_at: "2026-09-28T08:30:00Z"
        }),

        // 4. ยอดไลก์สูงสุด (6), Hybrid, 1000 ฿ (801+), มีรูป, คำถามยาก
        makeReview({
            review_id: 4,
            author: u1,
            company_id: 4,
            job_id: 2,
            skills: ["Node.js", "PostgreSQL", "Docker", "REST API"],
            is_anonymous: false,
            description: "สภาพแวดล้อมการทำงานเป็นนานาชาติ ใช้ภาษาอังกฤษในการสื่อสารทั้งหมด ได้ฝึกเขียน Unit Test และดูแล Microservices ที่รองรับผู้ใช้งานจำนวนมาก",
            work_mode: "Hybrid",
            rating_culture: 5,
            rating_workload: 4,
            rating_mentor: 5,
            pros: "ค่าตอบแทนสูงมาก ได้ฝึกภาษาอังกฤษทุกวัน สวัสดิการอาหารและฟิตเนสครบ",
            cons: "การสัมภาษณ์ค่อนข้างเข้มข้น ต้องเตรียมตัวเรื่อง Data Structures & Algorithms มาอย่างดี",
            daily_pay: "1000",
            upvoted_by: [u2.user_id, u3.user_id, u4.user_id, u5.user_id, u6.user_id, u7.user_id],
            bookmarked_by: [
                { user_id: u2.user_id, created_at: new Date("2026-09-22T10:00:00Z") },
                { user_id: u3.user_id, created_at: new Date("2026-09-23T09:00:00Z") }
            ],
            images: [
                makeReviewImageDataUri("Agoda Bangkok Office", "CentralWorld Offices ชั้นสูง วิวสวย", "#e11d48"),
                makeReviewImageDataUri("Engineering Sync", "ประชุมทีม Backend แบบ International", "#4f46e5")
            ],
            interview_questions: [
                { question_no: 1, question_title: "โจทย์ Algorithm บน LeetCode ระดับ Medium เรื่อง Hash Map และ Sliding Window", difficulty: "ยาก" },
                { question_no: 2, question_title: "ออกแบบ Database Schema สำหรับระบบจองโรงแรมเพื่อไม่ให้เกิดการจองซ้ำ (Double Booking)", difficulty: "ยาก" }
            ],
            comments: [
                {
                    comment_no: 1,
                    parent_comment_no: null,
                    author_id: u5.user_id,
                    author_name: u5.user_name,
                    content: "ภาษาอังกฤษต้องได้ระดับไหนคะ ถ้าพูดไม่คล่องมากแต่สื่อสารรู้เรื่องมีโอกาสไหมคะ?",
                    likes: 5,
                    liked_by: [u1.user_id, u2.user_id, u3.user_id, u4.user_id, u6.user_id],
                    is_edited: false,
                    created_at: new Date("2026-09-21T12:00:00Z"),
                    updated_at: new Date("2026-09-21T12:00:00Z")
                },
                {
                    comment_no: 2,
                    parent_comment_no: 1,
                    author_id: u1.user_id,
                    author_name: u1.user_name,
                    content: "เน้นสื่อสารแนวคิดการแก้ปัญหาให้รู้เรื่องครับ ไม่ต้องสำเนียงเป๊ะ แต่ต้องฟังโจทย์และอธิบายเหตุผลได้",
                    likes: 3,
                    liked_by: [u5.user_id, u2.user_id, u4.user_id],
                    is_edited: false,
                    created_at: new Date("2026-09-21T14:15:00Z"),
                    updated_at: new Date("2026-09-21T14:15:00Z")
                }
            ],
            created_at: "2026-09-20T10:00:00Z"
        }),

        // 5. On-site, 750 ฿ (501-800), Shopee Thailand
        makeReview({
            review_id: 5,
            author: u4,
            company_id: 5,
            job_id: 2,
            skills: ["Go", "MySQL", "Redis", "Docker"],
            is_anonymous: false,
            description: "อยู่ทีม Order Management System ได้เรียนรู้การรับมือ Traffic ช่วงแคมเปญเลขเบิ้ล (9.9 / 10.10) เขียน Service ด้วย Go และทำ Load Testing",
            work_mode: "On-site",
            rating_culture: 4,
            rating_workload: 3,
            rating_mentor: 4,
            pros: "ได้เห็นระบบ Scale ใหญ่จริง ออฟฟิศสวยมีห้องเกมและขนมเยอะ เบี้ยเลี้ยงดี",
            cons: "เข้าออฟฟิศทุกวันและช่วงแคมเปญงานค่อนข้างแน่น",
            daily_pay: "750",
            upvoted_by: [u1.user_id, u2.user_id, u3.user_id],
            bookmarked_by: [
                { user_id: u1.user_id, created_at: new Date("2026-11-01T09:00:00Z") }
            ],
            interview_questions: [
                { question_no: 1, question_title: "อธิบายการทำงานของ Goroutine และ Channel ในภาษา Go", difficulty: "ปานกลาง" },
                { question_no: 2, question_title: "เมื่อไหร่ควรใช้ Redis Cache และจะจัดการปัญหา Cache Invalidation อย่างไร", difficulty: "ยาก" }
            ],
            comments: [],
            created_at: "2026-09-12T11:00:00Z"
        }),

        // 6. Anonymous ของ u1 เอง (ทดสอบ: u1 เห็นในหน้าโปรไฟล์ตัวเอง แต่คนอื่นไม่เห็นใน Public Profile ของ u1)
        makeReview({
            review_id: 6,
            author: u1,
            company_id: 12,
            job_id: 3,
            skills: ["JavaScript", "Express", "MongoDB"],
            is_anonymous: true,
            description: "เป็นบริษัทสตาร์ทอัพขนาดเล็ก ได้ลองทำตั้งแต่หน้าบ้านยันหลังบ้าน แต่ยังไม่มีระบบ Code Review หรือ Mentor ที่ชัดเจน ต้องอาศัยค้นคว้าเองเป็นหลัก",
            work_mode: "On-site",
            rating_culture: 2,
            rating_workload: 2,
            rating_mentor: 1,
            pros: "ได้จับงานหลายด้านอย่างรวดเร็ว ไม่ต้องรอกระบวนการอนุมัตินาน",
            cons: "ไม่มีเบี้ยเลี้ยง Requirement เปลี่ยนบ่อย และไม่มีพี่เลี้ยงคอยโค้ชอย่างเป็นระบบ",
            daily_pay: "0",
            upvoted_by: [u3.user_id, u5.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "เคยทำเว็บด้วย MERN Stack มาก่อนไหม และเริ่มฝึกได้เมื่อไหร่", difficulty: "ง่าย" }
            ],
            comments: [],
            created_at: "2026-08-30T15:30:00Z"
        }),

        // 7. ไม่มีเบี้ยเลี้ยง ("" empty string), Remote, คะแนนปานกลาง, ไม่มีคำถามสัมภาษณ์
        makeReview({
            review_id: 7,
            author: u6,
            company_id: 9,
            job_id: 1,
            skills: ["React", "CSS", "Git"],
            is_anonymous: false,
            description: "ช่วยพัฒนาหน้า Landing Page และปรับปรุง Responsive ของคอร์สเรียนออนไลน์ ทีมเป็นกันเองมากและให้สิทธิ์เข้าเรียนคอร์สในแพลตฟอร์มฟรีตลอดการฝึกงาน",
            work_mode: "Remote",
            rating_culture: 5,
            rating_workload: 4,
            rating_mentor: 4,
            pros: "บรรยากาศอบอุ่น ยืดหยุ่นเวลาเรียนได้ และได้เรียนคอร์สออนไลน์ฟรี",
            cons: "เป็นโครงการฝึกงานระยะสั้นแบบไม่มีเบี้ยเลี้ยง",
            daily_pay: "",
            upvoted_by: [u1.user_id],
            bookmarked_by: [],
            interview_questions: [],
            comments: [],
            created_at: "2026-08-18T10:15:00Z"
        }),

        // 8. QA Intern, Hybrid, 400 ฿ (300-500), บริษัทซ้ำ LINE MAN Wongnai (ทดสอบ Filter บริษัทที่มีหลายรีวิว)
        makeReview({
            review_id: 8,
            author: u5,
            company_id: 1,
            job_id: 7,
            skills: ["Playwright", "Postman", "SQL"],
            is_anonymous: false,
            description: "ได้เขียน Automated Test ด้วย Playwright และทดสอบ API ด้วย Postman ก่อนปล่อย Release ทุกสัปดาห์ ทำให้เข้าใจวงจร SDLC และวิธีสื่อสาร Bug กับ Developer",
            work_mode: "Hybrid",
            rating_culture: 5,
            rating_workload: 4,
            rating_mentor: 5,
            pros: "พี่ QA ใจดีมาก มี Template เขียน Test Case ที่เป็นระบบ",
            cons: "วันก่อน Release ต้องช่วยทำ Regression Test ค่อนข้างละเอียดและใช้เวลา",
            daily_pay: "400",
            upvoted_by: [u1.user_id, u2.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "ถ้าต้องทดสอบหน้า Login จะออกแบบ Test Case ทั้ง Positive และ Negative อย่างไร", difficulty: "ง่าย" },
                { question_no: 2, question_title: "ความแตกต่างระหว่าง Smoke Testing กับ Regression Testing คืออะไร", difficulty: "ปานกลาง" }
            ],
            comments: [],
            created_at: "2026-08-05T09:45:00Z"
        }),

        // 9. Mobile Intern, Anonymous ของ u7 (บัญชีที่มีเฉพาะรีวิวไม่ระบุตัวตน), 600 ฿ (501-800), Hybrid
        makeReview({
            review_id: 9,
            author: u7,
            company_id: 2,
            job_id: 8,
            skills: ["Flutter", "Dart", "Firebase"],
            is_anonymous: true,
            description: "พัฒนาหน้าจอแอป Mobile Banking เวอร์ชันทดสอบด้วย Flutter ได้เรียนรู้ State Management และการเชื่อมต่อ REST API แบบปลอดภัย",
            work_mode: "Hybrid",
            rating_culture: 4,
            rating_workload: 4,
            rating_mentor: 4,
            pros: "ได้ฝึกเขียน Clean Architecture บนแอปจริง มีอุปกรณ์ทดสอบให้ยืมครบ",
            cons: "ขั้นตอนการขอสิทธิ์ Environment ภายในใช้เวลาพอสมควร",
            daily_pay: "600",
            upvoted_by: [u4.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "เปรียบเทียบ StatelessWidget กับ StatefulWidget ใน Flutter", difficulty: "ง่าย" }
            ],
            comments: [],
            created_at: "2026-07-25T13:00:00Z"
        }),

        // 10. DevOps / Cloud, On-site, 800 ฿ (501-800), มีรูป, คะแนนดี
        makeReview({
            review_id: 10,
            author: u4,
            company_id: 3,
            job_id: 9,
            skills: ["Docker", "Kubernetes", "AWS", "Linux"],
            is_anonymous: false,
            description: "ดูแล CI/CD Pipeline และเขียน Terraform จัดการ Infrastructure บน AWS ได้ฝึกตั้ง Monitoring ด้วย Prometheus และ Grafana",
            work_mode: "On-site",
            rating_culture: 4,
            rating_workload: 4,
            rating_mentor: 5,
            pros: "ได้ลองจับ Cloud และ Kubernetes จริงในสภาพแวดล้อมองค์กร เบี้ยเลี้ยงคุ้มค่า",
            cons: "ต้องเรียนรู้เครื่องมือใหม่พร้อมกันหลายตัวในช่วงเดือนแรก",
            daily_pay: "800",
            upvoted_by: [u1.user_id, u3.user_id, u5.user_id],
            bookmarked_by: [
                { user_id: u1.user_id, created_at: new Date("2026-10-02T17:20:00Z") }
            ],
            images: [
                makeReviewImageDataUri("SCB TechX Cloud Lab", "Workshop Kubernetes & CI/CD Pipeline", "#4c1d95")
            ],
            interview_questions: [
                { question_no: 1, question_title: "Docker Container ต่างจาก Virtual Machine อย่างไร", difficulty: "ง่าย" },
                { question_no: 2, question_title: "อธิบายขั้นตอนการทำงานของ CI/CD และแนวทาง Rollback เมื่อ Deploy พลาด", difficulty: "ปานกลาง" }
            ],
            comments: [
                {
                    comment_no: 1,
                    parent_comment_no: null,
                    author_id: u1.user_id,
                    author_name: u1.user_name,
                    content: "ก่อนไปฝึกต้องมี AWS Certificate ไหมครับ?",
                    likes: 2,
                    liked_by: [u3.user_id, u4.user_id],
                    is_edited: false,
                    created_at: new Date("2026-07-16T09:00:00Z"),
                    updated_at: new Date("2026-07-16T09:00:00Z")
                },
                {
                    comment_no: 2,
                    parent_comment_no: 1,
                    author_id: u4.user_id,
                    author_name: u4.user_name,
                    content: "ไม่จำเป็นครับ แค่เข้าใจพื้นฐาน Linux, Network และ Docker ก็สมัครได้เลย",
                    likes: 1,
                    liked_by: [u1.user_id],
                    is_edited: false,
                    created_at: new Date("2026-07-16T11:30:00Z"),
                    updated_at: new Date("2026-07-16T11:30:00Z")
                }
            ],
            created_at: "2026-07-15T10:30:00Z"
        }),

        // 11. Data Scientist, Remote, 900 ฿ (801+), Sertis
        makeReview({
            review_id: 11,
            author: u3,
            company_id: 11,
            job_id: 6,
            skills: ["Python", "Machine Learning", "PyTorch", "SQL"],
            is_anonymous: false,
            description: "ได้ทำโปรเจกต์ Computer Vision และทดลอง Fine-tune โมเดลร่วมกับทีมวิจัย พี่ๆ เก่งมากและมี Paper Reading Session ทุกสัปดาห์",
            work_mode: "Remote",
            rating_culture: 5,
            rating_workload: 4,
            rating_mentor: 5,
            pros: "งานท้าทายและได้ใช้ความรู้ AI/ML จริงๆ มี GPU Server ให้รัน Experiment",
            cons: "ต้องอ่านเปเปอร์ภาษาอังกฤษเยอะและเตรียมพื้นฐานคณิตศาสตร์มาให้แน่น",
            daily_pay: "900",
            upvoted_by: [u1.user_id, u2.user_id, u4.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "อธิบายปัญหา Overfitting และวิธีแก้ไขที่นิยมใช้", difficulty: "ง่าย" },
                { question_no: 2, question_title: "ความแตกต่างระหว่าง Precision, Recall และ F1-Score และควรเลือกใช้อันไหนกับข้อมูล Imbalanced", difficulty: "ปานกลาง" }
            ],
            comments: [],
            created_at: "2026-07-02T16:00:00Z"
        }),

        // 12. Cybersecurity, On-site, 650 ฿ (501-800), True Digital Group
        makeReview({
            review_id: 12,
            author: u4,
            company_id: 6,
            job_id: 10,
            skills: ["OWASP", "Linux", "Python"],
            is_anonymous: false,
            description: "ช่วยทีม Security ทำ Vulnerability Assessment และตรวจสอบ OWASP Top 10 บนระบบ Staging ได้ลองเขียนสคริปต์ช่วยสแกน Log อัตโนมัติ",
            work_mode: "On-site",
            rating_culture: 4,
            rating_workload: 4,
            rating_mentor: 4,
            pros: "ออฟฟิศอยู่ที่ True Digital Park เดินทางง่าย อาหารการกินครบ พี่ทีม Security ใจดี",
            cons: "เข้าออฟฟิศเต็มสัปดาห์เพราะข้อกำหนดด้านความปลอดภัยข้อมูล",
            daily_pay: "650",
            upvoted_by: [u3.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "อธิบายช่องโหว่ SQL Injection และ XSS พร้อมวิธีป้องกัน", difficulty: "ปานกลาง" }
            ],
            comments: [],
            created_at: "2026-06-20T09:00:00Z"
        }),

        // 13. Full Stack, Remote, 1200 ฿ (801+), LSEG (Refinitiv) — ค่าตอบแทนสูงสุด
        makeReview({
            review_id: 13,
            author: u1,
            company_id: 8,
            job_id: 3,
            skills: ["React", "TypeScript", "Node.js", "AWS"],
            is_anonymous: false,
            description: "ทำงานกับทีม Global Engineering พัฒนาเครื่องมือวิเคราะห์ข้อมูลตลาดการเงิน ประชุม Daily Standup กับเพื่อนร่วมทีมที่ลอนดอนและสิงคโปร์ทุกวัน",
            work_mode: "Remote",
            rating_culture: 5,
            rating_workload: 5,
            rating_mentor: 4,
            pros: "Work-life balance ดีมาก เบี้ยเลี้ยงสูง และได้ประสบการณ์ทำงานระดับ Global",
            cons: "บางประชุมจัดช่วงเย็นตามเวลาอังกฤษ",
            daily_pay: "1200",
            upvoted_by: [u2.user_id, u3.user_id, u4.user_id, u5.user_id],
            bookmarked_by: [
                { user_id: u2.user_id, created_at: new Date("2026-06-15T10:00:00Z") }
            ],
            interview_questions: [
                { question_no: 1, question_title: "อธิบาย Event Loop และ Asynchronous Programming ใน JavaScript", difficulty: "ปานกลาง" },
                { question_no: 2, question_title: "ถ้าหน้าเว็บแสดงข้อมูล Real-time จำนวนมากจนกระตุก จะ Optimize อย่างไร", difficulty: "ยาก" }
            ],
            comments: [],
            created_at: "2026-06-10T11:30:00Z"
        }),

        // 14. Product Manager Intern, Hybrid, 500 ฿ (300-500), Shopee Thailand
        makeReview({
            review_id: 14,
            author: u5,
            company_id: 5,
            job_id: 11,
            skills: ["SQL", "Figma", "User Research"],
            is_anonymous: false,
            description: "ได้ช่วยเก็บ Requirement เขียน PRD และวิเคราะห์ Funnel พฤติกรรมผู้ใช้ด้วย SQL เพื่อเสนอแนวทางปรับปรุงอัตรา Conversion",
            work_mode: "Hybrid",
            rating_culture: 4,
            rating_workload: 3,
            rating_mentor: 4,
            pros: "ได้เห็นภาพรวมธุรกิจตั้งแต่ต้นน้ำถึงปลายน้ำ ทำงานร่วมกับทั้ง Tech และ Business",
            cons: "งานเอกสารและการประสานงานเยอะ ต้องสื่อสารชัดเจน",
            daily_pay: "500",
            upvoted_by: [],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "ถ้าอัตราการกดซื้อสินค้าลดลง 15% ในสัปดาห์ที่ผ่านมา คุณจะเริ่มตรวจสอบจากอะไร", difficulty: "ปานกลาง" }
            ],
            comments: [],
            created_at: "2026-05-28T14:00:00Z"
        }),

        // 15. Anonymous, On-site, 300 ฿ (300-500), BDMS Health Tech, 0 likes, 0 comments
        makeReview({
            review_id: 15,
            author: u2,
            company_id: 10,
            job_id: 4,
            skills: ["Figma", "CSS", "User Research"],
            is_anonymous: true,
            description: "ออกแบบหน้าจอระบบนัดหมายแพทย์สำหรับผู้สูงอายุ เน้นเรื่อง Accessibility ขนาดตัวอักษร และความชัดเจนของปุ่มกด",
            work_mode: "On-site",
            rating_culture: 4,
            rating_workload: 4,
            rating_mentor: 3,
            pros: "ได้เรียนรู้โจทย์ด้าน Healthcare และ Accessibility ที่น่าสนใจมาก",
            cons: "ระเบียบการแต่งกายค่อนข้างเรียบร้อยกว่าบริษัท Tech ทั่วไป",
            daily_pay: "300",
            upvoted_by: [],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "หลักการออกแบบ UI ให้ผู้สูงอายุใช้งานได้ง่ายมีอะไรบ้าง", difficulty: "ง่าย" }
            ],
            comments: [],
            created_at: "2026-05-14T08:45:00Z"
        }),

        // 16. Blockchain / Backend, Remote, 850 ฿ (801+), Ascend Bit
        makeReview({
            review_id: 16,
            author: u3,
            company_id: 7,
            job_id: 2,
            skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
            is_anonymous: false,
            description: "พัฒนา Backend API สำหรับระบบสะสมแต้มและ Digital Wallet ได้ฝึกเขียน Integration Test และจัดการ Transaction ให้ปลอดภัย",
            work_mode: "Remote",
            rating_culture: 4,
            rating_workload: 4,
            rating_mentor: 5,
            pros: "WFH 100% พี่เลี้ยงพร้อมตอบคำถามตลอด และได้เรียนรู้เทคโนโลยี Web3 เพิ่มเติม",
            cons: "ไม่ค่อยได้เจอเพื่อนร่วมทีมแบบตัวจริง",
            daily_pay: "850",
            upvoted_by: [u1.user_id, u4.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "อธิบาย ACID Properties ของ Database Transaction", difficulty: "ปานกลาง" }
            ],
            comments: [],
            created_at: "2026-04-22T10:00:00Z"
        }),

        // 17. บริษัทซ้ำ Agoda, Hybrid, 700 ฿ (501-800), Data Engineer
        makeReview({
            review_id: 17,
            author: u4,
            company_id: 4,
            job_id: 5,
            skills: ["Python", "SQL", "Apache Airflow"],
            is_anonymous: false,
            description: "สร้าง Data Pipeline ดึงข้อมูลการค้นหาโรงแรมมาทำ Dashboard รายวัน ทีมใช้มาตรฐานโค้ดสูงและเน้น Automation ทุกขั้นตอน",
            work_mode: "Hybrid",
            rating_culture: 5,
            rating_workload: 4,
            rating_mentor: 4,
            pros: "ข้อมูลมหาศาลและระบบทันสมัยมาก ได้ฝึกทำงานร่วมกับทีมต่างชาติ",
            cons: "Onboarding สัปดาห์แรกข้อมูลเยอะมาก ต้องจดโน้ตให้ดี",
            daily_pay: "700",
            upvoted_by: [u3.user_id],
            bookmarked_by: [],
            interview_questions: [
                { question_no: 1, question_title: "จะออกแบบ Data Pipeline อย่างไรให้รันซ้ำได้โดยไม่เกิดข้อมูลซ้ำ (Idempotency)", difficulty: "ยาก" }
            ],
            comments: [],
            created_at: "2026-04-05T13:20:00Z"
        }),

        // 18. Anonymous ของ u7 อีก 1 รีวิว, On-site, ไม่มีเบี้ยเลี้ยง ("0"), คะแนนต่ำ, ไม่มีคำถามสัมภาษณ์ (ทดสอบ Sort เก่าสุด & คะแนนต่ำสุด)
        makeReview({
            review_id: 18,
            author: u7,
            company_id: 12,
            job_id: 8,
            skills: ["Flutter", "Git"],
            is_anonymous: true,
            description: "ช่วยแก้บั๊กหน้าแอปและอัปเดต UI ตามที่ได้รับมอบหมาย งานค่อนข้างกระชั้นชิดและต้องเรียนรู้งานเองเป็นส่วนใหญ่",
            work_mode: "On-site",
            rating_culture: 2,
            rating_workload: 2,
            rating_mentor: 2,
            pros: "ออฟฟิศอยู่ใกล้รถไฟฟ้า เดินทางสะดวก",
            cons: "ไม่มีเบี้ยเลี้ยงและตารางงานค่อนข้างแน่นช่วงใกล้ส่งลูกค้า",
            daily_pay: "0",
            upvoted_by: [],
            bookmarked_by: [],
            interview_questions: [],
            comments: [],
            created_at: "2026-03-10T09:00:00Z"
        })
    ];
}

async function seedDatabase() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("กรุณาตั้งค่า MONGO_URI ในไฟล์ .env");
        }

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

        // 2. เพิ่ม/อัปเดตข้อมูลผู้ใช้ตั้งต้น (USER) ลงใน PostgreSQL
        const defaultPasswordHash = await hashPassword("password123");
        const userByKey = {};
        for (const u of SAMPLE_USERS) {
            const res = await pgPool.query(
                `INSERT INTO public.users (student_code, password_hash, email, admission_year, user_name, profile_image)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (student_code) DO UPDATE
                 SET password_hash = EXCLUDED.password_hash,
                     email = EXCLUDED.email,
                     admission_year = EXCLUDED.admission_year,
                     user_name = EXCLUDED.user_name,
                     profile_image = EXCLUDED.profile_image
                 RETURNING user_id, student_code, user_name, profile_image`,
                [u.student_code, defaultPasswordHash, u.email, u.admission_year, u.user_name, u.profile_image]
            );
            userByKey[u.key] = res.rows[0];
        }
        console.log(`✅ เตรียมข้อมูล USER ใน PostgreSQL สำเร็จ (${SAMPLE_USERS.length} บัญชี, รหัสผ่าน: password123)`);

        // 3. เตรียม Master Maps และรายการรีวิวทั้งหมด
        const companyById = new Map(COMPANIES.map((c) => [c.company_id, c]));
        const jobById = new Map(JOB_ROLES.map((j) => [j.job_id, j]));

        // สร้างรายการ TechSkill ทั้งหมดจากรีวิว (รอบแรกใช้ map ชั่วคราวเพื่อดึง unique skills)
        const allSkillNames = [
            "React", "TypeScript", "TailwindCSS", "Figma", "Design System", "User Research",
            "Python", "SQL", "Apache Airflow", "BigQuery", "Node.js", "PostgreSQL", "Docker",
            "REST API", "Go", "MySQL", "Redis", "JavaScript", "Express", "MongoDB", "CSS",
            "Git", "Playwright", "Postman", "Flutter", "Dart", "Firebase", "Kubernetes",
            "AWS", "Linux", "Machine Learning", "PyTorch", "OWASP"
        ];
        const techSkills = allSkillNames.map((skill_name, idx) => ({
            skill_id: idx + 1,
            skill_name
        }));
        const skillIdByName = new Map(techSkills.map((s) => [s.skill_name, s.skill_id]));

        const sampleReviews = buildSampleReviews(userByKey, companyById, jobById, skillIdByName);

        // ตรวจสอบความถูกต้องตาม Mongoose Schema ก่อนบันทึกลง DB
        for (const [Model, docs] of [
            [Company, COMPANIES],
            [JobRole, JOB_ROLES],
            [TechSkill, techSkills],
            [Review, sampleReviews]
        ]) {
            for (const doc of docs) {
                await new Model(doc).validate();
            }
        }

        // 4. ล้างและบันทึกข้อมูลลง MongoDB (INTERNSHIP_REVIEW + Master Collections)
        await Promise.all([
            Review.deleteMany({}),
            Company.deleteMany({}),
            JobRole.deleteMany({}),
            TechSkill.deleteMany({})
        ]);

        await Promise.all([
            Company.insertMany(COMPANIES),
            JobRole.insertMany(JOB_ROLES),
            TechSkill.insertMany(techSkills)
        ]);
        await Review.insertMany(sampleReviews);

        console.log(`✅ เพิ่มข้อมูลรีวิว (INTERNSHIP_REVIEW) สำเร็จ ${sampleReviews.length} รายการ (3 หน้า Pagination)`);
        console.log(`✅ ซิงค์ Master Collections สำเร็จ: ${COMPANIES.length} บริษัท, ${JOB_ROLES.length} ตำแหน่ง, ${techSkills.length} ทักษะ`);
        console.log("\n🎉 เสร็จสมบูรณ์! บัญชีทดสอบทั้งหมด (รหัสผ่าน: password123):");
        for (const u of SAMPLE_USERS) {
            console.log(`   - ${u.student_code} (${u.user_name || "ยังไม่ตั้งชื่อ"}) — ${u.note}`);
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการ Seed ข้อมูล:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        await pgPool.end();
    }
}

seedDatabase();
