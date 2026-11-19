/**
 * ข้อมูลสมมติสำหรับทดสอบ: 16 บัญชี 20 บริษัท 10 ตำแหน่ง และ 124 รีวิว
 * เพิ่มรีวิวอีก 124 รายการโดยไม่ล้างข้อมูลเดิม: node scripts/seed2.js
 * ใช้บัญชี บริษัท ตำแหน่ง และทักษะเดิมถ้ามีแล้ว
 * บัญชีที่สร้างใหม่ใช้รหัสผ่าน password123 บัญชีเดิมจะไม่ถูกเปลี่ยนรหัส
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { Pool } = require("pg");
const { argon2, randomBytes } = require("node:crypto");
const { promisify } = require("node:util");
const Review = require("../models/review");
const Company = require("../models/company");
const JobRole = require("../models/jobRole");
const TechSkill = require("../models/techSkill");

/** @typedef {{ user_id: number, student_code: string, user_name: string }} SeedUser */

const names = ["เมฆ", "ฟ้า", "ต้น", "ใบเตย", "แพรว", "นนท์", "มิน", "ปัน",
    "ข้าว", "น้ำ", "ดาว", "ภูมิ", "พลอย", "บีม", "อิง", "พีท"];
const companies = Array.from({ length: 20 }, (_, index) => ({
    company_id: index + 1,
    company_name: ["เมฆา", "ใบไม้", "แสงดาว", "สายลม", "ภูผา"][index % 5]
        + " " + ["ดิจิทัล", "แล็บ", "โซลูชัน", "เทค"][Math.floor(index / 5)] + " (สมมติ)",
    industry_type: ["เทคโนโลยี", "การเงิน", "การศึกษา", "สุขภาพ", "อีคอมเมิร์ซ"][index % 5]
}));
const roles = [
    { job_id: 1, job_name: "Frontend Developer Intern", skills: ["React", "TypeScript", "CSS"], task: "พัฒนาหน้าค้นหาและปรับเว็บให้รองรับมือถือ", question: "จะจัดการสถานะของฟอร์มและแสดงข้อผิดพลาดอย่างไร" },
    { job_id: 2, job_name: "Backend Developer Intern", skills: ["Node.js", "PostgreSQL", "REST API"], task: "สร้าง API และเขียนการตรวจข้อมูลก่อนบันทึก", question: "จะป้องกันการบันทึกข้อมูลซ้ำใน API อย่างไร" },
    { job_id: 3, job_name: "UX/UI Designer Intern", skills: ["Figma", "User Research", "Design System"], task: "ออกแบบหน้าจอและทดลองใช้งานกับผู้ใช้", question: "เลือกปรับดีไซน์จากผลทดสอบผู้ใช้อย่างไร" },
    { job_id: 4, job_name: "Data Engineer Intern", skills: ["Python", "SQL", "Apache Airflow"], task: "สร้างกระบวนการนำเข้าข้อมูลและตรวจข้อมูลที่ขาดหาย", question: "ถ้าข้อมูลต้นทางมีแถวซ้ำจะจัดการอย่างไร" },
    { job_id: 5, job_name: "QA Engineer Intern", skills: ["Playwright", "Postman", "Test Design"], task: "เขียนกรณีทดสอบและทดสอบระบบอัตโนมัติ", question: "จะเลือกกรณีทดสอบหน้าเข้าสู่ระบบอย่างไร" },
    { job_id: 6, job_name: "Mobile Developer Intern", skills: ["Flutter", "Dart", "Firebase"], task: "พัฒนาหน้าแอปและจัดการสถานะขณะโหลดข้อมูล", question: "ถ้าอินเทอร์เน็ตหลุดระหว่างบันทึกข้อมูลจะออกแบบอย่างไร" },
    { job_id: 7, job_name: "DevOps Intern", skills: ["Docker", "Linux", "GitHub Actions"], task: "จัดทำขั้นตอนทดสอบและนำระบบขึ้นใช้งาน", question: "ถ้าการนำระบบขึ้นใช้งานล้มเหลวจะย้อนกลับอย่างไร" },
    { job_id: 8, job_name: "Data Analyst Intern", skills: ["SQL", "Power BI", "Excel"], task: "สรุปข้อมูลยอดขายและสร้างแดชบอร์ด", question: "จะตรวจสอบความถูกต้องของตัวเลขบนแดชบอร์ดอย่างไร" },
    { job_id: 9, job_name: "Security Intern", skills: ["OWASP", "Linux", "Python"], task: "ตรวจสิทธิ์การเข้าถึงและจัดทำรายงานช่องโหว่ในระบบทดสอบ", question: "การยืนยันตัวตนต่างจากการตรวจสิทธิ์อย่างไร" },
    { job_id: 10, job_name: "Full Stack Developer Intern", skills: ["Vue", "Express", "MongoDB"], task: "พัฒนาระบบจองตั้งแต่หน้าฟอร์มจนถึงฐานข้อมูล", question: "จะป้องกันผู้ใช้สองคนจองรายการเดียวกันพร้อมกันอย่างไร" }
];
const skills = [...new Set(roles.flatMap(role => role.skills))]
    .map((skill_name, index) => ({ skill_id: index + 1, skill_name }));
const sampleUsers = names.map((name, index) => ({
    student_code: String(67090500900 + index),
    email: "internsight-seed2-" + index + "@example.com",
    admission_year: 2567,
    user_name: name + " (บัญชีทดสอบ)"
}));

/** @param {SeedUser[]} users */
function buildReviews(users) {
    if (users.length !== 16) throw new Error("ต้องมีบัญชีตัวอย่างครบ 16 บัญชี");
    return Array.from({ length: 124 }, (_, index) => {
        // เว้นบัญชีสุดท้ายไว้ทดสอบหน้าโปรไฟล์ที่ยังไม่มีรีวิว
        const author = users[index % 15];
        const company = companies[index % companies.length];
        const role = roles[(index + Math.floor(index / 20)) % roles.length];
        const createdAt = new Date(Date.UTC(2026, 0, 1 + index * 2, 9));
        const commenter = users[(index + 1) % 15];
        const anonymous = index % 4 === 0;
        const voters = users.filter(user => user.user_id !== author.user_id).slice(0, index % 9);
        const comments = index % 3 === 0 ? [] : [
            { comment_no: 1, parent_comment_no: null, author_id: commenter.user_id,
                author_name: commenter.user_name, content: "ก่อนเริ่มฝึกควรเตรียมพื้นฐานอะไรบ้าง?",
                created_at: new Date(createdAt.getTime() + 3600000), updated_at: new Date(createdAt.getTime() + 3600000) },
            { comment_no: 2, parent_comment_no: 1, author_id: author.user_id,
                author_name: anonymous ? "ผู้เขียนไม่ระบุชื่อ" : author.user_name,
                content: "แนะนำให้ลองทำโปรเจกต์เล็ก ๆ ด้วย " + role.skills[0] + " และฝึกอ่านเอกสารครับ",
                created_at: new Date(createdAt.getTime() + 7200000), updated_at: new Date(createdAt.getTime() + 7200000) }
        ];
        return {
            review_id: index + 1, user_id: author.user_id, author_name: author.user_name,
            company_id: company.company_id, company_name: company.company_name,
            industry_type: company.industry_type, job_id: role.job_id, job_name: role.job_name,
            skills: role.skills, skill_ids: role.skills.map(name => {
                const skill = skills.find(item => item.skill_name === name);
                if (!skill) throw new Error("ไม่พบรหัสทักษะ: " + name);
                return skill.skill_id;
            }),
            images: [], is_anonymous: anonymous,
            description: "ข้อมูลสมมติสำหรับทดสอบรายการที่ " + (index + 1) + ": ได้" + role.task
                + " ในโปรเจกต์" + ["ระบบสมาชิก", "ร้านค้าออนไลน์", "จองห้องประชุม", "คลังสินค้า", "ติดตามงาน", "จัดการคอร์สเรียน"][Math.floor(index / 20) % 6]
                + " " + ["มีพี่เลี้ยงช่วยตรวจงานทุกสัปดาห์และได้ฝึกอธิบายเหตุผลในการออกแบบ",
                    "เริ่มจากงานเล็กก่อนแล้วค่อยรับผิดชอบฟีเจอร์ ได้ฝึกวางแผนและทดสอบงาน",
                    "ต้องค้นคว้าด้วยตัวเองค่อนข้างมาก แต่สามารถนัดคุยกับทีมเมื่อมีคำถาม",
                    "ได้ทำงานร่วมกับหลายฝ่ายและเรียนรู้การปรับขอบเขตงานให้ทันกำหนด"][index % 4],
            work_mode: ["On-site", "Hybrid", "Remote"][Math.floor(index / 4) % 3],
            rating_culture: 1 + index % 5,
            rating_workload: 1 + Math.floor(index / 3) % 5,
            rating_mentor: 1 + Math.floor(index / 7) % 5,
            pros: ["มีเวลาสำหรับเรียนรู้เครื่องมือ", "ทีมช่วยตรวจงานและให้คำแนะนำ", "ได้ทดลองงานหลายส่วน", "มีเอกสารเริ่มต้นและตัวอย่างให้ศึกษา"][index % 4],
            cons: ["ต้องเผื่อเวลาเดินทาง", "เอกสารบางส่วนยังไม่ครบ", "ช่วงส่งงานต้องจัดลำดับความสำคัญ", "ประชุมหลายช่วงจึงต้องแบ่งเวลาทำงาน"][Math.floor(index / 4) % 4],
            daily_pay: ["", "0", "250", "350", "500", "650", "800", "1000"][index % 8],
            likes: voters.length, upvoted_by: voters.map(user => user.user_id),
            bookmarked_by: users.slice(0, index % 5).map(user => ({
                user_id: user.user_id, created_at: new Date(createdAt.getTime() + 10800000)
            })),
            interview_questions: [
                { question_no: 1, question_title: role.question, difficulty: ["ง่าย", "ปานกลาง", "ยาก"][index % 3] },
                ...Array.from({ length: index % 3 }, (_, questionIndex) => ({
                    question_no: questionIndex + 2,
                    question_title: ["เล่าโปรเจกต์ที่เคยทำและปัญหาที่แก้ด้วยตนเอง", "ถ้างานใกล้กำหนดส่งแต่ยังมีข้อผิดพลาดจะสื่อสารกับทีมอย่างไร"][questionIndex],
                    difficulty: "ปานกลาง"
                }))
            ],
            comments, created_at: createdAt, updated_at: createdAt
        };
    });
}

/** @param {ReturnType<typeof buildReviews>} reviews */
async function validateData(reviews) {
    for (const [Model, rows] of [[Review, reviews], [Company, companies],
        [JobRole, roles], [TechSkill, skills]]) {
        for (const row of rows) {
            await new Model(row).validate();

        }
    }
    if (new Set(reviews.map(review => review.review_id)).size !== reviews.length) {
        throw new Error("รหัสรีวิวซ้ำ");
    }
}

async function main() {
    const previewUsers = sampleUsers.map((user, index) => ({ ...user, user_id: index + 1 }));
    await validateData(buildReviews(previewUsers));
    if (!process.env.MONGO_URI) throw new Error("ต้องตั้ง MONGO_URI ใน .env");
    if (typeof argon2 !== "function") throw new Error("Node.js รุ่นนี้ไม่มี crypto.argon2 ให้ใช้รุ่นเดียวกับที่รัน server.js ได้");
    const pool = new Pool({
        host: process.env.PG_HOST, port: Number(process.env.PG_PORT || 5432),
        user: process.env.PG_USER, password: process.env.PG_PASSWORD, database: process.env.PG_DATABASE
    });
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const salt = randomBytes(16);
        const digest = await promisify(argon2)("argon2id", {
            message: Buffer.from("password123"), nonce: salt, memory: 19456,
            passes: 2, parallelism: 1, tagLength: 32
        });
        const passwordHash = "$argon2id$v=19$m=19456,t=2,p=1$"
            + salt.toString("base64").replace(/=+$/, "") + "$" + digest.toString("base64").replace(/=+$/, "");
        // ใช้ตาราง users ที่ระบบสมัครสมาชิกสร้างไว้แล้ว ไม่เปลี่ยนข้อมูลบัญชีเดิม
        /** @type {SeedUser[]} */
        const users = [];
        for (const user of sampleUsers) {
            await pool.query(
                "INSERT INTO public.users (student_code, password_hash, email, admission_year, user_name) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (student_code) DO NOTHING",
                [user.student_code, passwordHash, user.email, user.admission_year, user.user_name]
            );
            const result = await pool.query("SELECT user_id, student_code, user_name FROM public.users WHERE student_code = $1", [user.student_code]);
            if (result.rows.length !== 1) throw new Error("ไม่พบบัญชีตัวอย่าง: " + user.student_code);
            users.push(result.rows[0]);
        }
        // อ้างรหัสจริงจากฐานข้อมูล และเพิ่มเฉพาะข้อมูลกลางที่ยังไม่มี
        const companyIds = new Map();
        const roleIds = new Map();
        const skillIds = new Map();
        const lastCompany = await Company.findOne().sort({ company_id: -1 }).lean();
        const lastRole = await JobRole.findOne().sort({ job_id: -1 }).lean();
        const lastSkill = await TechSkill.findOne().sort({ skill_id: -1 }).lean();
        let companyId = lastCompany?.company_id || 0;
        let roleId = lastRole?.job_id || 0;
        let skillId = lastSkill?.skill_id || 0;
        for (const company of companies) {
            const existing = await Company.findOne({ company_name: company.company_name }).lean();
            const saved = existing || await Company.create({ ...company, company_id: ++companyId });
            companyIds.set(company.company_id, saved.company_id);
        }
        for (const role of roles) {
            const existing = await JobRole.findOne({ job_name: role.job_name }).lean();
            const saved = existing || await JobRole.create({ job_id: ++roleId, job_name: role.job_name });
            roleIds.set(role.job_id, saved.job_id);
        }
        for (const skill of skills) {
            const existing = await TechSkill.findOne({ skill_name: skill.skill_name }).lean();
            const saved = existing || await TechSkill.create({ ...skill, skill_id: ++skillId });
            skillIds.set(skill.skill_id, saved.skill_id);
        }
        const lastReview = await Review.findOne({ review_id: { $type: "number" } })
            .sort({ review_id: -1 }).lean();
        const reviewOffset = lastReview?.review_id || 0;
        const reviews = buildReviews(users).map(review => ({
            ...review,
            review_id: reviewOffset + review.review_id,
            company_id: companyIds.get(review.company_id),
            job_id: roleIds.get(review.job_id),
            skill_ids: review.skill_ids.map(id => skillIds.get(id))
        }));
        await validateData(reviews);
        await Review.insertMany(reviews);
        console.log({ event: "เพิ่มข้อมูลสมมติสำเร็จ", reviews: reviews.length, users: users.length });
        console.log("บัญชีใหม่: 67090500900 ถึง 67090500915 | รหัสผ่าน: password123");
        console.log("บัญชี 67090500915 ไม่มีรีวิว สำหรับทดสอบหน้าโปรไฟล์ว่าง");
    } finally {
        await Promise.all([mongoose.disconnect(), pool.end()]);
    }
}

main().catch(error => {
    console.error({ event: "seed2_failed", message: error.message });
    process.exitCode = 1;
});
