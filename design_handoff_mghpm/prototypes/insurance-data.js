// Shared InsurancePolicy / InsuranceRequirement store — Register (27), New Policy (42), Policy 360 (43), Owner/Tenant 360.
// One policy record links to existing Property / Owner / Tenant / Lease / Vendor records (never duplicated).
// Payments reference the shared Payments module; documents the Document Center; messages the Inbox; history the Audit Log.
(function () {
  if (window.MGH_INS) return;
  var KEY = 'mghpm.insurance.v1', DKEY = 'mghpm.str.docs.v2';
  var P = function (id, entity, ref, type, carrier, number, insured, covered, coverage, deductible, eff, exp, premium, agent, verif, pay, extra) {
    return Object.assign({ id: id, entity: entity, ref: ref, type: type, carrier: carrier, number: number, insured: insured, covered: covered, coverage: String(coverage), deductible: deductible, eff: eff, exp: exp, premium: String(premium), agent: agent[0], agent_phone: agent[1], agent_email: agent[2], policy_file: number + ' — Policy.pdf', proof_file: verif === 'Verified' ? number + ' — Certificate.pdf' : '', pay: pay, verif: verif, verified_by: verif === 'Verified' ? 'Sofia Ramos' : '', notes: '' }, extra || {});
  };
  var CRP = ['Coastal Risk Partners — María Fuentes', '(305) 555-0640', 'mfuentes@coastalrisk.com'];
  var BBA = ['Brown & Brown Agency — Kevin Ross', '(954) 555-0712', 'kross@bbins.com'];
  var SEED = [
    P('INS-0001', 'Property', 'Brickell Bay Residences', 'Property / Dwelling', 'Citizens Property Insurance', 'CPI-44718203', 'Alvarez Family Trust', 'Brickell Bay Residences', 42000000, '2% of dwelling', '2026-01-01', '2026-12-31', 186400, CRP, 'Verified', 'Paid'),
    P('INS-0002', 'Property', 'Brickell Bay Residences', 'Flood', 'Wright Flood (NFIP)', 'WF-0918274', 'Alvarez Family Trust', 'Brickell Bay Residences', 2500000, '$10,000.00', '2025-10-28', '2026-10-28', 48200, CRP, 'Verified', 'Renewal Invoiced'),
    P('INS-0003', 'Property', 'Ocean View Villa', 'Hurricane / Windstorm', 'Universal Property & Casualty', 'UPC-7731045', 'Alvarez Family Trust', 'Ocean View Villa', 9800000, '5% hurricane', '2026-06-01', '2027-05-31', 71900, CRP, 'Verified', 'Paid'),
    P('INS-0004', 'Property', 'Ocean View Villa', 'Liability', 'Chubb', 'CHB-GL-552190', 'Alvarez Family Trust', 'Ocean View Villa', 2000000, '$2,500.00', '2025-11-20', '2026-11-20', 12450, CRP, 'Verified', 'Paid'),
    P('INS-0005', 'Property', 'Sunset Beach House', 'Property / Dwelling', 'Heritage Insurance', 'HER-3390218', 'Alvarez Family Trust', 'Sunset Beach House', 1850000, '$5,000.00', '2026-03-15', '2027-03-15', 14800, CRP, 'Pending Verification', 'Paid'),
    P('INS-0006', 'Property', 'Mar de Plata I', 'Property / Dwelling', 'Tower Hill Insurance', 'THI-6021187', 'Plata Investments Group', 'Mar de Plata I', 18400000, '2% of dwelling', '2025-09-30', '2026-09-30', 96300, BBA, 'Verified', 'Unpaid', { verified_by: 'María Santos', verified_at: '2025-10-05', verify_source: 'Certificate of Insurance' }),
    P('INS-0007', 'Owner', 'Alvarez Family Trust', 'Liability', 'Chubb', 'CHB-UMB-118402', 'Alvarez Family Trust', 'All owner properties (umbrella)', 5000000, '$10,000.00', '2026-05-01', '2027-04-30', 6900, CRP, 'Verified', 'Paid'),
    P('INS-0008', 'Tenant', 'Daniela Ortiz', "Renter's Liability", 'Lemonade', 'LMN-RL-90417', 'Daniela Ortiz', 'Brickell Bay Residences • Unit 1204', 300000, '$500.00', '2026-10-01', '2027-09-30', 168, ['Lemonade (direct)', '(844) 733-8666', 'help@lemonade.com'], 'Verified', 'Paid', { lease: 'L-2026-0418' }),
    P('INS-0009', 'Tenant', 'Jonathan Reyes', "Renter's Liability", 'State Farm', 'SF-R-4418201', 'Jonathan Reyes', 'Brickell Bay Residences • Unit 806', 100000, '$500.00', '2025-10-15', '2026-10-15', 144, ['State Farm — Ana Díaz', '(305) 555-0188', 'ana.diaz@statefarm.com'], 'Verified', 'Paid', { lease: 'L-2025-0392' }),
    P('INS-0010', 'Vendor', 'Aqua Pro Plumbing', 'General Liability', 'Hiscox', 'HSX-GL-2290114', 'Aqua Pro Plumbing LLC', 'Vendor operations', 1000000, '$1,000.00', '2026-03-31', '2027-03-31', 2150, BBA, 'Verified', 'Paid'),
    P('INS-0011', 'Vendor', 'Bright Spark Electric', 'General Liability', 'The Hartford', 'HTF-GL-7781290', 'Bright Spark Electric Inc.', 'Vendor operations', 1000000, '$1,000.00', '2025-10-31', '2026-10-31', 2480, BBA, 'Verified', 'Paid'),
    P('INS-0012', 'Vendor', 'Shield Pest Solutions', 'General Liability', 'Next Insurance', 'NXT-GL-334019', 'Shield Pest Solutions', 'Vendor operations', 500000, '$500.00', '2025-09-01', '2026-09-01', 980, BBA, 'Verified', 'Unpaid'),
    P('INS-0013', 'Vendor', 'Coastal HVAC Services', "Workers' Compensation", 'AmTrust', 'AMT-WC-5512007', 'Coastal HVAC Services', 'Employees (8)', 1000000, '—', '2026-01-15', '2027-01-15', 6400, BBA, 'Pending Verification', 'Paid'),
    P('INS-0014', 'Property', 'Coconut Grove Cottages', 'Property / Dwelling', 'Seguros Universal', 'SU-PR-2026-118804', 'Grove Cottages LLC', 'Coconut Grove Cottages', 95000000, '2% of dwelling', '2026-08-01', '2027-07-31', 410000, ['Seguros Universal — Luis Peralta', '+1 (809) 555-0261', 'lperalta@universal.com.do'], 'Pending Verification', 'Unpaid', { currency: 'DOP' })
  ];
  var R = function (id, entity, ref, type, source, min) { return { id: id, entity: entity, ref: ref, type: type, source: source, min: String(min || ''), waived: false }; };
  var REQS = [
    R('REQ-01', 'Property', 'Brickell Bay Residences', 'Property / Dwelling', 'Management Agreement MA-2026-0012', 40000000),
    R('REQ-02', 'Property', 'Brickell Bay Residences', 'Flood', 'Management Agreement MA-2026-0012', 2500000),
    R('REQ-03', 'Property', 'Ocean View Villa', 'Hurricane / Windstorm', 'Management Agreement MA-2026-0012', 8000000),
    R('REQ-04', 'Property', 'Sunset Beach House', 'Property / Dwelling', 'Management Agreement MA-2026-0012', 1500000),
    R('REQ-05', 'Property', 'Sunset Beach House', 'Flood', 'Management Agreement MA-2026-0012', 500000),
    R('REQ-06', 'Property', 'Las Olas Lofts', 'Property / Dwelling', 'MGHPM company policy', 10000000),
    R('REQ-07', 'Tenant', 'Daniela Ortiz', "Renter's Liability", 'Lease L-2026-0418', 100000),
    R('REQ-08', 'Tenant', 'Marco Bellini', "Renter's Liability", 'Lease L-2026-0420', 100000),
    R('REQ-09', 'Vendor', 'Aqua Pro Plumbing', 'General Liability', 'Vendor agreement', 1000000),
    R('REQ-10', 'Vendor', 'Spotless Turnover Co.', 'General Liability', 'Vendor agreement', 1000000),
    R('REQ-11', 'Vendor', 'Bright Spark Electric', 'General Liability', 'Vendor agreement', 1000000),
    R('REQ-12', 'Property', 'Mar de Plata I', 'Property / Dwelling', 'Management Agreement MA-2025-0031', 18000000)
  ];
  var PROPERTY_OWNER = { 'Brickell Bay Residences': 'Alvarez Family Trust', 'Ocean View Villa': 'Alvarez Family Trust', 'Sunset Beach House': 'Alvarez Family Trust', 'Mar de Plata I': 'Plata Investments Group', 'Mar de Plata II': 'Plata Investments Group', 'Las Olas Lofts': 'Las Olas Partners LP', 'Aventura Park Tower': 'Turnberry Capital Trust', 'Homestead Land Parcel': 'Southland Land Co.', 'Coral Gables Terrace': 'Las Olas Partners LP', 'Wynwood Commons': 'Plata Investments Group', 'Coconut Grove Cottages': 'Grove Cottages LLC' };
  var PID = { 'Brickell Bay Residences': 1, 'Ocean View Villa': 2, 'Coral Gables Terrace': 3, 'Las Olas Lofts': 4, 'Wynwood Commons': 5, 'Sunset Beach House': 6, 'Mar de Plata I': 7, 'Mar de Plata II': 8, 'Coconut Grove Cottages': 11, 'Aventura Park Tower': 13, 'Homestead Land Parcel': 16 };
  var TYPES = {
    Property: ['Property / Dwelling', 'Fire', 'Hurricane / Windstorm', 'Flood', 'Earthquake', 'Liability', 'Contents', 'Other'],
    Owner: ['Liability', 'Property / Dwelling', 'Contents', 'Other'],
    Tenant: ["Renter's Liability", 'Contents', 'Other'],
    Vendor: ['General Liability', "Workers' Compensation", 'Professional Liability', 'Commercial Auto', 'Other']
  };
  var VSTATUS = { NOT_VERIFIED: ['Not Verified', 'neutral'], UNDER_REVIEW: ['Under Review', 'info'], VERIFIED: ['Verified', 'success'], REJECTED: ['Rejected', 'danger'], REPLACEMENT_REQUIRED: ['Replacement Required', 'warning'], EXPIRED: ['Expired', 'danger'] };
  var VLABEL = { NOT_VERIFIED: 'Not Verified', UNDER_REVIEW: 'Pending Verification', VERIFIED: 'Verified', REJECTED: 'Rejected', REPLACEMENT_REQUIRED: 'Replacement Required' };
  var CHECKS = [['number', 'Policy number confirmed'], ['insured', 'Named insured confirmed'], ['entity', 'Covered entity confirmed'], ['coverage', 'Coverage requirement met'], ['dates', 'Effective dates valid'], ['carrier', 'Carrier information confirmed'], ['docs', 'Required documents received']];
  var DOC_TYPES = ['Policy Declaration', 'Certificate of Insurance', 'Proof of Coverage', 'Invoice', 'Payment Receipt', 'Endorsement', 'Renewal', 'Cancellation Notice', 'Claim Documentation'];
  var RESP = ['Owner', 'Tenant', 'Vendor', 'MGHPM', 'Other'];
  var today = function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  var daysTo = function (iso) { if (!iso) return null; var p = iso.split('-').map(Number); return Math.round((new Date(p[0], p[1] - 1, p[2]) - today()) / 86400000); };
  var status = function (p) { if (p.draft) return 'Draft'; var d = daysTo(p.exp); if (d !== null && d < 0) return 'Expired'; if (p.verif !== 'Verified') return 'Pending Verification'; if (d !== null && d <= 30) return 'Expiring Soon'; return 'Active'; };
  var vcode = function (p) { var d = daysTo(p.exp); if (d !== null && d < 0) return 'EXPIRED'; var m = { 'Verified': 'VERIFIED', 'Pending Verification': 'UNDER_REVIEW', 'Under Review': 'UNDER_REVIEW', 'Rejected': 'REJECTED', 'Replacement Required': 'REPLACEMENT_REQUIRED', 'Not Verified': 'NOT_VERIFIED' }; return m[p.verif] || 'NOT_VERIFIED'; };
  var DEF_ALERTS = [[90, 'Upcoming Renewal', 'info'], [60, 'Reminder', 'premium'], [30, 'Expiring Soon', 'warning'], [15, 'Escalation', 'danger'], [7, 'Critical', 'danger'], [0, 'Expired', 'danger']];
  var alerts = function () { var s = load().settings || {}; return (s.alerts || DEF_ALERTS).slice().sort(function (a, b) { return b[0] - a[0]; }); };
  var stage = function (p) { var d = daysTo(p.exp); if (d === null) return null; if (d < 0) return ['Compliance Alert', 'danger']; var a = alerts().filter(function (x) { return x[0] > 0 && d <= x[0]; }).pop(); return a ? [a[1] + ' • ' + a[0] + ' days', a[2]] : null; };
  var sym = function (c) { return c === 'DOP' ? 'RD$' : 'US$'; };
  var fmt = function (n, c) { if (window.MGH_PAY) return window.MGH_PAY.fmt(Number(n) || 0, c || 'USD'); return sym(c) + ' ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var fmtShort = function (n, c) { n = Number(n || 0); var s = sym(c); return n >= 1e6 ? s + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1e3 ? s + Math.round(n / 1e3) + 'K' : s + n; };
  function linesFor(p) {
    var c = Number(p.coverage) || 0, cur = p.currency || 'USD', S = sym(cur);
    var L = function (name, limit, ded) { return { name: name, limit: String(limit), deductible: ded || '—', status: 'Active' }; };
    if (p.type === 'Property / Dwelling') return [L('Dwelling', c, p.deductible), L('Liability', cur === 'DOP' ? 60000000 : 1000000, '—'), L('Contents', cur === 'DOP' ? 15000000 : 250000, cur === 'DOP' ? S + ' 150,000' : S + ' 2,500')];
    if (p.type === 'Flood') return [L('Building', c, p.deductible), L('Contents', Math.round(c * 0.1), p.deductible)];
    if (p.type === 'Hurricane / Windstorm') return [L('Windstorm — Dwelling', c, p.deductible), L('Loss of Rents', Math.round(c * 0.05), '14 days')];
    if (p.type === "Renter's Liability") return [L('Personal Liability', c, '—'), L('Personal Property', 25000, p.deductible), L('Loss of Use', 10000, '—')];
    if (p.type === 'General Liability') return [L('Each Occurrence', c, p.deductible), L('General Aggregate', c * 2, '—'), L('Products / Completed Ops', c * 2, '—')];
    if (p.type === "Workers' Compensation") return [L('Workers Compensation', 'Statutory', '—'), L("Employer's Liability", c, '—')];
    return [L(p.type, c, p.deductible)];
  }
  function norm(p) {
    if (p.v2) return p;
    var d = daysTo(p.exp);
    var x = Object.assign({ v2: 1, currency: 'USD', website: '', claims: '', coverages: null, endorsements: p.type === 'Property / Dwelling' ? 'Ordinance or Law (10%) • Water Backup' : '—', additionalInsured: p.entity === 'Property' || p.entity === 'Vendor' ? 'My Global Hub Property Management SRL' : '—', lossPayee: p.entity === 'Property' ? 'Lender on file (if applicable)' : '—', conditions: p.type === 'Hurricane / Windstorm' ? 'Named-storm deductible applies' : '—', exclusions: p.notes || '—', freq: 'Annual', due: p.eff, amountDue: p.pay === 'Paid' ? '0' : p.premium, paidDate: p.pay === 'Paid' ? p.eff : '', method: p.pay === 'Paid' ? 'Bank Transfer' : '', responsible: p.entity === 'Tenant' ? 'Tenant' : p.entity === 'Vendor' ? 'Vendor' : 'Owner', paymentId: p.pay === 'Paid' ? 'PAY-' + p.id.slice(-4) + '1' : '', checks: {}, docs: [], comms: [], verified_at: p.verif === 'Verified' ? p.eff : '', verify_source: p.verif === 'Verified' ? 'Certificate of Insurance' : '', nextReview: '' }, p);
    x.coverages = x.coverages || linesFor(x);
    if (x.verif === 'Verified') CHECKS.forEach(function (c) { x.checks[c[0]] = true; });
    if (!x.docs.length) { if (x.policy_file) x.docs.push({ type: 'Policy Declaration', name: x.policy_file, at: x.eff, by: 'Agent upload' }); if (x.proof_file) x.docs.push({ type: 'Certificate of Insurance', name: x.proof_file, at: x.eff, by: 'Agent upload' }); }
    if (x.id === 'INS-0006' && !x.comms.length) x.comms = [['2026-09-15', 'Renewal reminder sent to Owner', 'Email', 'Plata Investments Group'], ['2026-09-28', 'Updated certificate received', 'Inbox', 'Brown & Brown Agency'], ['2026-09-29', 'Additional information requested', 'Email', 'Brown & Brown Agency'], ['2026-09-30', 'Owner responded', 'Inbox', 'Plata Investments Group']].map(function (c) { return { at: Date.parse(c[0] + 'T10:00:00'), subject: c[1], channel: c[2], party: c[3] }; });
    return x;
  }
  var load = function () { try { var s = JSON.parse(sessionStorage.getItem(KEY)); if (s && s.policies) { SEED.forEach(function (p) { if (!s.policies.some(function (x) { return x.id === p.id; })) s.policies.push(p); }); REQS.forEach(function (r) { if (!s.reqs.some(function (x) { return x.id === r.id; })) s.reqs.push(r); }); s.policies = s.policies.map(norm); return s; } } catch (e) {} return { policies: SEED.map(norm), reqs: REQS.slice(), settings: { blockVendors: true, notifyParty: true, notifyAdmin: true } }; };
  var save = function (d) { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  var ownerOf = function (p) { return p.entity === 'Owner' ? p.ref : p.entity === 'Property' ? PROPERTY_OWNER[p.ref] : null; };
  var missing = function (d) { return d.reqs.filter(function (r) { return !r.waived && !d.policies.some(function (p) { return !p.draft && p.entity === r.entity && p.ref === r.ref && p.type === r.type && status(p) !== 'Expired'; }); }); };
  function get(id) { return load().policies.find(function (p) { return p.id === id; }) || null; }
  function nextId() { var n = Math.max.apply(null, load().policies.map(function (p) { return +String(p.id).replace(/\D/g, '') || 0; })) + 1; return 'INS-' + String(n).padStart(4, '0'); }
  function audit(p, action, detail, extra) { if (window.MGH_AUDIT) return window.MGH_AUDIT.record(Object.assign({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: action, module: 'Insurance', recordType: 'Insurance Policy', record: p.id + ' — ' + p.type + ' • ' + p.ref, recordId: p.id, category: 'Compliance', detail: detail }, extra || {})); }
  function put(p, action, detail, extra) { var d = load(), i = d.policies.findIndex(function (x) { return x.id === p.id; }); p.updated = Date.now(); if (i >= 0) d.policies[i] = p; else d.policies.unshift(p); save(d); if (action) audit(p, action, detail, extra); return p; }
  function primaryLimit(p) { var l = (p.coverages || [])[0]; return l && !isNaN(+l.limit) ? +l.limit : Number(p.coverage) || 0; }
  function reqsFor(p) { return load().reqs.filter(function (r) { return !r.waived && r.entity === p.entity && r.ref === p.ref; }).map(function (r) { var match = r.type === p.type, ok = match && (!r.min || primaryLimit(p) >= +r.min); return Object.assign({}, r, { match: match, ok: ok }); }); }
  function relations(p) {
    var out = [], own = ownerOf(p);
    if (p.entity === 'Property') { out.push({ role: 'Covered Property', kind: 'Property', name: p.ref, pid: PID[p.ref] }); if (own) out.push({ role: 'Named Insured', kind: 'Owner', name: own }); }
    if (p.entity === 'Owner') { out.push({ role: 'Named Insured', kind: 'Owner', name: p.ref }); Object.keys(PROPERTY_OWNER).filter(function (k) { return PROPERTY_OWNER[k] === p.ref; }).forEach(function (k) { out.push({ role: 'Covered Property', kind: 'Property', name: k, pid: PID[k] }); }); }
    if (p.entity === 'Tenant') { out.push({ role: 'Named Insured', kind: 'Tenant', name: p.ref }); if (p.lease) out.push({ role: 'Lease', kind: 'Lease', name: p.lease }); var cp = String(p.covered || '').split(' • ')[0]; if (PID[cp]) out.push({ role: 'Covered Property', kind: 'Property', name: cp, pid: PID[cp] }); }
    if (p.entity === 'Vendor') out.push({ role: 'Named Insured', kind: 'Vendor', name: p.ref });
    return out;
  }
  function addDoc(p, type, name) { p.docs = (p.docs || []).concat([{ type: type, name: name, at: new Date().toISOString().slice(0, 10), by: 'Marcus Vance' }]); if (type === 'Certificate of Insurance' || type === 'Proof of Coverage') p.proof_file = name; if (type === 'Policy Declaration') p.policy_file = name; try { var d = JSON.parse(sessionStorage.getItem(DKEY)) || []; d.push({ id: 'DOC-INS-' + String(Date.now()).slice(-6), pid: PID[p.ref] || PID[String(p.covered || '').split(' • ')[0]] || 0, policyId: p.id, related: p.id, person: p.insured, owner: ownerOf(p) || '', cat: 'Insurance', vis: 'Internal', name: name, meta: type + ' • ' + p.type + ' • ' + p.number, status: 'Uploaded', at: Date.now() }); sessionStorage.setItem(DKEY, JSON.stringify(d)); } catch (e) {} return p; }
  window.MGH_INS = { KEY: KEY, load: load, save: save, status: status, stage: stage, daysTo: daysTo, TYPES: TYPES, PROPERTY_OWNER: PROPERTY_OWNER, PID: PID, ownerOf: ownerOf, missing: missing, VSTATUS: VSTATUS, VLABEL: VLABEL, CHECKS: CHECKS, DOC_TYPES: DOC_TYPES, RESP: RESP, DEF_ALERTS: DEF_ALERTS, alerts: alerts, vcode: vcode, fmt: fmt, fmtShort: fmtShort, sym: sym, linesFor: linesFor, norm: norm, get: get, nextId: nextId, put: put, audit: audit, reqsFor: reqsFor, relations: relations, primaryLimit: primaryLimit, addDoc: addDoc };
})();
