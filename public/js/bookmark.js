lucide.createIcons();

const reviews = [
  {
    company: 'Alpha Studio', role: 'UX/UI Designer', mode: 'Hybrid', pay: '350 THB/Day',
    skills: ['Figma', 'Photoshop', 'Illustrator'], rating: 4.5,
    culture: 4, workload: 3, mentor: 5,
    pros: 'ทีมใจดี มีพี่เลี้ยงสอนงานจริงจัง ได้ลงมือทำงานจริงตั้งแต่สัปดาห์แรก',
    cons: 'งานช่วงปลายเดือนค่อนข้างหนักและมีประชุมบ่อย',
    user: 'User - 101', date: '12 ต.ค. 2569',
  },
  {
    company: 'KB Tech', role: 'Frontend Developer', mode: 'Remote', pay: '500 THB/Day',
    skills: ['React', 'CSS', 'Git'], rating: 4.7,
    culture: 5, workload: 4, mentor: 4,
    pros: 'ได้เขียนโค้ดจริงบนโปรเจกต์ลูกค้า มีการรีวิวโค้ดทุกสัปดาห์ เรียนรู้เร็วมาก',
    cons: 'งานเยอะในช่วงส่งมอบ และต้องจัดตารางเวลาเองให้ดี',
    user: 'User - 205', date: '8 ต.ค. 2569',
  },
  {
    company: 'Bluefin', role: 'Data Analyst', mode: 'On-site', pay: 'ไม่มีเบี้ยเลี้ยง',
    skills: ['SQL', 'Python', 'Tableau'], rating: 3.9,
    culture: 3, workload: 4, mentor: 3,
    pros: 'ได้ฝึกวิเคราะห์ข้อมูลจริง ออฟฟิศอยู่ใกล้รถไฟฟ้า',
    cons: 'ไม่มีเบี้ยเลี้ยง และพี่เลี้ยงไม่ค่อยว่างให้ถาม',
    user: 'User - 318', date: '30 ก.ย. 2569',
  },
  {
    company: 'Nova Labs', role: 'Backend Developer', mode: 'Hybrid', pay: '450 THB/Day',
    skills: ['Java', 'SQL', 'Docker'], rating: 4.3,
    culture: 4, workload: 4, mentor: 4,
    pros: 'บรรยากาศสบาย ๆ เวลาทำงานยืดหยุ่น ได้ใช้เครื่องมือที่ทันสมัย',
    cons: 'ระบบเก่าเยอะ เอกสารยังไม่ค่อยครบ',
    user: 'User - 142', date: '21 ก.ย. 2569',
  },
  {
    company: 'Orbit Pay', role: 'Full-stack Developer', mode: 'On-site', pay: '800 THB/Day',
    skills: ['React', 'Node.js', 'SQL'], rating: 4.4,
    culture: 4, workload: 2, mentor: 5,
    pros: 'เบี้ยเลี้ยงดี พี่เลี้ยงเก่งและใส่ใจ มีโอกาสได้ทำงานต่อหลังจบฝึกงาน',
    cons: 'ภาระงานหนัก บางวันต้องอยู่ดึก',
    user: 'User - 276', date: '15 ก.ย. 2569',
  },
  {
    company: 'Kite Data', role: 'Data Analyst', mode: 'Remote', pay: '600 THB/Day',
    skills: ['Python', 'Excel', 'SQL'], rating: 4.8,
    culture: 5, workload: 5, mentor: 4,
    pros: 'ทีมเป็นกันเอง งานไม่กดดัน ได้เรียนรู้เครื่องมือหลายตัว',
    cons: 'เวลาประชุมออนไลน์ค่อนข้างเยอะ',
    user: 'User - 099', date: '2 ก.ย. 2569',
  },
];

const list = document.querySelector('.list');
const detailCard = document.querySelector('.detail');
const field = (name) => document.querySelector(`[data-field="${name}"]`);

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const itemHTML = (r, index) => `
  <li class="item" data-index="${index}">
    <div class="r1">
      <h3>${esc(r.company)}</h3>
      <span class="rate"><i data-lucide="star"></i>${r.rating} / 5</span>
      <small>${esc(r.date)}</small>
      <i data-lucide="bookmark" class="solid"></i>
    </div>
    <div class="r2"><i data-lucide="briefcase-business"></i>${esc(r.role)}</div>
    <div class="r3">
      <i data-lucide="code-xml"></i>
      ${r.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}
      <span class="by"><span class="avatar"><i data-lucide="user-round"></i></span>${esc(r.user)}</span>
    </div>
  </li>`;

const showDetail = (r) => {
  field('company').textContent = r.company;
  field('mode').textContent = r.mode;
  field('role').textContent = r.role;
  field('pay').textContent = r.pay;
  field('culture').textContent = `${r.culture} / 5`;
  field('workload').textContent = `${r.workload} / 5`;
  field('mentor').textContent = `${r.mentor} / 5`;
  field('pros').textContent = r.pros;
  field('cons').textContent = r.cons;
  field('user').textContent = r.user;
  field('date').textContent = r.date;

  const chips = r.skills.map((skill) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = skill;
    return chip;
  });
  field('skills').replaceChildren(...chips);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    detailCard.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250, easing: 'ease' });
  }
};

list.innerHTML = reviews.map(itemHTML).join('');
field('count').textContent = `· ${reviews.length}`;
lucide.createIcons();

list.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (!item) return;

  list.querySelectorAll('.item').forEach((i) => i.removeAttribute('aria-current'));
  item.setAttribute('aria-current', 'true');
  showDetail(reviews[item.dataset.index]);
});