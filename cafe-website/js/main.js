// Boss Cafe — main script. Uses fetch() GET requests on local JSON "API" files.
// NOTE: fetch needs a local server (VS Code "Live Server" or `python -m http.server`).
const API = { products: 'data/products.json', customers: 'data/customers.json' };

async function getData(url) {            // GET operation
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.error('Could not load', url, e);
    return null;
  }
}

const peso = n => '₱' + n.toLocaleString();
const el = id => document.getElementById(id);

function productCard(p) {
  const pic = p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span aria-hidden="true">${p.emoji}</span>`;
  const soldOut = p.availability === 'Sold Out';
  return `<article class="card">
    <div class="pic">${pic}</div>
    <div class="body">
      <div class="meta"><span class="tag">${p.category}</span><span class="tag ${p.availability.split(' ')[0]}">${p.availability}</span></div>
      <h3>${p.name}</h3><p>${p.description}</p>
      <div class="meta"><span class="price">${peso(p.price)}</span>
      ${soldOut ? `<a class="btn small" href="contact.html?order=${encodeURIComponent(p.name + ' (notify me)')}">Notify Me</a>` : ''}</div>
    </div></article>`;
}

// ---------- Home: featured products + testimonials ----------
async function initHome() {
  const [products, customers] = await Promise.all([getData(API.products), getData(API.customers)]);
  if (products && el('featured')) el('featured').innerHTML = products.filter(p => p.featured).map(productCard).join('');
  if (customers) el('reviews').innerHTML = customers.slice(0, 3).map(c =>
    `<blockquote class="quote"><p>“${c.comment}”</p><small>${c.name} · ${'★'.repeat(c.rating)}</small></blockquote>`).join('');
}

// ---------- Products page: search + category filter ----------
async function initProducts() {
  const products = await getData(API.products);
  if (!products) { el('grid').textContent = 'Menu could not be loaded. Please run the site on a local server.'; return; }
  const cats = [...new Set(products.map(p => p.category))];
  el('category').innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option>${c}</option>`).join('');
  const render = () => {
    const q = el('search').value.toLowerCase(), c = el('category').value;
    const list = products.filter(p => (!c || p.category === c) && (p.name + p.description).toLowerCase().includes(q));
    el('grid').innerHTML = list.length ? list.map(productCard).join('') : '<p>No items match your search. Try another word or category.</p>';
  };
  el('search').addEventListener('input', render);
  el('category').addEventListener('change', render);
  render();
}

// ---------- Features page: rewards members (customer dataset) ----------
async function initFeatures() {
  const customers = await getData(API.customers);
  if (!customers) return;
  el('members').innerHTML = customers.map(c => {
    const [u, d] = c.email.split('@');
    return `<tr><td>${c.name}</td><td>${u[0]}***@${d}</td><td>${c.membership}</td><td>${c.points}</td><td>${c.favorite}</td></tr>`;
  }).join('');
}

// ---------- Contact page ----------
function initContact() {
  const today = () => new Date().toISOString().slice(0, 10);
  el('date').value = today();
  const order = new URLSearchParams(location.search).get('order');
  if (order) el('subject').value = 'Order: ' + order;
  el('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const m = el('msg');
    m.style.display = 'block';
    m.textContent = `Thank you, ${el('name').value}! We got your message and will reply to ${el('email').value} soon.`;
    e.target.reset(); el('date').value = today();
  });
}

const page = document.body.dataset.page;
({ home: initHome, products: initProducts, features: initFeatures, contact: initContact })[page]?.();
