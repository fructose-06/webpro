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

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const submit = form.querySelector('[type="submit"]');
	if (submit.disabled) return;
	submit.disabled = true;
	try {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ studentId: new FormData(form).get("studentId"), password: password.value })
		});
		if (response.status === 204) {
			location.replace("home.html");
			return;
		}
		showMessage((await response.json()).message);
	} catch {
		showMessage("ติดต่อระบบเข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง");
	} finally {
		submit.disabled = false;
	}
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
