// =====================================================================
//  BOTTLO SCOUT – VERSION 3 APP (every drink)
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
  beer: "🏆 Australia's best-selling beers first (2025 sales data), all as 30 blocks.",
  fav: "Your ⭐ favourites. Tap ⭐ on any drink to add it here.",
};
const PACK_CHOICES = { can: [1, 4, 6, 10, 16, 24, 30], bottle: [1, 6, 12] };

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
  products: [], productId: null, category: "beer", favs: new Map(), stores: [], rows: [], myVotes: {},
  dealsSeen: new Set(),
};

// ---------- little helpers ----------
const money = n => "$" + Number(n).toFixed(2);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const product = () => S.products.find(p => p.id === S.productId) || { std_pack: 30, unit: "can", short_name: "Super Crisp" };
const unitName = (p = product()) => p.unit === "bottle" ? "bottle" : "can";
function packName(n, p = product()) {
  if (p.unit === "bottle") return n === 1 ? "bottle" : n === 12 ? "dozen" : `${n} bottles`;
  return ({ 1: "single can", 24: "24 block", 30: "30 block" })[n] || `${n} pack`;
}
const stdPack = (p = product()) => Number(p.std_pack || 1);
const nameOf = p => p.short_name || p.name;
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

// ---------- location ----------
function locate() {
  if (!navigator.geolocation) return useHome();
  navigator.geolocation.getCurrentPosition(
    p => { S.pos = { lat: p.coords.latitude, lng: p.coords.longitude, gps: true }; $("where").textContent = "📍 Using your location"; render(); },
    () => useHome(),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
  );
}
function useHome() {
  const s = S.settings;
  S.pos = { lat: s.home_lat ?? JACOBS_WELL.lat, lng: s.home_lng ?? JACOBS_WELL.lng, gps: false };
  $("where").textContent = "🏠 Using your home spot. Allow location for live GPS.";
  render();
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
  return S.products.filter(p => p.category === cat).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}
function renderPicker() {
  $("cats").innerHTML = CATS.map(([k, label]) => `<button class="cat ${k === S.category ? "on" : ""}" data-cat="${k}">${label}</button>`).join("");
  const list = productsIn(S.category);
  $("catNote").textContent = CAT_NOTE[S.category] || "🔥 Popular picks. Prices from Dan's, BWS and scouts like you.";
  $("productPick").innerHTML = list.length
    ? list.map((p, i) => `<option value="${p.id}">${S.category === "fav" ? "⭐" : (p.rank ?? i + 1) + "."} ${esc(nameOf(p))}</option>`).join("")
    : `<option value="">No favourites yet</option>`;
  if (list.find(p => p.id === S.productId)) $("productPick").value = S.productId;
  renderFav();
}
function renderFav() {
  const isFav = S.favs.has(S.productId);
  $("favBtn").textContent = isFav ? "⭐" : "☆";
  $("favBox").classList.toggle("hide", !isFav);
  $("favPack").textContent = packName(stdPack());
  const t = S.favs.get(S.productId);
  $("favTarget").value = t ?? "";
}
function chooseProduct(id) {
  if (!id) return;
  S.productId = id; local.set("product", id);
  renderFav(); S.rows = []; render(); loadPrices();
}
$("cats").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  S.category = b.dataset.cat; local.set("category", S.category);
  renderPicker();
  const list = productsIn(S.category);
  if (list.length && !list.find(p => p.id === S.productId)) chooseProduct(list[0].id);
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
  const { data, error } = await sb.from("price_board").select("*")
    .eq("product_id", S.productId).gte("last_confirmed", since).order("added_at", { ascending: false });
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
function boardData() {
  const st = S.settings, useFuel = $("fuel").checked;
  // throw out prices lots of people say are wrong
  const ok = S.rows.filter(r => !(r.downs >= 3 && r.downs > r.ups));
  // for each shop + pack size, only the newest price counts (if it went up, the old cheap one is gone)
  const latest = new Map();
  for (const r of ok) { const k = r.store_id + ":" + r.pack_size; if (!latest.has(k)) latest.set(k, r); }
  const byStore = new Map();
  for (const r of latest.values()) {
    const cur = byStore.get(r.store_id);
    if (!cur || r.per_unit < cur.per_unit) byStore.set(r.store_id, r);
  }
  return S.stores.map(s => {
    const dist = km(S.pos, s);
    const best = byStore.get(s.id) || null;
    let score = Infinity;
    if (best) {
      score = Number(best.per_unit);
      if (useFuel) score += (dist * ROAD_FACTOR * 2 * st.fuel_per_km) / stdPack();
    }
    return { store: s, dist, best, score };
  }).filter(x => x.dist <= st.radius_km)
    .sort((a, b) => a.score - b.score || a.dist - b.dist);
}
const trusted = r => r.source === "robot" || r.source === "photo" || r.ups >= 2;
const target = () => S.favs.get(S.productId) || 0;
const isDeal = r => target() > 0 && Number(r.per_unit) * stdPack() <= target() + 0.001;
const sourceBadge = r => r.source === "robot" ? "🤖 Robot (online price)" : r.source === "photo" ? "📸 " + esc(r.nickname || "someone") : "👤 " + esc(r.nickname || "someone");

// ---------- drawing the screen ----------
function render() {
  $("radiusLbl").textContent = S.settings.radius_km;
  const board = boardData();
  const priced = board.filter(b => b.best);
  const st = S.settings;

  // 🔔 deal banner
  const deals = priced.filter(b => isDeal(b.best));
  $("deal").innerHTML = deals.length ? `<div class="card dealbox"><b>🔔 Deal alert!</b>
    ${esc(deals[0].store.name)} works out at ${money(deals[0].best.per_unit * stdPack())} for a ${packName(stdPack())}. That's under your ${money(target())} target!</div>` : "";
  deals.forEach(d => notifyDeal(d));

  // 🏆 winner
  if (!priced.length) {
    $("winner").innerHTML = `<div class="card empty"><b>No prices yet for ${esc(nameOf(product()))}</b>The 🤖 Robot checks every morning. Or be the first: tap <b>Add a price</b> when you spot it in a bottlo.</div>`;
  } else {
    const w = priced[0], r = w.best;
    const next = priced[1];
    let tip = "";
    if (w.store.chain !== "Dan Murphy's" && board.some(b => b.store.chain === "Dan Murphy's"))
      tip = `<div class="note" style="color:#2a1d00;opacity:.8;margin-top:12px">💡 Dan Murphy's says it beats a cheaper advertised price on the same product. Show them this price at Dan's.</div>`;
    else if (next)
      tip = `<div class="note" style="color:#2a1d00;opacity:.8;margin-top:12px">Saves you ${money((next.best.per_unit - r.per_unit) * stdPack())} on a ${packName(stdPack())} compared with ${esc(next.store.name)}.</div>`;
    $("winner").innerHTML = `<div class="card winner"><div class="bubbles"></div>
      <div class="tag">🏆 Cheapest near you ${trusted(r) ? "· ✅ trusted" : ""}</div>
      <div class="store">${esc(w.store.name)}</div>
      <div>~${w.dist.toFixed(1)} km away · ${sourceBadge(r)} · ${ago(r.added_at)}</div>
      <div class="big">${money(r.per_unit * stdPack())} <small>${stdPack() === 1 ? "a " + unitName() : "a " + packName(stdPack())}</small></div>
      <div>${stdPack() > 1 ? money(r.per_unit) + " per " + unitName() + " · " : ""}${r.pack_size !== stdPack() ? `seen as ${money(r.price)} for a ${packName(r.pack_size)}` : esc(nameOf(product()))}</div>
      <div style="margin-top:14px"><a class="btn" href="${mapsLink(w.store)}">📍 Take me there</a></div>${tip}</div>`;
  }

  // 📋 list
  $("list").innerHTML = board.length ? board.map((b, i) => itemHtml(b, i)).join("")
    : `<div class="card empty"><b>No shops in range</b>Make your search radius bigger in ⚙️ Settings.</div>`;
}

function itemHtml(b, i) {
  const s = b.store, r = b.best;
  if (!r) return `<div class="item noprice"><div class="top">
      <div class="rank">–</div>
      <div class="mid"><div class="nm">${esc(s.name)}</div><div class="dt">~${b.dist.toFixed(1)} km · no price yet${s.robot_readable ? " · 🤖 Robot will check" : ""}</div></div>
      <div class="pr"><b>?</b></div></div>
      <div class="actions"><button class="chip" data-add="${s.id}">＋ Add price</button><a class="chip" href="${mapsLink(s)}">📍 Map</a></div></div>`;
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
      <div class="pr"><b>${money(r.per_unit * stdPack())}</b><span>${stdPack() === 1 ? "a " + unitName() : "a " + packName(stdPack())}</span></div></div>
    <div class="actions">
      ${mine ? "" : `<button class="chip ${my === 1 ? "on" : ""}" data-vote="1" data-id="${r.id}">👍 ${r.ups}</button>
      <button class="chip ${my === -1 ? "on" : ""}" data-vote="-1" data-id="${r.id}">👎 ${r.downs}</button>`}
      ${mine ? `<span class="chip">👍 ${r.ups} · 👎 ${r.downs}</span>` : ""}
      ${r.photo_path ? `<a class="chip" href="${photoUrl(r.photo_path)}">📸 Photo</a>` : ""}
      <a class="chip" href="${mapsLink(s)}">📍 Map</a>
      <button class="chip" data-add="${s.id}">＋ New price</button>
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
      body: `${d.store.name}: ${nameOf(product())} ${money(d.best.per_unit * stdPack())} a ${packName(stdPack())}`,
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
  const list = S.stores.map(s => ({ s, d: km(S.pos, s) })).sort((a, b) => a.d - b.d);
  $("addStore").innerHTML = list.map(({ s, d }) =>
    `<option value="${s.id}">${d < 0.3 && S.pos.gps ? "📍 You're here: " : ""}${esc(s.name)} (~${d.toFixed(1)} km)</option>`).join("");
  if (preselect) $("addStore").value = preselect;
}
function openAdd(storeId) {
  if (needSignIn()) return;
  if (S.profile.banned) return toast("Your account is blocked from posting 🚫");
  fillStoreSelect(storeId);
  const p = product();
  $("addWhat").textContent = nameOf(p);
  $("addPack").innerHTML = PACK_CHOICES[p.unit === "bottle" ? "bottle" : "can"]
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
    let storeId = +$("addStore").value;
    // new shop?
    if (!$("newStore").classList.contains("hide") && $("nsName").value.trim()) {
      if (!S.pos.gps) throw new Error("Turn on location so we know where the new shop is");
      const { data, error } = await sb.from("stores").insert({
        name: $("nsName").value.trim(), suburb: $("nsSuburb").value.trim() || null,
        chain: "Independent", lat: S.pos.lat, lng: S.pos.lng, added_by: S.user.id,
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
  if (t.dataset.add) return openAdd(+t.dataset.add);
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
  s.radius_km = Math.max(1, +$("sRadius").value || 15);
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
  close("sheetSettings"); render(); toast("Saved ✓");
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
    toast("Home saved 🏠 Alerts will look around here.");
  }, () => toast("Allow location first, then try again"), { enableHighAccuracy: true, timeout: 10000 });
});
$("signInOut").addEventListener("click", async () => {
  close("sheetSettings");
  if (S.user) { await sb.auth.signOut(); await refreshUser(); render(); toast("Signed out"); }
  else open("sheetSignin");
});
$("fuel").addEventListener("change", () => { local.set("fuel", $("fuel").checked); render(); });
$("productPick").addEventListener("change", e => chooseProduct(+e.target.value));

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
  useHome();          // show something straight away…
  locate();           // …then switch to GPS when it's ready
  await loadPrices();
  sb.channel("board")
    .on("postgres_changes", { event: "*", schema: "public", table: "prices" }, reloadSoon)
    .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, reloadSoon)
    .subscribe();
  sb.auth.onAuthStateChange((evt) => { if (evt === "SIGNED_OUT") { S.user = null; S.profile = null; render(); } });
  setInterval(loadPrices, 5 * 60 * 1000);   // backup refresh every 5 minutes
})();
