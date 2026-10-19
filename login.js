// ตัวอย่าง Frontend: ยังไม่ส่งข้อมูลไปยัง server และไม่เก็บรหัสผ่าน
const form = document.querySelector("#login-form");
const password = document.querySelector("#password");
const togglePassword = document.querySelector("#toggle-password");
const dialog = document.querySelector("#demo-dialog");
const message = document.querySelector("#dialog-message");

function showMessage(text) {
	message.textContent = text;
	dialog.showModal();
}

togglePassword.addEventListener("click", () => {
	const showPassword = password.type === "password";
	password.type = showPassword ? "text" : "password";
	togglePassword.setAttribute("aria-pressed", String(showPassword));
	togglePassword.setAttribute(
		"aria-label",
		showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน",
	);
});

form.addEventListener("submit", (event) => {
	event.preventDefault();
	// Browser ตรวจ required และ pattern ก่อนมาถึงจุดนี้
	showMessage(
		"กรอกข้อมูลครบแล้ว หน้านี้เป็นตัวอย่าง Frontend ยังไม่ได้ตรวจสอบบัญชีกับระบบจริง",
	);
	// เมื่อมี Backend ให้นำ studentId และ password ส่งไปยัง Login API ผ่าน HTTPS
});

const demoMessages = {
	forgot: "ยังไม่ได้เชื่อมหน้ากู้คืนรหัสผ่าน สามารถเปลี่ยนปุ่มนี้เป็นลิงก์ไปหน้าดังกล่าวได้ภายหลัง",
	signup: "ยังไม่ได้เชื่อมหน้าสมัครสมาชิก สามารถเปลี่ยนปุ่มนี้เป็นลิงก์ไปหน้าสมัครสมาชิกของโปรเจกต์ได้",
	kmutt: "ยังไม่ได้เชื่อมระบบ KMUTT Account ปุ่มนี้เตรียมไว้สำหรับเชื่อมระบบยืนยันตัวตนของมหาวิทยาลัย",
};

document.querySelectorAll("[data-demo]").forEach((button) => {
	button.addEventListener("click", () =>
		showMessage(demoMessages[button.dataset.demo]),
	);
});
