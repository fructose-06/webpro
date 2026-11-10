document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  const params = new URLSearchParams(window.location.search);
  const reviewId = params.get("id");

  let currentUser = null;
  let activeReplyParentNo = null;

  try {
    const meRes = await fetch("/api/auth/me");
    if (meRes.ok) {
      currentUser = await meRes.json();
    }
  } catch {
    // ignore
  }

  function formatThaiDate(dateStr) {
    if (!dateStr) return "วันนี้";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatCommentTimestamp(dateStr) {
    if (!dateStr) return "เมื่อสักครู่";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear() + 543;
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} เวลา ${hh}:${min} น.`;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>'"]/g, (tag) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[tag]));
  }

  function buildFiveStarsHtml(score) {
    const filled = Math.round(Number(score) || 0);
    return Array.from({ length: 5 }, (_, i) => {
      const cls = i < filled ? "filled" : "";
      return `<i data-lucide="star" class="${cls}"></i>`;
    }).join("");
  }

  function renderComments(commentsArr = []) {
    const listEl = document.getElementById("commentsList");
    const headerCountEl = document.getElementById("commentHeaderCount");

    if (headerCountEl) headerCountEl.textContent = commentsArr.length;
    if (!listEl) return;

    if (commentsArr.length === 0) {
      listEl.innerHTML = `
        <div class="figma-comment-card">
          <div class="comment-card-body">
            <p class="comment-text" style="color: #666;">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นในรีวิวนี้ได้เลย!</p>
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = commentsArr
      .map((c) => {
        const replyTag = c.parent_comment_no
          ? `<span style="font-size:12px; color:#555; background:#f0f0f0; padding:2px 8px; border-radius:99px;">ตอบกลับความคิดเห็น #${c.comment_no ? c.parent_comment_no : ""}</span>`
          : "";
        return `
        <div class="figma-comment-card" data-comment-no="${c.comment_no}">
          <div class="comment-card-body">
            <div class="comment-user-row">
              <span class="user-circle-icon">
                <i data-lucide="user-round"></i>
              </span>
              <span class="comment-author-name">${escapeHtml(c.author_name || "User")}</span>
              <span class="comment-time">#${c.comment_no || 1} • ${escapeHtml(formatCommentTimestamp(c.created_at))}</span>
              ${replyTag}
            </div>
            <p class="comment-text" id="commentText-${c.comment_no}">${escapeHtml(c.content)}</p>
          </div>
          <div class="comment-card-footer">
            <button type="button" class="comment-act-link js-reply-comment" data-no="${c.comment_no}" data-author="${escapeHtml(c.author_name || "User")}">ตอบกลับ</button>
            <button type="button" class="comment-act-link js-edit-comment" data-no="${c.comment_no}">แก้ไข</button>
          </div>
        </div>
      `;
      })
      .join("");

    if (window.lucide) window.lucide.createIcons();

    // ปุ่มตอบกลับ (REPLIES_TO -> parent_comment_no)
    listEl.querySelectorAll(".js-reply-comment").forEach((btn) => {
      btn.addEventListener("click", () => {
        const no = Number(btn.getAttribute("data-no"));
        const author = btn.getAttribute("data-author");
        activeReplyParentNo = no;
        const input = document.getElementById("commentInput");
        if (input) {
          input.placeholder = `ตอบกลับความคิดเห็น #${no} ของ ${author}...`;
          input.focus();
        }
      });
    });

    // ปุ่มแก้ไขความคิดเห็น (PUT /api/reviews/:id/comments/:commentNo)
    listEl.querySelectorAll(".js-edit-comment").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const no = Number(btn.getAttribute("data-no"));
        const textEl = document.getElementById(`commentText-${no}`);
        const currentText = textEl ? textEl.textContent : "";
        const nextText = prompt(`แก้ไขความคิดเห็น #${no}:`, currentText);
        if (nextText === null || !nextText.trim() || !reviewId) return;

        try {
          const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments/${no}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: nextText.trim() })
          });
          if (res.ok) {
            const updatedReview = await res.json();
            renderComments(updatedReview.comments || []);
          } else {
            alert("ไม่สามารถแก้ไขความคิดเห็นได้");
          }
        } catch (err) {
          console.error(err);
        }
      });
    });
  }

  function renderReviewDetail(data) {
    const rMentor = Number(data.rating_mentor ?? 4);
    const rCulture = Number(data.rating_culture ?? 4);
    const rWorkload = Number(data.rating_workload ?? 4);
    const avg = Number(data.rating || ((rMentor + rCulture + rWorkload) / 3) || 4.5).toFixed(1);

    const company = data.company_name || "ไม่ระบุชื่อบริษัท";
    const industry = data.industry_type || "ทั่วไป";
    const workMode = data.work_mode || "On-site";
    const jobName = data.job_name || "นักศึกษาฝึกงาน";

    let dailyPay = data.daily_pay || "ไม่ระบุเบี้ยเลี้ยง";
    if (/^\d+$/.test(String(dailyPay).trim())) {
      dailyPay = `${String(dailyPay).trim()}บาท/วัน`;
    }

    const author = data.is_anonymous
      ? "ผู้ไม่ประสงค์ออกนาม"
      : (data.author_name || "นักศึกษาฝึกงาน");
    const dateText = formatThaiDate(data.created_at);

    document.getElementById("detailCompany").textContent = company;
    document.getElementById("detailJobName").textContent = jobName;
    document.getElementById("detailWorkMode").textContent = workMode;
    document.getElementById("detailDailyPay").textContent = dailyPay;
    document.getElementById("detailIndustry").textContent = industry;
    document.getElementById("detailAvgRating").textContent = avg;
    document.getElementById("detailAuthor").textContent = author;
    document.getElementById("detailDate").textContent = `• โพสต์เมื่อ ${dateText}`;
    document.getElementById("detailLikesCount").textContent = Number(data.likes || 0);

    // 3 Experience Star Rows
    document.getElementById("starsMentor").innerHTML = buildFiveStarsHtml(rMentor);
    document.getElementById("valMentor").textContent = `${rMentor}/5`;

    document.getElementById("starsCulture").innerHTML = buildFiveStarsHtml(rCulture);
    document.getElementById("valCulture").textContent = `${rCulture}/5`;

    document.getElementById("starsWorkload").innerHTML = buildFiveStarsHtml(rWorkload);
    document.getElementById("valWorkload").textContent = `${rWorkload}/5`;

    // Skills (Black Pills)
    const skills = Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : ["ไม่ระบุทักษะ"];
    document.getElementById("detailSkillsList").innerHTML = skills
      .map((s) => `<span class="black-skill-pill">${escapeHtml(s)}</span>`)
      .join("");

    // Paragraphs
    document.getElementById("detailDescription").textContent =
      data.description || "ไม่ได้ระบุรายละเอียดประสบการณ์ฝึกงาน";
    document.getElementById("detailPros").textContent =
      data.pros || "ไม่ได้ระบุข้อดี";
    document.getElementById("detailCons").textContent =
      data.cons || "ไม่ได้ระบุข้อสังเกต";

    // Interview Questions (INTERVIEW_QUESTION: question_no, question_title, difficulty)
    const questions = Array.isArray(data.interview_questions) ? data.interview_questions : [];
    document.getElementById("detailQuestionCount").textContent = `(${questions.length} ข้อ)`;
    const qListEl = document.getElementById("detailQuestionsList");

    if (questions.length === 0) {
      qListEl.innerHTML = `
        <div class="figma-q-row">
          <span class="q-index">01</span>
          <div class="q-box" style="color:#777;">ไม่ได้ระบุคำถามสัมภาษณ์</div>
          <span class="q-diff-pill">-</span>
        </div>
      `;
    } else {
      qListEl.innerHTML = questions
        .map((q, idx) => {
          const qNo = q.question_no || idx + 1;
          const numStr = String(qNo).padStart(2, "0");
          return `
            <div class="figma-q-row">
              <span class="q-index">${numStr}</span>
              <div class="q-box">${escapeHtml(q.question_title || q.text || "")}</div>
              <span class="q-diff-pill">${escapeHtml(q.difficulty || "ง่าย")}</span>
            </div>
          `;
        })
        .join("");
    }

    // Images Section (HAS_IMAGE (0, N) — แสดงเฉพาะเมื่อมีรูปภาพจริง ถ้าไม่มีให้ซ่อนทั้งส่วน)
    const imgSection = document.getElementById("detailImageSection");
    const imgGrid = document.getElementById("detailImagesGrid");
    const validImages = [];

    if (Array.isArray(data.images)) {
      data.images.forEach((item) => {
        const src = typeof item === "string" ? item : item?.image;
        if (typeof src === "string" && src.trim() !== "") {
          validImages.push(src.trim());
        }
      });
    }
    if (validImages.length === 0 && typeof data.image === "string" && data.image.trim() !== "") {
      validImages.push(data.image.trim());
    }

    if (imgSection && imgGrid) {
      if (validImages.length === 0) {
        imgSection.style.display = "none";
        imgGrid.innerHTML = "";
      } else {
        imgSection.style.display = "";
        imgGrid.innerHTML = validImages
          .map((src) => `<div class="figma-img-box"><img src="${src}" alt="รูปภาพฝึกงาน"></div>`)
          .join("");
      }
    }

    // Comments
    renderComments(Array.isArray(data.comments) ? data.comments : []);

    if (window.lucide) window.lucide.createIcons();
  }

  // Load Review Data strictly from MongoDB API
  try {
    const targetEndpoint = reviewId
      ? `/api/reviews/${encodeURIComponent(reviewId)}`
      : "/api/reviews";
    const res = await fetch(targetEndpoint);
    if (res.ok) {
      const result = await res.json();
      const reviewDoc = Array.isArray(result) ? result[0] : result;
      if (reviewDoc) {
        renderReviewDetail(reviewDoc);
      }
    }
  } catch (err) {
    console.error("Failed to fetch review detail:", err);
  }

  // Like Button Handler (POST /api/reviews/:id/like)
  const btnLikePost = document.getElementById("btnLikePost");
  btnLikePost?.addEventListener("click", async () => {
    if (!reviewId) return;
    const countEl = document.getElementById("detailLikesCount");
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
        method: "POST"
      });
      if (res.ok) {
        const updated = await res.json();
        if (countEl) countEl.textContent = updated.likes;
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Comment Form Submit Handler (POST /api/reviews/:id/comments)
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");

  commentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = commentInput?.value.trim();
    if (!content || !reviewId) return;

    const authorName = currentUser
      ? (currentUser.userName || `User - ${currentUser.studentCode || currentUser.userId}`)
      : "User - 101";
    const authorId = currentUser?.userId || null;

    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          author_id: authorId,
          author_name: authorName,
          parent_comment_no: activeReplyParentNo
        })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        renderComments(updatedReview.comments || []);
        commentInput.value = "";
        commentInput.placeholder = "แสดงความคิดเห็น...";
        activeReplyParentNo = null;
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "ไม่สามารถบันทึกความคิดเห็นได้");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  });
});
