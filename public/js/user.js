const list = document.querySelector("#myReviews");
const statusText = document.querySelector("#reviewStatus");
const order = document.querySelector("#reviewOrder");
const orderDropdown = document.querySelector("#reviewOrderDropdown");
const orderBtn = document.querySelector("#reviewOrderBtn");
const orderLabel = document.querySelector("#reviewOrderLabel");
const orderMenu = document.querySelector("#reviewOrderMenu");

if (orderBtn && orderMenu && orderDropdown) {
  orderBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = orderMenu.hidden;
    orderMenu.hidden = !isOpen;
    orderDropdown.classList.toggle("open", isOpen);
    orderBtn.setAttribute("aria-expanded", String(isOpen));
  });

  orderMenu.querySelectorAll(".sort-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = opt.dataset.value;
      if (order) order.value = val;
      if (orderLabel) orderLabel.textContent = opt.textContent;
      orderMenu.querySelectorAll(".sort-option").forEach((o) => {
        const active = o === opt;
        o.classList.toggle("active", active);
        o.setAttribute("aria-selected", String(active));
      });
      orderMenu.hidden = true;
      orderDropdown.classList.remove("open");
      orderBtn.setAttribute("aria-expanded", "false");
      order?.dispatchEvent(new Event("change"));
    });
  });

  document.addEventListener("click", (e) => {
    if (!orderDropdown.contains(e.target)) {
      orderMenu.hidden = true;
      orderDropdown.classList.remove("open");
      orderBtn.setAttribute("aria-expanded", "false");
    }
  });
}

const dialog = document.querySelector("#deleteReview");
const confirmDelete = document.querySelector("#confirmDelete");
const cancelDelete = document.querySelector("#cancelDelete");
const message = document.querySelector("#deleteMessage");
cancelDelete.onclick = () => dialog.close();
dialog.oncancel = event => {
  if (confirmDelete.disabled) event.preventDefault();
};
confirmDelete.onclick = async () => {
  confirmDelete.disabled = cancelDelete.disabled = true;
  try {
    const response = await fetch("/api/me/reviews/" + encodeURIComponent(dialog.dataset.id), { method: "DELETE" });
    if (!response.ok) throw new Error(String(response.status));
    dialog.close();
    location.reload();
  } catch (error) {
    message.textContent = "ลบรีวิวไม่สำเร็จ กรุณาลองอีกครั้ง";
  } finally {
    confirmDelete.disabled = cancelDelete.disabled = false;
    confirmDelete.focus();
  }
};

function addOwnerActions(card, review) {
  const actions = card.querySelector(".card-actions");
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "action-btn owner-edit";
  edit.textContent = "แก้ไขรีวิว";
  edit.onclick = () => location.assign("post-review.html?edit=" + encodeURIComponent(review._id));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "action-btn owner-delete";
  remove.textContent = "ลบ";
  remove.onclick = () => {
    dialog.dataset.id = review._id;
    message.textContent = "ต้องการลบรีวิวของ " + (review.company_name || "คุณ") + " หรือไม่? เมื่อลบแล้วจะกู้คืนไม่ได้";
    dialog.showModal();
  };
  actions.append(edit, remove);
}

async function loadProfile() {
  if (orderBtn) orderBtn.disabled = true;
  const viewUserId = new URLSearchParams(location.search).get("id");

  try {
    const identity = await fetch("/api/auth/me", { cache: "no-store" });
    if (identity.status === 401) {
      location.replace("login.html");
      return;
    }
    if (!identity.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
    const me = await identity.json();

    const targetId = viewUserId ? Number(viewUserId) : Number(me.userId);
    const isOwnProfile = !viewUserId || targetId === Number(me.userId);

    let profile = me;
    let reviews = [];

    if (isOwnProfile) {
      const result = await fetch("/api/me/reviews", { cache: "no-store" });
      if (result.status === 401) return location.replace("login.html");
      if (!result.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      ({ reviews } = await result.json());
    } else {
      const result = await fetch(`/api/users/${encodeURIComponent(targetId)}/profile`, { cache: "no-store" });
      if (result.status === 401) return location.replace("login.html");
      if (result.status === 404) {
        document.querySelector("#profileName").textContent = "ไม่พบผู้ใช้งานนี้";
        statusText.textContent = "ไม่พบข้อมูลโปรไฟล์ที่คุณต้องการดู";
        document.querySelector('.profile a[href="setting.html"]')?.setAttribute("hidden", "");
        document.querySelector(".banner")?.setAttribute("hidden", "");
        return;
      }
      if (!result.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const data = await result.json();
      profile = data.user;
      reviews = data.reviews || [];

      // ซ่อนปุ่มแก้ไขโปรไฟล์และแบนเนอร์เขียนรีวิวเมื่อดูโปรไฟล์คนอื่น
      document.querySelector('.profile a[href="setting.html"]')?.style.setProperty("display", "none");
      document.querySelector(".banner")?.style.setProperty("display", "none");
      const listHeading = document.querySelector(".list-head h2");
      if (listHeading) {
        const nameLabel = profile.userName || profile.studentCode || "สมาชิก";
        listHeading.innerHTML = `<i data-lucide="pin" class="solid"></i>รีวิวของ ${String(nameLabel).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]))} <span id="reviewCount"></span>`;
      }
    }

    document.querySelector("#profileName").textContent = profile.userName || profile.studentCode;
    const bigAvatar = document.querySelector(".profile .big");
    if (bigAvatar && profile.profileImage) {
      const img = document.createElement("img");
      img.src = profile.profileImage;
      img.alt = profile.userName || "Profile";
      img.className = "profile-avatar-img";
      bigAvatar.replaceChildren(img);
    }
    document.querySelector("#reviewCount").textContent = "(" + reviews.length + " รีวิว)";
    statusText.textContent = reviews.length ? "" : (isOwnProfile ? "ยังไม่มีรีวิว" : "ผู้ใช้นี้ยังไม่มีรีวิวที่เปิดเผย");
    if (orderBtn) orderBtn.disabled = reviews.length < 2;
    await window.InternsightUI.loadCurrentUser();
    async function render() {
      const sorted = order.value === "oldest" ? [...reviews].reverse() : reviews;
      if (sorted.length) {
        const ui = window.InternsightUI;
        await ui.renderReviewCards(list.id, sorted.map(ui.mapDbReviewToCard));
        if (isOwnProfile) {
          list.querySelectorAll(".review-card").forEach((card, index) => addOwnerActions(card, sorted[index]));
        }
      } else {
        list.replaceChildren();
      }
    }
    order.addEventListener("change", render);
    await render();
  } catch (error) {
    console.error({ event: "profile_load_failed", type: error.name });
    statusText.textContent = "โหลดข้อมูลโปรไฟล์ไม่ได้ กรุณารีเฟรชเพื่อลองอีกครั้ง";
  }
}
window.lucide?.createIcons();
loadProfile();
