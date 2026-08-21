const state = { product: null, departures: [], selectedDepartureId: null, draftOrder: null };
const root = document.getElementById("productRoot");
const productId = new URLSearchParams(location.search).get("id");
const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
const won = value => `${new Intl.NumberFormat("ko-KR").format(value)}원`;
const bi = value => `${escapeHtml(value?.ko || "")}<small>${escapeHtml(value?.zh || "")}</small>`;
const dateText = value => new Date(`${value}T12:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

async function api(url, options) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "요청을 처리할 수 없습니다.");
  return data;
}

function mapMarkup(map) {
  const nodes = map?.nodes || [];
  const path = nodes.length ? `M ${nodes.map((node, index) => `${index ? "L" : ""} ${node.x} ${node.y}`).join(" ")}` : "";
  return `<svg viewBox="${escapeHtml(map?.viewBox || "0 0 1 1")}" role="img" aria-label="여행 경로"><path class="map-path" d="${path}"/>${nodes.map(node => `<g class="map-node"><circle cx="${node.x}" cy="${node.y}" r="7"/><text x="${node.x}" y="${node.y - 18}" text-anchor="middle">${escapeHtml(node.label.ko)}</text><text x="${node.x}" y="${node.y + 26}" text-anchor="middle">DAY ${String(node.day).padStart(2, "0")}</text></g>`).join("")}</svg>`;
}

function spotMarkup(spot, number) {
  const hasImage = Boolean(spot.image && state.product.images.some(image => image.url === spot.image));
  const imageStyle = hasImage ? `style="background-image:linear-gradient(180deg,rgba(7,19,27,.02),rgba(7,19,27,.92)),url('${escapeHtml(spot.image)}')"` : "";
  const marker = hasImage ? `PLACE ${String(number).padStart(2, "0")}` : "FIELD NOTE";
  return `<article class="spot-card ${hasImage ? "" : "is-pending"}" ${imageStyle}><div class="spot-card-copy"><span class="spot-marker">${marker}</span><h4>${bi(spot.name)}</h4><p>${escapeHtml(spot.intro.ko)}<small>${escapeHtml(spot.intro.zh)}</small></p></div></article>`;
}

function dayMarkup(day) {
  const meta = [day.route, day.transport, day.meals, day.hotel].filter(value => value?.ko).map(value => `<span>${bi(value)}</span>`).join("");
  const spots = day.spots?.length ? `<div class="spot-grid">${day.spots.map((spot, index) => spotMarkup(spot, index + 1)).join("")}</div>` : `<p class="empty-spots">${escapeHtml(day.note.ko)}<br><small>${escapeHtml(day.note.zh)}</small></p>`;
  return `<article class="day-card"><div class="day-index">DAY<b>${String(day.day).padStart(2, "0")}</b></div><div><div class="day-title"><h3>${bi(day.title)}</h3></div><div class="day-meta">${meta}</div>${day.spots?.length ? `<p class="day-note">${escapeHtml(day.note.ko)}<br><small>${escapeHtml(day.note.zh)}</small></p>` : ""}${spots}</div></article>`;
}

function bilingualList(values) {
  return values.map(value => `<li>${escapeHtml(value.ko)}<small>${escapeHtml(value.zh)}</small></li>`).join("");
}

function renderProduct(product) {
  document.title = `${product.title.ko} | 바른투어`;
  root.innerHTML = `<section class="product-hero" style="background-image:url('${escapeHtml(product.heroImage)}')"><div class="product-hero-copy"><a class="breadcrumb" href="/"><span>바른투어</span><i></i><span>여행 찾기</span></a><p class="mono-label">${escapeHtml(product.tag.ko)} / ${escapeHtml(product.destination.ko)}</p><h1>${bi(product.title)}<small>${escapeHtml(product.subtitle.ko)}<br>${escapeHtml(product.subtitle.zh)}</small></h1><p>${escapeHtml(product.description.ko)}<br><small>${escapeHtml(product.description.zh)}</small></p></div><div class="product-quickfacts"><div><span>DURATION</span><b>${escapeHtml(product.duration.ko)}</b></div><div><span>DEPARTURE</span><b>${escapeHtml(product.departure.ko)}</b></div><div><span>TRAVEL STYLE</span><b>${escapeHtml(product.tag.ko)}</b></div></div></section>
  <section class="product-overview section-shell"><div><p class="mono-label">THE JOURNEY</p><h2>하루마다 명확한 목적지.<small>每一天，都有明确的目的地。</small></h2></div><div><p class="overview-lead">${escapeHtml(product.description.ko)}<br><small>${escapeHtml(product.description.zh)}</small></p><ul class="highlight-list">${product.highlights.map(value => `<li>${bi(value)}</li>`).join("")}</ul></div></section>
  <section class="journey-map"><div class="detail-heading"><div><p class="mono-label">JOURNEY LINE</p><h2>이동의 선을 따라.<small>沿着移动的路线。</small></h2></div><p>지도는 여행의 큰 이동 흐름을 보여 주는 시각 안내입니다. 실제 교통편과 시간은 출발 확정 시 안내합니다.</p></div><div class="map-canvas">${mapMarkup(product.map)}</div></section>
  <section class="itinerary-section section-shell" id="itinerary"><div class="detail-heading"><div><p class="mono-label">DAY BY DAY</p><h2>오늘은, 어디로 갈까요?<small>今天，去往哪里？</small></h2></div><p>주요 장소마다 이유와 이미지를 함께 확인하세요. 기상, 예약, 현지 운영에 따라 순서는 달라질 수 있습니다.</p></div><div class="day-stack">${product.itinerary.map(dayMarkup).join("")}</div></section>
  <section class="departure-panel" id="departures"><div class="departure-panel-inner"><div class="detail-heading"><div><p class="mono-label">DEMO DEPARTURES</p><h2>시연 출발일 선택.<small>选择演示出发日。</small></h2></div><p>아래 금액과 좌석은 예약 흐름을 확인하기 위한 시연 데이터입니다. 실제 판매·결제가 아닙니다.</p></div><div id="departureList" class="departure-list"><p class="loading-state">출발일을 불러오는 중입니다…</p></div><div class="booking-form-wrap"><div class="booking-copy"><p class="mono-label">TEST RESERVATION</p><h3>예약 흐름을<br>직접 확인하세요.</h3><p>제출 후에도 실제 결제는 발생하지 않습니다. 테스트용 연락처만 입력하고, 여권 번호·카드 정보는 입력하지 마세요.</p></div><form class="booking-form" id="bookingForm"><div id="selectedDeparture" class="form-message">먼저 시연 출발일을 선택해 주세요.</div><div class="traveler-grid"><label>성인<input id="adults" type="number" min="1" value="1"></label><label>아동<input id="children" type="number" min="0" value="0"></label><label>유아<input id="infants" type="number" min="0" value="0"></label></div><div class="contact-grid"><label>테스트 이름<input name="contactName" maxlength="50" required placeholder="예: 홍길동 (테스트)"></label><label>테스트 연락처<input name="contactPhone" maxlength="40" required placeholder="010-0000-0000"></label><label>테스트 이메일<input name="contactEmail" type="email" maxlength="100" required placeholder="example@test.com"></label></div><label class="consent"><input id="consent" type="checkbox" required> 공개 시연용 예약이며 실제 민감 정보를 입력하지 않았음을 확인합니다.</label><div class="price-summary"><span>테스트 주문 합계</span><strong id="totalPrice">—</strong></div><button class="primary-button" type="submit">테스트 예약 만들기 →</button><p class="form-message" id="formMessage" aria-live="polite"></p></form></div></div></section>
  <section class="detail-columns section-shell"><article><p class="mono-label">INCLUDED</p><h3>포함 사항</h3><ul>${bilingualList(product.included)}</ul></article><article><p class="mono-label">NOT INCLUDED</p><h3>불포함 사항</h3><ul>${bilingualList(product.excluded)}</ul></article><article><p class="mono-label">GOOD TO KNOW</p><h3>출발 전 안내</h3><ul>${bilingualList(product.notes)}</ul></article></section>`;
  document.getElementById("railTitle").textContent = product.title.ko;
  document.getElementById("bookingRail").hidden = false;
  document.querySelectorAll("[data-scroll-booking]").forEach(button => button.addEventListener("click", () => document.getElementById("departures").scrollIntoView({ behavior: "smooth", block: "start" })));
  ["adults", "children", "infants"].forEach(id => document.getElementById(id).addEventListener("input", updateTotal));
  document.getElementById("bookingForm").addEventListener("submit", createOrder);
}

function selectedDeparture() { return state.departures.find(departure => departure.id === state.selectedDepartureId); }

function renderDepartures() {
  const list = document.getElementById("departureList");
  const active = state.departures.filter(departure => departure.isOnSale && departure.availableSeats > 0);
  list.innerHTML = active.length ? active.map(departure => `<button class="departure-choice ${departure.id === state.selectedDepartureId ? "is-selected" : ""}" type="button" data-departure-id="${departure.id}"><span><b>${dateText(departure.travelDate)}</b><small>${escapeHtml(departure.note || "공개 시연 출발일")}</small></span><span class="departure-seat">잔여 ${departure.availableSeats}석</span><span class="departure-price">${won(departure.adultPrice)}<small>성인 1인</small></span><span>›</span></button>`).join("") : `<p class="loading-state">현재 공개된 시연 출발일이 없습니다. 운영자 페이지에서 추가해 주세요.</p>`;
  list.querySelectorAll("[data-departure-id]").forEach(button => button.addEventListener("click", () => { state.selectedDepartureId = Number(button.dataset.departureId); renderDepartures(); updateTotal(); document.getElementById("bookingForm").scrollIntoView({ behavior: "smooth", block: "center" }); }));
}

function updateTotal() {
  const departure = selectedDeparture();
  const adults = Math.max(1, Number(document.getElementById("adults").value || 1));
  const children = Math.max(0, Number(document.getElementById("children").value || 0));
  const infants = Math.max(0, Number(document.getElementById("infants").value || 0));
  document.getElementById("adults").value = adults;
  document.getElementById("children").value = children;
  document.getElementById("infants").value = infants;
  if (!departure) {
    document.getElementById("selectedDeparture").textContent = "먼저 시연 출발일을 선택해 주세요.";
    document.getElementById("totalPrice").textContent = "—";
    return;
  }
  document.getElementById("selectedDeparture").textContent = `${dateText(departure.travelDate)} · 성인 ${adults} / 아동 ${children} / 유아 ${infants} · 잔여 ${departure.availableSeats}석`;
  document.getElementById("totalPrice").textContent = won(adults * departure.adultPrice + children * departure.childPrice + infants * departure.infantPrice);
}

async function createOrder(event) {
  event.preventDefault();
  const departure = selectedDeparture();
  const message = document.getElementById("formMessage");
  if (!departure) { message.textContent = "시연 출발일을 먼저 선택해 주세요."; return; }
  const form = new FormData(event.currentTarget);
  message.textContent = "테스트 예약을 만드는 중입니다…";
  try {
    state.draftOrder = await api("/api/orders", { method: "POST", body: JSON.stringify({ productId: state.product.id, departureId: departure.id, adults: Number(form.get("adults")), children: Number(form.get("children")), infants: Number(form.get("infants")), contactName: form.get("contactName"), contactPhone: form.get("contactPhone"), contactEmail: form.get("contactEmail") }) });
    document.getElementById("paymentSummary").innerHTML = `주문 번호 <b>${escapeHtml(state.draftOrder.orderNo)}</b><br>테스트 결제 금액 <strong>${won(state.draftOrder.totalPrice)}</strong><br><small>확인해도 어떤 결제 채널에도 실제 청구되지 않습니다.</small>`;
    document.getElementById("paymentModal").hidden = false;
    message.textContent = "";
  } catch (error) { message.textContent = error.message; }
}

async function confirmPayment() {
  const button = document.getElementById("confirmPayment");
  button.disabled = true;
  button.textContent = "처리 중…";
  try {
    const result = await api(`/api/orders/${state.draftOrder.orderId}/demo-pay`, { method: "POST", body: "{}" });
    document.getElementById("paymentModal").hidden = true;
    document.getElementById("formMessage").textContent = `테스트 결제가 완료되었습니다. ${result.orderNo} 주문은 운영 확인 대기 상태입니다.`;
    state.departures = await api(`/api/products/${encodeURIComponent(state.product.id)}/departures`);
    renderDepartures();
    updateTotal();
  } catch (error) {
    document.getElementById("paymentSummary").insertAdjacentHTML("beforeend", `<p class="form-message">${escapeHtml(error.message)}</p>`);
  } finally { button.disabled = false; button.textContent = "테스트 결제 완료"; }
}

async function init() {
  if (!productId) { root.innerHTML = `<section class="simple-main"><p class="mono-label">JOURNEY NOT SELECTED</p><h1>여정을 먼저 선택해 주세요.</h1><p class="lead">请先从旅行列表选择一个产品。</p><a class="action-link" href="/">여행 찾기 <span>→</span></a></section>`; return; }
  try {
    const [product, departures] = await Promise.all([api(`/api/products/${encodeURIComponent(productId)}`), api(`/api/products/${encodeURIComponent(productId)}/departures`)]);
    state.product = product;
    state.departures = departures;
    renderProduct(product);
    renderDepartures();
    updateTotal();
    document.getElementById("cancelPayment").addEventListener("click", () => document.getElementById("paymentModal").hidden = true);
    document.getElementById("confirmPayment").addEventListener("click", confirmPayment);
  } catch (error) {
    root.innerHTML = `<section class="simple-main"><p class="mono-label">JOURNEY UNAVAILABLE</p><h1>여정을 불러올 수 없습니다.</h1><p class="lead">${escapeHtml(error.message)}</p><a class="action-link" href="/">여행 목록으로 <span>→</span></a></section>`;
  }
}

init();
