// MGHPM Property Readiness engine — answers one question per property: "Is it really ready to market and be occupied?"
// READS source records (Owner 360, Insurance, Inspections, Maintenance Requests, Cleaning Jobs, STR configuration)
// and owns ONLY what no other module owns (utilities, keys & access, HOA, safety, assets, marketing checks, reviews, history).
(function () {
  if (window.MGH_READY) return;
  var RKEY = 'mghpm.readiness.v1';
  var J = function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  var put = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var TODAY = function () { var d = new Date(); return d.toISOString().slice(0, 10); };
  var days = function (iso) { return Math.round((new Date(iso + 'T12:00:00') - new Date(TODAY() + 'T12:00:00')) / 864e5); };
  var M = { owner: 'Master 25 - Owner Profile.dc.html', ins: 'Master 27 - Insurance and Compliance.dc.html', insp: 'Master 10 - Digital Inspection.dc.html', req: 'Master 14 - Maintenance Requests.dc.html', clean: 'Master 22 - Supplies and Inventory.dc.html?tab=jobs', prop: 'Master 04 - Property Detail.dc.html', form: 'Master 20 - Property Form.dc.html', docs: 'Master 12 - Documents.dc.html', str: 'Master 21 - Settings.dc.html?section=reservations', self: 'Master 36 - Property Readiness.dc.html' };
  var PROPS = [
    [1, 'Brickell Bay Residences', 'MGH-BBR-001', 'apartment_condo', '1200 Brickell Bay Dr', 'Miami', 48, 46, 'active', 'occupied', 3850],
    [2, 'Ocean View Villa', 'MGH-OVV-002', 'residential', '2501 Collins Ave', 'Miami Beach', 12, 11, 'active', 'occupied', 4200],
    [3, 'Coral Gables Terrace', 'MGH-CGT-003', 'apartment_condo', '300 Alhambra Cir', 'Coral Gables', 36, 34, 'active', 'occupied', 3450],
    [4, 'Las Olas Lofts', 'MGH-LOL-004', 'mixed', '401 E Las Olas Blvd', 'Fort Lauderdale', 24, 22, 'active', 'occupied', 2980],
    [5, 'Wynwood Commons', 'MGH-WWC-005', 'mixed', '250 NW 23rd St', 'Miami', 18, 15, 'active', 'maintenance', 2650],
    [6, 'Sunset Beach House', 'MGH-SBH-006', 'residential', '7800 Atlantic Way', 'Miami Beach', 1, 0, 'active', 'vacant', 9500],
    [7, 'Mar de Plata I', 'MGH-MDP-007', 'apartment_condo', '6365 Collins Ave', 'Miami Beach', 20, 19, 'active', 'occupied', 3100],
    [8, 'Mar de Plata II', 'MGH-MDP-008', 'apartment_condo', '6345 Collins Ave', 'Miami Beach', 20, 18, 'active', 'occupied', 3050],
    [9, 'Key Biscayne Retreat', 'MGH-KBR-009', 'residential', '180 Harbor Dr', 'Key Biscayne', 1, 1, 'active', 'occupied', 12500],
    [10, 'Doral Business Center', 'MGH-DBC-010', 'commercial', '8200 NW 41st St', 'Doral', 10, 8, 'active', 'occupied', 5400],
    [11, 'Coconut Grove Cottages', 'MGH-CGC-011', 'residential', '3300 Mary St', 'Miami', 6, 6, 'active', 'occupied', 3750],
    [12, 'Hollywood Boardwalk Suites', 'MGH-HBS-012', 'apartment_condo', '101 N Ocean Dr', 'Hollywood', 14, 12, 'active', 'occupied', 2850],
    [13, 'Aventura Park Tower', 'MGH-APT-013', 'apartment_condo', '19355 Turnberry Way', 'Aventura', 30, 30, 'active', 'occupied', 3600],
    [14, 'Little Havana Flats', 'MGH-LHF-014', 'residential', '1550 SW 8th St', 'Miami', 8, 5, 'active', 'maintenance', 1950],
    [15, 'Hialeah Industrial Park', 'MGH-HIP-015', 'industrial', '7500 W 20th Ave', 'Hialeah', 4, 3, 'active', 'occupied', 6800],
    [16, 'Homestead Land Parcel', 'MGH-HLP-016', 'land', '28000 SW 152nd Ave', 'Homestead', 0, 0, 'draft', 'vacant', 0],
    [17, 'North Bay Village Residences', 'MGH-NBV-017', 'apartment_condo', '7900 Harbor Island Dr', 'North Bay Village', 16, 0, 'inactive', 'vacant', 2700],
    [18, 'Pompano Beach Duplex', 'MGH-PBD-018', 'residential', '2400 NE 16th St', 'Pompano Beach', 2, 2, 'active', 'occupied', 2400]
  ].map(function (r) { return { id: r[0], title: r[1], code: r[2], type: r[3], address: r[4], city: r[5], units: r[6], occupied: r[7], record: r[8], occ: r[9], rent: r[10] }; });
  var OWNER_OF = { 9: 'Harbor Drive Holdings LLC', 10: 'Doral Commerce Partners LLC', 11: 'Grove Cottages LLC', 12: 'Boardwalk Suites LLC', 14: 'Calle Ocho Properties LLC', 15: 'Hialeah Industrial REIT', 17: 'Harbor Island Partners LP', 18: 'Daniel & Rosa Méndez' };
  // Owner 360 summaries for owners whose full profile is not yet loaded in this session (Alvarez reads the live Owner 360 store).
  var OWNER_SEED = {
    'Alvarez Family Trust': { type: 'Trust', identity: 'Verified', entity: 'Verified', rep: 'Verified', own: { 1: { status: 'Verified', d_title: true, pct: '100' }, 2: { status: 'Verified', d_title: true, pct: '100' }, 6: { status: 'In Review', d_title: true, pct: '75', coowners: 'Isabel Alvarez (25%)', d_coauth: false, poa_applies: true, d_poa: true } }, agreement: { ma_id: 'MA-2026-0012', status: 'Active', commission: '8', file: 'Management Agreement — Alvarez.pdf' }, limits: { auto_up_to: '500', emergency: '2500' } },
    'Plata Investments Group': { type: 'LLC', identity: 'Verified', entity: 'Verified', rep: 'Verified', agreement: { ma_id: 'MA-2025-0031', status: 'Active', commission: '7', file: 'Management Agreement — Plata.pdf' }, limits: { auto_up_to: '750', emergency: '3000' } },
    'Las Olas Partners LP': { type: 'Partnership', identity: 'Verified', entity: 'Verified', rep: 'Verified', agreement: { ma_id: 'MA-2025-0019', status: 'Active', commission: '7.5', file: 'Management Agreement — Las Olas.pdf' }, limits: { auto_up_to: '600', emergency: '2500' } },
    'Turnberry Capital Trust': { type: 'Trust', identity: 'Verified', entity: 'Verified', rep: 'Verified', agreement: { ma_id: 'MA-2024-0044', status: 'Active', commission: '6.5', file: 'Management Agreement — Turnberry.pdf' }, limits: { auto_up_to: '1000', emergency: '5000' } },
    'Southland Land Co.': { type: 'LLC', identity: 'Pending', entity: 'Not Started', rep: 'Not Started', own: { 16: { status: 'Not Started', d_title: false } }, agreement: null, limits: {} },
    'Harbor Island Partners LP': { type: 'Partnership', identity: 'Verified', entity: 'Verified', rep: 'Verified', agreement: { ma_id: 'MA-2026-0007', status: 'Suspended', commission: '8', file: 'Management Agreement — Harbor Island.pdf' }, limits: { auto_up_to: '500', emergency: '2500' } },
    'Daniel & Rosa Méndez': { type: 'Individual', identity: 'Verified', entity: 'N/A', rep: 'N/A', agreement: { ma_id: 'MA-2026-0021', status: 'Active', commission: '9', file: 'Management Agreement — Méndez.pdf' }, limits: { auto_up_to: '400', emergency: '2000' } }
  };
  var DEF_OWNER = { type: 'LLC', identity: 'Verified', entity: 'Verified', rep: 'Verified', agreement: { ma_id: 'MA-2025-0010', status: 'Active', commission: '8', file: 'Management Agreement.pdf' }, limits: { auto_up_to: '500', emergency: '2500' } };
  // Fallbacks mirroring the module seeds, used only when that module has not saved its store this session.
  var REQ_SEED = [[1044, 'Bathroom exhaust fan making loud noise', 1, 'Unit 1204', 'medium', 'open'], [1042, 'Water leak under kitchen sink', 1, 'Unit 1507', 'urgent', 'in_progress'], [1041, 'A/C not cooling — master bedroom', 2, 'Unit 204', 'high', 'pending_approval'], [1039, 'Pool pump replacement', 3, 'Common Area', 'medium', 'in_progress'], [1036, 'Front door smart lock offline', 4, 'Unit 9', 'high', 'in_progress'], [1033, 'Dishwasher not draining', 5, 'Unit 2A', 'low', 'open'], [1046, 'Electrical panel replacement — scorch marks', 14, 'Unit 3', 'urgent', 'open'], [1047, 'Repaint hallway — water stains', 14, 'Common Area', 'low', 'open'], [1048, 'Gate remote receiver intermittent', 6, 'Main', 'medium', 'open']].map(function (r) { return { id: r[0], title: r[1], pid: r[2], unit: r[3], priority: r[4], status: r[5] }; });
  var JOB_SEED = [{ id: 'CJ-2026-0135', title: 'Initial Property Preparation', pid: 11, date: '2026-10-02', labor: 650, supplies: 105 }, { id: 'CJ-2026-0140', title: 'Move-Out Deep Cleaning', pid: 2, date: '2026-10-04', labor: 280, supplies: 49 }, { id: 'CJ-2026-0138', title: 'Turnover Cleaning', pid: 7, date: '2026-10-04', labor: 140, supplies: 28 }, { id: 'CJ-2026-0141', title: 'Turnover Cleaning + Linen Change', pid: 6, date: '2026-10-04', labor: 220, supplies: 0 }, { id: 'CJ-2026-0142', title: 'Initial Deep Cleaning', pid: 18, date: '2026-09-29', labor: 360, supplies: 64 }, { id: 'CJ-2026-0143', title: 'Initial Deep Cleaning', pid: 14, date: '2026-10-08', labor: 480, supplies: 90, scheduled: true }];
  var STR_PIDS = { 1: 'Both', 2: 'Both', 4: 'Both', 6: 'Short-Term', 7: 'Both', 8: 'Both', 13: 'Both' };
  var KEY_TYPES = ['Front door keys', 'Bedroom keys', 'Gate remotes', 'Access cards', 'Mailbox keys', 'Parking remotes', 'Smart lock', 'Lockbox'];
  function baseRec(p) {
    var ok = p.record === 'active';
    var furnished = !!STR_PIDS[p.id];
    var k = function (type, qty, ref, loc, tested, assigned) { return { type: type, qty: qty, ref: ref, loc: loc, tested: tested, assigned: assigned }; };
    return {
      mode: p.type === 'land' ? 'None' : STR_PIDS[p.id] || 'Long-Term',
      inspection: ok ? { id: 'INS-2026-0' + (200 + p.id), status: 'completed', date: '2026-0' + (1 + (p.id % 8)) + '-1' + (p.id % 9), photos: 30 + p.id * 3, report: true, critical: 0, reviewed: true } : { status: 'not_started', photos: 0, report: false, critical: 0, reviewed: false },
      insurance: ok ? 'on_file' : 'none',
      utilities: { electricity: ok ? 'complete' : 'pending', water: ok ? 'complete' : 'pending', internet: ok ? 'complete' : 'pending', gas: p.type === 'residential' ? (ok ? 'complete' : 'pending') : 'na', generator: 'na', meter: 'FPL-' + (4400 + p.id * 13) + '-' + (1000 + p.id * 7), reading: ok ? String(18000 + p.id * 211) : '', photo: ok, billing: furnished ? 'Per reservation (STR configuration)' : 'Tenant pays utility directly', waterProvider: p.city === 'Miami Beach' ? 'City of Miami Beach Public Works' : p.city === 'Fort Lauderdale' ? 'City of Fort Lauderdale Utilities' : 'Miami-Dade Water & Sewer', internetProvider: 'Xfinity Business • 500 Mbps' },
      keys: ok ? [k('Front door keys', p.units > 1 ? p.units * 2 : 3, 'KD-' + p.code.slice(4, 7) + '-01', 'MGHPM key cabinet • Brickell office, slot ' + p.id, true, 'Office'), k('Mailbox keys', Math.max(1, p.units), 'MB-' + p.id, 'Key cabinet slot ' + p.id, true, 'Office'), k('Parking remotes', Math.max(1, Math.round(p.units / 2)), 'PR-' + p.id, 'Key cabinet slot ' + p.id, true, 'Office')].concat(furnished ? [k('Smart lock', 1, 'Schlage Encode • SL-' + p.id, 'Installed at entry', true, 'Codes per reservation')] : []) : [],
      hoa: { applies: ['apartment_condo', 'mixed'].indexOf(p.type) >= 0, name: p.title + ' Condominium Association', contact: 'Board manager • (305) 555-02' + String(10 + p.id), rules: true, parking: true, strAllowed: !!STR_PIDS[p.id], registration: true, pool: true, quiet: '10:00 PM – 8:00 AM', access: true, docs: true },
      safety: { smoke: ok ? 'ok' : 'pending', extinguisher: ok ? 'ok' : 'pending', lighting: ok ? 'ok' : 'pending', locks: ok ? 'ok' : 'pending', railings: ['apartment_condo', 'mixed'].indexOf(p.type) >= 0 ? (ok ? 'ok' : 'pending') : 'na', gas: p.type === 'residential' ? (ok ? 'ok' : 'pending') : 'na', pool: p.id === 6 || p.id === 3 ? (ok ? 'ok' : 'pending') : 'na', contacts: ok ? 'ok' : 'pending', hazards: ok ? 'ok' : 'pending' },
      assets: furnished ? [['Furniture', 24, 'Good'], ['Appliances', 8, 'Good'], ['TVs', 3, 'Good'], ['A/C units', 4, 'Good'], ['Kitchen items', 85, 'Good'], ['Linens & towels', 40, 'New'], ['Electronics', 5, 'Good']].map(function (a) { return { cat: a[0], count: a[1], cond: a[2], photos: true }; }) : [],
      rental: { lt: p.type === 'land' ? null : { rent: p.rent, deposit: p.rent * 2, term: '12 months', pets: 'Up to 2 pets • US$500 deposit', utilities: 'Tenant pays electricity & internet', parking: '1 assigned space', occupancy: '2 per bedroom', reqs: 'Credit 650+, income 3× rent, background check' } },
      marketing: { photos: ok, hero: ok, title: ok, desc: ok, amenities: ok, map: ok, pricing: ok, availability: ok, rules: ok, contact: ok, listing: ok },
      review: ok ? { approved: true, by: 'Sofia Ramos', at: Date.parse('2026-0' + (1 + (p.id % 8)) + '-2' + (p.id % 9) + 'T15:00:00'), notes: 'Initial readiness approved at onboarding.' } : null,
      hold: p.record === 'inactive' ? 'Owner paused onboarding pending 40-year building recertification.' : '',
      ownerDocs: {}, history: []
    };
  }
  var OVERRIDES = {
    5: function (r) { r.insurance = 'missing'; r.safety.extinguisher = 'pending'; r.review = null; },
    6: function (r) { r.keys = r.keys.map(function (k) { return k; }).concat([{ type: 'Gate remotes', qty: 2, ref: 'GR-SBH-2', loc: 'Lockbox at side gate', tested: false, assigned: 'Unassigned' }, { type: 'Lockbox', qty: 1, ref: 'Master Lock 5440 • code on file', loc: 'Side gate', tested: true, assigned: 'Staff' }]); r.marketing.availability = false; r.review = null; r.history = [{ at: Date.parse('2026-09-21T10:00:00'), text: 'Readiness opened for Sunset Beach House (Short-Term)', by: 'Marcus Vance' }, { at: Date.parse('2026-09-26T14:00:00'), text: 'Initial inspection INS-2026-0206 completed • 51 photos', by: 'Luis Herrera' }]; },
    9: function (r) { r.marketing.photos = false; r.marketing.hero = false; r.keys[0].tested = false; r.review = null; },
    14: function (r) { r.inspection.critical = 2; r.safety.smoke = 'issue'; r.utilities.electricity = 'in_progress'; r.review = null; r.marketing.photos = false; },
    16: function (r) { r.mode = 'None'; r.hoa.applies = false; },
    17: function (r) { r.review = null; },
    18: function (r) { r.review = null; r.history = [{ at: Date.parse('2026-09-18T09:00:00'), text: 'Management takeover started • readiness opened', by: 'Marcus Vance' }, { at: Date.parse('2026-09-29T17:00:00'), text: 'Initial deep cleaning CJ-2026-0142 completed', by: 'SparkleClean Miami' }, { at: Date.parse('2026-10-03T11:00:00'), text: 'All keys tested and stored • slot 18', by: 'Luis Herrera' }]; }
  };
  function store() { var s = J(RKEY); if (!s) { s = {}; PROPS.forEach(function (p) { var r = baseRec(p); if (OVERRIDES[p.id]) OVERRIDES[p.id](r); s[p.id] = r; }); put(RKEY, s); } return s; }
  function rec(pid) { return store()[pid]; }
  function save(pid, r, text) { var s = store(); if (text && window.MGH_AUDIT) { var pp = PROPS.find(function (x) { return x.id === +pid; }); window.MGH_AUDIT.record({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: /Approved/.test(text) ? 'APPROVE' : /withdrawn/.test(text) ? 'OVERRIDE' : 'UPDATE', reason: /withdrawn/.test(text) ? text.split('• ').pop() : undefined, module: 'Property Readiness', recordType: 'Property', record: pp ? pp.title : 'PR-' + pid, recordId: 'PROP-' + String(pid).padStart(3, '0'), category: 'Property', detail: text }); } if (text && !window.MGH_AUDIT) r.history = (r.history || []).concat([{ at: Date.now(), text: text, by: 'Marcus Vance' }]); s[pid] = r; put(RKEY, s); }
  function props() { var saved = J('mghpm.properties.v1') || {}; var extra = Array.isArray(saved.added) ? saved.added : []; return PROPS.concat(extra.filter(function (x) { return x && x.id && !PROPS.some(function (p) { return p.id === x.id; }); }).map(function (x) { return { id: x.id, title: x.title, code: x.code || 'MGH-NEW-' + x.id, type: x.type || 'residential', address: x.address || '', city: x.city || '', units: x.units || 1, occupied: 0, record: 'draft', occ: 'vacant', rent: +x.rent || 0 }; })); }
  function ownerName(p) { var ins = window.MGH_INS; return OWNER_OF[p.id] || (ins && ins.PROPERTY_OWNER[p.title]) || 'Unassigned Owner'; }
  function ownerRec(name) { var live = (J('mghpm.owner360.v1') || {})[name]; var seed = OWNER_SEED[name] || DEF_OWNER; if (!live) return seed; return { type: (live.entity && live.entity.owner_type) || seed.type, identity: (live.identity && live.identity.status) || seed.identity, entity: (live.entity && live.entity.verif) || seed.entity, rep: seed.rep, own: live.own || seed.own, agreement: live.agreement || seed.agreement, limits: live.limits || seed.limits, live: true }; }
  function requests() { var s = J('mghpm.requests.v1'); var q = J('mghpm.requests.inbox.v1') || []; return q.concat((s && s.reqs) || REQ_SEED); }
  function jobs() { var s = J('mghpm.supplies.v1'); return (s && Array.isArray(s.jobs) ? s.jobs.map(function (j) { return { id: j.id, title: j.title, pid: j.pid, date: j.date, labor: +j.labor || 0, supplies: (j.supplies || []).reduce(function (t, x) { return t + (Array.isArray(x) ? (+x[1] || 0) * (+x[2] || 0) : 0); }, 0), scheduled: j.status === 'scheduled' }; }) : []).concat(JOB_SEED.filter(function (j) { return !(s && s.jobs || []).some(function (x) { return x.id === j.id; }); })); }
  var LV = { BLOCKER: 'BLOCKER', REQUIRED: 'REQUIRED', RECOMMENDED: 'RECOMMENDED', OPTIONAL: 'OPTIONAL' };
  function I(key, label, level, state, detail, o) { return Object.assign({ key: key, label: label, level: level, state: state, detail: detail || '' }, o || {}); }
  var st = function (b, partial) { return b ? 'complete' : partial ? 'in_progress' : 'pending'; };
  function build(pid) {
    var p = props().find(function (x) { return x.id === +pid; }); if (!p) return null;
    var r = rec(p.id) || baseRec(p), on = ownerName(p), o = ownerRec(on), S = window.MGH_STR_DATA, ins = window.MGH_INS;
    var stay = S ? S.STAYS.find(function (x) { return x.pid === p.id; }) : null;
    var isSTR = r.mode === 'Short-Term' || r.mode === 'Both', isLT = r.mode === 'Long-Term' || r.mode === 'Both', land = p.type === 'land';
    var oh = M.owner + '?owner=' + encodeURIComponent(on);
    var secs = [];
    // A. Owner & Authority
    var ent = o.type !== 'Individual';
    secs.push({ key: 'owner', title: 'Owner & Authority', icon: 'user-check', src: 'Owner 360', href: oh, ownerView: false, items: [
      I('created', 'Owner created', LV.REQUIRED, on !== 'Unassigned Owner' ? 'complete' : 'pending', on),
      I('identity', 'Owner identity verified', LV.BLOCKER, o.identity === 'Verified' ? 'complete' : o.identity === 'Pending' || o.identity === 'In Review' ? 'in_progress' : 'pending', 'Identity ' + String(o.identity).toLowerCase(), { href: oh + '&tab=identity' }),
      I('entity', 'Entity verification', ent ? LV.REQUIRED : LV.OPTIONAL, !ent ? 'na' : o.entity === 'Verified' ? 'complete' : 'pending', ent ? o.type + ' • ' + o.entity : 'Individual owner'),
      I('rep', 'Authorized representative verified', ent ? LV.REQUIRED : LV.OPTIONAL, !ent ? 'na' : o.rep === 'Verified' ? 'complete' : 'pending', ent ? 'Representative ' + String(o.rep).toLowerCase() : '')] });
    // B. Ownership
    var ow = (o.own && o.own[p.id]) || { status: o.identity === 'Verified' ? 'Verified' : 'Not Started', d_title: o.identity === 'Verified', pct: '100' };
    var ownerSub = r.ownerDocs && r.ownerDocs.ownership;
    secs.push({ key: 'ownership', title: 'Ownership Verification', icon: 'file-check', src: 'Owner 360 › Ownership', href: oh + '&tab=ownership', ownerView: true, items: [
      I('title', 'Certificate of Title received', LV.BLOCKER, ow.d_title ? 'complete' : ownerSub ? 'in_progress' : 'pending', ow.d_title ? (ow.title_no || 'On file') : ownerSub ? 'Submitted by owner — under review' : 'Not received', { ownerAction: !ow.d_title }),
      I('registered', 'Registered owner verified', LV.BLOCKER, ow.status === 'Verified' ? 'complete' : ow.status === 'In Review' ? 'in_progress' : 'pending', 'Title verification ' + String(ow.status).toLowerCase()),
      I('pct', 'Ownership percentage confirmed', LV.REQUIRED, ow.pct ? 'complete' : 'pending', ow.pct ? ow.pct + '%' + (ow.coowners ? ' • co-owner ' + ow.coowners : '') : ''),
      I('poa', 'Power of attorney', ow.poa_applies ? LV.REQUIRED : LV.OPTIONAL, !ow.poa_applies ? 'na' : ow.d_poa ? 'complete' : 'pending', ow.poa_applies ? (ow.d_poa ? 'Received' : 'Required') : 'Not applicable'),
      I('coauth', 'Co-owner authorization', ow.coowners ? LV.BLOCKER : LV.OPTIONAL, !ow.coowners ? 'na' : ow.d_coauth ? 'complete' : ownerSub ? 'in_progress' : 'pending', ow.coowners ? (ow.d_coauth ? 'Signed' : 'Not received • ' + ow.coowners) : 'Single owner', { ownerAction: !!ow.coowners && !ow.d_coauth })] });
    // C. Management Agreement
    var ag = o.agreement, lim = o.limits || {};
    secs.push({ key: 'agreement', title: 'Management Agreement', icon: 'file-signature', src: 'Owner 360 › Agreement', href: oh + '&tab=agreement', ownerView: true, items: [
      I('created', 'Agreement created', LV.BLOCKER, ag && ag.ma_id ? 'complete' : 'pending', ag ? ag.ma_id : 'No agreement record'),
      I('fees', 'Fees configured', LV.REQUIRED, ag && ag.commission ? 'complete' : 'pending', ag && ag.commission ? ag.commission + '% management fee' : ''),
      I('limits', 'Approval limits configured', LV.REQUIRED, lim.auto_up_to ? 'complete' : 'pending', lim.auto_up_to ? 'Auto-approve up to US$' + lim.auto_up_to : ''),
      I('repairs', 'Repair authorization configured', LV.REQUIRED, lim.emergency ? 'complete' : 'pending', lim.emergency ? 'Emergency authority US$' + lim.emergency : ''),
      I('signed', 'Agreement signed', LV.BLOCKER, ag && ag.file ? 'complete' : 'pending', ag && ag.file ? ag.file : ''),
      I('active', 'Agreement active', LV.BLOCKER, ag && ag.status === 'Active' ? 'complete' : ag && ag.status ? 'blocked' : 'pending', ag ? 'Status: ' + ag.status : '')] });
    // D. Insurance
    var pol = ins ? ins.load().policies.filter(function (x) { return x.entity === 'Property' && x.ref === p.title; }) : [];
    var expired = pol.filter(function (x) { return ins.status(x) === 'Expired'; }), soon = pol.filter(function (x) { return ins.status(x) === 'Expiring Soon'; });
    var insReq = !land, insMissing = insReq && !pol.length && r.insurance !== 'on_file';
    var insOwnerSub = r.ownerDocs && r.ownerDocs.insurance;
    secs.push({ key: 'insurance', title: 'Insurance', icon: 'umbrella', src: 'Insurance & Compliance', href: M.ins + '?q=' + encodeURIComponent(p.title), ownerView: true, items: insReq ? [
      I('required', 'Property insurance required', LV.REQUIRED, 'complete', 'Required by Management Agreement'),
      I('received', 'Policy received', LV.BLOCKER, pol.length || r.insurance === 'on_file' ? 'complete' : insOwnerSub ? 'in_progress' : 'pending', pol.length ? pol.map(function (x) { return x.type + ' • ' + x.number; }).join(', ') : r.insurance === 'on_file' ? 'Owner-carried policy on file' : insOwnerSub ? 'Submitted by owner — under review' : 'No policy on file', { ownerAction: insMissing }),
      I('verified', 'Policy verified', LV.REQUIRED, insMissing ? 'pending' : pol.length && pol.some(function (x) { return x.verif !== 'Verified'; }) ? 'in_progress' : 'complete', pol.filter(function (x) { return x.verif !== 'Verified'; }).map(function (x) { return x.number + ' ' + x.verif.toLowerCase(); }).join(', ') || (insMissing ? '' : 'Verified')),
      I('expiry', 'Expiration valid', LV.BLOCKER, insMissing ? 'pending' : expired.length ? 'blocked' : 'complete', expired.length ? expired.map(function (x) { return x.number + ' expired ' + x.exp; }).join(', ') : soon.length ? soon.map(function (x) { return x.number + ' expires ' + x.exp; }).join(', ') : 'All policies current'),
      I('coverage', 'Coverage requirement satisfied', LV.REQUIRED, insMissing || expired.length ? 'pending' : 'complete', insMissing ? '' : 'Dwelling + liability meet agreement minimums')] : [I('required', 'Property insurance required', LV.OPTIONAL, 'na', 'Not required for vacant land')] });
    // E. Initial Inspection
    var ip = r.inspection || {}, ipDone = ip.status === 'completed';
    if (p.id === 2 && J('mghpm.inspection.v2.INS-2026-0311')) { ipDone = true; ip = Object.assign({}, ip, { id: 'INS-2026-0311', status: 'completed' }); }
    secs.push({ key: 'inspection', title: 'Initial Inspection', icon: 'clipboard-check', src: 'Inspections', href: M.insp + (ip.id ? '?id=' + ip.id : ''), ownerView: true, items: land ? [I('scheduled', 'Initial inspection', LV.OPTIONAL, 'na', 'Not applicable to vacant land')] : [
      I('scheduled', 'Initial inspection scheduled', LV.REQUIRED, ip.status && ip.status !== 'not_started' ? 'complete' : 'pending', ip.date ? ip.id + ' • ' + ip.date : 'Not scheduled'),
      I('completed', 'Inspection completed', LV.BLOCKER, ipDone ? 'complete' : ip.status === 'scheduled' ? 'in_progress' : 'pending', ipDone ? 'Completed ' + (ip.date || '') : ''),
      I('photos', 'Photos uploaded', LV.REQUIRED, ip.photos > 0 ? 'complete' : 'pending', ip.photos ? ip.photos + ' photos' : ''),
      I('report', 'Condition report complete', LV.REQUIRED, ip.report ? 'complete' : 'pending', ''),
      I('critical', 'Critical issues identified', LV.REQUIRED, ipDone && ip.reviewed !== false ? 'complete' : 'pending', ipDone ? (ip.critical ? ip.critical + ' critical issue' + (ip.critical > 1 ? 's' : '') + ' → Maintenance Requests' : 'No critical issues') : ''),
      I('stored', 'Inspection report stored', LV.REQUIRED, ip.report ? 'complete' : 'pending', ip.report ? 'Document Center • Inspections' : '', { href: M.docs })] });
    // F. Repairs & Maintenance
    var open = requests().filter(function (q) { return q.pid === p.id && ['completed', 'cancelled'].indexOf(q.status) < 0; });
    var by = function (pr) { return open.filter(function (q) { return pr.indexOf(q.priority) >= 0; }); };
    var crit = by(['urgent']), high = by(['high']), cos = by(['medium', 'low']);
    var highBlocks = !!(J('mghpm.readiness.settings.v1') || {}).highBlocks;
    secs.push({ key: 'repairs', title: 'Repairs & Maintenance', icon: 'wrench', src: 'Maintenance Requests', href: M.req + '?property=' + p.id, ownerView: true, items: [
      I('critical', 'Critical repairs', LV.BLOCKER, crit.length ? 'blocked' : 'complete', crit.length + ' open' + (crit.length ? ' • ' + crit.map(function (q) { return '#' + q.id + ' ' + q.title; }).join(', ') : ''), { count: crit.length }),
      I('high', 'High-priority repairs', highBlocks ? LV.BLOCKER : LV.REQUIRED, high.length ? 'in_progress' : 'complete', high.length + ' open' + (high.length ? ' • ' + high.map(function (q) { return '#' + q.id + ' ' + q.title; }).join(', ') : ''), { count: high.length }),
      I('cosmetic', 'Cosmetic & routine repairs', LV.RECOMMENDED, cos.length ? 'in_progress' : 'complete', cos.length + ' open', { count: cos.length })] });
    // G. Cleaning
    var cj = jobs().filter(function (j) { return j.pid === p.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    secs.push({ key: 'cleaning', title: 'Cleaning', icon: 'spray-can', src: 'Cleaning Jobs', href: M.clean, ownerView: true, items: land ? [I('initial', 'Initial cleaning', LV.OPTIONAL, 'na', 'Not applicable')] : [
      I('initial', 'Initial cleaning complete', LV.REQUIRED, cj ? (cj.scheduled ? 'in_progress' : 'complete') : p.record === 'active' && p.occupied ? 'complete' : 'pending', cj ? cj.id + ' • ' + cj.title + ' • ' + (cj.scheduled ? 'Scheduled ' : '') + cj.date : p.record === 'active' && p.occupied ? 'Completed at onboarding' : 'No cleaning job'),
      I('checklist', 'Checklist complete', LV.REQUIRED, cj && !cj.scheduled || (!cj && p.occupied) ? 'complete' : 'pending', ''),
      I('photos', 'Before & after photos', LV.RECOMMENDED, cj && !cj.scheduled || (!cj && p.occupied) ? 'complete' : 'pending', ''),
      I('cost', 'Cost posted to property expense', LV.RECOMMENDED, cj && !cj.scheduled ? 'complete' : cj ? 'pending' : 'na', cj ? 'Supplies US$' + cj.supplies.toFixed(2) + ' • Labor US$' + cj.labor.toFixed(2) + ' • Responsibility: Owner' : '')] });
    // H. Utilities (readiness-owned)
    var u = r.utilities || {}, ec = S && isSTR ? S.elecCfg(p.id) : null;
    secs.push({ key: 'utilities', title: 'Utilities', icon: 'zap', src: 'Readiness record', editable: true, ownerView: true, items: land ? [I('electricity', 'Utilities', LV.OPTIONAL, 'na', 'No structures')] : [
      I('electricity', 'Electricity active', LV.REQUIRED, u.electricity, 'Meter ' + u.meter + (u.reading ? ' • initial reading ' + u.reading + ' kWh' : '') + (u.photo ? ' • meter photo' : '') + ' • ' + u.billing, { editable: true }),
      I('water', 'Water active', LV.REQUIRED, u.water, u.waterProvider, { editable: true }),
      I('internet', 'Internet installed', isSTR ? LV.REQUIRED : LV.OPTIONAL, u.internet, u.internetProvider, { editable: true }),
      I('gas', 'Gas ready', LV.OPTIONAL, u.gas, u.gas === 'na' ? 'No gas service' : 'TECO Peoples Gas', { editable: true }),
      I('generator', 'Generator / inverter tested', LV.OPTIONAL, u.generator, u.generator === 'na' ? 'Not installed' : 'Monthly test', { editable: true })].concat(isSTR ? [I('strElec', 'Guest electricity billing configured', LV.REQUIRED, ec ? 'complete' : 'pending', ec ? (S.ELEC_METHODS[ec.method] || [ec.method])[0] + (ec.rate ? ' • US$' + ec.rate + '/kWh' : '') : '', { href: M.str })] : []) });
    // I. Keys & Access
    var keys = r.keys || [];
    secs.push({ key: 'keys', title: 'Keys & Access', icon: 'key-round', src: 'Readiness record', editable: true, keysTable: true, ownerView: false, items: land ? [I('inv', 'Keys & access', LV.OPTIONAL, 'na', 'Gate code only')] : [
      I('inv', 'Keys inventoried', LV.REQUIRED, keys.length ? 'complete' : 'pending', keys.length ? keys.reduce(function (t, k) { return t + (+k.qty || 0); }, 0) + ' items across ' + keys.length + ' types' : 'No keys recorded'),
      I('tested', 'All keys & devices tested', LV.REQUIRED, keys.length && keys.every(function (k) { return k.tested; }) ? 'complete' : keys.length ? 'in_progress' : 'pending', keys.filter(function (k) { return !k.tested; }).map(function (k) { return k.type + ' untested'; }).join(', ') || (keys.length ? 'All tested' : '')),
      I('stored', 'Storage location recorded', LV.REQUIRED, keys.length && keys.every(function (k) { return k.loc; }) ? 'complete' : 'pending', ''),
      I('smart', 'Smart lock / lockbox configured', isSTR ? LV.REQUIRED : LV.RECOMMENDED, keys.some(function (k) { return /Smart lock|Lockbox/.test(k.type); }) ? 'complete' : isSTR ? 'pending' : 'na', isSTR ? 'Codes issued per reservation' : 'Optional for long-term')] });
    // J. HOA
    var h = r.hoa || {};
    secs.push({ key: 'hoa', title: 'HOA / Community', icon: 'landmark', src: 'Readiness record', editable: true, ownerView: false, items: !h.applies ? [I('applies', 'HOA / community association', LV.OPTIONAL, 'na', 'Not under an HOA')] : [
      I('identified', 'HOA identified & contact', LV.REQUIRED, h.name && h.contact ? 'complete' : 'pending', h.name + ' • ' + h.contact, { editable: true, field: 'contact' }),
      I('rules', 'HOA rules received', LV.REQUIRED, st(h.rules), 'Quiet hours ' + h.quiet, { editable: true, field: 'rules' }),
      I('parking', 'Parking rules received', LV.REQUIRED, st(h.parking), '', { editable: true, field: 'parking' }),
      I('str', 'Short-term rentals allowed', isSTR ? LV.BLOCKER : LV.OPTIONAL, !isSTR ? 'na' : h.strAllowed ? 'complete' : 'blocked', isSTR ? (h.strAllowed ? 'Permitted • minimum stays per HOA' : 'HOA prohibits STR') : 'Long-term only', { editable: isSTR, field: 'strAllowed' }),
      I('registration', 'Guest / tenant registration requirements', LV.REQUIRED, st(h.registration), '', { editable: true, field: 'registration' }),
      I('access', 'Access & pool requirements', LV.RECOMMENDED, st(h.access && h.pool), '', { editable: true, field: 'access' }),
      I('docs', 'HOA documents stored', LV.REQUIRED, st(h.docs), 'Document Center', { editable: true, field: 'docs' })] });
    // K. Safety
    var sf = r.safety || {}, SFM = { ok: 'complete', issue: 'blocked', pending: 'pending', na: 'na' };
    var SF = [['smoke', 'Smoke detectors', LV.BLOCKER], ['extinguisher', 'Fire extinguisher', LV.BLOCKER], ['lighting', 'Emergency lighting', LV.REQUIRED], ['locks', 'Locks', LV.BLOCKER], ['railings', 'Balcony / railings', LV.BLOCKER], ['gas', 'Gas detector', LV.REQUIRED], ['pool', 'Pool safety', LV.BLOCKER], ['contacts', 'Emergency contacts posted', LV.REQUIRED], ['hazards', 'Property-specific hazards documented', LV.REQUIRED]];
    secs.push({ key: 'safety', title: 'Safety', icon: 'shield-check', src: 'Readiness record', editable: true, ownerView: false, items: land ? [I('smoke', 'Safety', LV.OPTIONAL, 'na', 'No structures')] : SF.map(function (x) { var v = sf[x[0]] || 'pending'; return I(x[0], x[1], v === 'na' ? LV.OPTIONAL : x[2], SFM[v], v === 'issue' ? 'Issue reported — property blocked until corrected' : v === 'na' ? 'Not applicable' : v === 'ok' ? 'Checked' : 'Not checked', { editable: true, safety: true }); }) });
    // L. Assets & Inventory
    var as = r.assets || [], furnished = as.length > 0 || isSTR;
    secs.push({ key: 'assets', title: 'Assets & Inventory', icon: 'boxes', src: 'Readiness record', editable: true, ownerView: false, items: !furnished ? [I('inv', 'Furnishings inventory', LV.OPTIONAL, 'na', 'Unfurnished')] : [
      I('inv', 'Furnishings & appliances inventoried', isSTR ? LV.REQUIRED : LV.RECOMMENDED, as.length ? 'complete' : 'pending', as.map(function (a) { return a.cat + ' ' + a.count; }).join(' • ')),
      I('cond', 'Condition recorded with photos', isSTR ? LV.REQUIRED : LV.RECOMMENDED, as.length && as.every(function (a) { return a.photos; }) ? 'complete' : 'pending', as.length ? as.filter(function (a) { return a.cond !== 'Good' && a.cond !== 'New'; }).length + ' items need attention' : '')] });
    // M. Rental Configuration
    var lt = r.rental && r.rental.lt;
    var items = [I('mode', 'Rental mode configured', LV.BLOCKER, r.mode !== 'None' ? 'complete' : land ? 'na' : 'pending', r.mode === 'None' ? 'No rental mode' : r.mode)];
    if (isLT && lt) items = items.concat([I('ltRent', 'Monthly rent & deposit', LV.REQUIRED, lt.rent ? 'complete' : 'pending', 'US$' + Number(lt.rent).toLocaleString() + ' / month • deposit US$' + Number(lt.deposit).toLocaleString()), I('ltTerm', 'Lease term, pets & occupancy', LV.REQUIRED, lt.term ? 'complete' : 'pending', lt.term + ' • ' + lt.pets + ' • ' + lt.occupancy), I('ltReq', 'Tenant requirements', LV.REQUIRED, lt.reqs ? 'complete' : 'pending', lt.reqs), I('ltUtil', 'Utilities & parking terms', LV.RECOMMENDED, lt.utilities ? 'complete' : 'pending', lt.utilities + ' • ' + lt.parking)]);
    if (isSTR) items = items.concat(stay ? [I('strRate', 'Nightly rate, minimum stay & max guests', LV.REQUIRED, 'complete', 'US$' + stay.rate + ' / night • min ' + stay.min + ' nights • sleeps ' + stay.sleeps, { href: 'Master 29 - Explore Stays.dc.html?view=detail&id=' + p.id }), I('strFees', 'Cleaning fee & cancellation policy', LV.REQUIRED, 'complete', 'Cleaning US$' + stay.clean + ' • ' + stay.cancel + ' cancellation'), I('strTimes', 'Check-in / check-out', LV.REQUIRED, 'complete', stay.ci + ' / ' + stay.co), I('strRules', 'House rules & HOA rules published', LV.REQUIRED, 'complete', (S.RULES_VERSION || '') + ' • ' + (stay.hoa || 'Community')), I('strServices', 'Guest services enabled', LV.RECOMMENDED, 'complete', S.CATALOG.filter(function (c) { return c.visible; }).length + ' services visible to guests', { href: 'Master 35 - Guest Services.dc.html?tab=catalog' }), I('strGuide', 'Guest instructions', LV.REQUIRED, stay.rc && stay.rc.access ? 'complete' : 'pending', stay.rc ? stay.rc.access : '')] : [I('strRate', 'Short-term listing configured', LV.REQUIRED, 'pending', 'No STR configuration for this property')]);
    secs.push({ key: 'rental', title: 'Rental Configuration', icon: 'settings-2', src: isSTR ? 'STR configuration' : 'Readiness record', ownerView: true, items: items });
    // M2. Financial / Payment Setup (reads MGH_PAY configuration)
    var PY = window.MGH_PAY, pc = PY ? PY.cfg(p.id) : null;
    if (pc && !land) secs.push({ key: 'finance', title: 'Financial / Payment Setup', icon: 'landmark', src: 'Payment configuration', editable: true, ownerView: true, items: [
      I('currency', 'Property currency configured', LV.BLOCKER, pc.currency ? 'complete' : 'pending', pc.currency ? PY.CUR[pc.currency].code + ' — ' + PY.CUR[pc.currency].name + ' (' + PY.CUR[pc.currency].sym + ')' : 'Base currency not set', { fin: 'select', val: pc.currency }),
      I('methods', 'Guest / tenant payment methods configured', LV.REQUIRED, pc.methods && pc.methods.length ? 'complete' : 'pending', (pc.methods || []).join(' • ') || 'No methods enabled', { fin: 'toggle' }),
      I('instructions', 'Bank transfer instructions configured', LV.REQUIRED, pc.instructions && (pc.methods || []).indexOf('Bank Transfer') >= 0 ? 'complete' : 'pending', pc.instructions && pc.currency ? PY.instr(pc.currency, 'Tenant Payments').bank + ' ' + PY.instr(pc.currency, 'Tenant Payments').number + ' • ' + pc.currency : 'Instructions not configured', { fin: 'toggle' }),
      I('payout', 'Owner payout account verified', LV.REQUIRED, pc.payout && pc.payout.verified ? 'complete' : pc.payout ? 'in_progress' : 'pending', pc.payout ? pc.payout.bank + ' •••• ' + pc.payout.last4 + ' • ' + pc.payout.currency + (pc.payout.verified ? ' • verified' : ' • verification pending') : 'No payout account', { fin: 'toggle', ownerAction: !!pc.payout && !pc.payout.verified })] });
    // N. Marketing
    var mk = r.marketing || {}, MK = [['photos', 'Photos complete', LV.REQUIRED], ['hero', 'Hero image', LV.REQUIRED], ['title', 'Public title', LV.REQUIRED], ['desc', 'Description', LV.REQUIRED], ['amenities', 'Amenities', LV.RECOMMENDED], ['map', 'Location / map', LV.RECOMMENDED], ['pricing', 'Pricing published', LV.REQUIRED], ['availability', 'Availability calendar', LV.REQUIRED], ['rules', 'Rules published', isSTR ? LV.REQUIRED : LV.RECOMMENDED], ['contact', 'Property contact', LV.RECOMMENDED], ['listing', 'Listing status', LV.RECOMMENDED]];
    secs.push({ key: 'marketing', title: 'Marketing Readiness', icon: 'megaphone', src: 'Readiness record', editable: true, ownerView: false, items: land || r.mode === 'None' ? [I('photos', 'Marketing', LV.OPTIONAL, 'na', 'No rental mode configured')] : MK.map(function (x) { return I(x[0], x[1], x[2], mk[x[0]] ? 'complete' : 'pending', '', { editable: true, mk: true }); }) });
    // Score & status
    var all = []; secs.forEach(function (s) { s.items.forEach(function (it) { it.sec = s.key; it.secTitle = s.title; all.push(it); }); var req = s.items.filter(function (it) { return it.state !== 'na' && (it.level === 'BLOCKER' || it.level === 'REQUIRED'); }); s.done = req.filter(function (it) { return it.state === 'complete'; }).length; s.total = req.length; s.blocked = s.items.filter(function (it) { return it.state !== 'na' && ((it.level === 'BLOCKER' && it.state !== 'complete') || it.state === 'blocked'); }).length; s.state = s.items.every(function (it) { return it.state === 'na'; }) ? 'na' : s.blocked ? 'blocked' : s.done === s.total ? 'complete' : s.done ? 'in_progress' : 'pending'; });
    var req = all.filter(function (it) { return it.state !== 'na' && (it.level === 'BLOCKER' || it.level === 'REQUIRED'); });
    var blockers = all.filter(function (it) { return it.state !== 'na' && ((it.level === 'BLOCKER' && it.state !== 'complete') || it.state === 'blocked'); });
    var complete = req.filter(function (it) { return it.state === 'complete'; }).length;
    var pending = req.filter(function (it) { return it.state !== 'complete' && blockers.indexOf(it) < 0; });
    var score = req.length ? Math.round(complete / req.length * 100) : 0;
    var status = r.hold ? 'ON_HOLD' : p.record === 'draft' && complete <= Math.max(4, Math.round(req.length * 0.3)) ? 'NOT_STARTED' : blockers.length ? 'BLOCKED' : pending.length ? 'IN_PROGRESS' : !(r.review && r.review.approved) ? 'READY_FOR_REVIEW' : p.occupied > 0 ? 'ACTIVE' : 'READY_TO_MARKET';
    var next = blockers.find(function (it) { return it.level === 'BLOCKER'; }) || blockers[0] || pending[0] || null;
    return { p: p, owner: on, mode: r.mode, rec: r, secs: secs, items: all, req: req.length, complete: complete, blocked: blockers.length, pending: pending.length, blockers: blockers, pendingItems: pending, score: score, status: status, next: next, stay: stay, recommended: all.filter(function (it) { return it.level === 'RECOMMENDED' && it.state !== 'complete' && it.state !== 'na'; }).length };
  }
  var STATUS = { NOT_STARTED: ['Not Started', 'neutral'], IN_PROGRESS: ['In Progress', 'info'], BLOCKED: ['Blocked', 'danger'], READY_FOR_REVIEW: ['Ready for Review', 'warning'], READY_TO_MARKET: ['Ready to Market', 'success'], ACTIVE: ['Active', 'brand'], ON_HOLD: ['On Hold', 'neutral'] };
  function all() { return props().map(function (p) { return build(p.id); }).filter(Boolean); }
  function setItem(pid, sec, key, val) {
    var r = rec(pid); if (!r) return;
    var text = '';
    if (sec === 'utilities') { r.utilities[key] = val; text = 'Utilities • ' + key + ' set to ' + val; }
    if (sec === 'safety') { r.safety[key] = val; text = 'Safety • ' + key + ' marked ' + val; }
    if (sec === 'marketing') { r.marketing[key] = !!val; text = 'Marketing • ' + key + (val ? ' completed' : ' reopened'); }
    if (sec === 'hoa') { var f = key === 'identified' ? 'contact' : key === 'str' ? 'strAllowed' : key; if (f === 'access') { r.hoa.access = !!val; r.hoa.pool = !!val; } else if (f !== 'contact') r.hoa[f] = !!val; text = 'HOA • ' + key + (val ? ' confirmed' : ' reopened'); }
    if (sec === 'finance' && window.MGH_PAY) { var c0 = window.MGH_PAY.cfg(pid); if (key === 'currency') window.MGH_PAY.setCfg(pid, { currency: val }); if (key === 'methods') window.MGH_PAY.setCfg(pid, { methods: val ? ['Bank Transfer', 'Credit/Debit Card'].concat(c0.currency === 'DOP' ? ['Cash'] : ['PayPal']) : [] }); if (key === 'instructions') window.MGH_PAY.setCfg(pid, { instructions: !!val, methods: val && (c0.methods || []).indexOf('Bank Transfer') < 0 ? (c0.methods || []).concat(['Bank Transfer']) : c0.methods }); if (key === 'payout') window.MGH_PAY.setCfg(pid, { payout: Object.assign({ bank: 'Banco Popular Dominicano', holder: 'Owner of record', type: 'Checking (Corriente)', last4: '0000', currency: c0.currency || 'USD' }, c0.payout || {}, { verified: !!val }) }); text = 'Payment setup • ' + key + (key === 'currency' ? ' set to ' + val : val ? ' completed' : ' reopened'); }
    if (sec === 'assets') { r.assets = (r.assets || []).map(function (a) { return Object.assign({}, a, { photos: !!val }); }); text = 'Assets • condition photos ' + (val ? 'recorded' : 'reopened'); }
    save(pid, r, text);
  }
  function setKeys(pid, keys, text) { var r = rec(pid); r.keys = keys; save(pid, r, text); }
  function setMode(pid, mode) { var r = rec(pid); r.mode = mode; save(pid, r, 'Rental mode set to ' + mode); }
  function approve(pid, notes) { var r = rec(pid); r.review = { approved: true, by: 'Marcus Vance', at: Date.now(), notes: notes }; save(pid, r, 'Approved Ready to Market • ' + notes); try { var a = J('mghpm.audit.v1') || []; a.unshift({ at: Date.now(), actor: 'Marcus Vance', role: 'Portfolio Lead', action: 'readiness.approved', recordType: 'Property Readiness', recordNo: 'PR-' + pid, notes: notes }); } catch (e) {} }
  function reopen(pid, why) { var r = rec(pid); r.review = null; save(pid, r, 'Readiness approval withdrawn • ' + why); }
  function ownerSubmit(pid, sec, file) { var r = rec(pid); r.ownerDocs = Object.assign({}, r.ownerDocs, (function () { var o = {}; o[sec] = { at: Date.now(), file: file }; return o; })()); save(pid, r, 'Owner uploaded ' + file + ' for ' + sec + ' review'); try { var d = J('mghpm.str.docs.v2') || []; d.push({ pid: +pid, resId: '', cat: sec === 'insurance' ? 'Insurance' : 'Ownership', vis: 'Internal', name: file, meta: 'Uploaded by owner via Owner Portal • pending review' }); put('mghpm.str.docs.v2', d); } catch (e) {} }
  function aiReview(pid) {
    var b = build(pid); if (!b) return [];
    var out = [];
    b.blockers.forEach(function (it) { out.push({ sev: 'critical', sec: it.sec, title: it.secTitle + ': ' + it.label, detail: it.detail || 'Blocker — property cannot go live' }); });
    b.pendingItems.forEach(function (it) { out.push({ sev: 'high', sec: it.sec, title: it.secTitle + ': ' + it.label + ' incomplete', detail: it.detail || 'Required before launch' }); });
    var lt = b.rec.rental && b.rec.rental.lt;
    if (lt && b.p.rent && lt.rent !== b.p.rent) out.push({ sev: 'medium', sec: 'rental', title: 'Rent inconsistency', detail: 'Rental configuration US$' + lt.rent + ' vs property record US$' + b.p.rent });
    var ins = window.MGH_INS; if (ins) ins.load().policies.filter(function (x) { return x.entity === 'Property' && x.ref === b.p.title && ins.status(x) === 'Expiring Soon'; }).forEach(function (x) { out.push({ sev: 'medium', sec: 'insurance', title: 'Insurance expiring within 30 days', detail: x.type + ' • ' + x.number + ' expires ' + x.exp }); });
    var dup = props().filter(function (x) { return x.id !== b.p.id && x.address && b.p.address && x.address.split(' ').slice(0, 2).join(' ').toLowerCase() === b.p.address.split(' ').slice(0, 2).join(' ').toLowerCase() && x.city === b.p.city; });
    dup.forEach(function (x) { out.push({ sev: 'medium', sec: 'owner', title: 'Possible duplicate property', detail: x.title + ' shares address ' + x.address }); });
    if (b.recommended) out.push({ sev: 'low', sec: 'marketing', title: b.recommended + ' recommended item' + (b.recommended > 1 ? 's' : '') + ' open', detail: 'Do not block publishing' });
    return out;
  }
  // Action Center findings (shape consumed by ops-agent.js)
  function findings() {
    var F = [];
    all().forEach(function (b) {
      if (b.status === 'ON_HOLD') return;
      var href = M.self + '?id=' + b.p.id;
      b.blockers.forEach(function (it) {
        var crit = ['ownership', 'agreement', 'safety', 'owner'].indexOf(it.sec) >= 0 || (it.sec === 'insurance');
        var titles = { ownership: 'Property has no verified ownership', agreement: 'Management agreement not active', insurance: it.key === 'expiry' ? 'Required insurance expired' : 'Required insurance missing', inspection: 'Initial inspection incomplete', repairs: 'Critical repair blocks readiness', safety: 'Critical safety issue — property blocked', hoa: 'HOA does not permit short-term rental', owner: 'Owner identity not verified' };
        F.push({ sev: crit ? 'critical' : 'high', cats: ['Workflow Blockers'], title: titles[it.sec] || it.label, detail: b.p.title + ' — ' + it.label + (it.detail ? ' • ' + it.detail : ''), record: b.p.title, recordHref: href, action: 'Open Readiness', actionHref: href });
      });
      if (b.status !== 'ACTIVE' && b.status !== 'READY_TO_MARKET') b.pendingItems.filter(function (it) { return it.sec === 'inspection' || it.sec === 'marketing'; }).slice(0, 1).forEach(function (it) { F.push({ sev: it.sec === 'inspection' ? 'high' : 'medium', cats: ['Workflow Blockers'], title: it.sec === 'inspection' ? 'Initial inspection incomplete' : 'Property photographs incomplete', detail: b.p.title + ' — ' + it.label, record: b.p.title, recordHref: href, action: 'Open Readiness', actionHref: href }); });
      if (b.status === 'READY_FOR_REVIEW') F.push({ sev: 'medium', cats: ['Workflow Blockers'], title: 'Property ready for final review', detail: b.p.title + ' — all blockers and required items complete', record: b.p.title, recordHref: href, action: 'Final Review', actionHref: href });
    });
    return F;
  }
  function history(pid) { var r = rec(pid) || {}; var seed = (r.history || []).map(function (h) { return { at: h.at, text: h.text, by: h.by }; }); var ev = window.MGH_AUDIT ? window.MGH_AUDIT.forRecord('PROP-' + String(pid).padStart(3, '0')).map(function (e) { return { at: e.at, text: (e.detail || e.action + ' ' + e.recordType) + (e.reason ? ' — Reason: ' + e.reason : ''), by: e.actor, id: e.id }; }) : []; return seed.concat(ev).sort(function (a, b) { return a.at - b.at; }); }
  function ownerView(owner) { return all().filter(function (b) { return b.owner === owner; }); }
  window.MGH_READY = { KEY: RKEY, props: props, build: build, all: all, rec: rec, save: save, setItem: setItem, setKeys: setKeys, setMode: setMode, approve: approve, reopen: reopen, ownerSubmit: ownerSubmit, aiReview: aiReview, findings: findings, ownerView: ownerView, history: history, STATUS: STATUS, KEY_TYPES: KEY_TYPES, M: M };
})();
