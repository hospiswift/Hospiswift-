/* Hosirx shared core.
   Used by the app, the website and the partner dashboards.
   It stands in for the backend: listings, partner-set fees, stock, orders, visits (bookings,
   tickets, registrations) and profiles live in localStorage, so the customer side and the partner
   dashboards talk to each other on one browser. For production, replace the "DATA LAYER" functions
   with calls to your API and keep the same shapes. */
(function (w) {
  "use strict";
  var HS = w.HS = { config: { paystackKey: "" } };

  /* ===== DATA LAYER (swap for your API) ===== */
  var MEM = {}, LS = true;
  try { localStorage.setItem("hs__t", "1"); localStorage.removeItem("hs__t"); } catch (e) { LS = false; }
  function rd(k) { try { return LS ? localStorage.getItem(k) : (MEM[k] == null ? null : MEM[k]); } catch (e) { return null; } }
  function wr(k, s) { try { if (LS) localStorage.setItem(k, s); else MEM[k] = s; } catch (e) {} }
  function get(k, d) { var s = rd(k); if (s == null) return d; try { return JSON.parse(s); } catch (e) { return d; } }
  function put(k, v, quiet) { wr(k, JSON.stringify(v)); if (!quiet) wr("hs_ver", Date.now() + "." + Math.random()); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  HS.get = get; HS.put = put; HS.clone = clone;

  /* ===== small helpers ===== */
  HS.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  HS.naira = function (n) { return "₦" + Math.round(n).toLocaleString("en-NG"); };
  HS.since = function (ts) { var m = Math.max(0, Math.round((Date.now() - ts) / 60000)); return m < 1 ? "Just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + " h ago"; };
  HS.newId = function (p, list) { var id; do { id = p + Math.floor(1000 + Math.random() * 9000); } while (list.some(function (x) { return x.id === id; })); return id; };
  HS.TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

  /* ===== appointment types and fees ===== */
  HS.LABEL = { "Video": "Video consultation", "Voice": "Voice call", "Chat": "Chat", "In person": "In-person visit", "Emergency": "Emergency consultation", "Follow-up": "Follow-up visit", "Specialist": "Specialist consultation", "Antenatal": "Antenatal or maternity visit", "Registration": "New patient registration" };
  HS.TYPES = Object.keys(HS.LABEL);
  HS.label = function (k) { return HS.LABEL[k] || k; };
  HS.isLive = function (k) { return k === "Video" || k === "Voice" || k === "Chat"; };      /* live rooms: app only */
  HS.webOk = function (k) { return !HS.isLive(k) && k !== "Emergency"; };                    /* offered on the website */

  var BASE = [
    { id: "p1", kind: "pharm", name: "HealthPlus Pharmacy", state: "Lagos", area: "Ikeja", addr: "12 Allen Avenue", km: 1.2, eta: 25, rating: 4.8, open: "24 hrs", fees: { "Video": 2000, "Voice": 1500, "Chat": 1000 } },
    { id: "p2", kind: "pharm", name: "MedPoint Pharmacy", state: "Lagos", area: "Ikeja", addr: "8 Obafemi Awolowo Way", km: 2.4, eta: 35, rating: 4.6, open: "8am – 10pm", fees: { "Video": 1800, "Voice": 1200, "Chat": 800 } },
    { id: "p3", kind: "pharm", name: "Alpha Care Chemist", state: "Lagos", area: "Lekki", addr: "Admiralty Way, Lekki Phase 1", km: 3.1, eta: 40, rating: 4.5, open: "24 hrs", fees: { "Video": 2500, "Voice": 1800, "Chat": 1000 } },
    { id: "p4", kind: "pharm", name: "GreenCross Pharmacy", state: "Lagos", area: "Yaba", addr: "Herbert Macaulay Way", km: 4.0, eta: 50, rating: 4.3, open: "7am – 9pm", fees: { "Video": 1500, "Voice": 1000, "Chat": 700 } },
    { id: "p5", kind: "pharm", name: "Island Wellness Pharmacy", state: "Lagos", area: "Victoria Island", addr: "Adeola Odeku Street", km: 5.2, eta: 55, rating: 4.7, open: "8am – 11pm", fees: { "Video": 2800, "Voice": 2000, "Chat": 1200 } },
    { id: "p6", kind: "pharm", name: "Surulere Family Pharmacy", state: "Lagos", area: "Surulere", addr: "Bode Thomas Street", km: 6.0, eta: 60, rating: 4.4, open: "7am – 10pm", fees: { "Video": 1600, "Voice": 1100, "Chat": 700 } },
    { id: "p7", kind: "pharm", name: "Capital Care Pharmacy", state: "FCT Abuja", area: "Wuse", addr: "Aminu Kano Crescent", km: 1.5, eta: 30, rating: 4.6, open: "24 hrs", fees: { "Video": 2200, "Voice": 1600, "Chat": 1000 } },
    { id: "p8", kind: "pharm", name: "Maitama Health Chemist", state: "FCT Abuja", area: "Maitama", addr: "Ado Bayero Close", km: 2.8, eta: 35, rating: 4.8, open: "8am – 9pm", fees: { "Video": 2600, "Voice": 1900, "Chat": 1200 } },
    { id: "p9", kind: "pharm", name: "Gwarinpa Meds", state: "FCT Abuja", area: "Gwarinpa", addr: "3rd Avenue", km: 4.4, eta: 45, rating: 4.3, open: "8am – 8pm", closed: true, fees: { "Video": 1500, "Voice": 1000, "Chat": 600 } },
    { id: "p10", kind: "pharm", name: "Garden City Pharmacy", state: "Rivers", area: "Port Harcourt GRA", addr: "Aba Road", km: 1.9, eta: 30, rating: 4.5, open: "24 hrs", fees: { "Video": 2000, "Voice": 1400, "Chat": 900 } },
    { id: "p11", kind: "pharm", name: "Bodija Pharmacy", state: "Oyo", area: "Bodija", addr: "Bodija Market Road", km: 2.2, eta: 35, rating: 4.4, open: "8am – 9pm", fees: { "Video": 1500, "Voice": 1000, "Chat": 700 } },
    { id: "h1", kind: "hosp", state: "Lagos", area: "Ikeja", name: "Lagoon General Hospital", km: 1.8, type: "General", open24: true, rating: 4.6, phone: "+2348000000001", docs: ["Dr. Adeyemi – GP", "Dr. Okafor – Paediatrics"],
      fees: { "Video": 8000, "Voice": 6000, "Chat": 4000, "In person": 10000, "Emergency": 15000, "Follow-up": 5000, "Specialist": 12000, "Antenatal": 9000, "Registration": 3000 } },
    { id: "h2", kind: "hosp", state: "Lagos", area: "Victoria Island", name: "St. Mary Specialist Hospital", km: 3.2, type: "Specialist", open24: true, rating: 4.7, phone: "+2348000000002", docs: ["Dr. Bello – Cardiology", "Dr. Eze – Surgery"],
      fees: { "Video": 12000, "Voice": 9000, "Chat": 6000, "In person": 15000, "Emergency": 25000, "Follow-up": 8000, "Specialist": 20000, "Registration": 5000 } },
    { id: "h3", kind: "hosp", state: "Lagos", area: "Surulere", name: "Bright Future Maternity Centre", km: 4.5, type: "Maternity", open24: false, rating: 4.4, phone: "+2348000000003", docs: ["Dr. Ibrahim – Obstetrics", "Dr. Nwosu – Midwifery"],
      fees: { "Video": 7000, "Voice": 5000, "Chat": 3000, "In person": 9000, "Emergency": 15000, "Follow-up": 4500, "Antenatal": 8000, "Registration": 2500 } },
    { id: "h4", kind: "hosp", state: "Lagos", area: "Yaba", name: "CityCare Clinic", km: 2.1, type: "Clinic", open24: false, rating: 4.2, phone: "+2348000000004", docs: ["Dr. Balogun – GP", "Dr. Musa – Dental"],
      fees: { "Video": 5000, "Voice": 4000, "Chat": 2500, "In person": 6000, "Emergency": 10000, "Follow-up": 3000, "Registration": 2000 } }
  ];
  var DEF_STOCK = [
    { id: 1, n: "Paracetamol 500mg", c: "Pain & fever", k: "Pack of 20", p: 600, q: 99, rx: 0, on: 1 },
    { id: 2, n: "Ibuprofen 400mg", c: "Pain & fever", k: "Pack of 10", p: 900, q: 99, rx: 0, on: 1 },
    { id: 3, n: "Vitamin C 1000mg", c: "Vitamins", k: "Tube of 10", p: 1800, q: 99, rx: 0, on: 1 },
    { id: 4, n: "ORS Sachets", c: "Stomach", k: "Box of 5", p: 1200, q: 99, rx: 0, on: 1 },
    { id: 5, n: "Loratadine 10mg", c: "Allergy", k: "Pack of 10", p: 1500, q: 99, rx: 0, on: 1 },
    { id: 6, n: "Amoxicillin 500mg", c: "Antibiotics", k: "Pack of 21", p: 3500, q: 99, rx: 1, on: 1 },
    { id: 7, n: "Metformin 500mg", c: "Chronic care", k: "Pack of 30", p: 2800, q: 99, rx: 1, on: 1 },
    { id: 8, n: "Amlodipine 5mg", c: "Chronic care", k: "Pack of 30", p: 3200, q: 99, rx: 1, on: 1 },
    { id: 9, n: "Artemether/Lumefantrine", c: "Malaria", k: "Adult course", p: 2500, q: 99, rx: 0, on: 1 }
  ];

  /* ===== states and areas (communities) ===== */
  HS.STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
  HS.AREAS = {
    "Lagos": ["Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Yaba", "Surulere", "Ajah", "Maryland", "Gbagada", "Ikorodu", "Festac", "Apapa", "Magodo", "Oshodi", "Agege", "Alimosho", "Mushin", "Badagry", "Epe", "Ojo"],
    "FCT Abuja": ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Jabi", "Utako", "Kubwa", "Lugbe", "Karu"],
    "Rivers": ["Port Harcourt GRA", "Rumuola", "Rumuokoro", "Trans-Amadi", "Diobu", "Eleme"],
    "Oyo": ["Bodija", "Ring Road", "Challenge", "Dugbe", "Mokola", "Iwo Road"],
    "Ogun": ["Abeokuta", "Sagamu", "Ijebu-Ode", "Ota", "Ifo"],
    "Kano": ["Nassarawa", "Sabon Gari", "Fagge", "Bompai"],
    "Kaduna": ["Barnawa", "Ungwan Rimi", "Malali", "Kawo"],
    "Enugu": ["Independence Layout", "Ogui", "Trans-Ekulu", "New Haven"],
    "Edo": ["Benin GRA", "Ugbowo", "Sapele Road"],
    "Delta": ["Asaba", "Warri", "Effurun"],
    "Anambra": ["Awka", "Onitsha", "Nnewi"]
  };

  /* ===== listings ===== */
  function liveMap() { return get("hs_live", {}); }
  function allBase() { var l = liveMap(); return BASE.concat(Object.keys(l).map(function (k) { return l[k]; })); }
  function find(id) { return allBase().filter(function (x) { return x.id === id; })[0]; }
  HS.fees = function (id) { var o = get("hs_fees", {}); if (o[id]) return clone(o[id]); var l = find(id); return l ? clone(l.fees || {}) : {}; };
  HS.setFees = function (id, f) { var o = get("hs_fees", {}); o[id] = clone(f); put("hs_fees", o); };
  HS.listing = function (id) { var l = find(id); if (!l) return null; l = clone(l); l.fees = HS.fees(id); return l; };
  HS.listings = function (kind) { return allBase().filter(function (x) { return x.kind === kind; }).map(function (x) { return HS.listing(x.id); }); };
  HS.areas = function (state) {   /* known areas of a state plus any area a partner has registered in it */
    var seen = {}, out = [], add = function (a) { a = String(a || "").trim().replace(/\s+/g, " "); if (a && !seen[a.toLowerCase()]) { seen[a.toLowerCase()] = 1; out.push(a); } };
    (HS.AREAS[state] || []).forEach(add);
    HS.listings("pharm").concat(HS.listings("hosp")).forEach(function (l) { if (l.state === state) add(l.area); });
    return out;
  };
  HS.pros = function (l) { return (l.docs && l.docs.length) ? l.docs : (l.kind === "hosp" ? [] : ["Pharm. A. Obi", "Pharm. K. Yusuf"]); };
  HS.publish = function (l) { var m = liveMap(); m[l.id] = l; put("hs_live", m); };   /* real partners appear to customers */
  HS.setAvail = function (id, m) { var a = get("hs_avail", {}); a[id] = clone(m); put("hs_avail", a); };   /* doctor availability: {label:{on,off:[times]}} */
  HS.avail = function (id) { return get("hs_avail", {})[id] || null; };
  function demoStock(id) {   /* demo pharmacies p2 to p11 stock a slightly different range at slightly different prices */
    var n = parseInt(String(id).slice(1), 10), f = [1, 0.95, 1.05, 1.1, 0.9, 1.08, 1.02, 0.97, 1.04, 1.06][n % 10];
    return DEF_STOCK.filter(function (d) { return (d.id + n) % 5 !== 0; }).map(function (d) {
      var x = clone(d); x.p = Math.max(100, Math.round(d.p * f / 50) * 50); x.q = ((d.id * 7 + n * 13) % 90) + 5; return x;
    });
  }
  HS.stock = function (id) { var s = get("hs_stock", {}); return s[id] ? clone(s[id]) : /^p([2-9]|1[01])$/.test(id) ? demoStock(id) : clone(DEF_STOCK); };
  HS.setStock = function (id, arr) { var s = get("hs_stock", {}); s[id] = clone(arr); put("hs_stock", s); };

  /* ===== orders and visits ===== */
  HS.addOrder = function (o) { var a = get("hs_orders", []); o.id = o.id || HS.newId("HS", a); a.unshift(o); put("hs_orders", a.slice(0, 300)); return o; };
  HS.orders = function (fn) { return get("hs_orders", []).filter(fn || function () { return true; }); };
  HS.setOrder = function (id, patch) { var a = get("hs_orders", []), hit = null; a.forEach(function (o) { if (o.id === id) { for (var k in patch) o[k] = patch[k]; hit = o; } }); if (hit) { put("hs_orders", a); if (patch.st === "rejected" && hit.paid && hit.cust && HS.wallet) HS.wallet.refund(hit.cust, hit.total, "Refund · Order " + hit.id, "ord:" + hit.id); } return hit; };
  HS.addVisit = function (v) { var a = get("hs_visits", []); v.id = v.id || HS.newId(v.kind === "ticket" ? "TK" : v.kind === "reg" ? "RG" : "BK", a); a.unshift(v); put("hs_visits", a.slice(0, 300)); return v; };
  HS.visits = function (fn) { return get("hs_visits", []).filter(fn || function () { return true; }); };
  HS.setVisit = function (id, patch) { var a = get("hs_visits", []), hit = null; a.forEach(function (o) { if (o.id === id) { for (var k in patch) o[k] = patch[k]; hit = o; } }); if (hit) put("hs_visits", a); return hit; };

  /* ===== wallet ledger =====
     One ledger for every wallet on this device: customers (owner = their phone or email) and partners
     (owner = "partner:<id>"). Balances are always the sum of the ledger, never a stored number, so history and
     balance can't drift apart. Money in (funding, refunds, earnings) is positive, money out (payments, payouts)
     is negative. Every write that can be retried carries a ref, so the same order is never credited or refunded twice.
     DEMO ONLY: the ledger lives in localStorage and no real money moves. In production the ledger, the balances
     and the payouts must live on your server with a licensed wallet or virtual-account provider (see README). */
  var WC = HS.config.wallet = { minFund: 500, maxFund: 200000, maxBalance: 500000, minPayout: 1000, payoutSeconds: 6 };
  var W = HS.wallet = {};
  function wAll() { return get("hs_wtx", []); }
  function wSave(a) { put("hs_wtx", a.slice(0, 3000)); }
  function wId() { return "TX" + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(10 + Math.random() * 90); }
  function wSum(a, owner) { var n = 0; a.forEach(function (x) { if (x.owner === owner && x.st !== "failed") n += x.amt; }); return n; }
  function wSettle(a) {   /* demo: a payout turns from "processing" to "paid" after a few seconds */
    var now = Date.now(), ch = false, ttl = (WC.payoutSeconds || 6) * 1000;
    a.forEach(function (x) { if (x.type === "payout" && x.st === "processing" && now - x.t > ttl) { x.st = "paid"; ch = true; } });
    if (ch) wSave(a); return a;
  }
  W.add = function (owner, o) {
    var a = wAll();
    if (o.ref && a.some(function (x) { return x.owner === owner && x.type === o.type && x.ref === o.ref; })) return null;   /* already recorded */
    var tx = { id: wId(), owner: owner, type: o.type, amt: Math.round(o.amt), title: o.title || "", ref: o.ref || "", method: o.method || "", st: o.st || "ok", t: o.t || Date.now(), meta: o.meta || null };
    a.unshift(tx); wSave(a); return tx;
  };
  W.clear = function (owner) { wSave(wAll().filter(function (x) { return x.owner !== owner; })); };   /* demo reset */
  W.balance = function (owner) { return wSum(wSettle(wAll()), owner); };
  W.txs = function (owner, types) {
    return wSettle(wAll()).filter(function (x) { return x.owner === owner && (!types || types.indexOf(x.type) > -1); }).sort(function (a, b) { return b.t - a.t; });
  };
  W.checkFund = function (owner, amount) {
    amount = Math.round(amount);
    if (!(amount >= WC.minFund)) return "The minimum is " + HS.naira(WC.minFund) + ".";
    if (amount > WC.maxFund) return "The most you can add at once is " + HS.naira(WC.maxFund) + ".";
    if (W.balance(owner) + amount > WC.maxBalance) return "Your wallet can hold up to " + HS.naira(WC.maxBalance) + ".";
    return "";
  };
  W.fund = function (owner, amount, pay) { return W.add(owner, { type: "fund", amt: amount, title: "Wallet funding", method: pay.method, ref: pay.ref }); };
  W.spend = function (owner, amount, title, ref) { if (W.balance(owner) < amount) return null; return W.add(owner, { type: "pay", amt: -amount, title: title, method: "wallet", ref: ref }); };
  W.refund = function (owner, amount, title, ref) { return W.add(owner, { type: "refund", amt: amount, title: title, ref: ref }); };
  W.earn = function (owner, o) { return W.add(owner, { type: "earn", amt: o.amount, title: o.title, ref: o.ref, t: o.t }); };
  W.payout = function (owner, amount, dest) {
    amount = Math.round(amount);
    if (!(amount >= WC.minPayout)) return { error: "The minimum payout is " + HS.naira(WC.minPayout) + "." };
    if (amount > W.balance(owner)) return { error: "That is more than your available balance." };
    var last4 = String(dest.acct || "").slice(-4);
    return { tx: W.add(owner, { type: "payout", amt: -amount, st: "processing", method: "bank", title: "Payout to " + dest.bank + " ····" + last4, ref: "PO" + Date.now().toString(36).toUpperCase().slice(-6), meta: { bank: dest.bank, last4: last4, name: dest.name || "" } }) };
  };
  W.stats = function (owner) {
    var a = wSettle(wAll()).filter(function (x) { return x.owner === owner && x.st !== "failed"; }), r = { available: 0, lifetime: 0, paidOut: 0, processing: 0 };
    a.forEach(function (x) { r.available += x.amt; if (x.type === "earn") r.lifetime += x.amt; if (x.type === "payout") { r.paidOut += -x.amt; if (x.st === "processing") r.processing += -x.amt; } });
    return r;
  };
  HS.when = function (ts) {
    var d = new Date(ts), n = new Date(), t = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }), day = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    return ts >= day ? "Today, " + t : ts >= day - 864e5 ? "Yesterday, " + t : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }) + ", " + t;
  };
  HS.dayLabel = function (ts) {
    var n = new Date(), day = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    return ts >= day ? "Today" : ts >= day - 864e5 ? "Yesterday" : new Date(ts).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
  };

  /* ===== customer profile: name, address, favourite pharmacy and hospital, hospital numbers ===== */
  HS.profile = function (phone) { return get("hs_prof", {})[phone] || null; };
  HS.saveProfile = function (phone, p) { var m = get("hs_prof", {}); m[phone] = p; put("hs_prof", m); };
  HS.hospitalNo = function (l) { var ini = l.name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(function (x) { return x[0]; }).join("").toUpperCase().slice(0, 3); return ini + "-" + String(Math.floor(100000 + Math.random() * 900000)); };

  /* ===== partner presence (a live dashboard beats every 5 s) ===== */
  HS.beat = function (id) { var h = get("hs_hb", {}); h[id] = Date.now(); put("hs_hb", h, true); };
  HS.alive = function (id) { return Date.now() - (get("hs_hb", {})[id] || 0) < 15000; };

  /* ===== change notifications across tabs and frames ===== */
  HS.onChange = function (cb) {
    w.addEventListener("storage", function (e) { if (e.key === "hs_ver") cb(); });
    var last = rd("hs_ver");
    setInterval(function () { var v = rd("hs_ver"); if (v !== last) { last = v; cb(); } }, 3000);
  };

  /* ===== payment gateway =====
     HS.pay({amount, title, email}) -> Promise of {ref, method, amount, at} or null if closed before paying.
     Demo checkout by default (card, bank transfer, USSD). To go live with Paystack set
     HS.config.paystackKey = "pk_live_..." and verify every transaction on your server before you
     confirm an order or booking. */
  function luhn(s) { var n = 0, alt = false; for (var i = s.length - 1; i >= 0; i--) { var d = +s[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } n += d; alt = !alt; } return n % 10 === 0; }
  var PCSS = ".hsp-bg{position:fixed;inset:0;background:rgba(10,25,20,.6);z-index:300;display:flex;align-items:flex-end;justify-content:center}" +
    "@media(min-width:600px){.hsp-bg{align-items:center}}" +
    ".hsp{background:#fff;color:#1B1D21;width:100%;max-width:440px;max-height:94vh;overflow:auto;border-radius:22px 22px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));font-family:inherit}" +
    "@media(min-width:600px){.hsp{border-radius:22px}}" +
    ".hsp-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.hsp-x{width:34px;height:34px;border-radius:50%;background:#ECEDEF;font-size:15px;border:0;cursor:pointer}" +
    ".hsp-amt{font-size:30px;font-weight:800;letter-spacing:-.5px}.hsp-amt span{display:block;font-size:13px;font-weight:600;color:#5E626A;letter-spacing:0;margin-top:2px}" +
    ".hsp-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}.hsp-tabs button{padding:10px 4px;border-radius:10px;border:1.5px solid #DADCE0;background:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}" +
    ".hsp-tabs button.on{background:var(--accent,var(--a,#128A28));border-color:var(--accent,var(--a,#128A28));color:#fff}" +
    ".hsp-f{margin-bottom:12px;flex:1}.hsp-f label{display:block;font-weight:700;font-size:13px;margin-bottom:5px}" +
    ".hsp-f input,.hsp-f select{width:100%;padding:13px;border:1.5px solid #DADCE0;border-radius:12px;font:inherit;background:#fff;color:#1B1D21}" +
    ".hsp-r{display:flex;gap:10px}.hsp-err{color:#D93025;font-weight:600;font-size:13px;margin:-4px 0 10px}" +
    ".hsp-go{width:100%;padding:14px;border-radius:12px;border:0;background:var(--accent,var(--a,#128A28));color:#fff;font:inherit;font-weight:800;cursor:pointer}.hsp-go:disabled{opacity:.5}" +
    ".hsp-box{background:#F3F4F6;border-radius:14px;padding:14px;margin-bottom:12px;font-size:14px;line-height:1.5}.hsp-box b{font-size:20px;letter-spacing:1px;display:block;margin:2px 0}" +
    ".hsp-note{font-size:12px;color:#5E626A;text-align:center;margin-top:12px}.hsp-hint{font-size:12px;color:#5E626A;margin:-2px 0 12px}" +
    ".hsp-ok{text-align:center;padding:10px 0}.hsp-ok i{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 10px;border-radius:50%;background:#E3F7E8;color:#128A28;font-size:32px;font-style:normal}";
  function pcss() { if (document.getElementById("hsp-css")) return; var s = document.createElement("style"); s.id = "hsp-css"; s.textContent = PCSS; document.head.appendChild(s); }
  var BANKS = { "GTBank": "737", "Access Bank": "901", "UBA": "919", "Zenith Bank": "966", "First Bank": "894" };

  HS.pay = function (o) {
    return new Promise(function (resolve) {
      var ref = "HSP" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(10 + Math.random() * 90);
      if (HS.config.paystackKey) { /* live gateway (not exercised in the demo) */
        var go = function () { w.PaystackPop.setup({ key: HS.config.paystackKey, email: o.email || "customer@hosirx.app", amount: Math.round(o.amount * 100), currency: "NGN", ref: ref,
          callback: function (r) { resolve({ ref: r.reference, method: "paystack", amount: o.amount, at: Date.now() }); }, onClose: function () { resolve(null); } }).openIframe(); };
        if (w.PaystackPop) return go();
        var sc = document.createElement("script"); sc.src = "https://js.paystack.co/v1/inline.js"; sc.onload = go; sc.onerror = function () { resolve(null); }; document.head.appendChild(sc); return;
      }
      pcss();
      var st = { m: (o.wallet && HS.wallet.balance(o.wallet) >= o.amount) ? "wallet" : "card", busy: false, done: null, bank: "GTBank", acct: String(Math.floor(1e9 + Math.random() * 9e9)) };
      var bg = document.createElement("div"); bg.className = "hsp-bg";
      bg.innerHTML = '<div class="hsp" role="dialog" aria-modal="true" aria-label="Payment"><div class="hsp-top"><b>Hosirx Pay</b><button class="hsp-x" data-x aria-label="Close payment">✕</button></div>' +
        '<div class="hsp-amt">' + HS.naira(o.amount) + '<span>' + HS.esc(o.title || "Payment") + '</span></div><div id="hspTabs"></div><div id="hspBody"></div><p class="hsp-note">Demo checkout. No money moves. Never enter a real card here.</p></div>';
      document.body.appendChild(bg);
      var prevFocus = document.activeElement;
      function $(s) { return bg.querySelector(s); }
      function close() { document.removeEventListener("keydown", key); bg.remove(); if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) {} resolve(st.done); }
      function key(e) { if (e.key === "Escape" && !st.busy) close(); }
      document.addEventListener("keydown", key);
      function err(m) { var e = $("#hspErr"); if (e) { e.textContent = m; e.hidden = false; } }
      function succeed(method) { st.busy = false; st.done = { ref: ref, method: method, amount: o.amount, at: Date.now() }; draw(); }
      function busy(btn, msg, ms, then) { st.busy = true; btn.disabled = true; btn.textContent = msg; setTimeout(then, ms); }
      function draw() {
        $("#hspTabs").innerHTML = st.done ? "" : '<div class="hsp-tabs" role="tablist" style="grid-template-columns:repeat(' + (o.wallet ? 4 : 3) + ',1fr)">' + (o.wallet ? [["wallet", "Wallet"], ["card", "Card"], ["bank", "Transfer"], ["ussd", "USSD"]] : [["card", "Card"], ["bank", "Bank transfer"], ["ussd", "USSD"]]).map(function (t) { return '<button role="tab" aria-selected="' + (st.m === t[0]) + '" class="' + (st.m === t[0] ? "on" : "") + '" data-m="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</div>';
        var h = "";
        if (st.done) h = '<div class="hsp-ok" role="status"><i>✓</i><b style="font-size:20px">Payment successful</b><div class="hsp-hint" style="margin-top:6px">Reference ' + st.done.ref + ' · ' + ({ wallet: "Wallet", card: "Card", bank: "Bank transfer", ussd: "USSD" }[st.done.method] || st.done.method) + '</div></div><button class="hsp-go" data-cont>Continue</button>';
        else if (st.m === "wallet") {
          var wb = HS.wallet.balance(o.wallet), wok = wb >= o.amount;
          h = '<div class="hsp-box">Wallet balance<b>' + HS.naira(wb) + '</b>' + (wok ? 'After this payment: ' + HS.naira(wb - o.amount) : 'You need ' + HS.naira(o.amount - wb) + ' more. Add money from the Wallet tab, or choose another way to pay.') + '</div><div class="hsp-err" id="hspErr" role="alert" hidden></div><button class="hsp-go" data-wal' + (wok ? '' : ' disabled') + '>Pay ' + HS.naira(o.amount) + ' from wallet</button>';
        } else if (st.m === "card") h = '<div class="hsp-f"><label for="hc-n">Card number</label><input id="hc-n" inputmode="numeric" autocomplete="off" maxlength="23" placeholder="0000 0000 0000 0000"></div>' +
          '<div class="hsp-r"><div class="hsp-f"><label for="hc-e">Expiry</label><input id="hc-e" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="MM/YY"></div><div class="hsp-f"><label for="hc-c">CVV</label><input id="hc-c" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="123"></div></div>' +
          '<div class="hsp-hint">Test card: 4084 0840 8408 4081 · any future date · CVV 408</div><div class="hsp-err" id="hspErr" role="alert" hidden></div><button class="hsp-go" data-card>Pay ' + HS.naira(o.amount) + '</button>';
        else if (st.m === "bank") h = '<div class="hsp-box">Transfer exactly ' + HS.naira(o.amount) + ' to<b>' + st.acct + '</b>Wema Bank · Hosirx Pay (demo account)<br>This account expires in 30 minutes.</div><button class="hsp-go" data-bank>I have sent the money</button>';
        else h = '<div class="hsp-f"><label for="hu-b">Your bank</label><select id="hu-b">' + Object.keys(BANKS).map(function (b) { return '<option' + (b === st.bank ? " selected" : "") + '>' + b + '</option>'; }).join("") + '</select></div>' +
          '<div class="hsp-box">Dial this code on your phone<b id="hspUssd">*' + BANKS[st.bank] + '*000*' + Math.round(o.amount) + '#</b>Then confirm with your PIN.</div><button class="hsp-go" data-ussd>I have paid</button>';
        $("#hspBody").innerHTML = h;
      }
      bg.addEventListener("click", function (e) {
        if (e.target === bg && !st.busy) return close();
        var b = e.target.closest("button"); if (!b || b.disabled) return;
        if (b.hasAttribute("data-x") && !st.busy) return close();
        if (b.hasAttribute("data-cont")) return close();
        if (b.dataset.m && !st.busy) { st.m = b.dataset.m; return draw(); }
        if (b.hasAttribute("data-wal")) return busy(b, "Paying from wallet…", 900, function () {
          if (!HS.wallet.spend(o.wallet, o.amount, o.title || "Payment", ref)) { st.busy = false; draw(); return err("Your wallet balance is too low."); }
          succeed("wallet");
        });
        if (b.hasAttribute("data-bank")) return busy(b, "Confirming transfer…", 1800, function () { succeed("bank"); });
        if (b.hasAttribute("data-ussd")) return busy(b, "Confirming payment…", 1500, function () { succeed("ussd"); });
        if (b.hasAttribute("data-card")) {
          var n = $("#hc-n").value.replace(/\s/g, ""), ex = $("#hc-e").value, cv = $("#hc-c").value, now = new Date(), m = /^(0[1-9]|1[0-2])\/(\d\d)$/.exec(ex);
          if (!/^\d{13,19}$/.test(n) || !luhn(n)) return err("Check the card number.");
          if (!m || (2000 + +m[2]) * 12 + +m[1] < now.getFullYear() * 12 + now.getMonth() + 1) return err("Enter a valid expiry date (MM/YY), not in the past.");
          if (!/^\d{3,4}$/.test(cv)) return err("Enter the 3 or 4 digit CVV.");
          if (/0002$/.test(n)) return err("Card declined by your bank (demo). Try another card.");
          busy(b, "Processing payment…", 1600, function () { succeed("card"); });
        }
      });
      bg.addEventListener("input", function (e) {
        var t = e.target;
        if (t.id === "hc-n") t.value = t.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
        else if (t.id === "hc-e") { var d = t.value.replace(/\D/g, "").slice(0, 4); t.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; }
        else if (t.id === "hc-c") t.value = t.value.replace(/\D/g, "").slice(0, 4);
        var er = $("#hspErr"); if (er) er.hidden = true;
      });
      bg.addEventListener("change", function (e) { if (e.target.id === "hu-b") { st.bank = e.target.value; $("#hspUssd").textContent = "*" + BANKS[st.bank] + "*000*" + Math.round(o.amount) + "#"; } });
      draw();
      var f = $("#hc-n"); if (f) f.focus();
    });
  };
})(window);
