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
    const rows = products.slice().sort((a, b) => Number(b.id) - Number(a.id));
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

  function renderRecentOrders(orders) {
    const target = $("#adminRecentOrders");
    const recent = orders.slice().sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
    target.innerHTML = recent.length ? recent.map(order => `
      <div class="admin-recent-order">
        <div><b>سفارش #${number(order.id)}</b><small>${esc(order.customerName || "بدون نام")} · ${money(order.totalToman)}</small></div>
        <span class="admin-status ${esc((order.status || "PENDING").toLowerCase())}">${statusText(order.status)}</span>
      </div>`).join("") : '<p class="muted">هنوز سفارشی ثبت نشده است.</p>';
  }

  function render() {
    const permitted = isAdmin();
    if (navLink) navLink.hidden = !permitted;
    if (!permitted || section.hidden) return;

    const products = read("niga-demo-products", []);
    const orders = read("niga-demo-orders", []);
    const users = read("niga-demo-users", []);
    const messages = read("niga-demo-messages", []);

    renderStats(products, orders, users, messages);
    renderProducts(products);
    renderUsers(users, orders);
    renderMessages(messages);
    renderRecentOrders(orders);
  }

  shell.addEventListener("click", event => {
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) {
      setTab(tab.dataset.adminTab);
      render();
      return;
    }
    const deleteMessage = event.target.closest("[data-delete-message]");
    if (deleteMessage && isAdmin()) {
      const messages = read("niga-demo-messages", []);
      const remaining = messages.filter(message => String(message.id) !== deleteMessage.dataset.deleteMessage);
      write("niga-demo-messages", remaining);
      render();
    }
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
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  setTab("overview");
  render();
})();