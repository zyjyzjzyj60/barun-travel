const el = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
const won = value => `${new Intl.NumberFormat("ko-KR").format(value)}원`;
const state = { products: [], productId: "" };

async function request(url, options) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "요청을 처리할 수 없습니다.");
  return data;
}

function selectedProduct() { return state.products.find(product => product.id === state.productId); }

function setProducts(products) {
  state.products = products;
  state.productId = state.productId && products.some(product => product.id === state.productId) ? state.productId : products[0]?.id || "";
  el("productSelect").innerHTML = products.map(product => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.title.ko)} · ${escapeHtml(product.title.zh)}</option>`).join("");
  el("productSelect").value = state.productId;
}

async function refresh() {
  try {
    const [departures, orders] = await Promise.all([request(`/api/admin/departures?productId=${encodeURIComponent(state.productId)}`), request("/api/admin/orders")]);
    const product = selectedProduct();
    el("adminDepartures").innerHTML = departures.length ? departures.map(departure => `<div class="admin-departure"><div><b>${escapeHtml(departure.travelDate)}</b><small>${escapeHtml(product?.title.ko || departure.productId)} · 성인 ${won(departure.adultPrice)}</small></div><div><span class="status-pill ${departure.isOnSale ? "" : "off"}">${departure.isOnSale ? "공개" : "판매 중지"}</span><small> 예약 ${departure.reservedSeats} / ${departure.capacity}</small></div><button class="admin-button" data-toggle-id="${departure.id}" type="button">${departure.isOnSale ? "닫기" : "열기"}</button></div>`).join("") : "<p class=empty-row>선택한 상품에는 아직 출발일이 없습니다.</p>";
    el("ordersTable").innerHTML = orders.length ? orders.map(order => `<tr><td><b>${escapeHtml(order.orderNo)}</b><br><small>${new Date(order.createdAt).toLocaleString("ko-KR")}</small></td><td>${escapeHtml(order.productTitle)}</td><td>${escapeHtml(String(order.travelDate).slice(0, 10))}</td><td>성 ${order.adults} · 아 ${order.children} · 유 ${order.infants}</td><td>${escapeHtml(order.contactName)}<br><small>${escapeHtml(order.contactPhone)}<br>${escapeHtml(order.contactEmail)}</small></td><td>${won(order.totalPrice)}</td><td><span class="status-pill">${order.status === "PAID_PENDING_CONFIRMATION" ? "테스트 결제 완료" : "테스트 결제 대기"}</span></td></tr>`).join("") : "<tr><td class=empty-row colspan=7>아직 테스트 주문이 없습니다.</td></tr>";
    el("adminDepartures").querySelectorAll("[data-toggle-id]").forEach(button => button.addEventListener("click", async () => {
      const departure = departures.find(item => item.id === Number(button.dataset.toggleId));
      try { await request(`/api/admin/departures/${departure.id}`, { method: "PUT", body: JSON.stringify({ ...departure, isOnSale: !departure.isOnSale }) }); await refresh(); } catch (error) { alert(error.message); }
    }));
  } catch (error) { alert(error.message); }
}

async function enterDashboard() {
  el("loginPanel").hidden = true;
  el("dashboard").hidden = false;
  const products = await request("/api/admin/products");
  setProducts(products);
  await refresh();
}

el("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try { await request("/api/admin/login", { method: "POST", body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) }); await enterDashboard(); } catch (error) { el("loginMessage").textContent = error.message; }
});

el("productSelect").addEventListener("change", event => { state.productId = event.target.value; refresh(); });
el("departureForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await request("/api/admin/departures", { method: "POST", body: JSON.stringify({ productId: form.get("productId"), travelDate: form.get("travelDate"), adultPrice: Number(form.get("adultPrice")), childPrice: Number(form.get("childPrice")), infantPrice: Number(form.get("infantPrice")), capacity: Number(form.get("capacity")), note: form.get("note"), isOnSale: form.get("isOnSale") === "on" }) });
    el("departureMessage").textContent = "출발일이 저장되어 공개 사이트에 반영되었습니다.";
    event.currentTarget.reset();
    el("productSelect").value = state.productId;
    await refresh();
  } catch (error) { el("departureMessage").textContent = error.message; }
});
el("refreshOrders").addEventListener("click", refresh);
el("logout").addEventListener("click", async () => { await request("/api/admin/logout", { method: "POST", body: "{}" }); location.reload(); });
request("/api/admin/session").then(enterDashboard).catch(() => {});
