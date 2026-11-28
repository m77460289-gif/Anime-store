(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const money = value => new Intl.NumberFormat("fa-IR").format(Number(value) || 0) + " تومان";
  const number = value => new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  const statusText = status => ({
    PENDING: "در انتظار تأیید",
    PROCESSING: "در حال آماده‌سازی",
    SHIPPED: "ارسال شده",
    COMPLETED: "تکمیل شده",
    CANCELLED: "لغو شده"
  }[status] || status || "نامشخص");

  const section = $("#adminSection");
  if (!section) return;

  const navLink = $("#adminNav");
  const originalGrid = $(".admin-grid", section);
  if (!originalGrid) return;

  const productForm = $("#productAdminForm", originalGrid);
  const orderCard = originalGrid.children[1];
  const shell = document.createElement("div");
  shell.className = "admin-shell";
  shell.innerHTML = `
    <div class="admin-stats" id="adminStats" aria-live="polite"></div>
    <div class="admin-workspace">
      <nav class="admin-tabs" aria-label="بخش‌های پنل مدیریت">
        <button type="button" class="admin-tab active" data-admin-tab="overview">نمای کلی</button>
        <button type="button" class="admin-tab" data-admin-tab="products">مدیریت محصولات</button>
        <button type="button" class="admin-tab" data-admin-tab="orders">مدیریت سفارش‌ها</button>
        <button type="button" class="admin-tab" data-admin-tab="customers">مشتریان</button>
        <button type="button" class="admin-tab" data-admin-tab="messages">پیام‌های دریافتی</button>
        <button type="button" class="admin-tab" data-admin-tab="reports">گزارش فروش</button>
        <button type="button" class="admin-tab" data-admin-tab="coupons">کدهای تخفیف</button>
        <button type="button" class="admin-tab" data-admin-tab="reviews">نظرات مشتریان</button>
      </nav>
      <section class="admin-view active" data-admin-view="overview">
        <div class="admin-card admin-overview-card">
          <h3>خلاصه فروشگاه</h3>
          <p id="adminOverviewText" class="muted">اطلاعات فروشگاه در این بخش نمایش داده می‌شود.</p>
          <h4>آخرین سفارش‌ها</h4>
          <div id="adminRecentOrders"></div>
        </div>
      </section>
      <section class="admin-view" data-admin-view="products">
        <div id="adminProductFormHost"></div>
        <div class="admin-card admin-list-card">
          <h3>فهرست محصولات</h3>
          <div id="adminProductList"></div>
        </div>
      </section>
      <section class="admin-view" data-admin-view="orders">
        <div id="adminOrderHost"></div>
      </section>
      <section class="admin-view" data-admin-view="customers">
        <div class="admin-card admin-list-card">
          <h3>فهرست مشتریان</h3>
          <div id="adminUsers"></div>
        </div>
      </section>
      <section class="admin-view" data-admin-view="messages">
        <div class="admin-card admin-list-card">
          <h3>پیام‌های فرم تماس</h3>
          <div id="adminMessages"></div>
        </div>
      </section>
      <section class="admin-view" data-admin-view="coupons">
        <div class="admin-card admin-coupon-card"><h3>ساخت کد تخفیف</h3><form id="couponAdminForm" class="admin-coupon-form"><label>کد تخفیف<input name="code" required maxlength="40" placeholder="NIGA20"></label><label>نوع تخفیف<select name="type"><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت (تومان)</option></select></label><label>مقدار تخفیف<input name="value" type="number" min="1" required></label><label>حداقل مبلغ خرید (تومان)<input name="minOrder" type="number" min="0" value="0"></label><label>سقف تعداد استفاده (۰ = نامحدود)<input name="usageLimit" type="number" min="0" value="0"></label><label>تاریخ انقضا<input name="expiresAt" type="date"></label><button class="button button-primary">ذخیره کد</button><p id="couponAdminFeedback" class="form-feedback"></p></form></div><div class="admin-card admin-list-card"><h3>کدهای ثبت‌شده</h3><div id="adminCouponList"></div></div>
      </section>
      <section class="admin-view" data-admin-view="reviews"><div class="admin-card admin-list-card"><h3>نظرات ثبت‌شده</h3><div id="adminReviews"></div></div></section>
      <section class="admin-view" data-admin-view="reports">
        <div class="admin-card admin-report-card">
          <div class="admin-report-heading"><div><h3>گزارش عملکرد فروشگاه</h3><p class="muted">آمار بر اساس سفارش‌های ذخیره‌شده در همین مرورگر</p></div><label>بازه گزارش <select id="adminReportRange"><option value="7">۷ روز اخیر</option><option value="30" selected>۳۰ روز اخیر</option><option value="all">تمام مدت</option></select></label></div>
          <div id="adminReportStats" class="admin-report-stats"></div>
          <div class="admin-report-columns"><section><h4>فروش در بازه انتخابی</h4><div id="adminRevenueChart"></div></section><section><h4>محصولات پرفروش</h4><div id="adminTopProducts"></div></section></div>
          <section class="admin-report-status"><h4>وضعیت سفارش‌ها</h4><div id="adminStatusBreakdown"></div></section>
        </div>
      </section>
    </div>
  `;

  originalGrid.replaceWith(shell);
  if (productForm) $("#adminProductFormHost", shell).appendChild(productForm);
  if (orderCard) $("#adminOrderHost", shell).appendChild(orderCard);

  function adminUser() {
    return read("niga-demo-current-user", null);
  }

  function isAdmin() {
    return adminUser()?.role === "ADMIN";
  }

  function setTab(tabName) {
    shell.querySelectorAll("[data-admin-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.adminTab === tabName);
    });
    shell.querySelectorAll("[data-admin-view]").forEach(view => {
      view.classList.toggle("active", view.dataset.adminView === tabName);
    });
  }

  function renderStats(products, orders, users, messages) {
    const activeProducts = products.filter(product => product.active !== false);
    const customers = users.filter(user => user.role !== "ADMIN");
    const pending = orders.filter(order => order.status === "PENDING").length;
    const sales = orders
      .filter(order => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + Number(order.totalToman || 0), 0);
    $("#adminStats").innerHTML = [
      ["محصولات فعال", number(activeProducts.length), "▦"],
      ["کل سفارش‌ها", number(orders.length), "▤"],
      ["در انتظار تأیید", number(pending), "◷"],
      ["مشتریان", number(customers.length), "♙"],
      ["مجموع سفارش‌ها", money(sales), "◈"]
    ].map(([label, value, icon]) => `
      <article class="admin-stat">
        <span class="admin-stat-icon">${icon}</span>
        <small>${label}</small>
        <strong>${value}</strong>
      </article>
    `).join("");
    $("#adminOverviewText").textContent =
      `در حال حاضر ${number(activeProducts.length)} محصول فعال، ${number(customers.length)} مشتری و ${number(messages.length)} پیام ثبت شده است.`;
  }

  function renderProducts(products) {
    const list = $("#adminProductList");
    const rows = products.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    if (!rows.length) {
      list.innerHTML = '<p class="muted">هنوز محصولی ثبت نشده است.</p>';
      return;
    }
    list.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>محصول</th><th>دسته‌بندی</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th>عملیات</th></tr></thead>
          <tbody>${rows.map(product => `
            <tr>
              <td><div class="admin-product-cell"><img src="${esc(product.imageUrl || "assets/images/gojo-poster.webp")}" alt=""><b>${esc(product.name)}</b></div></td>
              <td>${esc(product.category || "سایر")}</td>
              <td>${Number(product.priceToman) > 0 ? money(product.priceToman) : "قیمت ثبت نشده"}</td>
              <td>${product.stock == null ? "نامحدود" : number(product.stock)}</td>
              <td><span class="admin-status ${product.active === false ? "inactive" : "active"}">${product.active === false ? "غیرفعال" : "فعال"}</span></td>
              <td class="admin-row-actions">
                <button type="button" data-edit-product="${esc(product.id)}">ویرایش</button>
                ${product.active === false
                  ? '<span class="muted">غیرفعال</span>'
                  : `<button type="button" class="danger" data-delete-product="${esc(product.id)}">حذف</button>`}
              </td>
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  function renderUsers(users, orders) {
    const customers = users.filter(user => user.role !== "ADMIN");
    $("#adminUsers").innerHTML = customers.length ? `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>نام مشتری</th><th>ایمیل</th><th>تعداد سفارش‌ها</th></tr></thead>
          <tbody>${customers.map(user => `
            <tr>
              <td>${esc(user.name || "بدون نام")}</td>
              <td dir="ltr">${esc(user.email)}</td>
              <td>${number(orders.filter(order => order.userEmail === user.email).length)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>` : '<p class="muted">هنوز مشتری‌ای ثبت‌نام نکرده است.</p>';
  }

  function renderMessages(messages) {
    const target = $("#adminMessages");
    const rows = messages.slice().sort((a, b) => Number(b.id) - Number(a.id));
    target.innerHTML = rows.length ? rows.map(message => `
      <article class="admin-message">
        <div class="admin-message-head">
          <b>${esc(message.name || "بدون نام")}</b>
          <small dir="ltr">${esc(message.email || "")}</small>
          <button type="button" class="danger" data-delete-message="${esc(message.id)}">حذف پیام</button>
        </div>
        <strong>${esc(message.subject || "بدون موضوع")}</strong>
        <p>${esc(message.message || "")}</p>
      </article>`).join("") : '<p class="muted">پیامی دریافت نشده است.</p>';
  }

  function renderReviews(reviews, products) {
    const target = $("#adminReviews");
    const rows = reviews.slice().sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
    target.innerHTML = rows.length ? rows.map(review => {
      const product = products.find(item => String(item.id) === String(review.productId));
      return '<article class="admin-message"><div class="admin-message-head"><b>'+esc(review.name||"مشتری نیگا")+'</b><small>'+esc(product?.name||"محصول حذف‌شده")+'</small><span class="review-stars">'+("★".repeat(Math.max(0,Math.min(5,Number(review.rating)||0))))+'</span><button type="button" data-review-approve="'+esc(review.id)+'" data-approved="'+String(!!review.approved)+'">'+(review.approved?"برداشتن تأیید":"تأیید و انتشار")+'</button><button type="button" class="danger" data-delete-review="'+esc(review.id)+'">حذف نظر</button></div><p>'+esc(review.comment||"")+'</p></article>';
    }).join("") : '<p class="muted">هنوز نظری ثبت نشده است.</p>';
  }

  function renderReports(products, orders, users) {
    const range = $("#adminReportRange")?.value || "30";
    const now = Date.now();
    const cutoff = range === "all" ? 0 : now - Number(range) * 86400000;
    const inRange = orders.filter(order => {
      const time = Date.parse(order.createdAt || "");
      return Number.isFinite(time) && time >= cutoff && time <= now;
    });
    const validOrders = inRange.filter(order => order.status !== "CANCELLED");
    const revenue = validOrders.reduce((sum, order) => sum + (Number(order.totalToman) || 0), 0);
    const completed = inRange.filter(order => order.status === "COMPLETED").length;
    const quantities = new Map();
    validOrders.forEach(order => (Array.isArray(order.items) ? order.items : []).forEach(item => {
      const name = String(item.name || "محصول بدون نام");
      quantities.set(name, (quantities.get(name) || 0) + Math.max(0, Number(item.quantity) || 0));
    }));
    const top = [...quantities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    $("#adminReportStats").innerHTML = [
      ["فروش غیرلغوشده", money(revenue)],
      ["سفارش‌های ثبت‌شده", number(inRange.length)],
      ["سفارش‌های تکمیل‌شده", number(completed)],
      ["میانگین مبلغ سفارش", money(validOrders.length ? Math.round(revenue / validOrders.length) : 0)]
    ].map(([label, value]) => `<article class="admin-report-stat"><small>${label}</small><strong>${value}</strong></article>`).join("");

    const days = range === "all" ? 14 : Math.min(Number(range), 30);
    const buckets = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date(now - offset * 86400000);
      const key = date.toLocaleDateString("en-CA");
      const total = validOrders.filter(order => {
        const d = new Date(order.createdAt);
        return Number.isFinite(d.getTime()) && d.toLocaleDateString("en-CA") === key;
      }).reduce((sum, order) => sum + (Number(order.totalToman) || 0), 0);
      buckets.push({label: new Intl.DateTimeFormat("fa-IR", {day:"numeric",month:"short"}).format(date), total});
    }
    const max = Math.max(1, ...buckets.map(bucket => bucket.total));
    $("#adminRevenueChart").innerHTML = buckets.some(bucket => bucket.total) ? `
      <div class="admin-bars">${buckets.map(bucket => `<div class="admin-bar-item" title="${esc(bucket.label)}: ${esc(money(bucket.total))}"><div class="admin-bar-track"><i style="height:${Math.max(3, bucket.total / max * 100)}%"></i></div><small>${esc(bucket.label)}</small></div>`).join("")}</div>
    ` : '<p class="muted">در این بازه فروشی ثبت نشده است.</p>';
    $("#adminTopProducts").innerHTML = top.length ? `
      <ol class="admin-top-list">${top.map(([name, qty]) => `<li><span>${esc(name)}</span><b>${number(qty)} عدد</b></li>`).join("")}</ol>
    ` : '<p class="muted">اطلاعات اقلام سفارش برای رتبه‌بندی کافی نیست.</p>';
    const statuses = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];
    $("#adminStatusBreakdown").innerHTML = statuses.map(status => {
      const count = inRange.filter(order => order.status === status).length;
      return `<div class="admin-status-row"><span>${statusText(status)}</span><b>${number(count)}</b></div>`;
    }).join("");
  }

  function renderRecentOrders(orders) {
    const target = $("#adminRecentOrders");
    const recent = orders.slice().sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
    target.innerHTML = recent.length ? recent.map(order => `
      <div class="admin-recent-order">
        <div><b>سفارش #${number(order.id)}</b><small>${esc(order.customerName || "بدون نام")} · ${money(order.totalToman)}</small></div>
        <span class="admin-status ${esc((order.status || "PENDING").toLowerCase())}">${statusText(order.status)}</span>
      </div>`).join("") : '<p class="muted">هنوز سفارشی ثبت نشده است.</p>';
  }

  let renderSequence = 0;
  async function render() {
    const permitted = isAdmin();
    if (navLink) navLink.hidden = !permitted;
    if (!permitted || section.hidden) return;
    const sequence = ++renderSequence;
    const products = read("niga-demo-products", []);
    const orders = read("niga-demo-orders", []);
    let users = [], messages = [], reviews = [];
    const client = window.nigaSupabase;
    if (client) {
      try {
        const [profileResult,messageResult,reviewResult] = await Promise.all([
          client.from("profiles").select("id,full_name,phone,role,created_at").order("created_at",{ascending:false}),
          client.from("support_messages").select("id,user_id,customer_name,customer_email,subject,message,status,created_at").order("created_at",{ascending:false}),
          client.from("reviews").select("id,product_id,user_id,rating,comment,is_approved,created_at").order("created_at",{ascending:false})
        ]);
        if (profileResult.error) throw profileResult.error;
        if (messageResult.error) throw messageResult.error;
        if (reviewResult.error) throw reviewResult.error;
        users = (profileResult.data||[]).map(u=>({id:u.id,name:u.full_name||"مشتری",email:u.id,phone:u.phone,role:u.role==="admin"?"ADMIN":"CUSTOMER"}));
        messages = (messageResult.data||[]).map(m=>({id:m.id,name:m.customer_name,email:m.customer_email,subject:m.subject,message:m.message,createdAt:m.created_at,status:m.status}));
        reviews = (reviewResult.data||[]).map(r=>({id:r.id,productId:r.product_id,userEmail:r.user_id,name:"مشتری · "+String(r.user_id).slice(0,8),rating:r.rating,comment:r.comment,approved:r.is_approved,createdAt:new Date(r.created_at).getTime()}));
      } catch(error) {
        console.error("Admin data load:",error);
        const box=$("#adminOverviewText");if(box)box.textContent="بارگذاری برخی اطلاعات آنلاین ناموفق بود: "+(error.message||"خطای ارتباط");
        return;
      }
    }
    if (sequence !== renderSequence) return;
    renderStats(products, orders, users, messages);
    renderProducts(products);
    renderUsers(users, orders);
    renderMessages(messages);
    renderReviews(reviews, products);
    renderRecentOrders(orders);
    renderReports(products, orders, users);
  }

  shell.addEventListener("click", event => {
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) {
      setTab(tab.dataset.adminTab);
      render();
      return;
    }
    const deleteReview = event.target.closest("[data-delete-review]");
    if (deleteReview && isAdmin()) {
      deleteReview.disabled = true;
      window.nigaSupabase.from("reviews").delete().eq("id",deleteReview.dataset.deleteReview).then(({error})=>{if(error)alert("حذف دیدگاه انجام نشد: "+error.message);render()});
      return;
    }
    const approveReview = event.target.closest("[data-review-approve]");
    if (approveReview && isAdmin()) {
      approveReview.disabled = true;
      window.nigaSupabase.from("reviews").update({is_approved:approveReview.dataset.approved!=="true"}).eq("id",approveReview.dataset.reviewApprove).then(({error})=>{if(error)alert("تغییر وضعیت دیدگاه انجام نشد: "+error.message);render()});
      return;
    }
    const deleteMessage = event.target.closest("[data-delete-message]");
    if (deleteMessage && isAdmin()) {
      deleteMessage.disabled = true;
      window.nigaSupabase.from("support_messages").delete().eq("id",deleteMessage.dataset.deleteMessage).then(({error})=>{if(error)alert("حذف پیام انجام نشد: "+error.message);render()});
    }
  });

  shell.addEventListener("change", event => {
    if (event.target.id === "adminReportRange") render();
  });

  document.addEventListener("submit", event => {
    if (event.target.id === "productAdminForm") setTimeout(render, 0);
  });
  document.addEventListener("change", event => {
    if (event.target.matches("[data-order-status]")) setTimeout(render, 0);
  });
  document.addEventListener("click", event => {
    if (event.target.closest("[data-delete-product], [data-edit-product]")) setTimeout(render, 0);
  });

  const observer = new MutationObserver(render);
  observer.observe(section, { attributes: true, attributeFilter: ["hidden"] });
  window.addEventListener("storage", render);
  window.addEventListener("niga:catalog-updated", render);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  setTab("overview");
  render();
})();