// Shared Guest module: persistent Guest profiles (one per person, across stays), reservation occupants,
// STR incidents and guest communications. Reservation-owned data (pricing, charges, payments) is READ from
// mghpm.reservations.v2 — never copied here. Documents live in the Document Center store mghpm.str.docs.v2.
// Maintenance problems are queued into the shared Maintenance Requests store (Master 14).
(function () {
  if (window.MGH_GUEST) return;
  var GKEY = 'mghpm.guests.v1', IKEY = 'mghpm.incidents.v1', MKEY = 'mghpm.messages.v1', RKEY = 'mghpm.reservations.v2', DKEY = 'mghpm.str.docs.v2', QKEY = 'mghpm.requests.inbox.v1';
  var get = function (k, d) { try { var v = JSON.parse(sessionStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var put = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var T0 = 1790000000000;
  var P = function (id, first, last, email, phone, country, x) {
    return Object.assign({ id: id, first: first, middle: '', last: last, preferred: '', dob: '', nationality: country, residence: country, email: email, phone: phone, whatsapp: phone, lang: 'English', address: '', emergency: '', comm: ['Email', 'WhatsApp'], aliases: [], notes: '',
      ver: { status: 'verified', docType: 'Passport', country: country, provider: 'Persona', verifiedAt: '2026-09-20', expires: '2031-05-14', review: 'Approved by Marcus Vance' }, created: T0, log: [] }, x || {});
  };
  var SEED = [
    P('G-1001', 'Laura', 'Méndez', 'laura.mendez@gmail.com', '+1 (305) 555-0142', 'United States', { lang: 'Spanish', address: '2450 SW 27th Ave, Miami, FL 33145', emergency: 'Jorge Méndez • +1 (305) 555-0149', notes: 'Also an MGHPM long-term tenant (Tenant 360).', ver: { status: 'verified', docType: "Driver's License", country: 'United States', provider: 'Persona', verifiedAt: '2026-02-01', expires: '2029-08-30', review: 'Approved by Marcus Vance' } }),
    P('G-1002', 'Tom', 'Becker', 'tom.becker@web.de', '+49 151 2345 6789', 'Germany', { lang: 'German', address: 'Lindenstraße 14, 10969 Berlin', ver: { status: 'verified', docType: 'Passport', country: 'Germany', provider: 'Persona', verifiedAt: '2026-06-02', expires: '2030-03-11', review: 'Approved by Marcus Vance' } }),
    P('G-1003', 'Mia', 'Johnson', 'mia.johnson@outlook.com', '+1 (646) 555-0118', 'United States'),
    P('G-1004', 'Oliver', 'Grant', 'oliver.grant@gmail.com', '+44 7700 900123', 'United Kingdom'),
    P('G-1005', 'Ana', 'Torres', 'ana.torres@gmail.com', '+1 (786) 555-0190', 'United States', { middle: 'Lucía', preferred: 'Ana', dob: '1988-03-12', nationality: 'Dominican Republic', residence: 'United States', whatsapp: '+1 (786) 555-0190', lang: 'Spanish', address: '1550 Brickell Ave, Apt 908, Miami, FL 33129', emergency: 'Carlos Torres (spouse) • +1 (786) 555-0191', comm: ['Email', 'WhatsApp', 'SMS'], notes: 'Prefers WhatsApp for arrival coordination. Celebrating anniversary on the October stay.',
      ver: { status: 'verified', docType: 'Passport', country: 'Dominican Republic', provider: 'Persona', verifiedAt: '2026-04-02', expires: '2032-11-07', review: 'Approved by Marcus Vance' }, created: 1775000000000 }),
    P('G-1006', 'James', 'Whitaker', 'j.whitaker@icloud.com', '+1 (212) 555-0177', 'United States'),
    P('G-1007', 'Camila', 'Rossi', 'camila.rossi@gmail.com', '+39 347 555 0102', 'Italy', { lang: 'Italian', ver: { status: 'pending', docType: 'Passport', country: 'Italy', provider: 'Persona', verifiedAt: '', expires: '', review: 'Submitted • awaiting staff review' } }),
    P('G-1008', 'Kenji', 'Watanabe', 'kenji.w@gmail.com', '+81 90 5555 0134', 'Japan', { lang: 'Japanese' }),
    P('G-1009', 'Isla', 'Fernández', 'isla.fernandez@gmail.com', '+34 612 555 018', 'Spain', { lang: 'Spanish', ver: { status: 'needs_review', docType: 'National ID', country: 'Spain', provider: 'Persona', verifiedAt: '', expires: '2027-01-19', review: 'Name mismatch between ID and booking — staff review required' } }),
    P('G-1010', 'Priya', 'Shah', 'priya.shah@gmail.com', '+1 (408) 555-0163', 'United States', { ver: { status: 'not_started', docType: '', country: '', provider: 'Persona', verifiedAt: '', expires: '', review: 'Verification link sent Oct 3' } }),
    P('G-1011', 'Daniel', 'Okoro', 'daniel.okoro@gmail.com', '+1 (954) 555-0109', 'United States'),
    P('G-1012', 'Sophie', 'Laurent', 'sophie.laurent@orange.fr', '+33 6 55 50 01 21', 'France', { lang: 'French' }),
    P('G-1013', 'Ethan', 'Park', 'ethan.park@gmail.com', '+1 (415) 555-0186', 'United States'),
    P('G-1014', 'Hannah', 'Schultz', 'h.schultz@gmx.de', '+49 160 555 0147', 'Germany', { lang: 'German' }),
    P('G-1015', 'Marek', 'Novak', 'marek.novak@seznam.cz', '+420 602 555 014', 'Czech Republic', { aliases: ['The Novak Family'], lang: 'English' }),
    P('G-1016', 'Lucas', 'Meyer', 'lucas.meyer@gmail.com', '+41 79 555 01 33', 'Switzerland', { ver: { status: 'failed', docType: 'Passport', country: 'Switzerland', provider: 'Persona', verifiedAt: '', expires: '', review: 'Document image unreadable • resubmission requested' } })
  ];
  var OCC_SEED = {
    '20261002-DR-0001': { adults: 2, children: 1, infants: 0, pets: 0, vehicles: [{ plate: 'FL • QTR 4821', desc: 'White Toyota RAV4' }], list: [['Carlos Torres', 'Adult', 'Adult', 'Complete'], ['Sofía Torres', 'Child', 'Minor', 'N/A']] },
    '20260913-DR-0001': { adults: 2, children: 0, infants: 0, pets: 0, vehicles: [], list: [['Carlos Torres', 'Adult', 'Adult', 'Complete']] },
    '20260417-DR-0032': { adults: 2, children: 1, infants: 0, pets: 0, vehicles: [{ plate: 'FL • QTR 4821', desc: 'White Toyota RAV4' }], list: [['Carlos Torres', 'Adult', 'Adult', 'Complete'], ['Sofía Torres', 'Child', 'Minor', 'N/A']] },
    '20260906-DR-0001': { adults: 4, children: 2, infants: 0, pets: 0, vehicles: [{ plate: 'Rental • Hertz', desc: 'Silver Chrysler Pacifica' }], list: [['Eva Novak', 'Adult', 'Adult', 'Complete'], ['Jan Novak', 'Adult', 'Adult', 'Complete'], ['Lenka Novak', 'Adult', 'Adult', 'Complete'], ['Tomáš Novak', 'Child', 'Minor', 'N/A'], ['Klára Novak', 'Child', 'Minor', 'N/A']] }
  };
  var INC_SEED = [
    { id: 'INC-2026-0014', type: 'Excessive Vehicles', guestId: 'G-1015', resId: '20260906-DR-0001', pid: 6, at: '2026-09-29T21:40', desc: 'Three vehicles parked at Sunset Beach House; listing allows two. HOA security issued a courtesy notice.', evidence: 'HOA courtesy notice (photo)', action: 'Guest moved third vehicle to public lot within 30 minutes. Reminder of parking rule sent.', status: 'Resolved', severity: 'Low', by: 'Marcus Vance' },
    { id: 'INC-2026-0011', type: 'Noise Complaint', guestId: 'G-1002', resId: '20260608-DR-0011', pid: 7, at: '2026-06-13T23:15', desc: 'Neighbor reported music from the balcony after quiet hours (10:00 PM).', evidence: 'Building security log', action: 'Call to guest at 11:20 PM; music stopped. Written warning issued.', status: 'Closed', severity: 'Medium', by: 'Luis Herrera' }
  ];
  var MSG_SEED = [
    { id: 'TH-5001', guestId: 'G-1005', resId: '20261002-DR-0001', topic: 'Services', subject: 'Private chef for anniversary dinner', msgs: [['guest', 'Ana Torres', 'Hi! Could we book the private chef for Oct 12? It is our anniversary.', 1791200000000], ['staff', 'Marcus Vance', 'Congratulations! Chef Marisol is confirmed for Oct 12 at 7:00 PM. Seafood menu as discussed.', 1791203600000]] },
    { id: 'TH-5002', guestId: 'G-1005', resId: '20261002-DR-0001', topic: 'Arrival', subject: 'Arrival time & parking', msgs: [['staff', 'Marcus Vance', 'Please submit your arrival time in My Stay so we can schedule your welcome.', 1791210000000]] },
    { id: 'TH-5003', guestId: 'G-1005', resId: '20260913-DR-0001', topic: 'Check-Out', subject: 'Late check-out request', msgs: [['guest', 'Ana Torres', 'Is a 1:00 PM check-out possible tomorrow?', 1791130000000], ['staff', 'Marcus Vance', 'Approved until 1:00 PM at no charge.', 1791133000000]] },
    { id: 'TH-4102', guestId: 'G-1005', resId: '20260417-DR-0032', topic: 'Stay', subject: 'Pool heater', msgs: [['guest', 'Ana Torres', 'The pool heater seems off.', 1776700000000], ['staff', 'Luis Herrera', 'Reset completed — should be warm within 2 hours.', 1776703000000]] }
  ];
  var DOC_SEED = [
    { pid: 13, resId: '20261002-DR-0001', guestId: 'G-1005', cat: 'Reservation Agreement', vis: 'Shared', name: 'Reservation Agreement — 20261002-DR-0001.pdf', meta: 'Signed Oct 5, 2026 • 4 pages' },
    { pid: 13, resId: '20261002-DR-0001', guestId: 'G-1005', cat: 'House Rules Acknowledgment', vis: 'Shared', name: 'House Rules Acknowledgment — Aventura Park Tower.pdf', meta: 'HR-2026.10 v3 • Accepted Oct 5, 2026' },
    { pid: 13, resId: '20261002-DR-0001', guestId: 'G-1005', cat: 'HOA Acknowledgment', vis: 'Shared', name: 'HOA Rules Acknowledgment — Aventura Park Tower.pdf', meta: 'Accepted Oct 5, 2026' },
    { pid: 13, resId: '20261002-DR-0001', guestId: 'G-1005', cat: 'Receipt', vis: 'Shared', name: 'Receipt RC-20261005-0001.pdf', meta: 'Deposit • US$500.00 • Oct 5, 2026' },
    { pid: 0, resId: '', guestId: 'G-1005', cat: 'Identification', vis: 'Internal', name: 'Passport — Ana L. Torres.pdf', meta: 'Verified Apr 2, 2026 • Persona • Expires Nov 7, 2032' },
    { pid: 6, resId: '20260417-DR-0032', guestId: 'G-1005', cat: 'Receipt', vis: 'Shared', name: 'Final Stay Statement — 20260417-DR-0032.pdf', meta: 'FS-20260417-DR-0032 • Apr 24, 2026' }
  ];
  function guests() { var l = get(GKEY, null); if (!l) { l = SEED; put(GKEY, l); } return l; }
  function nameOf(g) { return g.first + ' ' + g.last; }
  function S() { return window.MGH_STR_DATA; }
  var ADDED = ['20261002-DR-0001', '20260417-DR-0032', '20260212-DR-0007', '20260608-DR-0011', '20260722-DR-0019'];
  function reservations() {
    var s = S(); var r = get(RKEY, null);
    if (r && r.res && s && !get('mghpm.guests.seedres.v2', false)) {
      var add = s.SEED.filter(function (x) { return ADDED.indexOf(x.id) >= 0 && !r.res.some(function (y) { return y.id === x.id; }); });
      if (add.length) { r.res = r.res.concat(add); put(RKEY, r); }
      put('mghpm.guests.seedres.v2', true);
    }
    return (r && r.res) || (s ? s.SEED : []);
  }
  function owns(g, r) { if (!r || r.status === 'draft') return false; if (r.guestId) return r.guestId === g.id; if (r.guestInfo && r.guestInfo.id) return r.guestInfo.id === g.id; return r.guest === nameOf(g) || (g.aliases || []).indexOf(r.guest) >= 0; }
  function stays(g) { return reservations().filter(function (r) { return owns(g, r); }).sort(function (a, b) { return a.ci < b.ci ? 1 : -1; }); }
  function stayOf(r) { var s = S(); return s ? s.STAYS.find(function (x) { return x.key === r.unit; }) : null; }
  // Read-only summary of the Reservation account (Reservation 360 remains the owner of the folio).
  function account(r) {
    var s = S(), st = stayOf(r), n = s ? s.nightsOf(r.ci, r.co) : 0, done = ['confirmed', 'checked_in', 'checked_out'].indexOf(r.status) >= 0, ext = r.channel !== 'Direct';
    var total = r.pricing && r.pricing.total != null ? r.pricing.total : (st ? (function () { var nightly = st.rate * n; return Math.round((nightly + 185) * 1.13 * 100) / 100; })() : 0);
    var charges = r.charges || ((s && s.SEED_CHARGES) || {})[r.id] || [];
    var cat = function (k) { return s && s.CATALOG.find(function (c) { return c.key === k; }); };
    var bill = charges.filter(function (c) { return s && s.BILLABLE.indexOf(c.status) >= 0 && (c.currency || 'USD') === 'USD'; });
    var svc = bill.reduce(function (a, c) { return a + s.chargeCalc(c, cat(c.svc)).total; }, 0);
    var paid = (ext ? total : r.payment ? (r.payment.paid || 0) : done ? total : 0) + (r.folioPays || []).filter(function (p) { return (p.cur || 'USD') === 'USD'; }).reduce(function (a, p) { return a + (+p.amt || 0); }, 0);
    var credits = (r.credits || []).reduce(function (a, c) { return a + (+c.amt || 0); }, 0);
    var refunded = (r.refunds || []).reduce(function (a, c) { return a + (+c.amt || 0); }, 0) + (r.status === 'cancelled' && paid > 0 ? paid : 0);
    var bal = Math.round((total + svc - credits - paid) * 100) / 100;
    if (r.status === 'cancelled') bal = 0;
    return { total: Math.round((total + svc) * 100) / 100, accom: total, svc: svc, paid: Math.round(paid * 100) / 100, balance: Math.max(0, bal), refunded: refunded, charges: charges, nights: n, st: st, ext: ext };
  }
  function occupants(r) { var o = r.occupants || OCC_SEED[r.id]; if (o) return o; return { adults: r.guests || 1, children: 0, infants: 0, pets: 0, vehicles: [], list: [] }; }
  function patchRes(id, fn) { var s = S(); var cur = get(RKEY, null); var list = (cur && cur.res) || (s ? s.SEED.slice() : []); list = list.map(function (r) { if (r.id !== id) return r; var p = fn(r) || {}; if (window.MGH_AUDIT && p.activity) { var fresh = p.activity.slice((r.activity || []).length); fresh.forEach(function (a) { var guest = /by guest|in My Stay/i.test(a.text); window.MGH_AUDIT.record({ actor: guest ? (r.guest || 'Guest') : 'Marcus Vance', actorType: guest ? 'GUEST_PORTAL' : 'USER', role: guest ? 'Guest' : 'Staff', action: /payment|received/i.test(a.text) ? 'CREATE' : /accepted/i.test(a.text) ? 'CONFIRM' : /requested/i.test(a.text) ? 'REQUEST' : 'UPDATE', module: 'Reservations', recordType: 'Reservation', record: id, category: /payment/i.test(a.text) ? 'Financial' : 'Reservation', detail: a.text }); }); p = Object.assign({}, p); delete p.activity; } else if (window.MGH_AUDIT) { window.MGH_AUDIT.record({ actor: 'Marcus Vance', role: 'Staff', action: 'UPDATE', module: 'Reservations', recordType: 'Reservation', record: id, category: 'Reservation', detail: 'Updated: ' + Object.keys(p).join(', ') }); } return Object.assign({}, r, p); }); put(RKEY, { res: list }); }
  function save(g, logText) { var l = guests().map(function (x) { return x.id === g.id ? g : x; }); if (!l.some(function (x) { return x.id === g.id; })) l.push(g); if (logText) { g.log = (g.log || []).concat([{ at: Date.now(), text: logText }]); if (window.MGH_AUDIT) window.MGH_AUDIT.record({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: /created/i.test(logText) ? 'CREATE' : /identity/i.test(logText) ? 'VERIFY' : 'UPDATE', module: 'Guests', recordType: 'Guest', record: g.id, category: /identity/i.test(logText) ? 'Compliance' : 'Guest', detail: logText }); } put(GKEY, l); return g; }
  function match(q) { q = q || {}; var em = (q.email || '').trim().toLowerCase(), ph = (q.phone || '').replace(/\D/g, ''), nm = (q.name || '').trim().toLowerCase();
    return guests().filter(function (g) { return (em && g.email.toLowerCase() === em) || (ph.length >= 7 && g.phone.replace(/\D/g, '') === ph) || (nm.length > 3 && nameOf(g).toLowerCase() === nm); }); }
  function docs(g) { var l = get(DKEY, null); if (!l || !l.some(function (d) { return d.seedG === 2; })) { l = (l || []).filter(function (d) { return !d.seedG; }).concat(DOC_SEED.map(function (d) { return Object.assign({ seedG: 2 }, d); })); put(DKEY, l); } var ids = stays(g).map(function (r) { return r.id; }); return l.filter(function (d) { return d.guestId === g.id || (d.resId && ids.indexOf(d.resId) >= 0); }); }
  function addDoc(d) { var l = get(DKEY, []) || []; l.push(d); put(DKEY, l); }
  function incidents(g) { var l = get(IKEY, null); if (!l) { l = INC_SEED; put(IKEY, l); } return g ? l.filter(function (i) { return i.guestId === g.id; }) : l; }
  function addIncident(i) { var l = incidents(); l.unshift(i); put(IKEY, l); }
  function threads(g) { var l = get(MKEY, null) || []; if (!l.some(function (t) { return t.seed === 2; })) { l = l.filter(function (t) { return !t.seed; }).concat(MSG_SEED.map(function (t) { return Object.assign({ seed: 2 }, t); })); put(MKEY, l); } return g ? l.filter(function (t) { return t.guestId === g.id; }) : l; }
  function post(th, from) { var l = threads(); var ex = l.find(function (t) { return t.id === th.id; }); if (ex) { ex.msgs.push(from); } else { th.msgs = [from]; l.unshift(th); } put(MKEY, l); }
  function submitRequest(req) { var q = get(QKEY, []) || []; q.push(req); put(QKEY, q); }
  function list() { return guests().map(function (g) { return { id: g.id, name: nameOf(g), email: g.email, phone: g.phone, whatsapp: g.whatsapp, country: g.residence }; }); }
  window.MGH_GUEST = { GKEY: GKEY, IKEY: IKEY, MKEY: MKEY, QKEY: QKEY, guests: guests, list: list, find: function (id) { return guests().find(function (g) { return g.id === id; }); }, forReservation: function (r) { return guests().find(function (g) { return owns(g, r); }); }, nameOf: nameOf, stays: stays, stayOf: stayOf, account: account, occupants: occupants, patchRes: patchRes, save: save, match: match, docs: docs, addDoc: addDoc, incidents: incidents, addIncident: addIncident, threads: threads, post: post, submitRequest: submitRequest, reservations: reservations,
    VER: { not_started: ['Not Started', 'neutral'], pending: ['Pending', 'warning'], verified: ['Verified', 'success'], failed: ['Failed', 'danger'], needs_review: ['Needs Review', 'warning'] },
    INCIDENT_TYPES: ['Noise Complaint', 'Unauthorized Party', 'Excessive Vehicles', 'HOA Complaint', 'Property Damage', 'Smoking Violation', 'Unauthorized Guest', 'Security Issue', 'Other'],
    TOPICS: ['Booking', 'Payment', 'Arrival', 'Stay', 'Maintenance', 'Services', 'Check-Out'] };
})();
