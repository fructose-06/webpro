lucide.createIcons();

const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');

const showTab = (name) => {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === name;
    tab.classList.toggle('active', isActive);
    tab.toggleAttribute('aria-current', isActive);
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    showTab(tab.dataset.tab);
    history.replaceState(null, '', `#${tab.dataset.tab}`); // เก็บแท็บไว้ใน URL
  });
});

showTab(location.hash === '#account' ? 'account' : 'profile');

const dialog = document.querySelector('#confirm-dialog');
const dialogTitle = document.querySelector('#confirm-title');
const dialogText = document.querySelector('#confirm-text');
const dialogList = document.querySelector('#confirm-list');
const dialogOk = document.querySelector('#confirm-ok');
const dialogBack = document.querySelector('#confirm-back');


const confirmDialog = ({ title, text, items = [], okText, backText = 'กลับไปแก้ไข' }) =>
  new Promise((resolve) => {
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    dialogOk.textContent = okText;
    dialogBack.textContent = backText;
    dialogList.replaceChildren(
      ...items.map((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        return li;
      })
    );
    dialog.returnValue = '';
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.showModal();
  });

dialogOk.addEventListener('click', () => dialog.close('ok'));
dialogBack.addEventListener('click', () => dialog.close('back'));

const toast = document.querySelector('#toast');
let toastTimer;

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
};


const profileForm = document.querySelector('#profile-form');
const nameInput = document.querySelector('#display-name');
const modeRadios = document.querySelectorAll('input[name="mode"]');
const profileSave = document.querySelector('#profile-save');
const profileCancel = document.querySelector('#profile-cancel');

const readProfile = () => ({
  name: nameInput.value.trim(),
  mode: [...modeRadios].find((radio) => radio.checked).value,
});

const modeLabel = (value) =>
  document.querySelector(`input[name="mode"][value="${value}"]`).parentElement.textContent.trim();

let savedProfile = readProfile(); 

const refreshProfileButtons = () => {
  const now = readProfile();
  const changed = now.name !== savedProfile.name || now.mode !== savedProfile.mode;
  profileSave.disabled = !changed || now.name === ''; 
  profileCancel.disabled = !changed;
};

['input', 'change'].forEach((type) => profileForm.addEventListener(type, refreshProfileButtons));

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const now = readProfile();
  const items = [];
  if (now.name !== savedProfile.name) items.push(`ชื่อที่แสดง: ${savedProfile.name} → ${now.name}`);
  if (now.mode !== savedProfile.mode) {
    items.push(`โหมดเริ่มต้น: ${modeLabel(savedProfile.mode)} → ${modeLabel(now.mode)}`);
  }

  const ok = await confirmDialog({
    title: 'บันทึกการเปลี่ยนแปลง?',
    text: 'ข้อมูลโปรไฟล์สาธารณะจะถูกอัปเดต และแสดงให้ผู้อื่นเห็น',
    items,
    okText: 'บันทึก',
  });
  if (!ok) return;

  savedProfile = now; 
  nameInput.value = now.name;
  refreshProfileButtons();
  showToast('บันทึกการเปลี่ยนแปลงแล้ว');
});

profileCancel.addEventListener('click', async () => {
  const ok = await confirmDialog({
    title: 'ยกเลิกการแก้ไข?',
    text: 'การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป และกลับเป็นค่าเดิม',
    okText: 'ยกเลิกการแก้ไข',
    backText: 'แก้ไขต่อ',
  });
  if (!ok) return;

  nameInput.value = savedProfile.name;
  document.querySelector(`input[name="mode"][value="${savedProfile.mode}"]`).checked = true;
  refreshProfileButtons();
});


const pwButton = document.querySelector('.btn-change');
const pwForm = document.querySelector('#pw-form');
const pwSave = document.querySelector('#pw-save');
const pwCancel = document.querySelector('#pw-cancel');
const currentPw = document.querySelector('#current-pw');
const newPw = document.querySelector('#new-pw');
const confirmPw = document.querySelector('#confirm-pw');
const ruleItems = document.querySelectorAll('.rules li');

const eyeButtons = document.querySelectorAll('.input .eye');

const setPasswordVisible = (button, visible) => {
  const input = button.parentElement.querySelector('input');
  input.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', visible);
  button.setAttribute('aria-label', visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  button.innerHTML = `<i data-lucide="${visible ? 'eye-off' : 'eye'}"></i>`;
  lucide.createIcons(); 
};

eyeButtons.forEach((button) => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input');
    setPasswordVisible(button, input.type === 'password');
  });
});

const rules = {
  length: (value) => value.length >= 8,
  mix: (value) => /[A-Za-z]/.test(value) && /\d/.test(value),
};
const isValidPassword = (value) => Object.values(rules).every((check) => check(value));

const setError = (input, message) => {
  const errorBox = document.querySelector(`#${input.id}-error`);
  errorBox.textContent = message;
  errorBox.hidden = !message;
  input.closest('.input').classList.toggle('invalid', Boolean(message));
  input.setAttribute('aria-invalid', Boolean(message));
};

const refreshPwForm = () => {
  ruleItems.forEach((item) => {
    item.classList.toggle('ok', rules[item.dataset.rule](newPw.value));
  });

  const sameAsCurrent = newPw.value !== '' && newPw.value === currentPw.value;
  const mismatch = confirmPw.value !== '' && confirmPw.value !== newPw.value;
  setError(newPw, sameAsCurrent ? 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน' : '');
  setError(confirmPw, mismatch ? 'รหัสผ่านไม่ตรงกัน' : '');

  pwSave.disabled = !(
    currentPw.value &&
    isValidPassword(newPw.value) &&
    !sameAsCurrent &&
    newPw.value === confirmPw.value
  );
};

const setPasswordForm = (open) => {
  pwForm.hidden = !open;
  pwButton.hidden = open;
  pwButton.setAttribute('aria-expanded', open);
  if (open) currentPw.focus();
};

const closePasswordForm = () => {
  pwForm.reset();
  eyeButtons.forEach((button) => setPasswordVisible(button, false)); 
  setError(currentPw, '');
  refreshPwForm();
  setPasswordForm(false);
};

const changePasswordRequest = async (current) =>
  current === 'demo1234' ? { ok: true } : { ok: false, reason: 'wrong-current' };

pwButton.addEventListener('click', () => setPasswordForm(true));

pwForm.addEventListener('input', (event) => {
  if (event.target === currentPw) setError(currentPw, ''); 
  refreshPwForm();
});

pwForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const ok = await confirmDialog({
    title: 'เปลี่ยนรหัสผ่าน?',
    text: 'คุณจะต้องใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป',
    okText: 'เปลี่ยนรหัสผ่าน',
  });
  if (!ok) return;

  pwSave.disabled = true; 
  const result = await changePasswordRequest(currentPw.value, newPw.value);

  if (!result.ok) {
    setError(currentPw, 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
    currentPw.focus();
    refreshPwForm();
    return;
  }

  closePasswordForm();
  showToast('เปลี่ยนรหัสผ่านแล้ว');
});

pwCancel.addEventListener('click', async () => {
  const hasText = [currentPw, newPw, confirmPw].some((input) => input.value);
  if (hasText) {
    const ok = await confirmDialog({
      title: 'ยกเลิกการเปลี่ยนรหัสผ่าน?',
      text: 'สิ่งที่คุณพิมพ์ไว้จะหายไป',
      okText: 'ยกเลิก',
      backText: 'แก้ไขต่อ',
    });
    if (!ok) return;
  }
  closePasswordForm();
});