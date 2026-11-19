document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Elements
  const step1Card = document.getElementById("step1Card");
  const step2Card = document.getElementById("step2Card");
  const step1Indicator = document.getElementById("step1Indicator");
  const step2Indicator = document.getElementById("step2Indicator");

  const btnNext = document.getElementById("btnNext");
  const btnPrev = document.getElementById("btnPrev");
  const btnSubmit = document.getElementById("btnSubmit");

  // State
  let currentStep = 1;
  const formData = {
    company: "",
    workMode: "On-site",
    companyType: "",
    position: "",
    stipend: "",
    skills: [],
    ratings: {
      mentor: 0,
      culture: 0,
      suitability: 0
    },
    experience: "",
    pros: "",
    cons: "",
    interviewQuestions: [
      { text: "", difficulty: "ง่าย" }
    ],
    anonymous: false,
    images: []
  };

  const editId = new URLSearchParams(location.search).get("edit");
  const editUrl = "/api/me/reviews/" + encodeURIComponent(editId || "");
  if (editId !== null) {
    step1Card.inert = true;
    try {
      const response = await fetch(editUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const r = await response.json();
      Object.assign(formData, {
        company: r.company_name, position: r.job_name, companyType: r.industry_type,
        stipend: r.daily_pay, workMode: r.work_mode, anonymous: r.is_anonymous,
        skills: r.skills || [], images: (r.images || []).map(item => item.image),
        ratings: { mentor: r.rating_mentor, culture: r.rating_culture, suitability: r.rating_workload },
        interviewQuestions: (r.interview_questions || []).map(q => ({ text: q.question_title, difficulty: q.difficulty }))
      });
      for (const [id, value] of Object.entries({
        companyInput: r.company_name, positionInput: r.job_name, stipendInput: r.daily_pay,
        companyTypeInput: r.industry_type, workModeInput: r.work_mode,
        expTextarea: r.description, prosTextarea: r.pros, consTextarea: r.cons
      })) {
        const el = document.getElementById(id);
        if (el) el.value = value ?? "";
      }
      document.querySelectorAll(".segment-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === r.work_mode));
      document.getElementById("anonymousToggle").checked = !!r.is_anonymous;
      document.querySelector("#step1Card h1").textContent = "แก้ไขรายละเอียดที่ฝึกงาน";
      btnSubmit.textContent = "บันทึกการแก้ไข";
      document.getElementById("modalSuccessTitle").textContent = "แก้ไขรีวิวสำเร็จแล้ว!";
      document.querySelector("#successModal .modal-desc").textContent = "บันทึกข้อมูลรีวิวฉบับแก้ไขแล้ว";
      document.getElementById("modalCloseBtn").textContent = "กลับหน้าโปรไฟล์";
      step1Card.inert = false;
    } catch (error) {
      alert("เปิดรีวิวเพื่อแก้ไขไม่ได้");
      location.replace("user.html");
      return;
    }
  }

  // ดึงตัวเลือกที่มีอยู่จริงจาก MongoDB (/api/reviews/options — ไม่มี Mock Data)
  const companyDatabase = [];
  const positionDatabase = [];
  const industryDatabase = [];
  const skillDatabase = [];
  let companyIndustryMap = {};

  fetch("/api/reviews/options")
    .then((res) => (res.ok ? res.json() : null))
    .then((opts) => {
      if (!opts) return;
      if (Array.isArray(opts.companies)) companyDatabase.push(...opts.companies);
      if (Array.isArray(opts.positions)) positionDatabase.push(...opts.positions);
      if (Array.isArray(opts.skills)) skillDatabase.push(...opts.skills);
      if (opts.companyIndustries && typeof opts.companyIndustries === "object") {
        companyIndustryMap = opts.companyIndustries;
      }

      if (Array.isArray(opts.industries)) {
        opts.industries.forEach((ind) => {
          const val = String(ind || "").trim();
          if (val && !industryDatabase.includes(val)) {
            industryDatabase.push(val);
          }
        });
      }
    })
    .catch(() => {});

  // Reusable Custom Autocomplete Combobox Setup
  function setupAutocomplete({ wrapperId, inputId, listId, dataList, fieldKey, newLabel }) {
    const wrapper = document.getElementById(wrapperId);
    const input = document.getElementById(inputId);
    const listEl = document.getElementById(listId);
    const toggleBtn = wrapper?.querySelector(".dropdown-toggle-btn");

    if (!wrapper || !input || !listEl) return;

    function renderMenu(filterText = "") {
      listEl.innerHTML = "";
      const query = filterText.trim().toLowerCase();

      const filtered = dataList.filter((item) =>
        item.toLowerCase().includes(query)
      );

      filtered.forEach((item) => {
        const li = document.createElement("li");
        li.className = "autocomplete-item";
        li.setAttribute("role", "option");
        li.textContent = item;
        li.addEventListener("mousedown", (e) => {
          e.preventDefault(); // ป้องกัน blur ก่อนเลือกค่าเสร็จ
          selectValue(item);
        });
        listEl.appendChild(li);
      });

      // ถ้าพิมพ์ข้อความที่ยังไม่มีในระบบ ให้แสดงตัวเลือก "+ เพิ่ม ... (บันทึกใหม่)"
      const exactMatch = dataList.some((item) => item.toLowerCase() === query);
      if (filterText.trim() !== "" && !exactMatch) {
        const addLi = document.createElement("li");
        addLi.className = "autocomplete-item add-new-item";
        addLi.setAttribute("role", "option");
        const cleanVal = escapeHtml(filterText.trim());
        addLi.innerHTML = `
          <span>+ ใช้ชื่อ${newLabel}ใหม่: "<strong>${cleanVal}</strong>"</span>
          <span class="autocomplete-badge">เพิ่มใหม่</span>
        `;
        addLi.addEventListener("mousedown", (e) => {
          e.preventDefault();
          selectValue(filterText.trim(), true);
        });
        listEl.appendChild(addLi);
      }

      if (listEl.children.length > 0) {
        wrapper.classList.add("open");
      } else {
        wrapper.classList.remove("open");
      }
    }

    function selectValue(val, isNew = false) {
      input.value = val;
      formData[fieldKey] = val;
      if (isNew && !dataList.includes(val)) {
        dataList.push(val); // จำลองการเพิ่มเข้าลิสต์ (และส่งไปบันทึก DB ตอน Submit)
      }
      // ถ้าเลือกบริษัทที่มีในระบบ ให้เลือกประเภทบริษัทให้อัตโนมัติ (ยังเปลี่ยนเองได้)
      if (fieldKey === "company" && companyIndustryMap[val]) {
        const companyTypeInput = document.getElementById("companyTypeInput");
        if (companyTypeInput) {
          companyTypeInput.value = companyIndustryMap[val];
          formData.companyType = companyIndustryMap[val];
        }
      }
      wrapper.classList.remove("open");
      input.style.borderColor = "";
    }

    input.addEventListener("focus", () => {
      renderMenu(input.value);
    });

    input.addEventListener("input", () => {
      formData[fieldKey] = input.value.trim();
      input.style.borderColor = "";
      renderMenu(input.value);
    });

    input.addEventListener("blur", () => {
      formData[fieldKey] = input.value.trim();
      wrapper.classList.remove("open");
    });

    toggleBtn?.addEventListener("click", () => {
      if (wrapper.classList.contains("open")) {
        wrapper.classList.remove("open");
      } else {
        input.focus();
        renderMenu("");
      }
    });
  }

  setupAutocomplete({
    wrapperId: "companyAutocomplete",
    inputId: "companyInput",
    listId: "companyDropdownList",
    dataList: companyDatabase,
    fieldKey: "company",
    newLabel: "บริษัท"
  });

  setupAutocomplete({
    wrapperId: "positionAutocomplete",
    inputId: "positionInput",
    listId: "positionDropdownList",
    dataList: positionDatabase,
    fieldKey: "position",
    newLabel: "ตำแหน่ง"
  });

  setupAutocomplete({
    wrapperId: "companyTypeAutocomplete",
    inputId: "companyTypeInput",
    listId: "companyTypeDropdownList",
    dataList: industryDatabase,
    fieldKey: "companyType",
    newLabel: "ประเภทบริษัท"
  });

  // 1. Navigation Steps
  function setStep(step) {
    currentStep = step;
    if (step === 1) {
      step1Card.style.display = "block";
      step2Card.style.display = "none";
      step1Indicator.classList.add("active");
      step2Indicator.classList.remove("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 2) {
      step1Card.style.display = "none";
      step2Card.style.display = "block";
      step1Indicator.classList.remove("active");
      step1Indicator.classList.add("completed");
      step2Indicator.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // Validation Helpers
  function clearFieldError(el) {
    if (!el) return;
    el.classList.remove("input-error");
    const container = el.closest(".form-group, .rating-section") || el.parentElement;
    container?.querySelectorAll(".field-error-msg").forEach((m) => m.remove());
  }

  function showFieldError(el, message) {
    if (!el) return;
    clearFieldError(el);
    if (el.classList.contains("form-control")) {
      el.classList.add("input-error");
    }
    const container = el.closest(".form-group, .rating-section") || el.parentElement;
    if (container) {
      const msgEl = document.createElement("span");
      msgEl.className = "field-error-msg";
      msgEl.textContent = message;
      container.appendChild(msgEl);
    }
  }

  document.getElementById("stipendInput")?.addEventListener("input", (e) => clearFieldError(e.target));
  document.getElementById("expTextarea")?.addEventListener("input", (e) => clearFieldError(e.target));
  document.getElementById("prosTextarea")?.addEventListener("input", (e) => clearFieldError(e.target));
  document.getElementById("consTextarea")?.addEventListener("input", (e) => clearFieldError(e.target));
  document.getElementById("companyInput")?.addEventListener("input", (e) => clearFieldError(e.target));
  document.getElementById("positionInput")?.addEventListener("input", (e) => clearFieldError(e.target));
  document.getElementById("companyTypeInput")?.addEventListener("input", (e) => clearFieldError(e.target));

  btnNext?.addEventListener("click", () => {
    const companyInput = document.getElementById("companyInput");
    const positionInput = document.getElementById("positionInput");
    const companyTypeInput = document.getElementById("companyTypeInput");
    const skillInputEl = document.getElementById("skillInput");
    const stipendInput = document.getElementById("stipendInput");
    const ratingSection = document.querySelector(".rating-section");

    [companyInput, positionInput, companyTypeInput, skillInputEl, stipendInput, ratingSection].forEach(clearFieldError);

    let firstInvalid = null;

    if (companyInput && !companyInput.value.trim()) {
      showFieldError(companyInput, "กรุณาระบุชื่อบริษัท");
      firstInvalid = firstInvalid || companyInput;
    }

    if (positionInput && !positionInput.value.trim()) {
      showFieldError(positionInput, "กรุณาระบุตำแหน่งงานที่ฝึก");
      firstInvalid = firstInvalid || positionInput;
    }

    const stipendVal = stipendInput?.value.trim() || "";
    if (stipendVal !== "" && !/^\d+$/.test(stipendVal)) {
      showFieldError(stipendInput, "กรุณากรอกค่าตอบแทนเป็นตัวเลขจำนวนเต็ม (เช่น 300 หรือ 0)");
      firstInvalid = firstInvalid || stipendInput;
    }

    if (companyTypeInput && !companyTypeInput.value.trim()) {
      showFieldError(companyTypeInput, "กรุณาเลือกหรือระบุประเภทของบริษัท");
      firstInvalid = firstInvalid || companyTypeInput;
    }

    if (!Array.isArray(formData.skills) || formData.skills.length === 0) {
      showFieldError(skillInputEl, "กรุณาเพิ่มทักษะและความสามารถอย่างน้อย 1 ทักษะ");
      firstInvalid = firstInvalid || skillInputEl;
    }

    if (!formData.ratings.mentor || !formData.ratings.culture || !formData.ratings.suitability) {
      showFieldError(ratingSection, "กรุณาให้คะแนนดาวครบทั้ง 3 หัวข้อ (1–5 ดาว)");
      firstInvalid = firstInvalid || ratingSection;
    }

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof firstInvalid.focus === "function") firstInvalid.focus();
      return;
    }

    formData.company = companyInput ? companyInput.value.trim() : "";
    formData.position = positionInput ? positionInput.value.trim() : "";
    formData.stipend = stipendVal;
    formData.companyType = companyTypeInput ? companyTypeInput.value.trim() : (formData.companyType || "");

    setStep(2);
  });

  btnPrev?.addEventListener("click", () => {
    setStep(1);
  });

  // 2. Work Mode Segmented Control
  const workModeBtns = document.querySelectorAll(".segmented-control .segment-btn");
  const workModeInput = document.getElementById("workModeInput");
  workModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      workModeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.mode;
      formData.workMode = mode;
      if (workModeInput) workModeInput.value = mode;
    });
  });

  // 3. Skills Input, Autocomplete from DB & Tags
  const skillWrapper = document.getElementById("skillAutocomplete");
  const skillInput = document.getElementById("skillInput");
  const skillDropdownList = document.getElementById("skillDropdownList");
  const addSkillBtn = document.getElementById("addSkillBtn");
  const skillsContainer = document.getElementById("skillsContainer");

  function renderSkills() {
    if (!skillsContainer) return;
    skillsContainer.innerHTML = "";
    formData.skills.forEach((skill, index) => {
      const chip = document.createElement("span");
      chip.className = "skill-chip";
      chip.innerHTML = `
        ${escapeHtml(skill)}
        <button type="button" class="remove-chip-btn" data-index="${index}" aria-label="ลบ ${escapeHtml(skill)}">
          <i data-lucide="x"></i>
        </button>
      `;
      chip.querySelector(".remove-chip-btn")?.addEventListener("click", () => {
        formData.skills.splice(index, 1);
        renderSkills();
        clearFieldError(skillInput);
      });
      skillsContainer.appendChild(chip);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function addSkill(customVal = null) {
    if (!skillInput) return;
    const val = (customVal !== null ? customVal : skillInput.value).trim();
    if (val) {
      const alreadyAdded = formData.skills.some((s) => s.toLowerCase() === val.toLowerCase());
      if (!alreadyAdded) {
        formData.skills.push(val);
        if (!skillDatabase.some((s) => s.toLowerCase() === val.toLowerCase())) {
          skillDatabase.push(val);
        }
        renderSkills();
        clearFieldError(skillInput);
      }
      skillInput.value = "";
      skillWrapper?.classList.remove("open");
    }
  }

  function renderSkillMenu(filterText = "") {
    if (!skillDropdownList || !skillWrapper) return;
    skillDropdownList.innerHTML = "";
    const query = filterText.trim().toLowerCase();

    const filtered = skillDatabase.filter(
      (item) =>
        item.toLowerCase().includes(query) &&
        !formData.skills.some((s) => s.toLowerCase() === item.toLowerCase())
    );

    filtered.forEach((item) => {
      const li = document.createElement("li");
      li.className = "autocomplete-item";
      li.setAttribute("role", "option");
      li.textContent = item;
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        addSkill(item);
      });
      skillDropdownList.appendChild(li);
    });

    const exactMatch = skillDatabase.some((item) => item.toLowerCase() === query);
    if (filterText.trim() !== "" && !exactMatch) {
      const addLi = document.createElement("li");
      addLi.className = "autocomplete-item add-new-item";
      addLi.setAttribute("role", "option");
      addLi.innerHTML = `
        <span>+ เพิ่มทักษะใหม่: "<strong>${escapeHtml(filterText.trim())}</strong>"</span>
        <span class="autocomplete-badge">เพิ่มใหม่</span>
      `;
      addLi.addEventListener("mousedown", (e) => {
        e.preventDefault();
        addSkill(filterText.trim());
      });
      skillDropdownList.appendChild(addLi);
    }

    if (skillDropdownList.children.length > 0) {
      skillWrapper.classList.add("open");
    } else {
      skillWrapper.classList.remove("open");
    }
  }

  skillInput?.addEventListener("focus", () => renderSkillMenu(skillInput.value));
  skillInput?.addEventListener("input", () => renderSkillMenu(skillInput.value));
  skillInput?.addEventListener("blur", () => skillWrapper?.classList.remove("open"));

  addSkillBtn?.addEventListener("click", () => addSkill());
  skillInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  });

  // Render initial tags
  renderSkills();

  // 4. Rating Stars System
  const ratingItems = document.querySelectorAll(".rating-item");
  ratingItems.forEach((item) => {
    const key = item.dataset.ratingKey;
    const stars = item.querySelectorAll(".star-btn");
    const scoreText = item.querySelector(".rating-score-text");

    function updateStars(score) {
      formData.ratings[key] = score;
      stars.forEach((star, idx) => {
        if (idx < score) {
          star.classList.add("filled");
        } else {
          star.classList.remove("filled");
        }
      });
      if (scoreText) scoreText.textContent = `${score}/5`;
    }

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        const val = parseInt(star.dataset.val, 10);
        updateStars(val);
        clearFieldError(document.querySelector(".rating-section"));
      });
      star.addEventListener("mouseenter", () => {
        const hoverVal = parseInt(star.dataset.val, 10);
        stars.forEach((s, idx) => {
          if (idx < hoverVal) s.classList.add("filled");
          else s.classList.remove("filled");
        });
      });
      star.addEventListener("mouseleave", () => {
        updateStars(formData.ratings[key]);
      });
    });

    updateStars(formData.ratings[key] ?? 0);
  });

  // 5. Dynamic Interview Questions
  const questionsContainer = document.getElementById("interviewQuestionsList");
  const addQuestionBtn = document.getElementById("addQuestionBtn");

  function renderQuestions() {
    if (!questionsContainer) return;
    questionsContainer.innerHTML = "";

    formData.interviewQuestions.forEach((q, index) => {
      const qCard = document.createElement("div");
      qCard.className = "question-card";

      const qRow = document.createElement("div");
      qRow.className = "question-row";

      const numBadge = document.createElement("span");
      numBadge.className = "question-number";
      numBadge.textContent = (index + 1).toString();

      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-control question-input";
      input.placeholder = "เช่น เคยใช้ React ทำโปรเจกต์ไหนบ้าง ?";
      input.value = q.text;
      input.addEventListener("input", (e) => {
        q.text = e.target.value;
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-question-btn";
      delBtn.textContent = "ลบ";
      delBtn.addEventListener("click", () => {
        if (formData.interviewQuestions.length > 1) {
          formData.interviewQuestions.splice(index, 1);
        } else {
          formData.interviewQuestions[0] = { text: "", difficulty: "ง่าย" };
        }
        renderQuestions();
      });

      qRow.appendChild(numBadge);
      qRow.appendChild(input);
      qRow.appendChild(delBtn);

      // Difficulty row
      const diffRow = document.createElement("div");
      diffRow.className = "difficulty-row";
      diffRow.innerHTML = `<span class="difficulty-label">ระดับความยาก :</span>`;

      const pillsContainer = document.createElement("div");
      pillsContainer.className = "difficulty-pills";

      ["ง่าย", "ปานกลาง", "ยาก"].forEach((lvl) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = `diff-pill ${q.difficulty === lvl ? "active" : ""}`;
        pill.textContent = lvl;
        pill.addEventListener("click", () => {
          q.difficulty = lvl;
          diffRow.querySelectorAll(".diff-pill").forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");
        });
        pillsContainer.appendChild(pill);
      });

      diffRow.appendChild(pillsContainer);
      qCard.appendChild(qRow);
      qCard.appendChild(diffRow);
      questionsContainer.appendChild(qCard);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  addQuestionBtn?.addEventListener("click", () => {
    formData.interviewQuestions.push({ text: "", difficulty: "ง่าย" });
    renderQuestions();
  });

  renderQuestions();

  // 6. Multi-Image Upload & Preview (Up to 4 images matching Figma)
  const MAX_IMAGES = 4;
  const imageUploadBox = document.getElementById("imageUploadBox");
  const imageFileInput = document.getElementById("imageFileInput");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const imageCountLabel = document.getElementById("imageCountLabel");

  function renderImagePreviews() {
    if (!imagePreviewContainer) return;

    if (imageCountLabel) {
      imageCountLabel.textContent = `(${formData.images.length}/${MAX_IMAGES} รูป)`;
    }

    if (imageUploadBox) {
      imageUploadBox.style.display = formData.images.length >= MAX_IMAGES ? "none" : "flex";
    }

    imagePreviewContainer.innerHTML = formData.images
      .map(
        (imgSrc, idx) => `
          <div class="preview-thumb-item">
            <img src="${escapeHtml(imgSrc)}" alt="Preview ${idx + 1}" class="image-preview-thumb">
            <button type="button" class="clear-image-btn" data-img-idx="${idx}" title="ลบรูปภาพนี้">
              <i data-lucide="x"></i>
            </button>
          </div>
        `
      )
      .join("");

    if (window.lucide) window.lucide.createIcons();

    imagePreviewContainer.querySelectorAll(".clear-image-btn").forEach((btn) => {
      btn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        const removeIdx = Number(btn.getAttribute("data-img-idx"));
        formData.images.splice(removeIdx, 1);
        renderImagePreviews();
      });
    });
  }

  renderImagePreviews();

  imageUploadBox?.addEventListener("click", () => {
    if (formData.images.length >= MAX_IMAGES) {
      alert(`สามารถอัปโหลดรูปภาพได้สูงสุด ${MAX_IMAGES} รูปครับ`);
      return;
    }
    imageFileInput?.click();
  });

  imageFileInput?.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES - formData.images.length;
    if (files.length > remainingSlots) {
      alert(`คุณสามารถเพิ่มได้อีก ${remainingSlots} รูป (สูงสุด ${MAX_IMAGES} รูป)`);
    }

    const filesToRead = files.slice(0, remainingSlots);
    filesToRead.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`ไฟล์ "${file.name}" ไม่ใช่ไฟล์รูปภาพ`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`ไฟล์ "${file.name}" มีขนาดใหญ่เกิน 5MB กรุณาเลือกรูปที่เล็กลง`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && formData.images.length < MAX_IMAGES) {
          formData.images.push(event.target.result);
          renderImagePreviews();
        }
      };
      reader.readAsDataURL(file);
    });

    imageFileInput.value = "";
  });

  renderImagePreviews();

  // 7. Anonymous Mode Toggle
  const anonymousToggle = document.getElementById("anonymousToggle");
  anonymousToggle?.addEventListener("change", (e) => {
    formData.anonymous = e.target.checked;
  });

  // 8. Submit Form & Modal
  const successModal = document.getElementById("successModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalHomeBtn = document.getElementById("modalHomeBtn");

  btnSubmit?.addEventListener("click", async (e) => {
    e.preventDefault();

    const expTextarea = document.getElementById("expTextarea");
    const prosTextarea = document.getElementById("prosTextarea");
    const consTextarea = document.getElementById("consTextarea");

    [expTextarea, prosTextarea, consTextarea].forEach(clearFieldError);

    let firstInvalidStep2 = null;
    if (expTextarea && !expTextarea.value.trim()) {
      showFieldError(expTextarea, "กรุณากรอกประสบการณ์การทำงานและรายละเอียดที่เจอ");
      firstInvalidStep2 = firstInvalidStep2 || expTextarea;
    }
    if (prosTextarea && !prosTextarea.value.trim()) {
      showFieldError(prosTextarea, "กรุณากรอกสิ่งที่ประทับใจ / ข้อดี");
      firstInvalidStep2 = firstInvalidStep2 || prosTextarea;
    }
    if (consTextarea && !consTextarea.value.trim()) {
      showFieldError(consTextarea, "กรุณากรอกข้อเสีย / สิ่งที่อยากให้ปรับปรุง");
      firstInvalidStep2 = firstInvalidStep2 || consTextarea;
    }

    if (firstInvalidStep2) {
      firstInvalidStep2.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidStep2.focus();
      return;
    }

    // Collect Step 1 & Step 2 latest field values
    formData.stipend = document.getElementById("stipendInput")?.value.trim() || "";
    formData.companyType = document.getElementById("companyTypeInput")?.value.trim() || formData.companyType || "";
    formData.experience = expTextarea?.value.trim() || "";
    formData.pros = prosTextarea?.value.trim() || "";
    formData.cons = consTextarea?.value.trim() || "";

    btnSubmit.disabled = true;

    let currentUserId = null;
    let authorName = formData.anonymous ? "ผู้ไม่ประสงค์ออกนาม" : "นักศึกษาฝึกงาน";
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const me = await meRes.json();
        currentUserId = me?.userId || null;
        if (!formData.anonymous) {
          authorName = me?.userName || `User - ${me?.studentCode || me?.userId}`;
        }
      }
    } catch {
      // ignore
    }

    const payload = {
      user_id: currentUserId,
      author_name: authorName,
      company_name: formData.company || "ไม่ระบุชื่อบริษัท",
      industry_type: document.getElementById("companyTypeInput")?.value.trim() || formData.companyType || "",
      job_name: formData.position || "ไม่ระบุตำแหน่ง",
      skills: formData.skills,
      interview_questions: formData.interviewQuestions
        .filter((q) => q.text && q.text.trim() !== "")
        .map((q, idx) => ({
          question_no: idx + 1,
          question_title: q.text.trim(),
          difficulty: q.difficulty
        })),
      ...(formData.images.length > 0
        ? {
            images: formData.images.map((img, idx) => ({
              image_id: idx + 1,
              image: img
            }))
          }
        : { images: [] }),
      is_anonymous: formData.anonymous,
      description: formData.experience,
      work_mode: formData.workMode,
      rating_culture: formData.ratings.culture,
      rating_workload: formData.ratings.suitability,
      rating_mentor: formData.ratings.mentor,
      pros: formData.pros,
      cons: formData.cons,
      daily_pay: document.getElementById("stipendInput").value.trim()
    };

    try {
      const response = await fetch(editId ? editUrl : "/api/reviews", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Show Success Modal
        if (successModal) {
          successModal.classList.add("open");
          if (window.lucide) window.lucide.createIcons();
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "เกิดข้อผิดพลาดในการบันทึกรีวิว");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      btnSubmit.disabled = false;
    }
  });

  modalCloseBtn?.addEventListener("click", () => {
    if (editId) return location.assign("user.html");
    location.reload();
  });

  modalHomeBtn?.addEventListener("click", () => {
    window.location.href = "home.html";
  });

  // Escape HTML helper
  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});
