/**
 * ชื่อบริษัทจริง แต่รีวิว คะแนน ค่าตอบแทน คำถามสัมภาษณ์ และความคิดเห็นทั้งหมดเป็นเรื่องจำลอง
 * ไม่ใช่ข้อมูลการรับสมัครหรือคำรับรองเกี่ยวกับบริษัท ไม่ใช้ภาพบุคคลหรือสำนักงานปลอม
 * ข้อมูลสมมติสำหรับทดสอบ: 24 บัญชี 12 บริษัท 10 ตำแหน่ง และ 180 รีวิว
 * เพิ่มรีวิวอีก 180 รายการโดยไม่ล้างข้อมูลเดิม: node scripts/seed3.js
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
    "ข้าว", "น้ำ", "ดาว", "ภูมิ", "พลอย", "บีม", "อิง", "พีท", "เจน", "กาย", "แป้ง", "เจ", "นุ่น", "เต้", "พิม", "ออม"];
const companies = [
    {
        "company_id": 1,
        "company_name": "Agoda",
        "industry_type": "ท่องเที่ยวและจองที่พัก"
    },
    {
        "company_id": 2,
        "company_name": "LINE MAN Wongnai",
        "industry_type": "แพลตฟอร์มอาหารและบริการ"
    },
    {
        "company_id": 3,
        "company_name": "SCB TechX",
        "industry_type": "เทคโนโลยีการเงิน"
    },
    {
        "company_id": 4,
        "company_name": "KBTG",
        "industry_type": "เทคโนโลยีการเงิน"
    },
    {
        "company_id": 5,
        "company_name": "True Digital Group",
        "industry_type": "เทคโนโลยีและบริการดิจิทัล"
    },
    {
        "company_id": 6,
        "company_name": "AIS",
        "industry_type": "โทรคมนาคม"
    },
    {
        "company_id": 7,
        "company_name": "LINE Thailand",
        "industry_type": "แพลตฟอร์มดิจิทัล"
    },
    {
        "company_id": 8,
        "company_name": "Shopee",
        "industry_type": "อีคอมเมิร์ซ"
    },
    {
        "company_id": 9,
        "company_name": "Lazada",
        "industry_type": "อีคอมเมิร์ซ"
    },
    {
        "company_id": 10,
        "company_name": "Ascend Money",
        "industry_type": "เทคโนโลยีการเงิน"
    },
    {
        "company_id": 11,
        "company_name": "G-Able",
        "industry_type": "บริการเทคโนโลยีสารสนเทศ"
    },
    {
        "company_id": 12,
        "company_name": "MFEC",
        "industry_type": "บริการเทคโนโลยีสารสนเทศ"
    }
];
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
    student_code: String(65090500470 + index),
    email: "internsight-seed3-" + index + "@example.com",
    admission_year: 2565,
    user_name: name + " (บัญชีทดสอบ)"
}));


const scenarios = [
    { experience: "สัปดาห์แรกใช้เวลาติดตั้งเครื่องมือและอ่านโค้ดเก่า พอเริ่มเข้าใจโครงสร้างจึงรับงานแก้บั๊กเล็ก ๆ ก่อนส่งฟีเจอร์แรก ตอนเปิด pull request ได้คำแนะนำเรื่องตั้งชื่อและแยกหน้าที่ของโค้ด ทำให้กลับมาปรับงานอย่างเป็นระบบมากขึ้น", pros: "ได้ฝึกอ่านโค้ดของทีมและได้รับข้อเสนอแนะที่นำไปแก้ได้จริง", cons: "ควรเผื่อเวลาทำความเข้าใจระบบเดิม ไม่ควรประเมินงานจากจำนวนบรรทัดอย่างเดียว" },
    { experience: "ได้รับโจทย์ทำต้นแบบจากความต้องการสั้น ๆ ต้องนัดถามผู้ใช้งานและเขียนขอบเขตให้ตรงกันก่อนเริ่ม ช่วงกลางฝึกนำงานไปทดลองกับเพื่อนในทีมแล้วพบกรณีที่คิดไม่ถึง เช่น ข้อมูลว่างและการกรอกซ้ำ จึงเพิ่มกรณีทดสอบก่อนสาธิตรอบสุดท้าย", pros: "ได้เห็นงานตั้งแต่เก็บความต้องการจนถึงทดสอบกับผู้ใช้", cons: "การเปลี่ยนความต้องการทำให้ต้องปรับแผน ควรแบ่งงานเป็นชิ้นเล็ก" },
    { experience: "ทำงานเป็นรอบสัปดาห์ เริ่มวันด้วยการบอกความคืบหน้าและสิ่งที่ติดอยู่ พยายามจดคำถามพร้อมสิ่งที่ลองแล้วก่อนคุยกับพี่เลี้ยง จากเดิมที่รอคำตอบทุกขั้นเริ่มค้นเอกสารและเสนอทางเลือกได้เอง งานท้ายช่วงฝึกเป็นการเขียนคู่มือส่งต่อให้คนถัดไป", pros: "ได้ฝึกสื่อสารความคืบหน้าและอธิบายเหตุผลของทางเลือก", cons: "ต้องจัดเวลาอ่านเอกสารควบคู่กับส่งงาน โดยเฉพาะช่วงเริ่มใช้เครื่องมือใหม่" },
    { experience: "โจทย์หลักเกี่ยวกับการจัดการข้อมูลตัวอย่างที่รูปแบบไม่เหมือนกัน เริ่มจากทำรายการปัญหาแล้วสร้างชุดทดสอบ ครึ่งหลังเน้นตรวจผลลัพธ์กับคนที่ดูแลโจทย์และปรับให้รองรับข้อมูลผิดรูปแบบ สิ่งที่ได้เรียนรู้มากที่สุดคือผลลัพธ์ที่รันผ่านไม่ได้แปลว่าถูกตามความต้องการเสมอ", pros: "ได้ฝึกตรวจความถูกต้องและอธิบายข้อจำกัดของข้อมูล", cons: "งานตรวจข้อมูลละเอียดกว่าที่คาด ต้องมีสมาธิและเก็บตัวอย่างปัญหาให้ครบ" },
    { experience: "ทำต้นแบบร่วมกับเพื่อนฝึกงานอีกคน แบ่งหน้าที่และตกลงรูปแบบข้อมูลกันก่อนเริ่ม ใช้ branch แยกแล้วตรวจงานให้กัน ตอนรวมงานเจอชื่อฟิลด์ไม่ตรงจึงทำตัวอย่างข้อมูลกลางไว้ สัปดาห์สุดท้ายสาธิตงานและอธิบายส่วนที่ยังทำไม่ครบอย่างตรงไปตรงมา", pros: "ได้ฝึกทำงานเป็นทีม ใช้ Git และตกลงขอบเขตระหว่างส่วนงาน", cons: "ต้องเผื่อเวลารวมงานและทดสอบร่วมกัน ไม่ควรรวมทุกอย่างในวันส่ง" },
    { experience: "เริ่มจากศึกษาตัวอย่างที่ทำงานได้แล้วลองปรับโจทย์ให้ยากขึ้น พอเจอปัญหาจึงสร้างกรณีเล็ก ๆ เพื่อหาสาเหตุ แทนการแก้หลายจุดพร้อมกัน ช่วงท้ายสรุปขั้นตอนตั้งค่าและข้อผิดพลาดที่พบบ่อย ทำให้คนอื่นทดลองงานต่อได้โดยไม่ต้องถามทุกขั้น", pros: "ได้ฝึกหาสาเหตุของปัญหาและเขียนเอกสารที่คนอื่นทำตามได้", cons: "บางงานใช้เวลาทดลองมากกว่าที่วางไว้ ต้องแจ้งความคืบหน้าเมื่อเริ่มติดนาน" }
];
const outcomes = [
    "ท้ายช่วงฝึกได้สาธิตฟีเจอร์และตอบคำถามเรื่องข้อจำกัดของงานด้วยตัวเอง",
    "ผลงานที่ส่งต่อมีทั้งต้นแบบ ชุดข้อมูลทดสอบ และคู่มือเริ่มใช้งาน",
    "ได้กลับมาแก้งานหลังรับความคิดเห็นอีกรอบ ทำให้เข้าใจว่าการส่งงานครั้งแรกยังไม่ใช่จุดจบ",
    "นำสิ่งที่เรียนรู้มาสรุปเป็นบันทึกประจำสัปดาห์เพื่อใช้เขียนรายงานฝึกงาน",
    "ได้ฝึกประมาณเวลาและแยกสิ่งที่จำเป็นต้องเสร็จออกจากส่วนที่ค่อยเพิ่มภายหลัง",
    "สิ่งที่พัฒนาชัดที่สุดคือการตั้งคำถามให้ตรงจุดและนำเสนอสิ่งที่ได้ลองไปแล้ว"
];
const preparation = [
    "เตรียมโปรเจกต์เล็ก ๆ ที่อธิบายการตัดสินใจของตัวเองได้ ไม่จำเป็นต้องใช้เครื่องมือเยอะ",
    "ฝึกอ่าน error และค้นเอกสารทางการ พร้อมจดขั้นตอนที่ทำให้เกิดปัญหาซ้ำได้",
    "ทบทวน Git พื้นฐาน โดยเฉพาะ branch, commit และการอ่าน diff ก่อนส่งงาน",
    "ลองเขียน README ให้เพื่อนติดตั้งโปรเจกต์ตาม จะเห็นจุดที่ยังอธิบายไม่ชัด",
    "ฝึกแบ่งงานเป็นรายการเล็ก ๆ และบอกทีมล่วงหน้าเมื่อคิดว่าจะส่งไม่ทัน",
    "เตรียมตัวอย่างทั้งกรณีใช้งานปกติและกรณีข้อมูลผิด เพื่ออธิบายวิธีทดสอบ"
];
const commentQuestions = ["ก่อนเริ่มควรเตรียมพื้นฐานอะไรเป็นพิเศษไหมครับ?", "ตอนติดปัญหาควรถามพี่เลี้ยงแบบไหนให้เข้าใจง่ายครับ?", "ถ้ามีแค่โปรเจกต์ในวิชาจะเริ่มเตรียมพอร์ตอย่างไรดี?", "มีวิธีจดงานระหว่างฝึกเพื่อกลับมาทำรายงานไหมครับ?"];
const commentAnswers = ["ในสถานการณ์จำลองนี้ เริ่มจากพื้นฐานของเครื่องมือที่ใช้และการอ่านเอกสารครับ", "ควรแนบขั้นตอนที่ลอง ผลที่คาดหวัง และผลที่เกิดขึ้นจริง จะคุยกันง่ายขึ้นครับ", "เลือกงานที่เล่าได้ว่ารับผิดชอบอะไร เจอปัญหาอะไร และแก้อย่างไรครับ", "จดโจทย์ สิ่งที่ทำ ผลลัพธ์ และบทเรียนทุกสัปดาห์ โดยไม่ใส่ข้อมูลภายในบริษัทครับ"];

/** @param {SeedUser[]} users */
function buildReviews(users) {
    if (users.length !== 24) throw new Error("ต้องมีบัญชีตัวอย่างครบ 24 บัญชี");
    return Array.from({ length: 180 }, (_, index) => {
        // เว้นบัญชีสุดท้ายไว้ทดสอบหน้าโปรไฟล์ที่ยังไม่มีรีวิว
        const author = users[index % 23];
        const company = companies[index % companies.length];
        const role = roles[(index + Math.floor(index / companies.length)) % roles.length];
        const createdAt = new Date(Date.UTC(2025, 0, 1 + index * 2, 9));
        const commenter = users[(index + 1) % 23];
        const anonymous = index % 4 === 0;
        const voters = users.filter(user => user.user_id !== author.user_id).slice(0, index % 9);
        const comments = index % 3 === 0 ? [] : [
            { comment_no: 1, parent_comment_no: null, author_id: commenter.user_id,
                author_name: commenter.user_name, content: commentQuestions[index % commentQuestions.length],
                created_at: new Date(createdAt.getTime() + 3600000), updated_at: new Date(createdAt.getTime() + 3600000) },
            { comment_no: 2, parent_comment_no: 1, author_id: author.user_id,
                author_name: anonymous ? "ผู้เขียนไม่ระบุชื่อ" : author.user_name,
                content: commentAnswers[index % commentAnswers.length] + " ลองฝึก " + role.skills[0] + " จากโปรเจกต์เล็ก ๆ ก่อนก็ช่วยได้ครับ",
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
            description: "[ข้อมูลจำลองสำหรับเดโม ไม่ใช่ประสบการณ์หรือเงื่อนไขจริงของบริษัท]\n\n"
                + "ฝึกงานตำแหน่ง " + role.job_name + " เป็นเวลา " + ["10 สัปดาห์", "12 สัปดาห์", "4 เดือน", "หนึ่งภาคการศึกษา"][index % 4]
                + " งานหลักคือ" + role.task + " โดยใช้ " + role.skills.join(", ") + "\n\n"
                + scenarios[Math.floor(index / roles.length) % scenarios.length].experience + "\n\n"
                + outcomes[index % outcomes.length] + " สิ่งที่อยากแนะนำรุ่นน้องคือ " + preparation[(index + Math.floor(index / 12)) % preparation.length],
            work_mode: ["On-site", "Hybrid", "Remote"][Math.floor(index / 4) % 3],
            rating_culture: 3 + index % 3,
            rating_workload: 3 + Math.floor(index / 3) % 3,
            rating_mentor: 3 + Math.floor(index / 7) % 3,
            pros: "[จำลอง] " + scenarios[Math.floor(index / roles.length) % scenarios.length].pros,
            cons: "[จำลอง] " + scenarios[Math.floor(index / roles.length) % scenarios.length].cons,
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
            comments, created_at: createdAt, updated_at: comments.length ? comments[comments.length - 1].updated_at : createdAt
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
            if (result.rows[0].student_code !== user.student_code) throw new Error("บัญชีตัวอย่างไม่ตรงกับรหัสที่ร้องขอ");
            const owner = await pool.query("SELECT email FROM public.users WHERE user_id = $1", [result.rows[0].user_id]);
            if (owner.rows[0]?.email !== user.email) throw new Error("รหัสบัญชี seed3 ซ้ำกับบัญชีอื่น: " + user.student_code);
            users.push(result.rows[0]);
        }
        // อ้างรหัสจริงจากฐานข้อมูล และเพิ่มเฉพาะข้อมูลกลางที่ยังไม่มี
        /** @type {Map<number, number>} */
        const companyIds = new Map();
        /** @type {Map<number, number>} */
        const roleIds = new Map();
        /** @type {Map<number, number>} */
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
        console.log("บัญชีใหม่: 65090500470 ถึง 65090500493 | รหัสผ่าน: password123");
        console.log("บัญชี 65090500493 ไม่มีรีวิว สำหรับทดสอบหน้าโปรไฟล์ว่าง");
    } finally {
        await Promise.all([mongoose.disconnect(), pool.end()]);
    }
}

if (require.main === module) main().catch(error => {
    console.error({ event: "seed3_failed", message: error.message });
    process.exitCode = 1;
});

module.exports = { buildReviews, validateData, sampleUsers, companies, roles, skills };
