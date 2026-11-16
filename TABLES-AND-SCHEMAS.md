# ตารางและสคีมาของ Internsight ตาม ER

แบบเชิงสัมพันธ์ตาม ER ของทีมประกอบด้วย 8 ตารางหลักและ 3 ตารางเชื่อม **ตัวหนาในวงเล็บ** คือคีย์หลัก (PK) ถ้ามีตัวหนาสองช่อง ให้ใช้สองช่องร่วมกันเป็นคีย์หลัก เครื่องหมาย → แสดงว่าคีย์นอก (FK) อ้างถึงช่องไหน

## ตารางหลัก

**USER** (**user_id**, email, password_hash, student_code, admission_year, user_name, profile_image)

**COMPANY** (**company_id**, company_name, industry_type)

**JOB_ROLE** (**job_id**, job_name)

**INTERNSHIP_REVIEW** (**review_id**, user_id, company_id, job_id, work_mode, description, rating_mentor, rating_workload, rating_culture, pros, cons, daily_pay, created_at, updated_at, is_anonymous)  
↳ user_id → USER.user_id · company_id → COMPANY.company_id · job_id → JOB_ROLE.job_id

**TECH_SKILL** (**skill_id**, skill_name)

**IMAGE** (**image_id**, image, review_id)  
↳ review_id → INTERNSHIP_REVIEW.review_id

**INTERVIEW_QUESTION** (**review_id**, **question_no**, question_title, difficulty)  
↳ review_id → INTERNSHIP_REVIEW.review_id

**REVIEW_COMMENT** (**review_id**, **comment_no**, user_id, content, created_at, updated_at, parent_comment_no)  
↳ review_id → INTERNSHIP_REVIEW.review_id · user_id → USER.user_id  
↳ (review_id, parent_comment_no) → REVIEW_COMMENT(review_id, comment_no)  
ความคิดเห็นหลักใช้ parent_comment_no = NULL ส่วนคำตอบกลับใช้เลขความคิดเห็นแม่ในรีวิวเดียวกัน

## ตารางเชื่อม

**REVIEW_SKILL** (**review_id**, **skill_id**)  
↳ review_id → INTERNSHIP_REVIEW.review_id · skill_id → TECH_SKILL.skill_id

**UPVOTES** (**user_id**, **review_id**)  
↳ user_id → USER.user_id · review_id → INTERNSHIP_REVIEW.review_id

**BOOKMARKS** (**user_id**, **review_id**, created_at)  
↳ user_id → USER.user_id · review_id → INTERNSHIP_REVIEW.review_id  
created_at คือเวลาที่สมาชิกกดบันทึกรีวิว

โปรเจกต์ปัจจุบันเก็บบัญชีใน PostgreSQL ที่ public.users และเก็บรีวิวพร้อมข้อมูลย่อยใน MongoDB ที่ internshipreviews ส่วน 11 ตารางข้างต้นแสดงโครงสร้างตามแบบ ER ของทีม
