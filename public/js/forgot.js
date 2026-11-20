const $ = (selector) => document.querySelector(selector);
const step1 = $('#step1');
const step2 = $('#step2');
const message = $('#message');
const resend = $('#resend');

let studentId = '';
let timer;

function show(text, ok = false) {
  message.textContent = text;
  message.hidden = !text;
  message.classList.toggle('ok', ok);
}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

function goToStep(n) {
  step1.hidden = n !== 1;
  step2.hidden = n !== 2;
  $('#intro').textContent = n === 1
      ? 'กรอกรหัสนักศึกษา เราจะส่งรหัส OTP ไปที่อีเมลที่ลงทะเบียนไว้'
      : `ถ้ามีบัญชี ${studentId} ในระบบ เราส่งรหัส OTP ไปที่อีเมลแล้ว รหัสหมดอายุใน 5 นาที`;
  show('');
  (n === 1 ? $('#student-id') : $('#otp')).focus();
}

function startCooldown(seconds = 60) {
  clearInterval(timer);
  let left = seconds;
  resend.disabled = true;
  timer = setInterval(() => {
    left--;
    resend.textContent = left > 0 ? `ส่งรหัสอีกครั้ง (${left})` : 'ส่งรหัสอีกครั้ง';
    if (left <= 0) {
      clearInterval(timer);
      resend.disabled = false;
    }
  }, 1000);
  resend.textContent = `ส่งรหัสอีกครั้ง (${left})`;
}

async function requestOtp() {
  const { ok } = await post('/api/auth/forgot', { studentId });
  if (!ok) throw new Error('ส่งรหัส OTP ไม่ได้ กรุณาลองอีกครั้ง');
}

// ขอ OTP
step1.addEventListener('submit', async (event) => {
  event.preventDefault();
  studentId = $('#student-id').value.trim();
  try {
    await requestOtp();
    goToStep(2);
    startCooldown();
  } catch (error) {
    show(error.message);
  }
});

resend.addEventListener('click', async () => {
  try {
    await requestOtp();
    show('ส่งรหัสใหม่แล้ว กรุณาตรวจอีเมล', true);
    startCooldown();
  } catch (error) {
    show(error.message);
  }
});

$('#change-id').addEventListener('click', () => goToStep(1));

$('#show-pw').addEventListener('change', (event) => {
  const type = event.target.checked ? 'text' : 'password';
  $('#new-pw').type = type;
  $('#confirm-pw').type = type;
});

// ยืนยัน OTP และเปลี่ยนรหัสผ่าน
step2.addEventListener('submit', async (event) => {
  event.preventDefault();
  const replacement = $('#new-pw').value;
  if (replacement.length < 8 || !/[A-Za-z]/.test(replacement) || !/\d/.test(replacement)) {
    return show('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัว และมีทั้งตัวอักษรภาษาอังกฤษกับตัวเลข');
  }
  if (replacement !== $('#confirm-pw').value) return show('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');

  const { ok, data } = await post('/api/auth/reset', {
    studentId,
    otp: $('#otp').value.trim(),
    replacement,
  });
  if (!ok) return show(data.message || 'เปลี่ยนรหัสผ่านไม่ได้ กรุณาลองอีกครั้ง');

  show('เปลี่ยนรหัสผ่านแล้ว กำลังไปหน้าเข้าสู่ระบบ…', true);
  setTimeout(() => (location.href = 'login.html'), 1500);
});