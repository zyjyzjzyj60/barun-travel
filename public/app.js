const state = { product: null, departures: [], selected: null, draftOrder: null };
const money = value => new Intl.NumberFormat("ko-KR").format(value) + "원";
const element = id => document.getElementById(id);
const escapeHtml = value => String(value).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));

async function api(url, options) { const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options }); const data = res.status === 204 ? null : await res.json(); if (!res.ok) throw new Error(data?.error || "请求失败，请稍后重试"); return data; }
function selectedDeparture() { return state.departures.find(d => d.id === state.selected); }
function renderDepartures() {
  const list = element("departureList"); const active = state.departures.filter(d => d.isOnSale && d.availableSeats > 0);
  list.innerHTML = active.length ? active.map(d => `<button class="departure ${d.id === state.selected ? "selected" : ""}" data-id="${d.id}" type="button"><span class="date"><b>${new Date(d.travelDate + "T12:00:00").toLocaleDateString("zh-CN", { month:"long", day:"numeric", weekday:"short" })}</b><small>${d.note ? escapeHtml(d.note) : "西安 3晚4日"}</small></span><span class="seat">余 ${d.availableSeats} 名</span><span class="departure-price">${money(d.adultPrice)}<small>成人起</small></span></button>`).join("") : "<div class=\"empty\">目前没有开放可订团期，请在后台添加测试团期。</div>";
  list.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { state.selected = Number(button.dataset.id); renderDepartures(); updateTotal(); document.querySelector("#booking").scrollIntoView({ behavior:"smooth", block:"center" }); }));
}
function updateTotal() {
  const d = selectedDeparture(); const adults = Math.max(1, Number(element("adults").value || 1)), children = Math.max(0, Number(element("children").value || 0)), infants = Math.max(0, Number(element("infants").value || 0));
  element("adults").value = adults; element("children").value = children; element("infants").value = infants;
  if (!d) { element("totalPrice").textContent = "—"; element("selectedDeparture").textContent = "请先选择一个可订团期"; return; }
  element("selectedDeparture").innerHTML = `<b>${d.travelDate}</b> · 成人 ${adults} / 儿童 ${children} / 婴儿 ${infants} · 余 ${d.availableSeats} 名`;
  element("totalPrice").textContent = money(adults * d.adultPrice + children * d.childPrice + infants * d.infantPrice);
}
function renderProduct(p) {
  state.product = p; element("productTitle").textContent = p.title; element("description").textContent = p.description; element("airline").textContent = p.airline; element("duration").textContent = p.duration; element("departure").textContent = p.departure;
  element("heroImage").style.backgroundImage = `linear-gradient(90deg,rgba(13,28,52,.88),rgba(13,28,52,.18)), url('${p.images[0].url}')`;
  element("highlights").innerHTML = p.highlights.map(v => `<li>${escapeHtml(v)}</li>`).join("");
  element("gallery").innerHTML = p.images.map((i, index) => `<figure class="gallery-item item-${index + 1}"><img src="${i.url}" alt="${escapeHtml(i.alt)}"><figcaption>${escapeHtml(i.alt)}<small>${index + 1} / 4</small></figcaption></figure>`).join("");
  element("itineraryList").innerHTML = p.itinerary.map(day => `<article class="day"><span class="day-number">DAY<br><b>${String(day.day).padStart(2,"0")}</b></span><div><h3>${escapeHtml(day.title)}</h3><div class="day-meta"><span>${escapeHtml(day.transport)}</span><span>${escapeHtml(day.meals)}</span>${day.hotel ? `<span>${escapeHtml(day.hotel)}</span>` : ""}</div><ul>${day.activities.map(a => `<li>${escapeHtml(a)}</li>`).join("")}</ul></div></article>`).join("");
  [["included",p.included],["excluded",p.excluded],["notes",p.notes]].forEach(([id, values]) => element(id).innerHTML = values.map(v => `<li>${escapeHtml(v)}</li>`).join(""));
}
async function init() {
  try { const [product, departures] = await Promise.all([api("/api/product"), api("/api/departures")]); renderProduct(product); state.departures = departures; renderDepartures(); updateTotal(); } catch (error) { element("departureList").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
}
["adults","children","infants"].forEach(id => element(id).addEventListener("input", updateTotal));
element("bookingForm").addEventListener("submit", async event => {
  event.preventDefault(); const message = element("formMessage"), d = selectedDeparture();
  if (!d) { message.textContent = "请先在上方选择一个可订团期。"; return; }
  const form = new FormData(event.currentTarget); message.textContent = "正在创建测试订单…";
  try { state.draftOrder = await api("/api/orders", { method:"POST", body: JSON.stringify({ departureId:d.id, adults:Number(form.get("adults")), children:Number(form.get("children")), infants:Number(form.get("infants")), contactName:form.get("contactName"), contactPhone:form.get("contactPhone"), contactEmail:form.get("contactEmail") }) }); element("paymentSummary").innerHTML = `订单号 <b>${state.draftOrder.orderNo}</b><br>测试支付金额 <strong>${money(state.draftOrder.totalPrice)}</strong><br><small>点击确认后仅改变演示订单状态，不会向任何支付渠道发起扣款。</small>`; element("paymentModal").hidden = false; message.textContent = ""; } catch (error) { message.textContent = error.message; }
});
element("cancelPayment").addEventListener("click", () => element("paymentModal").hidden = true);
element("confirmPayment").addEventListener("click", async () => { const button = element("confirmPayment"); button.disabled = true; button.textContent = "处理中…"; try { const result = await api(`/api/orders/${state.draftOrder.orderId}/demo-pay`, { method:"POST", body:"{}" }); element("paymentModal").hidden = true; element("formMessage").innerHTML = `测试支付完成：订单 <b>${result.orderNo}</b> 已进入“已付款待人工确认”。`; state.departures = await api("/api/departures"); renderDepartures(); updateTotal(); } catch (error) { element("paymentSummary").insertAdjacentHTML("beforeend", `<p class="error">${escapeHtml(error.message)}</p>`); } finally { button.disabled = false; button.textContent = "完成测试支付"; } });
init();
