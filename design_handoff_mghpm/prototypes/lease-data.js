// MGHPM Leases — single lease store shared by Leases (15), Create Lease (40) and Lease 360 (41).
// Lease Created ≠ Lease Active. Activation validates readiness, then establishes the Tenant–Property–Lease
// relationship and the rent-charge schedule. Bank instructions come from Organization › Financial Settings.
(function () {
  if (window.MGH_LEASE) return;
  var KEY = 'mghpm.leases.v1', LKEY = 'mghpm.leasing.v1', DKEY = 'mghpm.str.docs.v2', TKEY = 'mghpm.tenancy.v1';
  var J = function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  var put = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var PROPS = { 1: 'Brickell Bay Residences', 2: 'Ocean View Villa', 3: 'Coral Gables Terrace', 4: 'Las Olas Lofts', 5: 'Wynwood Commons', 6: 'Sunset Beach House', 7: 'Mar de Plata I', 8: 'Mar de Plata II', 9: 'Key Biscayne Retreat', 10: 'Doral Business Center', 11: 'Coconut Grove Cottages', 12: 'Hollywood Boardwalk Suites', 13: 'Aventura Park Tower', 14: 'Little Havana Flats', 15: 'Hialeah Industrial Park', 16: 'Homestead Land Parcel', 17: 'North Bay Village Residences', 18: 'Pompano Beach Duplex' };
  var CUR_LABEL = { DOP: 'DOP — Dominican Peso (RD$)', USD: 'USD — US Dollar ($)' };
  var SL = { draft: ['Draft', 'neutral'], pending: ['Pending Activation', 'info'], active: ['Active', 'success'], expired: ['Expired', 'warning'], terminated: ['Terminated', 'danger'] };
  var STEPS = [
    ['verify', 'Tenant Verification', 'Identity verified for every adult lease party', 'parties'],
    ['generate', 'Lease Generated', 'Lease and addenda generated from Templates', 'documents'],
    ['sign', 'Signatures', 'All required signers executed the lease', 'signatures'],
    ['funds', 'Initial Funds', 'First month rent and deposits received & verified', 'payments'],
    ['insurance', 'Renters Insurance', 'Policy received and verified', 'insurance'],
    ['inspection', 'Move-In Inspection', 'Baseline condition report with photos', 'movein'],
    ['keys', 'Keys / Access', 'Keys, remotes and access credentials handed over', 'movein'],
    ['hoa', 'HOA / Rules Acknowledgment', 'Tenant acknowledged HOA and property rules', 'documents'],
    ['utilities', 'Utilities Instructions', 'Utility responsibilities and transfer instructions sent', 'terms'],
    ['ack', 'Move-In Acknowledgment', 'Tenant confirmed move-in and unit condition', 'movein']
  ];
  var ADDENDA = [['pet', 'Pet Addendum', 'TPL-101'], ['parking', 'Parking Addendum', null], ['hoa', 'HOA Rules', 'TPL-014'], ['utilities', 'Utilities Addendum', null], ['occupancy', 'Occupancy Addendum', null], ['other', 'Other', null]];
  var pname = function (pid) { var O = window.MGH_ORG; return (O && O.PROPS[pid]) || PROPS[pid] || 'Property ' + pid; };
  var fmt = function (n, c) { if (window.MGH_PAY) return window.MGH_PAY.fmt(n, c || 'USD'); return (c === 'DOP' ? 'RD$ ' : 'US$ ') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var fmtD = function (iso) { return iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; };
  var propCur = function (pid) { var P = window.MGH_PAY; var c = P && pid ? P.cfg(pid).currency : ''; return c || 'USD'; };
  var U = function (l) { return l.map(function (u) { return { unit: u[0], floor: u[1], beds: u[2], baths: u[3], size: u[4] }; }); };
  var UNIT_SEED = { 1: [['Unit 1507', 15, 2, 2, 1180], ['Unit 1204', 12, 2, 2, 1150], ['Unit 2003', 20, 2, 2, 1210], ['Unit 806', 8, 1, 1, 820]], 2: [['Unit 102', 1, 3, 2, 1640], ['Unit 204', 2, 3, 2, 1620], ['Unit 305', 3, 2, 2, 1380]], 3: [['Unit 118', 1, 1, 1, 760], ['Unit 214', 2, 2, 2, 1040], ['Unit 305', 3, 2, 2, 1060]], 11: [['Cottage 2', 1, 3, 2, 1450], ['Cottage 4', 1, 2, 2, 1180], ['Cottage 6', 1, 3, 2, 1500]], 12: [['Unit 7B', 7, 2, 2, 1090], ['Unit 9A', 9, 2, 2, 1120]], 13: [['Unit 1103', 11, 2, 2, 1240], ['Unit 2204', 22, 3, 2, 1580]], 14: [['Unit 1', 1, 2, 1, 880], ['Unit 3', 1, 2, 1, 880], ['Unit 5', 2, 3, 2, 1100]], 18: [['Unit A', 1, 3, 2, 1400], ['Unit B', 1, 3, 2, 1400]] };
  function units(pid) { return U(UNIT_SEED[pid] || [['Unit 1', 1, 2, 2, 1000], ['Unit 2', 1, 2, 1, 920], ['Unit 4B', 4, 3, 2, 1320]]); }
  var PEOPLE = [
    ['Carlos Martínez', 'carlos.martinez@gmail.com', '+1 (809) 555-0193', 'Verified', 'APP-2026-0187', 'Applicant — Approved'],
    ['Nathan Brooks', 'n.brooks@fpl.com', '(305) 555-0147', 'Verified', 'APP-2026-0169', 'Applicant — Approved'],
    ['Marco Bellini', 'm.bellini@citadel.com', '(305) 555-0121', 'Verified', 'APP-2026-0171', 'Applicant — Lease Draft'],
    ['Daniela Ortiz', 'daniela.ortiz@gmail.com', '(305) 555-0172', 'Verified', 'APP-2026-0148', 'Tenant — Active'],
    ['Chloe Dubois', 'c.dubois@airfrance.fr', '(305) 555-0188', 'Pending', 'APP-2026-0173', 'Tenant — Active'],
    ['Jonathan Reyes', 'j.reyes@outlook.com', '(786) 555-0134', 'Verified', '', 'Tenant — Active'],
    ['Sofia Martinez', 'sofia.martinez@gmail.com', '(305) 555-0163', 'Verified', '', 'Tenant — Active'],
    ['Michael Chen', 'm.chen@ucsd.edu', '(305) 555-0151', 'Verified', '', 'Tenant — Active'],
    ['Priya Nair', 'priya.nair@gmail.com', '(786) 555-0119', 'Verified', '', 'Tenant — Active'],
    ['Andre Williams', 'andre.w@icloud.com', '(305) 555-0177', 'Verified', '', 'Tenant — Active'],
    ['Valentina Cruz', 'v.cruz@gmail.com', '(954) 555-0102', 'Verified', '', 'Former Tenant'],
    ['Tom Becker', 'tom.becker@gmail.com', '(305) 555-0144', 'Verified', '', 'Former Tenant']
  ].map(function (p) { return { name: p[0], email: p[1], phone: p[2], verif: p[3], app: p[4], status: p[5] }; });
  function person(name) { return PEOPLE.find(function (p) { return p.name === name; }) || { name: name || '', email: '', phone: '', verif: 'Not Started', app: '', status: 'New Person' }; }
  var APPS = [
    { id: 'APP-2026-0187', name: 'Carlos Martínez', pid: 11, unit: 'Cottage 2', rent: 85000, deposit: 170000, currency: 'DOP', moveIn: '2026-11-01', occupants: [['Spouse', 'Laura Gómez de Martínez', 'laura.gomez@gmail.com'], ['Minor Occupant', 'Sofía Martínez Gómez (9)', '']], pets: 'None', income: 'RD$ 310,000 / month • Banco Popular Dominicano — Regional Manager • 6 years', decision: 'Approved • Oct 3, 2026 • Sofia Ramos', conditions: ['Security deposit 2× monthly rent', 'Renters insurance RD$ 1,500,000 minimum before move-in'] },
    { id: 'APP-2026-0169', name: 'Nathan Brooks', pid: 12, unit: 'Unit 7B', rent: 2850, deposit: 2850, currency: 'USD', moveIn: '2026-10-06', occupants: [], pets: 'None', income: 'US$ 9,900 / month • Florida Power & Light — Electrical Engineer • 6 years', decision: 'Approved • Sep 28, 2026 • Sofia Ramos', conditions: ['Standard 1× security deposit'] }
  ];
  function apps() { var ov = J(LKEY) || {}, l = all(); return APPS.map(function (a) { var lease = l.find(function (x) { return x.app === a.id; }); return Object.assign({}, a, { status: (ov[a.id] && ov[a.id].status) || 'APPROVED', lease: lease ? lease.id : '' }); }); }
  function utilDefault(pid) { var R = window.MGH_READY, r = R && pid ? R.rec(pid) : null, hoa = r && r.hoa && r.hoa.applies; return [['Electricity', 'Tenant', 'Account transfer to tenant name at move-in'], ['Water', 'Owner', ''], ['Internet', 'Tenant', ''], ['Gas', 'Tenant', ''], ['HOA', hoa ? 'Owner' : 'Not Applicable', hoa ? 'HOA dues paid by owner' : 'No HOA']].map(function (u) { return { name: u[0], party: u[1], notes: u[2] }; }); }
  function rules(pid) {
    var R = window.MGH_READY, r = R && pid ? R.rec(pid) : null; if (!r) return [];
    var lt = (r.rental && r.rental.lt) || {}, h = r.hoa || {};
    return [['hoa', 'HOA Rules', !!h.applies, h.applies ? h.name + ' • quiet hours ' + h.quiet : 'No HOA for this property'], ['property', 'Property Rules', true, 'Occupancy ' + (lt.occupancy || 'per property') + ' • no modifications without written approval'], ['pets', 'Pet Policy', true, lt.pets || 'No pets'], ['parking', 'Parking Policy', true, lt.parking || 'Per building'], ['smoking', 'Smoking Policy', true, 'No smoking inside the unit or common areas'], ['visitors', 'Visitors & Common Areas', !!h.applies, 'Guest registration with building access control'], ['maint', 'Maintenance Responsibilities', true, 'Tenant: routine upkeep & filters • Owner/MGHPM: systems & structure']].map(function (x) { return { key: x[0], label: x[1], applies: x[2], detail: x[3] }; });
  }
  function propCheck(pid) {
    var R = window.MGH_READY, b = R && pid ? R.build(pid) : null;
    if (!b) return { ready: true, label: 'Readiness not assessed', blockers: [], mode: '—', owner: '—', code: '—', address: '', occ: '—', statusL: 'Not assessed', statusT: 'neutral' };
    var blk = (b.items || []).filter(function (i) { return i.level === 'BLOCKER' && i.state !== 'complete' && i.state !== 'na'; });
    var lt = b.mode === 'Long-Term' || b.mode === 'Both', ready = !blk.length && lt;
    var st = R.STATUS && R.STATUS[b.status];
    return { ready: ready, lt: lt, label: ready ? 'Ready for Long-Term Rental' : !lt ? 'Property not configured for long-term rental' : 'Property not ready for lease activation', blockers: blk.map(function (i) { return i.label + (i.detail ? ' — ' + i.detail : ''); }), mode: b.mode, owner: b.owner, code: b.p.code, address: b.p.address + ', ' + b.p.city, occ: b.p.occ, statusL: st ? st[0] : b.status, statusT: st ? st[1] : 'neutral' };
  }
  function initialFunds(l) { var f = l.funds || {}, n = function (x) { return Number(x) || 0; }; var rows = [['first', 'First Month Rent', l.includeFirst !== false ? n(l.rent) : 0], ['security', 'Security Deposit', n(f.security)], ['additional', 'Additional Deposit', n(f.additional)], ['pet', 'Pet Deposit', n(f.pet)], ['advance', 'Advance Rent', n(f.advance)], ['other', f.otherLabel || 'Other Initial Charge', n(f.other)]].map(function (r) { return { key: r[0], label: r[1], amount: r[2], na: !r[2] }; }); return { rows: rows, total: rows.reduce(function (t, r) { return t + r.amount; }, 0) }; }
  function signers(l) {
    var s = l.sign || {}, out = [{ role: 'Tenant', name: l.tenant, req: 'Yes' }];
    (l.parties || []).forEach(function (p) { if (p.role === 'Co-Tenant' || p.role === 'Spouse') out.push({ role: 'Co-Tenant', name: p.name, req: 'Conditional • present' }); if (p.role === 'Guarantor') out.push({ role: 'Guarantor', name: p.name, req: 'Conditional • present' }); });
    out.push({ role: 'MGHPM', name: 'Marcus Vance • Portfolio Lead', req: 'Yes' });
    if (l.ownerSign === 'Required') out.push({ role: 'Owner', name: propCheck(l.pid).owner, req: 'Based on agreement' });
    return out.map(function (x, i) { return Object.assign(x, { order: i + 1, key: x.role + ':' + x.name, status: s[x.role + ':' + x.name] || 'Not Sent' }); });
  }
  var DEF = function (l) {
    var act = l.status === 'active' || l.status === 'expired' || l.status === 'terminated', cur = l.currency || propCur(l.pid), p = person(l.tenant);
    return { v2: 1, source: l.app ? 'application' : 'admin', currency: cur, parties: [], possession: l.start, moveIn: l.start, renewal: 'Manual Renewal Required', notice: '60 days', dueDay: '1', grace: '5', lateFee: '5% of monthly rent after grace period', firstDue: l.start, prorate: false, funds: { security: l.deposit, additional: 0, pet: 0, advance: 0, other: 0, otherLabel: '' }, includeFirst: true, methods: { 'Bank Transfer': true, 'Credit/Debit Card': true, Cash: false, Other: false }, utilities: utilDefault(l.pid), rules: {}, insurance: act ? { required: true, min: cur === 'DOP' ? 'RD$ 1,500,000' : 'US$ 100,000', carrier: 'Lemonade Insurance', policy: 'LMN-RL-' + l.id.slice(-4) + '17', eff: l.start, exp: l.end, proof: 'Certificate.pdf', verif: 'Verified' } : { required: true, min: cur === 'DOP' ? 'RD$ 1,500,000' : 'US$ 100,000', carrier: '', policy: '', eff: '', exp: '', proof: '', verif: 'Not Received' }, template: { id: 'TPL-010', lang: cur === 'DOP' ? 'Spanish' : 'English' }, addenda: {}, ownerSign: 'Not required', signOrder: true, sign: {}, fundsPaid: {}, charges: [], comms: [], tenantStatus: act ? (l.status === 'active' ? 'Active' : 'Former') : 'Pending', createdAt: Date.parse(l.start + 'T12:00:00') - 30 * 864e5, email: p.email };
  };
  var SEED = [
    ['L-2026-0420', 1, 'Unit 1507', 'Marco Bellini', 'draft', '2026-11-01', '2027-10-31', 3950, 3950, 'APP-2026-0171', { sign: 1 }],
    ['L-2026-0418', 1, 'Unit 1204', 'Daniela Ortiz', 'active', '2026-10-01', '2027-09-30', 3850, 3850, 'APP-2026-0148', null],
    ['L-2026-0421', 12, 'Unit 7B', 'Nathan Brooks', 'pending', '2026-10-06', '2027-10-05', 2850, 2850, 'APP-2026-0169', {}],
    ['L-2025-0392', 1, 'Unit 806', 'Jonathan Reyes', 'active', '2025-06-01', '2027-05-31', 3600, 3600, '', null],
    ['L-2025-0377', 2, 'Unit 102', 'Sofia Martinez', 'active', '2025-03-01', '2027-02-28', 4200, 4200, '', null],
    ['L-2025-0351', 2, 'Unit 204', 'Tom Becker', 'terminated', '2025-01-01', '2026-10-04', 4350, 4350, '', null],
    ['L-2024-0298', 2, 'Unit 301', 'Priya Nair', 'active', '2024-12-01', '2026-11-30', 4100, 4100, '', null],
    ['L-2025-0344', 3, 'Unit 305', 'Michael Chen', 'active', '2025-12-01', '2026-11-30', 3450, 3450, '', null],
    ['L-2025-0310', 5, 'Unit 4B', 'Andre Williams', 'active', '2025-09-01', '2026-12-31', 2650, 2650, '', null],
    ['L-2024-0201', 4, 'Unit 12', 'Valentina Cruz', 'expired', '2024-08-01', '2026-07-31', 2900, 2900, '', null],
    ['L-2025-0333', 13, 'Unit 1103', 'Chloe Dubois', 'active', '2025-11-01', '2027-04-30', 3600, 3600, '', null],
    ['L-2026-0431', 14, 'Unit 1', 'Rafael Peña', 'active', '2026-09-01', '2027-08-31', 65000, 130000, '', null]
  ].map(function (r) { return { id: r[0], pid: r[1], unit: r[2], tenant: r[3], status: r[4], start: r[5], end: r[6], rent: r[7], deposit: r[8], app: r[9], steps: r[10] }; });
  function norm(l) {
    if (l.v2) return l;
    var act = l.status === 'active' || l.status === 'expired' || l.status === 'terminated', o = l.steps || {}, steps = {};
    if (act) STEPS.forEach(function (s) { steps[s[0]] = 'done'; }); else { steps.verify = 'done'; steps.generate = 'done'; if (o.sign) steps.sign = 'done'; if (o.pay) steps.funds = 'done'; if (o.insp) steps.inspection = 'done'; }
    var x = Object.assign(DEF(l), l, { steps: steps });
    if (act) { var s = {}; signers(x).forEach(function (g) { s[g.key] = 'Signed'; }); x.sign = s; initialFunds(x).rows.forEach(function (r) { if (!r.na) x.fundsPaid[r.key] = { ref: 'Verified at onboarding', at: x.createdAt }; }); }
    else if (o.sign) { var s2 = {}; signers(x).forEach(function (g) { s2[g.key] = 'Signed'; }); x.sign = s2; }
    return x;
  }
  function all() { var d = J(KEY); var list = d && Array.isArray(d.leases) ? d.leases : SEED; var n = list.map(norm); if (!d || list.some(function (x) { return !x.v2; })) put(KEY, { leases: n }); if (!n.some(function (x) { return x.id === 'L-2026-0431'; })) { n.push(norm(SEED[SEED.length - 1])); put(KEY, { leases: n }); } return n; }
  function get(id) { return all().find(function (l) { return l.id === id; }) || null; }
  function audit(l, action, detail, extra) { if (window.MGH_AUDIT) return window.MGH_AUDIT.record(Object.assign({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: action, module: 'Leases', recordType: 'Lease', record: l.id + ' — ' + l.tenant, recordId: l.id, category: 'Leasing', detail: detail }, extra || {})); }
  function save(l, action, detail, extra) { var list = all(), i = list.findIndex(function (x) { return x.id === l.id; }); l.updatedAt = Date.now(); if (i >= 0) list[i] = l; else list.unshift(l); put(KEY, { leases: list }); if (action) audit(l, action, detail, extra); return l; }
  function nextId() { var d = new Date(), k = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); var n = all().filter(function (l) { return l.id.indexOf(k) === 0; }).length + 1; return k + '-DR-' + String(n).padStart(4, '0') + '-LT'; }
  function markApp(appId, leaseId) { if (!appId) return; var ov = J(LKEY) || {}; var o = ov[appId] || {}; ov[appId] = Object.assign({}, o, { status: 'LEASE_CREATED', lease: leaseId, history: (o.history || []).concat([{ title: 'Lease ' + leaseId + ' created from application', meta: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' • Marcus Vance', color: '#16A34A' }]) }); put(LKEY, ov); }
  function create(rec, status) { var l = Object.assign({ v2: 1, id: nextId(), steps: {}, sign: {}, fundsPaid: {}, charges: [], comms: [], tenantStatus: 'Pending', createdAt: Date.now() }, rec, { status: status || 'pending' }); l.deposit = Number((l.funds || {}).security) || 0; if (person(l.tenant).verif === 'Verified') l.steps.verify = 'done'; save(l, 'CREATE', (status === 'draft' ? 'Draft lease saved' : 'Lease created — pending activation') + ' • ' + pname(l.pid) + ' • ' + l.unit + ' • ' + fmt(l.rent, l.currency) + ' / month' + (l.app ? ' • from ' + l.app : ''), { changes: [['Status', '—', SL[l.status][0]], ['Monthly Rent', '—', fmt(l.rent, l.currency)], ['Currency', '—', l.currency]] }); if (l.app && status !== 'draft') markApp(l.app, l.id); return l; }
  function setStep(l, k, state, detail) { l.steps = Object.assign({}, l.steps, {}); l.steps[k] = state; var s = STEPS.find(function (x) { return x[0] === k; }); return save(l, 'UPDATE', (s ? s[1] : k) + ' — ' + (state === 'done' ? 'complete' : 'in progress') + (detail ? ' • ' + detail : ''), { changes: [[s ? s[1] : k, 'Pending', state === 'done' ? 'Complete' : 'In Progress']] }); }
  function readiness(l) {
    var pc = propCheck(l.pid);
    var items = STEPS.map(function (s) { var na = s[0] === 'insurance' && l.insurance && !l.insurance.required; var st = na ? 'na' : (l.steps || {})[s[0]] || 'todo'; return { key: s[0], label: s[1], detail: s[2], tab: s[3], state: st }; });
    var appl = items.filter(function (i) { return i.state !== 'na'; }), done = appl.filter(function (i) { return i.state === 'done'; }).length;
    var next = appl.find(function (i) { return i.state !== 'done'; }) || null;
    return { items: items, done: done, total: appl.length, next: next, prop: pc, canActivate: !next && pc.ready && (l.status === 'pending' || l.status === 'draft') };
  }
  function leaseVals(l) { var p = person(l.tenant); return { 'lease.number': l.id, 'lease.start_date': fmtD(l.start), 'lease.end_date': fmtD(l.end), 'lease.monthly_rent': fmt(l.rent, l.currency), 'lease.currency': CUR_LABEL[l.currency], 'lease.deposit': fmt((l.funds || {}).security, l.currency), 'tenant.legal_name': l.tenant, 'tenant.email': p.email, 'tenant.phone': p.phone }; }
  function docsFor(l) { return (J(DKEY) || []).filter(function (d) { return d.leaseId === l.id; }); }
  function generateDocs(l) {
    var T = window.MGH_TPL, out = [], skipped = []; if (!T) return { docs: out, skipped: skipped };
    var pc = propCheck(l.pid), ctx = { pid: l.pid, owner: pc.owner, lang: l.template.lang || 'Spanish' }, vals = Object.assign({}, T.resolve(ctx), leaseVals(l));
    var t = T.get(l.template.id); if (t) out.push(T.generate(t, ctx, vals));
    ADDENDA.forEach(function (a) { if (!(l.addenda || {})[a[0]]) return; var at = a[2] && T.get(a[2]); if (at && at.status === 'PUBLISHED') out.push(T.generate(at, ctx, vals)); else skipped.push(a[1] + (at ? ' (' + at.id + ' is ' + T.STATUS[at.status][0] + ')' : ' (no published template)')); });
    var d = J(DKEY) || [], ids = out.map(function (x) { return x.id; });
    d.forEach(function (x) { if (ids.indexOf(x.id) >= 0) { x.leaseId = l.id; x.related = l.id; x.person = l.tenant; x.name = x.name.replace(/\.pdf$/, '') .replace(/ — [^—]+$/, '') + ' — ' + l.id + '.pdf'; } }); put(DKEY, d);
    l.steps = Object.assign({}, l.steps, { generate: 'done' });
    save(l, 'GENERATE', 'Generated ' + ids.join(', ') + ' from ' + l.template.id + (skipped.length ? ' • not generated: ' + skipped.join(', ') : ''));
    return { docs: out, skipped: skipped };
  }
  function addMonths(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); }
  function activate(l) {
    var r = readiness(l); if (!r.canActivate) return { ok: false, error: r.prop.ready ? 'Complete ' + (r.next ? r.next.label : 'all requirements') + ' before activation.' : r.prop.label };
    if (window.MGH_AUDIT) window.MGH_AUDIT.begin('Activate ' + l.id);
    var charges = [], first = l.firstDue || l.start, day = String(Math.min(28, Number(l.dueDay) || 1)).padStart(2, '0');
    for (var i = 0; ; i++) { var d = addMonths(first.slice(0, 8) + '01', i).slice(0, 8) + day; if (d > l.end) break; charges.push({ id: 'CHG-' + l.id.replace(/\W/g, '').slice(-8) + '-' + String(i + 1).padStart(2, '0'), date: d, desc: 'Rent — ' + new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), amount: Number(l.rent), currency: l.currency, status: i === 0 && l.includeFirst !== false && (l.fundsPaid || {}).first ? 'Paid' : 'Scheduled' }); if (i > 60) break; }
    var prev = SL[l.status][0];
    l.status = 'active'; l.tenantStatus = 'Active'; l.activatedAt = Date.now(); l.charges = charges;
    save(l, 'UPDATE', 'Lease activated — Tenant–Property–Lease relationship established', { severity: 'Medium', changes: [['Status', prev, 'Active'], ['Tenant Status', 'Pending', 'Active'], ['Rent Charges', '0', String(charges.length)]] });
    var t = J(TKEY) || {}; t[l.tenant] = { pid: l.pid, property: pname(l.pid), unit: l.unit, lease: l.id, status: 'Active', since: l.moveIn || l.start, rent: l.rent, currency: l.currency }; put(TKEY, t);
    if (window.MGH_AUDIT) { window.MGH_AUDIT.record({ actor: 'System', actorType: 'SYSTEM', role: 'System', action: 'CREATE', module: 'Accounting', recordType: 'Rent Charges', record: l.id, recordId: l.id, category: 'Financial', detail: charges.length + ' monthly rent charges of ' + fmt(l.rent, l.currency) + ' scheduled ' + fmtD(charges[0] && charges[0].date) + ' – ' + fmtD(charges.length && charges[charges.length - 1].date) }); window.MGH_AUDIT.record({ actor: 'System', actorType: 'SYSTEM', role: 'System', action: 'UPDATE', module: 'Tenants', recordType: 'Tenant', record: l.tenant, recordId: l.id, category: 'Leasing', detail: l.tenant + ' is now an active tenant of ' + pname(l.pid) + ' • ' + l.unit, changes: [['Tenant Status', 'Pending', 'Active']] }); }
    return { ok: true, charges: charges.length };
  }
  function tenancy() { return J(TKEY) || {}; }
  window.MGH_LEASE = { KEY: KEY, SL: SL, STEPS: STEPS, ADDENDA: ADDENDA, CUR_LABEL: CUR_LABEL, PEOPLE: PEOPLE, pname: pname, fmt: fmt, fmtD: fmtD, propCur: propCur, units: units, person: person, apps: apps, utilDefault: utilDefault, rules: rules, propCheck: propCheck, initialFunds: initialFunds, signers: signers, all: all, get: get, save: save, nextId: nextId, create: create, setStep: setStep, readiness: readiness, leaseVals: leaseVals, docsFor: docsFor, generateDocs: generateDocs, activate: activate, tenancy: tenancy, markApp: markApp };
})();
