document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  const params = new URLSearchParams(window.location.search);
  const reviewId = params.get("id");

  let currentUser = null;
  let currentReviewData = null;
  let currentSort = "newest"; // "newest" | "popular"
  let activeReplyState = null; // { targetNo, rootNo, targetAuthor }
  let editingCommentNo = null;
  let openMenuNo = null;
  let pendingDeleteNo = null;
  const expandedThreads = new Set();

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
    const filled = Math.floor(Number(score) || 0);
    return Array.from({ length: 5 }, (_, i) => {
      const cls = i < filled ? "filled" : "";
      return `<i data-lucide="star" class="${cls}"></i>`;
    }).join("");
  }

  function isCommentOwner(comment) {
    if (!currentUser || !currentUser.userId) return !comment.author_id;
    if (!comment.author_id) return true;
    return Number(comment.author_id) === Number(currentUser.userId);
  }

  function isReviewAuthor(comment) {
    if (!currentReviewData || !currentReviewData.user_id || !comment.author_id) return false;
    return Number(currentReviewData.user_id) === Number(comment.author_id);
  }

  function hasUserLiked(comment) {
    if (!currentUser || !currentUser.userId || !Array.isArray(comment.liked_by)) return false;
    return comment.liked_by.includes(Number(currentUser.userId));
  }

  function buildCommentCardHtml(c, isReply, replyCount = 0, rootNo = null, replyToAuthor = null) {
    const owner = isCommentOwner(c);
    const reviewAuthorBadge = isReviewAuthor(c)
      ? `<span class="comment-owner-badge">เจ้าของรีวิว</span>`
      : "";
    const editedTag = c.is_edited
      ? `<span class="comment-edited-tag">• (แก้ไขแล้ว)</span>`
      : "";
    const liked = hasUserLiked(c);
    const likeCount = Number(c.likes || 0);
    const isReplyingHere = activeReplyState && activeReplyState.targetNo === c.comment_no;
    const isEditing = editingCommentNo === c.comment_no;
    const isMenuOpen = openMenuNo === c.comment_no;

    const dropdownHtml = isMenuOpen && owner
      ? `
        <div class="comment-dropdown-menu" data-menu-no="${c.comment_no}">
          <button type="button" class="comment-dropdown-item js-edit-comment" data-no="${c.comment_no}">
            <i data-lucide="pencil"></i>
            <span>แก้ไขความคิดเห็น</span>
          </button>
          <button type="button" class="comment-dropdown-item danger js-delete-comment" data-no="${c.comment_no}">
            <i data-lucide="trash-2"></i>
            <span>ลบความคิดเห็น</span>
          </button>
        </div>
      `
      : "";

    const mentionPrefix =
      isReply && replyToAuthor && !String(c.content || "").trim().startsWith(`@${replyToAuthor}`)
        ? `<span class="comment-reply-mention">@${escapeHtml(replyToAuthor)}</span> `
        : "";

    const bodyHtml = isEditing
      ? `
        <textarea class="comment-edit-textarea" id="editInput-${c.comment_no}" maxlength="500">${escapeHtml(c.content)}</textarea>
        <div class="comment-edit-actions">
          <button type="button" class="btn-reply-cancel js-cancel-edit">ยกเลิก</button>
          <button type="button" class="btn-reply-submit js-save-edit" data-no="${c.comment_no}">บันทึกการแก้ไข</button>
        </div>
      `
      : `<p class="comment-text" id="commentText-${c.comment_no}">${mentionPrefix}${escapeHtml(c.content)}</p>`;

    const footerHtml = isEditing
      ? ""
      : `
        <div class="comment-card-footer">
          <button type="button" class="comment-act-link ${liked ? "active" : ""} js-like-comment" data-no="${c.comment_no}">
            <i data-lucide="thumbs-up"></i>
            <span>ถูกใจ${likeCount > 0 ? ` (${likeCount})` : ""}</span>
          </button>
          <button
            type="button"
            class="comment-act-link ${isReplyingHere ? "active" : ""} js-reply-comment"
            data-no="${c.comment_no}"
            data-root-no="${rootNo || c.comment_no}"
            data-author="${escapeHtml(c.author_name || "User")}"
          >
            <i data-lucide="message-circle"></i>
            <span>ตอบกลับ${!isReply && replyCount > 0 ? ` (${replyCount})` : ""}</span>
          </button>
          ${
            owner
              ? `
                <button type="button" class="comment-act-link js-edit-comment" data-no="${c.comment_no}">แก้ไข</button>
                <button type="button" class="comment-act-link danger js-delete-comment" data-no="${c.comment_no}">ลบ</button>
              `
              : ""
          }
        </div>
      `;

    return `
      <div class="figma-comment-card ${isReply ? "is-reply" : ""}" data-comment-no="${c.comment_no}">
        <div class="comment-card-body">
          <div class="comment-user-row">
            <div class="comment-user-meta">
              <span class="user-circle-icon">
                <i data-lucide="user-round"></i>
              </span>
              <span class="comment-author-name">${escapeHtml(c.author_name || "User")}</span>
              ${reviewAuthorBadge}
              <span class="comment-time">${escapeHtml(formatCommentTimestamp(c.created_at))}</span>
              ${isEditing ? '<span class="comment-edited-tag">• กำลังแก้ไข...</span>' : editedTag}
            </div>
            ${
              owner
                ? `
                  <div class="comment-more-wrapper">
                    <button type="button" class="comment-more-btn js-toggle-menu" data-no="${c.comment_no}" aria-label="ตัวเลือกเพิ่มเติม">
                      <i data-lucide="more-horizontal"></i>
                    </button>
                    ${dropdownHtml}
                  </div>
                `
                : ""
            }
          </div>
          ${bodyHtml}
        </div>
        ${footerHtml}
      </div>
    `;
  }

  function buildInlineReplyHtml(targetAuthor, isInsideReplyThread = false, hasRepliesBelow = false) {
    return `
      <div class="inline-reply-composer ${isInsideReplyThread ? "in-thread" : ""}">
        <div class="inline-reply-label">
          <i data-lucide="corner-down-right"></i>
          <span>กำลังตอบกลับ @${escapeHtml(targetAuthor)}</span>
        </div>
        <div class="inline-reply-row">
          <span class="user-circle-icon">
            <i data-lucide="user-round"></i>
          </span>
          <form class="inline-reply-form" id="inlineReplyForm">
            <textarea
              class="inline-reply-textarea"
              id="inlineReplyInput"
              placeholder="พิมพ์คำตอบของคุณถึง @${escapeHtml(targetAuthor)}..."
              maxlength="500"
              required
            ></textarea>
            <div class="inline-reply-actions">
              <button type="button" class="btn-reply-cancel js-cancel-reply">ยกเลิก</button>
              <button type="submit" class="btn-reply-submit">ส่งคำตอบ</button>
            </div>
          </form>
        </div>
      </div>
      ${!isInsideReplyThread && hasRepliesBelow ? '<hr class="inline-reply-divider">' : ""}
    `;
  }

  function renderComments(commentsArr = []) {
    const listEl = document.getElementById("commentsList");
    const headerCountEl = document.getElementById("commentHeaderCount");

    if (headerCountEl) headerCountEl.textContent = commentsArr.length;
    if (!listEl) return;

    if (commentsArr.length === 0) {
      listEl.innerHTML = `
        <div class="comment-empty-state">
          <i data-lucide="message-circle"></i>
          <h3 class="comment-empty-title">ยังไม่มีความคิดเห็นในรีวิวนี้</h3>
          <p class="comment-empty-sub">เป็นคนแรกที่เริ่มพูดคุย หรือสอบถามข้อมูลเพิ่มเติมเกี่ยวกับการฝึกงานได้เลย</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // สร้างแผนที่สำหรับจัดกลุ่มคำตอบย่อยให้อยู่ใต้ Root Comment
    const commentMap = new Map(commentsArr.map((c) => [c.comment_no, c]));
    const findRootNo = (c) => {
      let cur = c;
      const visited = new Set();
      while (cur && cur.parent_comment_no && commentMap.has(cur.parent_comment_no) && !visited.has(cur.comment_no)) {
        visited.add(cur.comment_no);
        cur = commentMap.get(cur.parent_comment_no);
      }
      return cur ? cur.comment_no : c.comment_no;
    };

    const topLevel = commentsArr.filter((c) => !c.parent_comment_no || !commentMap.has(c.parent_comment_no));
    const repliesByRoot = new Map();

    for (const c of commentsArr) {
      if (c.parent_comment_no && commentMap.has(c.parent_comment_no)) {
        const rootNo = findRootNo(c);
        if (!repliesByRoot.has(rootNo)) repliesByRoot.set(rootNo, []);
        repliesByRoot.get(rootNo).push(c);
      }
    }

    topLevel.sort((a, b) => {
      if (currentSort === "popular") {
        const diff = (b.likes || 0) - (a.likes || 0);
        if (diff !== 0) return diff;
      }
      return (b.comment_no || 0) - (a.comment_no || 0);
    });

    listEl.innerHTML = topLevel
      .map((parent) => {
        const replies = (repliesByRoot.get(parent.comment_no) || []).sort(
          (a, b) => (a.comment_no || 0) - (b.comment_no || 0)
        );
        const isReplyingToParent = activeReplyState && activeReplyState.targetNo === parent.comment_no;
        const isExpanded = expandedThreads.has(parent.comment_no);
        const visibleReplies = isExpanded ? replies : replies.slice(0, 2);
        const hiddenCount = replies.length - visibleReplies.length;

        const parentInlineReplyHtml = isReplyingToParent
          ? buildInlineReplyHtml(activeReplyState.targetAuthor, false, replies.length > 0)
          : "";

        const repliesHtml =
          replies.length > 0
            ? `
              <div class="replies-section-label">คำตอบทั้งหมด (${replies.length})</div>
              <div class="comment-replies-thread">
                ${visibleReplies
                  .map((r) => {
                    const isReplyingToThisReply = activeReplyState && activeReplyState.targetNo === r.comment_no;
                    const parentComment = r.parent_comment_no ? commentMap.get(r.parent_comment_no) : null;
                    const replyToAuthor = parentComment ? (parentComment.author_name || "User") : null;
                    return `
                      ${buildCommentCardHtml(r, true, 0, parent.comment_no, replyToAuthor)}
                      ${isReplyingToThisReply ? buildInlineReplyHtml(activeReplyState.targetAuthor, true, false) : ""}
                    `;
                  })
                  .join("")}
                ${
                  hiddenCount > 0
                    ? `
                      <button type="button" class="btn-show-more-replies js-expand-replies" data-root-no="${parent.comment_no}">
                        <i data-lucide="chevron-down"></i>
                        <span>ดูคำตอบเพิ่มเติมอีก ${hiddenCount} รายการ</span>
                      </button>
                    `
                    : ""
                }
              </div>
            `
            : "";

        return `
          <div class="comment-thread-wrapper" data-thread-root="${parent.comment_no}">
            ${buildCommentCardHtml(parent, false, replies.length, parent.comment_no)}
            ${parentInlineReplyHtml}
            ${repliesHtml}
          </div>
        `;
      })
      .join("");

    if (window.lucide) window.lucide.createIcons();

    if (activeReplyState) {
      const replyInput = document.getElementById("inlineReplyInput");
      if (replyInput) replyInput.focus();
    }
    if (editingCommentNo) {
      const editInput = document.getElementById(`editInput-${editingCommentNo}`);
      if (editInput) {
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      }
    }

    bindCommentEvents();
  }

  function bindCommentEvents() {
    const listEl = document.getElementById("commentsList");
    if (!listEl) return;

    // 1. กดปุ่มตอบกลับ -> เปิด Inline Reply ใต้คอมเมนต์นั้นๆ (ตรงกับ targetNo ที่กด)
    listEl.querySelectorAll(".js-reply-comment").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetNo = Number(btn.getAttribute("data-no"));
        const rootNo = Number(btn.getAttribute("data-root-no"));
        const targetAuthor = btn.getAttribute("data-author") || "User";
        if (activeReplyState && activeReplyState.targetNo === targetNo) {
          activeReplyState = null;
        } else {
          activeReplyState = { targetNo, rootNo, targetAuthor };
          editingCommentNo = null;
        }
        openMenuNo = null;
        renderComments(currentReviewData?.comments || []);
      });
    });

    listEl.querySelector(".js-cancel-reply")?.addEventListener("click", () => {
      activeReplyState = null;
      renderComments(currentReviewData?.comments || []);
    });

    // ส่งคำตอบ Inline Reply
    document.getElementById("inlineReplyForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("inlineReplyInput");
      const content = input?.value.trim();
      if (!content || !reviewId || !activeReplyState) return;

      const authorName = currentUser
        ? (currentUser.userName || `User - ${currentUser.studentCode || currentUser.userId}`)
        : "User - 101";

      try {
        const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            author_id: currentUser?.userId || null,
            author_name: authorName,
            parent_comment_no: activeReplyState.targetNo
          })
        });
        if (res.ok) {
          currentReviewData = await res.json();
          expandedThreads.add(activeReplyState.rootNo);
          activeReplyState = null;
          renderComments(currentReviewData.comments || []);
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || "ไม่สามารถส่งคำตอบได้");
        }
      } catch (err) {
        console.error(err);
      }
    });

    // 2. กดถูกใจความคิดเห็น
    listEl.querySelectorAll(".js-like-comment").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!reviewId) return;
        const no = Number(btn.getAttribute("data-no"));
        try {
          const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments/${no}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser?.userId || null })
          });
          if (res.ok) {
            currentReviewData = await res.json();
            renderComments(currentReviewData.comments || []);
          }
        } catch (err) {
          console.error(err);
        }
      });
    });

    // 3. เปิด/ปิด Dropdown Menu (•••)
    listEl.querySelectorAll(".js-toggle-menu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const no = Number(btn.getAttribute("data-no"));
        openMenuNo = openMenuNo === no ? null : no;
        renderComments(currentReviewData?.comments || []);
      });
    });

    // 4. เข้าสู่โหมดแก้ไข Inline Edit
    listEl.querySelectorAll(".js-edit-comment").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingCommentNo = Number(btn.getAttribute("data-no"));
        activeReplyState = null;
        openMenuNo = null;
        renderComments(currentReviewData?.comments || []);
      });
    });

    listEl.querySelector(".js-cancel-edit")?.addEventListener("click", () => {
      editingCommentNo = null;
      renderComments(currentReviewData?.comments || []);
    });

    listEl.querySelector(".js-save-edit")?.addEventListener("click", async (e) => {
      const no = Number(e.currentTarget.getAttribute("data-no"));
      const editInput = document.getElementById(`editInput-${no}`);
      const nextText = editInput?.value.trim();
      if (!nextText || !reviewId) return;

      try {
        const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments/${no}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: nextText,
            user_id: currentUser?.userId || null
          })
        });
        if (res.ok) {
          currentReviewData = await res.json();
          editingCommentNo = null;
          renderComments(currentReviewData.comments || []);
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.message || "ไม่สามารถแก้ไขความคิดเห็นได้");
        }
      } catch (err) {
        console.error(err);
      }
    });

    // 5. เปิด Modal ยืนยันการลบ
    listEl.querySelectorAll(".js-delete-comment").forEach((btn) => {
      btn.addEventListener("click", () => {
        pendingDeleteNo = Number(btn.getAttribute("data-no"));
        openMenuNo = null;
        renderComments(currentReviewData?.comments || []);
        const modal = document.getElementById("deleteCommentModal");
        if (modal) modal.hidden = false;
      });
    });

    // 6. ดูคำตอบเพิ่มเติม
    listEl.querySelectorAll(".js-expand-replies").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rootNo = Number(btn.getAttribute("data-root-no"));
        expandedThreads.add(rootNo);
        renderComments(currentReviewData?.comments || []);
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

    const uid = currentUser?.userId ? Number(currentUser.userId) : null;
    const isPostLiked = uid && Array.isArray(data.upvoted_by) && data.upvoted_by.includes(uid);
    const isPostBookmarked =
      uid && Array.isArray(data.bookmarked_by) && data.bookmarked_by.some((b) => Number(b.user_id) === uid);
    document.getElementById("btnLikePost")?.classList.toggle("active", Boolean(isPostLiked));
    document.getElementById("btnBookmarkPost")?.classList.toggle("active", Boolean(isPostBookmarked));

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
    const qSectionEl = document.getElementById("detailQuestionSection");
    const qListEl = document.getElementById("detailQuestionsList");
    document.getElementById("detailQuestionCount").textContent = `(${questions.length} ข้อ)`;

    if (questions.length === 0) {
      if (qSectionEl) qSectionEl.style.display = "none";
      if (qListEl) qListEl.innerHTML = "";
    } else {
      if (qSectionEl) qSectionEl.style.display = "";
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
    currentReviewData = data;
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
    const uid = currentUser?.userId ? Number(currentUser.userId) : null;
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid })
      });
      if (res.ok) {
        const updated = await res.json();
        if (countEl) countEl.textContent = updated.likes;
        const isLiked = uid && Array.isArray(updated.upvoted_by) && updated.upvoted_by.includes(uid);
        btnLikePost.classList.toggle("active", Boolean(isLiked));
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Bookmark Button Handler (POST /api/reviews/:id/bookmark)
  const btnBookmarkPost = document.getElementById("btnBookmarkPost");
  btnBookmarkPost?.addEventListener("click", async () => {
    if (!reviewId) return;
    const uid = currentUser?.userId ? Number(currentUser.userId) : null;
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid })
      });
      if (res.ok) {
        const updated = await res.json();
        const isBookmarked =
          uid && Array.isArray(updated.bookmarked_by) && updated.bookmarked_by.some((b) => Number(b.user_id) === uid);
        btnBookmarkPost.classList.toggle("active", Boolean(isBookmarked));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "ไม่สามารถบันทึกรีวิวได้");
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Comment Form Submit Handler (POST /api/reviews/:id/comments)
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");
  const commentCharCount = document.getElementById("commentCharCount");

  commentInput?.addEventListener("input", () => {
    if (commentCharCount) {
      commentCharCount.textContent = `${commentInput.value.length} / 500 ตัวอักษร`;
    }
  });

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
          parent_comment_no: null
        })
      });
      if (res.ok) {
        currentReviewData = await res.json();
        renderComments(currentReviewData.comments || []);
        commentInput.value = "";
        if (commentCharCount) commentCharCount.textContent = "0 / 500 ตัวอักษร";
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "ไม่สามารถบันทึกความคิดเห็นได้");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  });

  // Sort Pills (ใหม่ล่าสุด / ยอดนิยม)
  const sortNewestBtn = document.getElementById("sortNewestBtn");
  const sortPopularBtn = document.getElementById("sortPopularBtn");
  [sortNewestBtn, sortPopularBtn].forEach((btn) => {
    btn?.addEventListener("click", () => {
      currentSort = btn.getAttribute("data-sort") || "newest";
      sortNewestBtn?.classList.toggle("active", currentSort === "newest");
      sortPopularBtn?.classList.toggle("active", currentSort === "popular");
      renderComments(currentReviewData?.comments || []);
    });
  });

  // Delete Modal Handlers
  const deleteModal = document.getElementById("deleteCommentModal");
  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    pendingDeleteNo = null;
    if (deleteModal) deleteModal.hidden = true;
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", async () => {
    if (!pendingDeleteNo || !reviewId) return;
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments/${pendingDeleteNo}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser?.userId || null })
      });
      if (res.ok) {
        currentReviewData = await res.json();
        if (activeReplyState?.rootNo === pendingDeleteNo) activeReplyState = null;
        if (editingCommentNo === pendingDeleteNo) editingCommentNo = null;
        renderComments(currentReviewData.comments || []);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "ไม่สามารถลบความคิดเห็นได้");
      }
    } catch (err) {
      console.error(err);
    } finally {
      pendingDeleteNo = null;
      if (deleteModal) deleteModal.hidden = true;
    }
  });

  // ปิด Dropdown เมื่อคลิกนอกเมนู
  document.addEventListener("click", (e) => {
    if (openMenuNo && !e.target.closest(".comment-more-wrapper")) {
      openMenuNo = null;
      renderComments(currentReviewData?.comments || []);
    }
  });
});
