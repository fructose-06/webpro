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
    image: null
  };

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
    const companySelect = document.getElementById("companySelect");

    if (companySelect && !companySelect.value) {
      companySelect.focus();
      companySelect.style.borderColor = "#ef4444";
      setTimeout(() => { companySelect.style.borderColor = ""; }, 2000);
      return;
    }

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

  // 6. Image Upload & Preview
  const imageUploadBox = document.getElementById("imageUploadBox");
  const imageFileInput = document.getElementById("imageFileInput");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const uploadPlaceholder = document.getElementById("uploadPlaceholder");

  imageUploadBox?.addEventListener("click", () => {
    imageFileInput?.click();
  });

  imageFileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      formData.image = event.target.result;
      if (imagePreviewContainer && uploadPlaceholder) {
        uploadPlaceholder.style.display = "none";
        imagePreviewContainer.innerHTML = `
          <img src="${formData.image}" alt="Preview" class="image-preview-thumb">
          <button type="button" class="clear-image-btn" id="clearImageBtn" title="ลบรูปภาพ">
            <i data-lucide="x"></i>
          </button>
        `;
        if (window.lucide) window.lucide.createIcons();

        document.getElementById("clearImageBtn")?.addEventListener("click", (evt) => {
          evt.stopPropagation();
          formData.image = null;
          imageFileInput.value = "";
          imagePreviewContainer.innerHTML = "";
          uploadPlaceholder.style.display = "flex";
        });
      }
    };
    reader.readAsDataURL(file);
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

  btnSubmit?.addEventListener("click", (e) => {
    e.preventDefault();

    // Collect comments
    formData.experience = document.getElementById("expTextarea")?.value || "";
    formData.pros = document.getElementById("prosTextarea")?.value || "";
    formData.cons = document.getElementById("consTextarea")?.value || "";

    console.log("Submitted Review Data:", formData);

    // Show Success Modal
    if (successModal) {
      successModal.classList.add("open");
      if (window.lucide) window.lucide.createIcons();
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
