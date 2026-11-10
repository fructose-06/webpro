document.addEventListener("DOMContentLoaded", () => {
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
    skills: ["Javascript"],
    ratings: {
      mentor: 4,
      culture: 4,
      suitability: 4
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

  // Mock Database Lists (ต่อไปสามารถดึงจาก API / Database มาแทนที่ได้)
  const companyDatabase = [
    "Agoda",
    "SCB / SCBX",
    "KBTG (Kasikorn Business-Technology Group)",
    "LINE MAN Wongnai",
    "Shopee Thailand",
    "Bitkub Online",
    "True Digital Group",
    "PTT Digital Solutions"
  ];

  const positionDatabase = [
    "Frontend Developer",
    "Backend Developer",
    "Full-stack Developer",
    "UX/UI Designer",
    "Product Designer",
    "Data Analyst",
    "Data Engineer",
    "QA / Tester"
  ];

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

  btnNext?.addEventListener("click", () => {
    // Validate minimal step 1 info
    const companyInput = document.getElementById("companyInput");
    const positionInput = document.getElementById("positionInput");

    if (companyInput && !companyInput.value.trim()) {
      companyInput.focus();
      companyInput.style.borderColor = "#ef4444";
      setTimeout(() => { companyInput.style.borderColor = ""; }, 2000);
      return;
    }

    if (positionInput && !positionInput.value.trim()) {
      positionInput.focus();
      positionInput.style.borderColor = "#ef4444";
      setTimeout(() => { positionInput.style.borderColor = ""; }, 2000);
      return;
    }

    formData.company = companyInput ? companyInput.value.trim() : "";
    formData.position = positionInput ? positionInput.value.trim() : "";

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

  // 3. Skills Input & Tags
  const skillInput = document.getElementById("skillInput");
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
      });
      skillsContainer.appendChild(chip);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function addSkill() {
    if (!skillInput) return;
    const val = skillInput.value.trim();
    if (val && !formData.skills.includes(val)) {
      formData.skills.push(val);
      renderSkills();
      skillInput.value = "";
    }
  }

  addSkillBtn?.addEventListener("click", addSkill);
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

    updateStars(formData.ratings[key] || 4);
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
            <img src="${imgSrc}" alt="Preview ${idx + 1}" class="image-preview-thumb">
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

    // Collect comments
    formData.experience = document.getElementById("expTextarea")?.value || "";
    formData.pros = document.getElementById("prosTextarea")?.value || "";
    formData.cons = document.getElementById("consTextarea")?.value || "";

    console.log("Submitted Review Data:", formData);

    let authorName = "ผู้ไม่ประสงค์ออกนาม";
    let currentUserId = null;
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const me = await meRes.json();
        currentUserId = me.userId || null;
        if (!formData.anonymous) {
          authorName = me.userName || `User - ${me.studentCode || me.userId}`;
        }
      }
    } catch {
      if (!formData.anonymous) authorName = "นักศึกษาฝึกงาน";
    }

    const payload = {
      user_id: currentUserId,
      company_name: formData.company || "ไม่ระบุชื่อบริษัท",
      industry_type: formData.companyType || "",
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
        : {}),
      author_name: authorName,
      is_anonymous: formData.anonymous,
      description: formData.experience,
      work_mode: formData.workMode,
      rating_culture: formData.ratings.culture,
      rating_workload: formData.ratings.suitability,
      rating_mentor: formData.ratings.mentor,
      pros: formData.pros,
      cons: formData.cons,
      daily_pay: formData.stipend
    };

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
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
        alert("เกิดข้อผิดพลาดในการบันทึกรีวิว");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  });

  modalCloseBtn?.addEventListener("click", () => {
    successModal?.classList.remove("open");
    setStep(1);
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
