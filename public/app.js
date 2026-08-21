const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));

function journeyCard(product, index) {
  const image = product.heroImage ? `style="background-image:linear-gradient(180deg,rgba(7,19,27,.04),rgba(7,19,27,.76)),url('${escapeHtml(product.heroImage)}')"` : "";
  return `<article class="journey-card journey-card--${escapeHtml(product.theme)}">
    <a href="/product.html?id=${encodeURIComponent(product.id)}" aria-label="${escapeHtml(product.title.ko)} 자세히 보기">
      <div class="journey-image" ${image}><span class="journey-number">0${index + 1}</span><span class="journey-tag">${escapeHtml(product.tag.ko)} <small>${escapeHtml(product.tag.zh)}</small></span></div>
      <div class="journey-card-copy"><div class="journey-card-meta"><span>${escapeHtml(product.duration.ko)}</span><i></i><span>${escapeHtml(product.departure.ko)}</span></div><h3>${escapeHtml(product.title.ko)}<small>${escapeHtml(product.title.zh)}</small></h3><p>${escapeHtml(product.subtitle.ko)}</p><span class="card-action">상세 여정 보기 <b>→</b></span></div>
    </a>
  </article>`;
}

async function init() {
  const container = document.getElementById("journeyCards");
  try {
    const response = await fetch("/api/products");
    const products = await response.json();
    if (!response.ok) throw new Error(products?.error || "여정을 불러올 수 없습니다.");
    container.innerHTML = products.length ? products.map(journeyCard).join("") : "<p class=\"loading-state\">아직 공개된 여행이 없습니다.</p>";
  } catch (error) {
    container.innerHTML = `<p class="loading-state is-error">${escapeHtml(error.message)}<br><small>잠시 후 다시 시도해 주세요.</small></p>`;
  }
}

init();
