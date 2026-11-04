// แบบฟอร์ม Frontend เท่านั้น ยังไม่สร้างบัญชีจริงหรือเก็บรหัสผ่าน
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

form.addEventListener("submit", (event) => {
	event.preventDefault();
	validateConfirmation();
	if (!form.reportValidity()) return;
	message.textContent =
		"ข้อมูลผ่านการตรวจเบื้องต้นแล้ว แต่ยังไม่ได้สร้างบัญชี เนื่องจากหน้านี้ยังไม่ได้เชื่อม Backend";
	dialog.showModal();
});

document.querySelector("#register-kmutt").addEventListener("click", () => {
	message.textContent =
		"ปุ่มนี้เตรียมไว้สำหรับเชื่อม KMUTT Account ยังไม่ได้เชื่อมระบบยืนยันตัวตนจริง";
	dialog.showModal();
});
