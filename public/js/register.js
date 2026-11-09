const form = document.querySelector("#register-form");
const password = document.querySelector("#new-password");
const confirmation = document.querySelector("#confirm-password");
const yearSelect = document.querySelector("#admission-year");
const dialog = document.querySelector("#register-dialog");
const message = document.querySelector("#dialog-message");

// ปรับปีเริ่มต้นได้ตามกลุ่มผู้ใช้ของโปรเจกต์
const earliestAdmissionYear = 2503;
const currentBuddhistYear = new Date().getFullYear() + 543;
for (let year = currentBuddhistYear; year >= earliestAdmissionYear; year--) {
	const option = document.createElement("option");
	option.value = String(year);
	option.textContent = String(year);
	yearSelect.append(option);
}

document.querySelectorAll("[data-password]").forEach((button) => {
	button.addEventListener("click", () => {
		const input = document.getElementById(button.dataset.password);
		const visible = input.type === "password";
		input.type = visible ? "text" : "password";
		button.setAttribute("aria-pressed", String(visible));
		const suffix = input === confirmation ? "รหัสผ่านที่ยืนยัน" : "รหัสผ่าน";
		button.setAttribute("aria-label", (visible ? "ซ่อน" : "แสดง") + suffix);
	});
});

function validateConfirmation() {
	confirmation.setCustomValidity(
		confirmation.value && password.value !== confirmation.value
			? "รหัสผ่านทั้งสองช่องไม่ตรงกัน"
			: "",
	);
}
password.addEventListener("input", validateConfirmation);
confirmation.addEventListener("input", validateConfirmation);

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	validateConfirmation();
	if (!form.reportValidity()) return;
	const submit = form.querySelector('button[type="submit"]');
	if (submit.disabled) return;
	submit.disabled = true;
	try {
		const fields = new FormData(form);
		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				studentId: fields.get("studentId"),
				admissionYear: Number(fields.get("admissionYear")),
				email: fields.get("email"),
				password: password.value
			})
		});
		if (response.status === 201) {
			form.reset();
			message.textContent = "สร้างบัญชีสำเร็จ กดปิดเพื่อไปหน้าเข้าสู่ระบบ";
			dialog.addEventListener("close", () => location.assign("login.html"), { once: true });
		} else {
			message.textContent = response.headers.get("content-type")?.includes("application/json")
				? (await response.json()).message
				: "เซิร์ฟเวอร์รับคำขอสมัครไม่ได้ กรุณาลองอีกครั้ง";
		}
	} catch (error) {
		console.error({ event: "registration_request_failed", type: error.name });
		message.textContent = "ติดต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองอีกครั้ง";
	} finally {
		submit.disabled = false;
	}
	dialog.showModal();
});

document.querySelector("#register-kmutt").addEventListener("click", () => {
	message.textContent =
		"ปุ่มนี้เตรียมไว้สำหรับเชื่อม KMUTT Account ยังไม่ได้เชื่อมระบบยืนยันตัวตนจริง";
	dialog.showModal();
});
