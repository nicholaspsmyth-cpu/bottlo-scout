// =====================================================================
//  BOTTLO SCOUT – VERSION 4 APP (Esky look, Scout Around, drink cards)
//  You shouldn't need to change anything in here. Your keys go in config.js.
// =====================================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const $ = id => document.getElementById(id);
const JACOBS_WELL = { lat: -27.7810, lng: 153.3655 };
const FADE_DAYS = 7;
const ROAD_FACTOR = 1.3;              // roads are roughly 30% longer than a straight line
const CATS = [
  ["beer", "🍺 Beer"], ["cider", "🍏 Cider"], ["premix", "🥤 Premix"], ["rum", "🏴‍☠️ Rum"], ["bourbon", "🥃 Bourbon"],
  ["whisky", "🥃 Whisky"], ["vodka", "🍸 Vodka"], ["gin", "🍸 Gin"], ["brandy", "🥃 Brandy"], ["redwine", "🍷 Red"], ["whitewine", "🥂 White"],
  ["fav", "⭐ Mine"],
];
const CAT_NOTE = {
  beer: "🏆 Australia's best-selling beers first (2025 sales data).",
  fav: "Your ⭐ favourites. Tap ⭐ on any drink to add it here.",
};
const PACK_CHOICES = { can: [1, 4, 6, 10, 16, 24, 30], bottle: [1, 6, 12], stubby: [1, 6, 24] };
const CAT_EMOJI = { beer: "🍺", cider: "🍏", premix: "🥤", rum: "🏴‍☠️", bourbon: "🥃", whisky: "🥃", vodka: "🍸", gin: "🍸", brandy: "🥃", redwine: "🍷", whitewine: "🥂" };
const RADII = [5, 10, 15, 25, 50];
// Scotty lives right inside the app code, so he can never go missing 🤠
const SCOTTY_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" role=\"img\" aria-label=\"Scotty the Scout\"><circle cx=\"250\" cy=\"300\" r=\"190\" fill=\"#1C6BB5\" opacity=\"0.13\"/>     <g transform=\"translate(246 318) scale(1.42) translate(-203 -180)\">       <!-- shoulders + singlet -->       <path d=\"M100 312 Q110 256 166 248 L240 248 Q296 256 306 312 Z\" fill=\"#e9a97f\"></path>       <path d=\"M150 252 L170 252 Q203 292 236 252 L256 252 Q290 282 294 312 L112 312 Q116 282 150 252 Z\" fill=\"#1C6BB5\"></path>       <g transform=\"translate(203 190) scale(1.18) translate(-203 -190)\">       <!-- mullet (behind the head) -->       <path d=\"M148 196 Q130 258 156 280 Q182 290 203 278 Q224 290 250 280 Q276 258 258 196 Z\" fill=\"#9c4f26\"></path>       <path d=\"M150 238 Q146 266 164 282 M256 238 Q260 266 242 282\" fill=\"none\" stroke=\"#80401c\" stroke-width=\"4\" stroke-linecap=\"round\"></path>       <!-- neck + ears + face -->       <rect x=\"185\" y=\"226\" width=\"36\" height=\"34\" rx=\"8\" fill=\"#d99470\"></rect>       <circle cx=\"141\" cy=\"190\" r=\"15\" fill=\"#e09a74\"></circle>       <circle cx=\"265\" cy=\"190\" r=\"15\" fill=\"#e09a74\"></circle>       <ellipse cx=\"203\" cy=\"186\" rx=\"62\" ry=\"66\" fill=\"#e9a97f\"></ellipse>       <!-- scraggly ginger beard -->       <path d=\"M141 180 Q136 238 150 262 L158 254 L164 274 L174 262 L182 284 L192 268 L203 290 L214 268 L224 284 L232 262 L242 274 L248 254 L256 262 Q270 238 265 180 Q258 210 243 214 Q224 234 203 234 Q182 234 163 214 Q148 210 141 180 Z\" fill=\"#9c4f26\"></path>       <path d=\"M166 246 q5 8 2 16 M203 256 q2 9 -1 18 M240 246 q-5 8 -2 16\" fill=\"none\" stroke=\"#80401c\" stroke-width=\"3.5\" stroke-linecap=\"round\"></path>       <circle cx=\"163\" cy=\"206\" r=\"10\" fill=\"#e0675a\" opacity=\"0.5\"></circle>       <circle cx=\"243\" cy=\"206\" r=\"10\" fill=\"#e0675a\" opacity=\"0.5\"></circle>       <!-- big sunburnt nose -->       <ellipse cx=\"203\" cy=\"200\" rx=\"17\" ry=\"14\" fill=\"#e0675a\"></ellipse>       <ellipse cx=\"197\" cy=\"195\" rx=\"5\" ry=\"3.5\" fill=\"#fff\" opacity=\"0.5\"></ellipse>       <!-- cheeky gap-tooth grin + mo -->       <path d=\"M178 228 Q203 254 228 228 Q203 238 178 228 Z\" fill=\"#fff\" stroke=\"#3a1e10\" stroke-width=\"3\" stroke-linejoin=\"round\"></path>       <rect x=\"200\" y=\"232\" width=\"7\" height=\"10\" rx=\"2\" fill=\"#3a1e10\"></rect>       <path d=\"M170 216 Q188 204 203 214 Q218 204 236 216 Q224 228 203 222 Q182 228 170 216 Z\" fill=\"#80401c\"></path>       <!-- eyebrows (one raised, sussing out a bargain) + wraparound sunnies -->       <path d=\"M156 160 Q176 150 196 156\" fill=\"none\" stroke=\"#80401c\" stroke-width=\"8\" stroke-linecap=\"round\"></path>       <path d=\"M210 146 Q230 132 250 146\" fill=\"none\" stroke=\"#80401c\" stroke-width=\"8\" stroke-linecap=\"round\"></path>       <path d=\"M144 168 Q203 156 262 168 L257 186 Q233 198 211 188 Q203 184 195 188 Q173 198 149 186 Z\" fill=\"#12406E\" stroke=\"#C8321F\" stroke-width=\"3.5\" stroke-linejoin=\"round\"></path>       <path d=\"M158 174 L192 171 M214 171 L248 174\" stroke=\"#9FD0FF\" stroke-width=\"3.5\" stroke-linecap=\"round\" opacity=\"0.85\"></path>       <!-- tilted akubra with corks + a clearance tag he never took off -->       <g transform=\"rotate(-7 203 120)\">         <ellipse cx=\"203\" cy=\"134\" rx=\"112\" ry=\"21\" fill=\"#5c3e22\"></ellipse>         <path d=\"M142 132 Q146 74 203 70 Q260 74 264 132 Z\" fill=\"#7d5733\"></path>         <path d=\"M180 76 Q203 92 226 76\" fill=\"none\" stroke=\"#5c3e22\" stroke-width=\"4\" stroke-linecap=\"round\"></path>         <path d=\"M145 114 L261 114 L263 132 L143 132 Z\" fill=\"#C8321F\"></path>         <path d=\"M112 140 v22 M130 146 v20 M278 146 v20 M296 140 v22\" stroke=\"#3b2a1a\" stroke-width=\"2\"></path>         <rect x=\"108\" y=\"160\" width=\"8\" height=\"13\" rx=\"2\" fill=\"#c98a4b\"></rect>         <rect x=\"126\" y=\"164\" width=\"8\" height=\"13\" rx=\"2\" fill=\"#c98a4b\"></rect>         <rect x=\"274\" y=\"164\" width=\"8\" height=\"13\" rx=\"2\" fill=\"#c98a4b\"></rect>         <rect x=\"292\" y=\"160\" width=\"8\" height=\"13\" rx=\"2\" fill=\"#c98a4b\"></rect>         <path d=\"M150 120 Q120 116 104 98\" fill=\"none\" stroke=\"#f4f1e6\" stroke-width=\"2\"></path>         <g transform=\"rotate(-24 84 92)\">           <path d=\"M62 82 h44 l10 10 l-10 10 h-44 z\" fill=\"#f4f1e6\"></path>           <circle cx=\"106\" cy=\"92\" r=\"3\" fill=\"#12406E\"></circle>           <text x=\"82\" y=\"96\" text-anchor=\"middle\" font-family=\"Inter, sans-serif\" font-weight=\"800\" font-size=\"10\" fill=\"#c0392b\">CLEARANCE</text>         </g>       </g>       </g>     </g>     <!-- magnifier -->     <line x1=\"430\" y1=\"458\" x2=\"398\" y2=\"420\" stroke=\"#6b4a2b\" stroke-width=\"20\" stroke-linecap=\"round\"></line>     <circle cx=\"376\" cy=\"392\" r=\"50\" fill=\"#9FD0FF\" fill-opacity=\"0.35\" stroke=\"#C8321F\" stroke-width=\"12\"></circle>     <text x=\"376\" y=\"412\" text-anchor=\"middle\" font-family=\"Alfa Slab One, Georgia, serif\" font-weight=\"700\" font-size=\"58\" fill=\"#C8321F\">$</text>   </svg>";
const SCOTTY_SRC = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SCOTTY_SVG);
const SCOTTY = `<img class="scotty-sm" src="${SCOTTY_SRC}" alt="Scotty the Scout">`;
document.querySelector(".logo")?.setAttribute("src", SCOTTY_SRC);
// Chains whose 📋 Scout Report price is the same online price at every one of their shops
const ONLINE_CHAINS = ["Dan Murphy's", "BWS"];
const CHAINS = [[/dan murphy/i, "Dan Murphy's"], [/\bbws\b/i, "BWS"], [/liquorland/i, "Liquorland"], [/liquor legends/i, "Liquor Legends"],
  [/cellarbrations/i, "Cellarbrations"], [/bottlemart/i, "Bottlemart"], [/first choice/i, "First Choice Liquor"], [/super cellars/i, "Super Cellars"],
  [/thirsty camel/i, "Thirsty Camel"], [/iga/i, "IGA Liquor"], [/porters/i, "Porters"], [/vintage cellars/i, "Vintage Cellars"], [/bottle-?o\b/i, "The Bottle-O"]];
const chainOf = name => (CHAINS.find(([re]) => re.test(name || "")) || [])[1] || "Independent";
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const STATES = { Queensland: "QLD", "New South Wales": "NSW", Victoria: "VIC", Tasmania: "TAS", "South Australia": "SA", "Western Australia": "WA", "Northern Territory": "NT", "Australian Capital Territory": "ACT" };

if (!SUPABASE_URL || SUPABASE_URL.includes("PASTE")) {
  document.querySelector(".wrap").innerHTML =
    `<div class="card empty" style="margin-top:40px"><b>Almost there!</b>Open <code>config.js</code> and paste in your Supabase URL and anon key.</div>`;
  throw new Error("config.js not filled in");
}
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- state ----------
const S = {
  user: null, profile: null,
  settings: { radius_km: 15, deal_price: 55, deal_pack: 30, fuel_per_km: 0.20 },
  pos: { ...JACOBS_WELL, gps: false },
  products: [], productId: null, category: "beer", beerFmt: "can", favs: new Map(), stores: [], osm: [], rows: [], myVotes: {},
  gpsPos: null, scout: null,       // scout = a spot picked in 📍 Scout Around (null = use GPS / home)
  dealsSeen: new Set(),
};

// ---------- little helpers ----------
const money = n => "$" + Number(n).toFixed(2);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const product = (id = S.productId) => S.products.find(p => p.id === id) || { std_pack: 30, unit: "can", short_name: "Super Crisp" };
const isStubby = (p = product()) => p.category === "beer" && p.unit === "bottle";
const unitName = (p = product()) => isStubby(p) ? "stubby" : p.unit === "bottle" ? "bottle" : "can";
function packName(n, p = product()) {
  if (isStubby(p)) return ({ 1: "stubby", 6: "6 pack", 24: "24 carton" })[n] || `${n} stubbies`;
  if (p.unit === "bottle") return n === 1 ? "bottle" : n === 12 ? "dozen" : `${n} bottles`;
  return ({ 1: "single can", 24: "24 block", 30: "30 block" })[n] || `${n} pack`;
}
const stdPack = (p = product()) => Number(p.std_pack || 1);
const nameOf = p => p.short_name || p.name;
// price for the usual pack (no rounding wobble when the price was seen in that exact pack)
const packPrice = (r, sp = stdPack()) => Number(r.pack_size) === sp ? Number(r.price) : Number(r.per_unit) * sp;
const local = {
  get(k, d) { try { const v = localStorage.getItem("cf." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("cf." + k, JSON.stringify(v)); } catch {} },
};
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 2600);
}
function open(id) { $(id).classList.remove("hide"); }
function close(id) { $(id).classList.add("hide"); }
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => b.closest(".sheet").classList.add("hide")));
document.querySelectorAll(".sheet").forEach(s => s.addEventListener("click", e => { if (e.target === s && s.id !== "sheetAge" && s.id !== "sheetNick") s.classList.add("hide"); }));

function km(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function ago(t) {
  const m = Math.round((Date.now() - new Date(t)) / 60000);
  if (m < 60) return m <= 1 ? "just now" : m + " min ago";
  const h = Math.round(m / 60); if (h < 24) return h + " hr ago";
  const d = Math.round(h / 24); return d === 1 ? "yesterday" : d + " days ago";
}
const mapsLink = s => `https://maps.apple.com/?daddr=${s.lat},${s.lng}&q=${encodeURIComponent(s.name)}`;
const photoUrl = p => sb.storage.from("price-photos").getPublicUrl(p).data.publicUrl;

// ---------- 📍 location + Scout Around ----------
const homeSpot = () => ({ lat: S.settings.home_lat ?? JACOBS_WELL.lat, lng: S.settings.home_lng ?? JACOBS_WELL.lng });
function setPos() {
  const old = S.pos;
  if (S.scout) S.pos = { lat: S.scout.lat, lng: S.scout.lng, gps: false };
  else if (S.gpsPos) S.pos = { ...S.gpsPos, gps: true };
  else S.pos = { ...homeSpot(), gps: false };
  renderLoc();
  if (!old || km(old, S.pos) > 0.5 || !S.osmFor) loadOsm();
  render();
}
function renderLoc() {
  const r = S.settings.radius_km;
  if (S.scout) {
    $("locPin").textContent = S.scout.home ? "🏠" : "🧭";
    $("locName").textContent = `${S.scout.name} · ${r} km`;
    $("where").textContent = S.scout.home ? "Showing bottlos around your home spot." : "Scouting around here. Tap Scout Around to change it.";
  } else if (S.gpsPos) {
    $("locPin").textContent = "📍"; $("locName").textContent = `Near you · ${r} km`;
    $("where").textContent = "";
  } else {
    $("locPin").textContent = "🏠"; $("locName").textContent = `Home spot · ${r} km`;
    $("where").textContent = "Allow location for live GPS, or tap Scout Around.";
  }
}
function locate(onFail) {
  if (!navigator.geolocation) { setPos(); return onFail?.(); }
  navigator.geolocation.getCurrentPosition(
    p => { S.gpsPos = { lat: p.coords.latitude, lng: p.coords.longitude }; setPos(); },
    () => { setPos(); onFail?.(); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
  );
}

// Every bottlo on the free OpenStreetMap near where you're looking (works anywhere in Australia)
async function loadOsm() {
  const pos = S.pos, r = Math.min(50, S.settings.radius_km);
  const key = `${pos.lat.toFixed(2)},${pos.lng.toFixed(2)},${r}`;
  S.osmFor = key;
  const cache = local.get("osmCache", []);
  const hit = cache.find(c => c.key === key && Date.now() - c.t < 3 * 86400000);
  if (hit) { S.osm = hit.list; render(); return; }
  const q = `[out:json][timeout:25];(nwr["shop"="alcohol"](around:${r * 1000},${pos.lat},${pos.lng});nwr["shop"="wine"](around:${r * 1000},${pos.lat},${pos.lng}););out center tags;`;
  for (const url of OVERPASS) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctl.signal });
      clearTimeout(t);
      if (!res.ok) continue;
      const j = await res.json();
      const list = (j.elements || []).map(el => {
        const tg = el.tags || {}, name = tg.name || tg.brand;
        const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
        if (!name || lat == null) return null;
        const osm_id = (el.type === "node" ? 1 : el.type === "way" ? 2 : 3) * 1e11 + el.id;   // one number per map thing
        return { id: "osm-" + osm_id, osm_id, name, chain: chainOf(name + " " + (tg.brand || "")), suburb: tg["addr:suburb"] || tg["addr:city"] || "", lat, lng, osm: true };
      }).filter(Boolean);
      if (S.osmFor !== key) return;               // you moved on while we were looking
      S.osm = list;
      local.set("osmCache", [{ key, t: Date.now(), list }, ...cache.filter(c => c.key !== key)].slice(0, 4));
      return render();
    } catch {}
  }
  if (S.osmFor === key) { S.osm = []; render(); }
}

// Our own shops + map shops, with doubles thrown out
function allStores() {
  const out = [...S.stores];
  const known = new Set(S.stores.map(s => s.osm_id).filter(Boolean).map(Number));
  for (const o of S.osm) {
    if (known.has(o.osm_id)) continue;
    const twin = S.stores.some(s => {
      const d = km(s, o);
      return d < 0.06 || (d < 0.2 && (s.chain === o.chain && o.chain !== "Independent" || s.name.toLowerCase().slice(0, 5) === o.name.toLowerCase().slice(0, 5)));
    });
    if (!twin) out.push(o);
  }
  return out;
}

// ---------- loading data ----------
async function loadStatic() {
  const [p, s] = await Promise.all([
    sb.from("products").select("*").order("category").order("rank", { nullsFirst: false }).order("id"),
    sb.from("stores").select("*").order("name"),
  ]);
  if (p.error || s.error) { toast("Couldn't reach the Brain. Check your internet."); return; }
  S.products = p.data; S.stores = s.data;
  S.productId = S.productId ?? local.get("product", S.products.find(x => x.stockcode === "6076024")?.id ?? S.products[0]?.id);
  if (!S.products.find(x => x.id === S.productId)) S.productId = S.products[0]?.id;
  S.category = local.get("category", product().category || "beer");
  S.scout = local.get("scout", null);
  S.beerFmt = product().category === "beer" ? product().unit : local.get("beerFmt", "can");
  renderPicker();
}

async function loadFavs() {
  S.favs = new Map();
  if (!S.user) return;
  const { data } = await sb.from("favourites").select("product_id,target_price").eq("user_id", S.user.id);
  (data || []).forEach(f => S.favs.set(f.product_id, f.target_price === null ? null : Number(f.target_price)));
}

// ---------- 🍺🥃🍷 category chips + drink picker ----------
function productsIn(cat) {
  if (cat === "fav") return S.products.filter(p => S.favs.has(p.id));
  return S.products.filter(p => p.category === cat && (cat !== "beer" || p.unit === S.beerFmt)).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}
function renderPicker() {
  $("cats").innerHTML = CATS.map(([k, label]) => `<button class="cat ${k === S.category ? "on" : ""}" data-cat="${k}">${label}</button>`).join("");
  $("catNote").textContent = CAT_NOTE[S.category] || "🔥 Popular picks. Prices from Dan's, BWS and scouts like you. Swipe for more →";
  $("beerFmt").classList.toggle("hide", S.category !== "beer");
  $("beerFmt").querySelectorAll("[data-fmt]").forEach(b => b.classList.toggle("on", b.dataset.fmt === S.beerFmt));
  renderDrinks(true);
  renderFav();
}
// 📸 the swipeable drink cards
function drinkPhoto(p) {
  const em = CAT_EMOJI[p.category] || "🍾";
  const img = src => `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.replaceWith('${em}')">`;
  if (p.image_url) return img(p.image_url);
  const shot = S.rows.find(r => r.product_id === p.id && r.photo_path && !(r.downs >= 3 && r.downs > r.ups));
  if (shot) return img(photoUrl(shot.photo_path));
  return em;
}
function renderDrinks(scroll) {
  const list = productsIn(S.category);
  if (!list.length) {
    $("drinks").innerHTML = `<div class="card empty" style="flex:1">${SCOTTY}<b>No favourites yet</b>Tap ☆ on any drink and it lands here.</div>`;
    return;
  }
  $("drinks").innerHTML = list.map((p, i) => {
    const best = boardData(p.id).find(b => b.best);
    const price = best ? `<div class="dprice">${money(packPrice(best.best, stdPack(p)))}</div><div class="dsub">${esc(best.store.name)}</div>`
      : `<div class="dprice none">No price nearby yet</div>`;
    return `<button class="dcard ${p.id === S.productId ? "on" : ""}" data-pid="${p.id}">
      <div class="dphoto">${drinkPhoto(p)}</div>
      ${S.category === "fav" ? "" : `<span class="drank">#${p.rank ?? i + 1}</span>`}
      ${S.favs.has(p.id) ? `<span class="dfav">⭐</span>` : ""}
      <div class="dname">${esc(nameOf(p))}</div>${price}</button>`;
  }).join("");
  if (scroll) $("drinks").querySelector(".dcard.on")?.scrollIntoView({ block: "nearest", inline: "center" });
}
function renderFav() {
  const isFav = S.favs.has(S.productId);
  const nm = nameOf(product());
  $("selName").textContent = nm + (stdPack() > 1 && !nm.includes(packName(stdPack())) ? ` · ${packName(stdPack())}` : "");
  $("favBtn").textContent = isFav ? "⭐" : "☆";
  $("favBox").classList.toggle("hide", !isFav);
  $("favPack").textContent = packName(stdPack());
  const t = S.favs.get(S.productId);
  $("favTarget").value = t ?? "";
}
function chooseProduct(id) {
  if (!id) return;
  S.productId = id; local.set("product", id);
  if (product().category === "beer" && product().unit !== S.beerFmt) { S.beerFmt = product().unit; local.set("beerFmt", S.beerFmt); }
  renderFav(); render();
  if (!S.rows.some(r => r.product_id === id)) loadPrices();
}
$("cats").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  S.category = b.dataset.cat; local.set("category", S.category);
  renderPicker();
  const list = productsIn(S.category);
  if (list.length && !list.find(p => p.id === S.productId)) chooseProduct(list[0].id);
  loadPrices();
});
$("beerFmt").addEventListener("click", e => {
  const b = e.target.closest("[data-fmt]"); if (!b || b.dataset.fmt === S.beerFmt) return;
  S.beerFmt = b.dataset.fmt; local.set("beerFmt", S.beerFmt);
  const list = productsIn("beer");
  // jump to the same beer in the other format if we have it (Super Crisp cans → Super Crisp stubbies)
  const base = s => nameOf(s).replace(/ (30 block|stubbies)$/, "");
  const twin = list.find(p => base(p) === base(product())) || list[0];
  renderPicker();
  if (twin) chooseProduct(twin.id);
  loadPrices();
});
$("drinks").addEventListener("click", e => {
  const b = e.target.closest("[data-pid]"); if (!b) return;
  chooseProduct(+b.dataset.pid);
});
$("favBtn").addEventListener("click", async () => {
  if (needSignIn()) return;
  const id = S.productId;
  if (S.favs.has(id)) {
    const { error } = await sb.from("favourites").delete().eq("user_id", S.user.id).eq("product_id", id);
    if (error) return toast("Couldn't update favourites");
    S.favs.delete(id); toast("Removed from ⭐ favourites");
  } else {
    const { error } = await sb.from("favourites").upsert({ user_id: S.user.id, product_id: id, target_price: null });
    if (error) return toast("Couldn't update favourites");
    S.favs.set(id, null); toast("⭐ Added! Set a price to get buzzed about deals.");
  }
  if (S.category === "fav") renderPicker(); else renderFav();
  render();
});
$("saveFav").addEventListener("click", async () => {
  if (needSignIn()) return;
  const v = parseFloat($("favTarget").value);
  const target = v > 0 ? Math.round(v * 100) / 100 : null;
  const { error } = await sb.from("favourites").upsert({ user_id: S.user.id, product_id: S.productId, target_price: target });
  if (error) return toast("Couldn't save");
  S.favs.set(S.productId, target);
  toast(target ? `🔔 We'll buzz you when a ${packName(stdPack())} is under ${money(target)}` : "Alert turned off for this drink");
  render();
});

async function loadPrices() {
  if (!S.productId) return;
  const since = new Date(Date.now() - FADE_DAYS * 86400000).toISOString();
  // one trip to the Brain for every drink in this row of cards
  const ids = [...new Set([S.productId, ...productsIn(S.category).map(p => p.id)])];
  const { data, error } = await sb.from("price_board").select("*")
    .in("product_id", ids).gte("last_confirmed", since).order("added_at", { ascending: false }).limit(2000);
  if (error) { toast("Couldn't load prices"); console.error(error); return; }
  S.rows = data.map(r => ({ ...r, price: +r.price, per_unit: +r.per_unit, ups: +r.ups, downs: +r.downs }));
  S.myVotes = {};
  if (S.user && data.length) {
    const { data: v } = await sb.from("votes").select("price_id,vote").eq("user_id", S.user.id).in("price_id", data.map(r => r.id));
    (v || []).forEach(x => S.myVotes[x.price_id] = x.vote);
  }
  render();
}
let reloadTimer;
const reloadSoon = () => { clearTimeout(reloadTimer); reloadTimer = setTimeout(loadPrices, 400); };

// ---------- the brains of the leaderboard ----------
function boardData(pid = S.productId) {
  const st = S.settings, useFuel = $("fuel").checked, p = product(pid), sp = stdPack(p);
  const chainOfStore = new Map(S.stores.map(s => [s.id, s.chain]));
  // throw out prices lots of people say are wrong
  const ok = S.rows.filter(r => r.product_id === pid && !(r.downs >= 3 && r.downs > r.ups));
  // for each shop + pack size, only the newest price counts (if it went up, the old cheap one is gone)
  const latest = new Map();
  for (const r of ok) { const k = r.store_id + ":" + r.pack_size; if (!latest.has(k)) latest.set(k, r); }
  const byStore = new Map(), byChain = new Map();
  for (const r of latest.values()) {
    const cur = byStore.get(r.store_id);
    if (!cur || r.per_unit < cur.per_unit) byStore.set(r.store_id, r);
    // 📋 Dan's and BWS online prices are the same at every one of their shops
    const ch = chainOfStore.get(r.store_id);
    if (r.source === "robot" && ONLINE_CHAINS.includes(ch)) {
      const c = byChain.get(ch);
      if (!c || r.per_unit < c.per_unit) byChain.set(ch, r);
    }
  }
  return allStores().map(s => {
    const dist = km(S.pos, s);
    let best = byStore.get(s.id) || null;
    if (!best && byChain.has(s.chain)) best = { ...byChain.get(s.chain), viaChain: true };
    let score = Infinity;
    if (best) {
      score = Number(best.per_unit);
      if (useFuel) score += (dist * ROAD_FACTOR * 2 * st.fuel_per_km) / sp;
    }
    return { store: s, dist, best, score };
  }).filter(x => x.dist <= st.radius_km)
    .sort((a, b) => a.score - b.score || a.dist - b.dist);
}
const trusted = r => r.source === "robot" || r.source === "photo" || r.ups >= 2;
const target = () => S.favs.get(S.productId) || 0;
const isDeal = r => target() > 0 && Number(r.per_unit) * stdPack() <= target() + 0.001;
const sourceBadge = r => r.viaChain ? "📋 Scout Report · online price (in-store can differ by state)" : r.source === "robot" ? "📋 Scout Report (online price)" : r.source === "photo" ? "📸 " + esc(r.nickname || "someone") : "👤 " + esc(r.nickname || "someone");

// ---------- drawing the screen ----------
function render() {
  $("radiusLbl").textContent = S.settings.radius_km;
  if (!S.products.length) return;
  renderDrinks(false);
  const board = boardData();
  const priced = board.filter(b => b.best);
  const st = S.settings;

  // 🔔 deal banner
  const deals = priced.filter(b => isDeal(b.best));
  $("deal").innerHTML = deals.length ? `<div class="card dealbox"><b>🔔 Deal alert!</b>
    ${esc(deals[0].store.name)} works out at ${money(packPrice(deals[0].best))} for a ${packName(stdPack())}. That's under your ${money(target())} target!</div>` : "";
  deals.forEach(d => notifyDeal(d));

  // 🏆 winner
  if (!priced.length) {
    $("winner").innerHTML = `<div class="card empty">${SCOTTY}<b>No prices yet for ${esc(nameOf(product()))}</b>Scotty's still sussing this one out. 📋 The Scout Report checks Dan's and BWS every morning, or be the first: tap <b>Add a price</b> when you spot it in a bottlo.</div>`;
  } else {
    const w = priced[0], r = w.best;
    const next = priced[1];
    let tip = "";
    if (w.store.chain !== "Dan Murphy's" && board.some(b => b.store.chain === "Dan Murphy's"))
      tip = `<div class="tipline">💡 Dan Murphy's says it beats a cheaper advertised price on the same product. Show them this price at Dan's.</div>`;
    else if (next)
      tip = `<div class="tipline">💰 Saves you ${money((next.best.per_unit - r.per_unit) * stdPack())} on a ${packName(stdPack())} compared with ${esc(next.store.name)}.</div>`;
    $("winner").innerHTML = `<div class="card winner"><img class="scotty-pick" src="${SCOTTY_SRC}" alt="Scotty's pick">
      <div class="tag">🏆 Cheapest ${S.scout && !S.scout.home ? "around " + esc(S.scout.name) : "near you"} ${trusted(r) ? "· ✅ trusted" : ""}</div>
      <div class="store">${esc(w.store.name)}</div>
      <div class="meta">~${w.dist.toFixed(1)} km away · ${sourceBadge(r)} · ${ago(r.added_at)}</div>
      <div class="big">${money(packPrice(r))} <small>${stdPack() === 1 ? "a " + unitName() : "a " + packName(stdPack())}</small></div>
      <div class="meta">${stdPack() > 1 ? money(r.per_unit) + " per " + unitName() + " · " : ""}${r.pack_size !== stdPack() ? `seen as ${money(r.price)} for a ${packName(r.pack_size)}` : esc(nameOf(product()))}</div>
      <div style="margin-top:14px"><a class="btn" href="${mapsLink(w.store)}">📍 Take me there</a></div>${tip}</div>`;
  }

  // 📋 list
  $("list").innerHTML = board.length ? board.map((b, i) => itemHtml(b, i)).join("")
    : `<div class="card empty">${SCOTTY}<b>No bottlos in range</b>Scotty can't see any shops this close. Tap <b>Scout Around</b> and look further out.</div>`;
}

function itemHtml(b, i) {
  const s = b.store, r = b.best;
  const addBtn = `<button class="chip" data-add="${s.id}">＋ ${r ? "New price" : "Add price"}</button>`;
  if (r?.viaChain) return `<div class="item ${i === 0 ? "first" : ""}"><div class="top">
      <div class="rank">${i + 1}</div>
      <div class="mid"><div class="nm">${esc(s.name)} ${isDeal(r) ? "🔔" : ""}</div>
        <div class="dt">~${b.dist.toFixed(1)} km${$("fuel").checked ? ` · ${money(b.score * stdPack())} with petrol` : ""}</div>
        <div class="dt">${sourceBadge(r)} · ${ago(r.added_at)}</div></div>
      <div class="pr"><b>${money(packPrice(r))}</b><span>${stdPack() === 1 ? "a " + unitName() : "a " + packName(stdPack())}</span></div></div>
      <div class="actions">${addBtn}<a class="chip" href="${mapsLink(s)}">📍 Map</a></div></div>`;
  if (!r) return `<div class="item noprice"><div class="top">
      <div class="rank">–</div>
      <div class="mid"><div class="nm">${esc(s.name)}</div><div class="dt">~${b.dist.toFixed(1)} km · no price yet${s.robot_readable ? " · 📋 on the Scout Report" : ""}</div></div>
      <div class="pr"><b>?</b></div></div>
      <div class="actions">${addBtn}<a class="chip" href="${mapsLink(s)}">📍 Map</a></div></div>`;
  const mine = S.user && r.added_by === S.user.id;
  const my = S.myVotes[r.id] || 0;
  const fuelTxt = $("fuel").checked ? ` · ${money(b.score * stdPack())} with petrol` : "";
  const canDelete = mine || S.profile?.is_admin;
  const canBan = S.profile?.is_admin && !mine && r.added_by;
  return `<div class="item ${i === 0 ? "first" : ""}"><div class="top">
      <div class="rank">${i + 1}</div>
      <div class="mid">
        <div class="nm">${esc(s.name)} ${trusted(r) ? "✅" : ""} ${isDeal(r) ? "🔔" : ""}</div>
        <div class="dt">${money(r.price)} / ${packName(r.pack_size)} · ~${b.dist.toFixed(1)} km${fuelTxt}</div>
        <div class="dt">${sourceBadge(r)} · ${ago(r.added_at)}</div>
      </div>
      <div class="pr"><b>${money(packPrice(r))}</b><span>${stdPack() === 1 ? "a " + unitName() : "a " + packName(stdPack())}</span></div></div>
    <div class="actions">
      ${mine ? "" : `<button class="chip ${my === 1 ? "on" : ""}" data-vote="1" data-id="${r.id}">👍 ${r.ups}</button>
      <button class="chip ${my === -1 ? "on" : ""}" data-vote="-1" data-id="${r.id}">👎 ${r.downs}</button>`}
      ${mine ? `<span class="chip">👍 ${r.ups} · 👎 ${r.downs}</span>` : ""}
      ${r.photo_path ? `<a class="chip" href="${photoUrl(r.photo_path)}">📸 Photo</a>` : ""}
      <a class="chip" href="${mapsLink(s)}">📍 Map</a>
      ${addBtn}
      ${canDelete ? `<button class="chip danger" data-del="${r.id}">🗑</button>` : ""}
      ${canBan ? `<button class="chip danger" data-ban="${r.added_by}" data-nick="${esc(r.nickname)}">🚫 Ban</button>` : ""}
    </div></div>`;
}

// ---------- 🔔 alerts while the app is open (background alerts come in Step 4) ----------
async function notifyDeal(d) {
  const key = d.best.id;
  if (S.dealsSeen.has(key)) return;
  S.dealsSeen.add(key);
  const seen = local.get("dealsNotified", []);
  if (seen.includes(key)) return;
  local.set("dealsNotified", [...seen.slice(-50), key]);
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (await alertsOn()) return;      // background alerts will buzz instead, so no double-up
  try {
    const reg = await navigator.serviceWorker?.ready;
    reg?.showNotification("🔔 Bottlo Scout deal!", {
      body: `${d.store.name}: ${nameOf(product())} ${money(packPrice(d.best))} a ${packName(stdPack())}`,
      icon: "icons/icon-192.png", tag: "deal-" + key,
    });
  } catch {}
}

// ---------- signing in ----------
async function refreshUser() {
  const { data } = await sb.auth.getSession();
  S.user = data.session?.user || null;
  S.profile = null;
  if (S.user) {
    const { data: p } = await sb.from("profiles").select("*").eq("id", S.user.id).maybeSingle();
    S.profile = p;
    if (!p) { open("sheetNick"); }
    const { data: st } = await sb.from("settings").select("*").eq("user_id", S.user.id).maybeSingle();
    if (st) S.settings = { ...S.settings, ...st, radius_km: +st.radius_km, deal_price: +st.deal_price, fuel_per_km: +st.fuel_per_km };
  } else {
    S.settings = { ...S.settings, ...local.get("settings", {}) };
  }
  await loadFavs();
  if (S.products.length) renderPicker();
  $("signInOut").textContent = S.user ? "Sign out" : "Sign in";
  $("acct").textContent = S.user ? `Signed in as ${S.profile?.nickname || ""} (${S.user.email}) · 🏅 ${S.profile?.points ?? 0} scout points${S.profile?.is_admin ? " · 👑 admin" : ""}${S.profile?.banned ? " · 🚫 blocked from posting" : ""}` : "Not signed in. You can look, but sign in to add prices or vote.";
}
function needSignIn() { if (S.user && S.profile) return false; open(S.user ? "sheetNick" : "sheetSignin"); return true; }

async function doAuth(mode) {
  const email = $("email").value.trim(), password = $("password").value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return toast("Check your email address");
  if (password.length < 8) return toast("Password needs at least 8 characters");
  const btns = [$("signInBtn"), $("signUpBtn")]; btns.forEach(b => b.disabled = true);
  const { data, error } = mode === "up"
    ? await sb.auth.signUp({ email, password })
    : await sb.auth.signInWithPassword({ email, password });
  btns.forEach(b => b.disabled = false);
  if (error) {
    if (/already registered/i.test(error.message)) return toast("You already have an account. Tap Sign in.");
    if (/invalid login/i.test(error.message)) return toast("Wrong email or password");
    return toast(error.message);
  }
  if (!data.session) return toast("Account made, but email confirmation is still ON in Supabase (see Setup Step 3).");
  $("password").value = "";
  close("sheetSignin");
  await refreshUser(); await loadPrices();
  if (S.profile) toast("Welcome back, " + S.profile.nickname + "!");
}
$("signInBtn").addEventListener("click", () => doAuth("in"));
$("signUpBtn").addEventListener("click", () => doAuth("up"));
$("saveNick").addEventListener("click", async () => {
  const nickname = $("nick").value.trim();
  if (nickname.length < 2) return toast("At least 2 letters please");
  const { error } = await sb.from("profiles").insert({ id: S.user.id, nickname });
  if (error) return toast(error.code === "23505" ? "Someone has that nickname. Try another!" : error.message);
  await sb.from("settings").upsert({ user_id: S.user.id, ...pickSettings(S.settings) });
  close("sheetNick");
  await refreshUser(); render();
  toast("You're in, " + nickname + "! 🍻");
});

// ---------- adding a price ----------
function fillStoreSelect(preselect) {
  const list = allStores().map(s => ({ s, d: km(S.pos, s) })).sort((a, b) => a.d - b.d)
    .filter((x, i) => i < 40 || x.s.id === preselect);
  $("addStore").innerHTML = list.map(({ s, d }) =>
    `<option value="${s.id}">${S.gpsPos && km(S.gpsPos, s) < 0.3 ? "📍 You're here: " : ""}${esc(s.name)} (~${d.toFixed(1)} km)</option>`).join("");
  if (preselect != null) $("addStore").value = preselect;
}
function openAdd(storeId) {
  if (needSignIn()) return;
  if (S.profile.banned) return toast("Your account is blocked from posting 🚫");
  fillStoreSelect(storeId);
  const p = product();
  $("addWhat").textContent = nameOf(p);
  $("addPack").innerHTML = PACK_CHOICES[isStubby(p) ? "stubby" : p.unit === "bottle" ? "bottle" : "can"]
    .map(n => `<option value="${n}" ${n === stdPack() ? "selected" : ""}>${packName(n)}</option>`).join("");
  $("addPrice").value = ""; $("addPhoto").value = "";
  $("newStore").classList.add("hide"); $("weird").classList.add("hide");
  open("sheetAdd");
}
$("openAdd").addEventListener("click", () => openAdd());
$("showNewStore").addEventListener("click", () => $("newStore").classList.toggle("hide"));

function looksWeird() {
  const price = parseFloat($("addPrice").value), pack = +$("addPack").value;
  if (!(price > 0)) return false;
  const ref = Number(product().ref_price) / stdPack();        // a normal price per can/bottle
  if (!(ref > 0)) return false;
  const per = price / pack;
  return per < ref * 0.55 || per > ref * 1.7;
}
$("addPrice").addEventListener("input", () => $("weird").classList.toggle("hide", !looksWeird()));
$("addPack").addEventListener("change", () => $("weird").classList.toggle("hide", !looksWeird()));

// A shop from the map gets saved into our own list the first time someone adds a price there
async function saveMapShop(key) {
  const o = S.osm.find(x => x.id === key);
  if (!o) throw new Error("Couldn't find that shop, try again");
  const found = await sb.from("stores").select("*").eq("osm_id", o.osm_id).maybeSingle();
  if (found.data) { if (!S.stores.some(s => s.id === found.data.id)) S.stores.push(found.data); return found.data.id; }
  const { data, error } = await sb.from("stores").insert({
    name: o.name, suburb: o.suburb || null, chain: o.chain, lat: o.lat, lng: o.lng, osm_id: o.osm_id, added_by: S.user.id,
  }).select().single();
  if (error) throw error;
  S.stores.push(data);
  return data.id;
}

async function shrinkPhoto(file) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(res => c.toBlob(res, "image/jpeg", 0.7));
}

$("savePrice").addEventListener("click", async () => {
  const btn = $("savePrice");
  const price = parseFloat($("addPrice").value);
  const pack = +$("addPack").value;
  const file = $("addPhoto").files[0];
  if (!(price > 0)) return toast("Type in the price");
  if (looksWeird() && !file) return toast("That price looks odd. Add a photo of the tag please 📸");
  btn.disabled = true; btn.textContent = "Sharing…";
  try {
    let storeId = $("addStore").value;
    storeId = /^osm-/.test(storeId) ? await saveMapShop(storeId) : +storeId;
    // new shop?
    if (!$("newStore").classList.contains("hide") && $("nsName").value.trim()) {
      if (!S.gpsPos) throw new Error("Turn on location so we know where the new shop is");
      const { data, error } = await sb.from("stores").insert({
        name: $("nsName").value.trim(), suburb: $("nsSuburb").value.trim() || null,
        chain: chainOf($("nsName").value), lat: S.gpsPos.lat, lng: S.gpsPos.lng, added_by: S.user.id,
      }).select().single();
      if (error) throw error;
      storeId = data.id; S.stores.push(data);
    }
    let photo_path = null;
    if (file) {
      const blob = await shrinkPhoto(file);
      photo_path = `${S.user.id}/${Date.now()}.jpg`;
      const up = await sb.storage.from("price-photos").upload(photo_path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
    }
    const { error } = await sb.from("prices").insert({
      product_id: S.productId, store_id: storeId, pack_size: pack, price,
      source: photo_path ? "photo" : "user", photo_path, added_by: S.user.id,
    });
    if (error) throw (error.code === "42501" ? new Error("Slow down! Max 10 prices an hour 😅") : error);
    close("sheetAdd");
    toast("Shared with everyone! 🍻");
    loadPrices();
    sb.functions.invoke("robot", { body: { alerts: true } }).catch(() => {});   // buzz anyone this is a deal for
  } catch (e) {
    toast(e.message || "Something went wrong");
  } finally {
    btn.disabled = false; btn.textContent = "Share with everyone";
  }
});

// ---------- votes, delete, ban ----------
$("list").addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.add) return openAdd(/^osm-/.test(t.dataset.add) ? t.dataset.add : +t.dataset.add);
  if (t.dataset.vote) {
    if (needSignIn()) return;
    const id = +t.dataset.id, v = +t.dataset.vote;
    const { error } = S.myVotes[id] === v
      ? await sb.from("votes").delete().eq("price_id", id).eq("user_id", S.user.id)
      : await sb.from("votes").upsert({ price_id: id, user_id: S.user.id, vote: v });
    if (error) return toast(S.profile?.banned ? "Your account is blocked 🚫" : "Couldn't save your vote");
    toast(S.myVotes[id] === v ? "Vote removed" : v === 1 ? "Thanks for checking! 👍" : "Thanks, flagged 👎");
    return loadPrices();
  }
  if (t.dataset.del) {
    if (!confirm("Delete this price?")) return;
    const { error } = await sb.from("prices").delete().eq("id", +t.dataset.del);
    if (error) return toast("Couldn't delete");
    toast("Deleted 🗑"); return loadPrices();
  }
  if (t.dataset.ban) {
    if (!confirm(`Ban ${t.dataset.nick}? They won't be able to post or vote.`)) return;
    const { error } = await sb.rpc("ban_user", { target: t.dataset.ban });
    toast(error ? "Couldn't ban" : "Banned 🚫");
  }
});

// ---------- settings ----------
const pickSettings = s => ({ radius_km: s.radius_km, deal_price: s.deal_price, deal_pack: s.deal_pack, fuel_per_km: s.fuel_per_km, ...(s.home_lat != null ? { home_lat: s.home_lat, home_lng: s.home_lng } : {}) });
$("openSettings").addEventListener("click", () => {
  const s = S.settings;
  $("sNick").value = S.profile?.nickname || ""; $("sNick").disabled = !S.profile;
  $("sRadius").value = s.radius_km; $("sFuel").value = s.fuel_per_km;
  refreshAlertsBtn();
  open("sheetSettings");
});
$("saveSettings").addEventListener("click", async () => {
  const s = S.settings;
  const oldR = s.radius_km;
  s.radius_km = Math.min(100, Math.max(1, +$("sRadius").value || 15));
  s.fuel_per_km = Math.max(0, +$("sFuel").value || 0);
  local.set("settings", pickSettings(s));
  if (S.user && S.profile) {
    await sb.from("settings").upsert({ user_id: S.user.id, ...pickSettings(s) });
    const nick = $("sNick").value.trim();
    if (nick && nick !== S.profile.nickname) {
      const { error } = await sb.from("profiles").update({ nickname: nick }).eq("id", S.user.id);
      if (error) toast(error.code === "23505" ? "That nickname is taken" : "Couldn't change nickname");
      else S.profile.nickname = nick;
    }
  }
  close("sheetSettings"); renderLoc();
  if (oldR !== s.radius_km) loadOsm();
  render(); toast("Saved ✓");
});
// ---------- 🔔 background deal alerts (web push) ----------
function b64ToBytes(b64) {
  const pad = "=".repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function alertsOn() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    return !!(await reg?.pushManager?.getSubscription()) && Notification.permission === "granted";
  } catch { return false; }
}
async function refreshAlertsBtn() {
  $("alertsBtn").textContent = (await alertsOn()) ? "🔔 Deal alerts are on (tap to test)" : "🔔 Turn on deal alerts";
}
$("alertsBtn").addEventListener("click", async () => {
  if (needSignIn()) return;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window))
    return toast("On iPhone: add Bottlo Scout to your Home Screen first, then open it from there.");
  if (await alertsOn()) {                         // already on → send a test buzz
    const { error } = await sb.functions.invoke("robot", { body: { alerts: true } });
    return toast(error ? "Alerts are on ✅ (no new deals to send right now)" : "Checked for deals 🔔 You'll get a buzz if there's a new one.");
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return toast("Alerts are off. You can change this in iPhone Settings → Notifications.");
  try {
    const { data: key, error } = await sb.rpc("vapid_public_key");
    if (error || !key) throw new Error("Alerts aren't set up yet (Morning checklist step 3).");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
    const j = sub.toJSON();
    const { error: e2 } = await sb.from("push_subscriptions").upsert(
      { user_id: S.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
    if (e2) throw e2;
    toast("Alerts on! 🔔 We'll buzz you when there's a deal.");
  } catch (e) {
    toast(e.message || "Couldn't turn on alerts");
  }
  refreshAlertsBtn();
});
$("setHome").addEventListener("click", () => {
  if (!navigator.geolocation) return toast("Location isn't available");
  navigator.geolocation.getCurrentPosition(async p => {
    S.settings.home_lat = p.coords.latitude; S.settings.home_lng = p.coords.longitude;
    local.set("settings", pickSettings(S.settings));
    if (S.user && S.profile) await sb.from("settings").upsert({ user_id: S.user.id, ...pickSettings(S.settings) });
    if (S.scout?.home) { S.scout = { name: "Home spot", ...homeSpot(), home: true }; local.set("scout", S.scout); }
    setPos();
    toast("Home saved 🏠 Alerts will look around here.");
  }, () => toast("Allow location first, then try again"), { enableHighAccuracy: true, timeout: 10000 });
});
$("signInOut").addEventListener("click", async () => {
  close("sheetSettings");
  if (S.user) { await sb.auth.signOut(); await refreshUser(); render(); toast("Signed out"); }
  else open("sheetSignin");
});
$("fuel").addEventListener("change", () => { local.set("fuel", $("fuel").checked); render(); });

// ---------- 📍 Scout Around sheet ----------
let scoutHits = [];
function renderRadii() {
  $("scoutRadius").innerHTML = RADII.map(r => `<button class="chip ${r === S.settings.radius_km ? "on" : ""}" data-r="${r}">${r} km</button>`).join("");
}
$("openScout").addEventListener("click", () => {
  $("scoutQ").value = ""; $("scoutResults").innerHTML = ""; scoutHits = [];
  renderRadii(); open("sheetScout");
});
function placeLabel(r) {
  const a = r.address || {};
  const place = a.suburb || a.town || a.city || a.village || a.hamlet || a.locality || r.name || r.display_name.split(",")[0];
  const st = STATES[a.state] || a.state || "";
  return [place, [st, a.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}
async function scoutSearch() {
  const q = $("scoutQ").value.trim();
  if (q.length < 3) return toast("Type a postcode or suburb");
  $("scoutGo").disabled = true;
  $("scoutResults").innerHTML = `<div class="note">🔍 Scotty's looking…</div>`;
  try {
    const p = new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: "6", countrycodes: "au", "accept-language": "en" });
    if (/^\d{4}$/.test(q)) { p.set("postalcode", q); p.set("country", "Australia"); } else p.set("q", q);
    const res = await fetch("https://nominatim.openstreetmap.org/search?" + p);
    const j = res.ok ? await res.json() : [];
    const seen = new Set();
    scoutHits = j.map(r => ({ name: placeLabel(r), lat: +r.lat, lng: +r.lon }))
      .filter(h => !seen.has(h.name) && seen.add(h.name));
    $("scoutResults").innerHTML = scoutHits.length
      ? scoutHits.map((h, i) => `<button class="item" style="text-align:left;font:600 15px Inter,sans-serif;color:var(--ink);cursor:pointer" data-hit="${i}">📍 ${esc(h.name)}</button>`).join("")
      : `<div class="note">Couldn't find "${esc(q)}". Try a 4-digit postcode or check the spelling.</div>`;
  } catch {
    $("scoutResults").innerHTML = `<div class="note">Couldn't search right now. Check your internet and try again.</div>`;
  } finally { $("scoutGo").disabled = false; }
}
function scoutTo(spot) {
  S.scout = spot; local.set("scout", spot);
  close("sheetScout"); setPos();
  toast(spot ? (spot.home ? "🏠 Back home" : `🧭 Scouting around ${spot.name}`) : "📍 Using where you are");
}
$("scoutGo").addEventListener("click", scoutSearch);
$("scoutQ").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); scoutSearch(); } });
$("scoutResults").addEventListener("click", e => {
  const b = e.target.closest("[data-hit]"); if (b) scoutTo(scoutHits[+b.dataset.hit]);
});
$("scoutHere").addEventListener("click", () => {
  scoutTo(null);
  locate(() => toast("Allow location in iPhone Settings so Scotty knows where you are"));
});
$("scoutHome").addEventListener("click", () => scoutTo({ name: "Home spot", ...homeSpot(), home: true }));
$("scoutRadius").addEventListener("click", async e => {
  const b = e.target.closest("[data-r]"); if (!b) return;
  S.settings.radius_km = +b.dataset.r; renderRadii();
  local.set("settings", pickSettings(S.settings));
  if (S.user && S.profile) sb.from("settings").upsert({ user_id: S.user.id, ...pickSettings(S.settings) });
  renderLoc(); loadOsm(); render();
});

// ---------- age check + install tip ----------
if (!local.get("age18", false)) open("sheetAge");
$("age18").addEventListener("click", () => { local.set("age18", true); close("sheetAge"); });
$("ageNo").addEventListener("click", () => { document.body.innerHTML = `<div class="wrap"><div class="card empty" style="margin-top:60px"><b>Sorry!</b>Bottlo Scout is for adults 18 and over.</div></div>`; });
const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !standalone && !local.get("tipHidden", false)) $("installTip").classList.remove("hide");
$("hideTip").addEventListener("click", () => { local.set("tipHidden", true); $("installTip").classList.add("hide"); });

// ---------- start up ----------
(async function start() {
  $("fuel").checked = local.get("fuel", false);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  await loadStatic();
  await refreshUser();
  setPos();           // show something straight away (home spot or your Scout Around spot)…
  locate();           // …then switch to GPS when it's ready
  await loadPrices();
  sb.channel("board")
    .on("postgres_changes", { event: "*", schema: "public", table: "prices" }, reloadSoon)
    .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, reloadSoon)
    .subscribe();
  sb.auth.onAuthStateChange((evt) => { if (evt === "SIGNED_OUT") { S.user = null; S.profile = null; render(); } });
  setInterval(loadPrices, 5 * 60 * 1000);   // backup refresh every 5 minutes
})();
