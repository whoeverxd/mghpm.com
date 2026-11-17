// MGHPM central audit/event store. Immutable: append-only, no edit/delete API. Secrets are never stored;
// sensitive values are masked on write. Activity tabs across modules are filtered views (forRecord / forOrg).
(function () {
  if (window.MGH_AUDIT) return;
  var AKEY = 'mghpm.audit.v1';
  var J = function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  var put = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var ACTOR_TYPES = ['USER', 'SYSTEM', 'AI', 'API', 'AUTOMATION', 'OWNER_PORTAL', 'TENANT_PORTAL', 'GUEST_PORTAL'];
  var SOURCE = { USER: 'Admin Web', SYSTEM: 'System', AI: 'AI Assistant', API: 'API', AUTOMATION: 'Automation', OWNER_PORTAL: 'Owner Portal', TENANT_PORTAL: 'Tenant Portal', GUEST_PORTAL: 'Guest / My Stay' };
  var SECRET = /password|secret|token|api.?key|cvv|card number|pin\b|otp|mfa code/i, BANK = /account|iban|routing|card/i;
  function mask(field, v) { if (v == null || v === '') return v; if (SECRET.test(field)) return '[redacted]'; var d = String(v).replace(/\D/g, ''); if (BANK.test(field) && d.length >= 6) return '••••' + d.slice(-4); return v; }
  var D = function (iso) { return Date.parse(iso); };
  var E = function (at, actor, type, role, action, module, rtype, record, o) { return Object.assign({ at: D(at), actor: actor, actorType: type, role: role, action: action, module: module, recordType: rtype, record: record, orgId: 'ORG-001', pf: null, result: 'Success', severity: 'Info', category: 'Operations', ip: type === 'USER' ? '190.166.' + (40 + (D(at) / 1e5 | 0) % 200) + '.' + ((D(at) / 1e3 | 0) % 250) : type.indexOf('PORTAL') >= 0 ? '181.36.' + ((D(at) / 1e4 | 0) % 250) + '.12' : '—', changes: [], detail: '' }, o || {}); };
  var SEED = [
    E('2026-10-05T10:42:18', 'Marcus Vance', 'USER', 'Portfolio Lead', 'UPDATE', 'Reservations', 'Reservation', '20261002-DR-0001', { pf: 'PF-01', category: 'Reservation', severity: 'Medium', corr: 'COR-20261005-0001', reason: 'Guest requested 2-night extension; nights priced at published calendar rate', changes: [['Check-Out', 'Oct 12, 2026', 'Oct 14, 2026'], ['Nights', '2', '4'], ['Accommodation', 'US$872.92', 'US$1,745.85'], ['Property', 'Aventura Park Tower', 'Aventura Park Tower'], ['Guests', '3', '3']], detail: 'Stay extended at guest request' }),
    E('2026-10-05T10:38:02', 'María Santos', 'USER', 'Property Manager', 'VERIFY', 'Payments', 'Bank Transfer', 'TRX-45832', { pf: 'PF-02', category: 'Financial', severity: 'High', changes: [['Status', 'UNDER_REVIEW', 'VERIFIED'], ['Amount', 'RD$ 65,000.00', 'RD$ 65,000.00'], ['Method', 'Bank Transfer', 'Bank Transfer'], ['Reference', 'BR-TRX-45832', 'BR-TRX-45832']], detail: 'Verified against Banreservas statement', corr: 'COR-20261005-0412' }),
    E('2026-10-05T10:38:03', 'System', 'SYSTEM', 'System', 'POST', 'Accounting', 'Journal Entry', 'JE-2026-10-0412', { pf: 'PF-02', category: 'Financial', corr: 'COR-20261005-0412', changes: [['Debit', '—', 'Banreservas Operating • RD$ 65,000.00'], ['Credit', '—', 'Tenant Receivable L-2026-0431 • RD$ 65,000.00']], detail: 'Cash receipt posted from verified transfer TRX-45832' }),
    E('2026-10-05T10:38:03', 'System', 'SYSTEM', 'System', 'UPDATE', 'Leases', 'Lease', 'L-2026-0431', { pf: 'PF-02', category: 'Financial', corr: 'COR-20261005-0412', changes: [['October Rent', 'Due', 'Paid'], ['Balance', 'RD$ 65,000.00', 'RD$ 0.00']], detail: 'Tenant ledger updated — October rent settled' }),
    E('2026-10-05T10:42:19', 'System', 'SYSTEM', 'System', 'UPDATE', 'Calendar', 'Calendar Block', 'Aventura Park Tower • Unit 1802', { pf: 'PF-01', category: 'Reservation', corr: 'COR-20261005-0001', changes: [['Blocked Through', 'Oct 12, 2026', 'Oct 14, 2026']], detail: 'Availability updated for 20261002-DR-0001' }),
    E('2026-10-05T10:31:40', 'MGHPM Assistant', 'AI', 'Operations Agent', 'PROPOSE', 'Guests', 'Guest', 'G-1005', { category: 'AI', result: 'Review', detail: 'Identified possible duplicate guest: G-1005 Ana Torres ↔ new booking contact ana.torres@gmail.com', chain: 'CH-0091', step: 'AI Proposed' }),
    E('2026-10-05T10:33:05', 'Marcus Vance', 'USER', 'Portfolio Lead', 'CONFIRM', 'Guests', 'Guest', 'G-1005', { category: 'AI', detail: 'Marked records “Not a Duplicate” — same guest, returning stay', chain: 'CH-0091', step: 'User Confirmed', changes: [['Duplicate Flag', 'Possible duplicate', 'Not a duplicate']] }),
    E('2026-10-05T10:33:06', 'System', 'SYSTEM', 'System', 'EXECUTE', 'Guests', 'Guest', 'G-1005', { category: 'AI', detail: 'Duplicate review closed; booking linked to existing profile G-1005', chain: 'CH-0091', step: 'System Executed' }),
    E('2026-10-05T10:22:51', 'Ana Torres', 'GUEST_PORTAL', 'Guest', 'UPLOAD', 'Payments', 'Bank Transfer', 'TRX-45861', { category: 'Financial', severity: 'Medium', detail: 'Bank transfer proof uploaded — Comprobante BPD-88142.pdf • US$ 477.30 • reservation 20261002-DR-0001' }),
    E('2026-10-05T09:58:13', 'Carlos Peña', 'USER', 'Accounting', 'UPDATE', 'Organizations', 'Bank Account', 'BA-05 Owner Distribution', { category: 'Financial', severity: 'High', changes: [['Account Number', '812034419001', '812034420009'], ['Purpose', 'Owner Distributions', 'Owner Distributions']], detail: 'Owner distribution account replaced after bank migration', reason: 'Banco Popular account migration — bank letter on file (Carta BPD 2026-09-30)' }),
    E('2026-10-05T09:41:00', 'unknown', 'USER', '—', 'LOGIN', 'Security', 'Session', 'e.cruz@mghpm.com', { category: 'Security', result: 'Failed', severity: 'High', detail: 'Failed login — invalid password (3rd attempt) • account locked 15 minutes', ip: '45.155.205.33' }),
    E('2026-10-05T09:12:44', 'Marcus Vance', 'USER', 'Portfolio Lead', 'LOGIN', 'Security', 'Session', 'm.vance@mghpm.com', { category: 'Security', detail: 'Login • MFA (authenticator app) • Chrome on macOS' }),
    E('2026-10-05T08:55:20', 'Automation', 'AUTOMATION', 'Scheduler', 'GENERATE', 'Documents', 'Document', 'Owner Statement — Alvarez — Sep 2026', { category: 'Documents', detail: 'Monthly owner statement generated and queued for review' }),
    E('2026-10-05T08:30:00', 'Payments API', 'API', 'Stripe webhook', 'CREATE', 'Payments', 'Payment', 'PAY-50412', { category: 'Financial', detail: 'Card payment captured • US$ 4,200.00 • lease L-2024-0298' }),
    E('2026-10-04T18:20:11', 'Luis Herrera', 'USER', 'Maintenance Coordinator', 'UPDATE', 'Reservations', 'Reservation', '20260909-DR-0002', { pf: 'PF-01', category: 'Reservation', changes: [['Meter Out', '—', '20,712.0 kWh'], ['Electricity', '—', 'Included']], detail: 'Meter Out entered at check-out' }),
    E('2026-10-04T17:05:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'CANCEL', 'Reservations', 'Reservation', '20261001-DR-0001', { pf: 'PF-02', category: 'Reservation', severity: 'Medium', changes: [['Status', 'confirmed', 'cancelled'], ['Refund', '—', 'Full refund via Airbnb']], detail: 'Cancelled at guest request within free-cancellation window' }),
    E('2026-10-04T16:12:00', 'Sofia Ramos', 'USER', 'Compliance', 'REJECT', 'Payments', 'Bank Transfer', 'TRX-45722', { category: 'Financial', severity: 'Medium', changes: [['Status', 'UNDER_REVIEW', 'REJECTED']], detail: 'Amount on receipt (RD$ 45,800.00) does not match transfer reported', reason: 'Amount on receipt (RD$ 45,800.00) does not match transfer reported' }),
    E('2026-10-04T15:00:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'UPDATE', 'Property Readiness', 'Property', 'Pompano Beach Duplex', { pf: 'PF-02', category: 'Property', changes: [['Keys & Access', 'In Progress', 'Complete'], ['Readiness', '88%', '100%']] }),
    E('2026-10-04T14:22:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'ROLE_CHANGE', 'Security', 'User', 'd.brooks@mghpm.com', { category: 'Security', severity: 'Medium', reason: 'Promoted to inspection lead for Broward onboarding', changes: [['Role', 'Field Staff', 'Inspector'], ['Portfolio Access', 'Miami Metro', 'Miami Metro, Broward']] }),
    E('2026-10-04T11:40:00', 'Ricardo Alvarez', 'OWNER_PORTAL', 'Owner', 'APPROVE', 'Maintenance', 'Maintenance Request', '#1041 A/C not cooling', { category: 'Maintenance', severity: 'Medium', detail: 'Owner approved compressor replacement estimate US$ 4,860.00' }),
    E('2026-10-04T10:05:00', 'Daniela Ortiz', 'TENANT_PORTAL', 'Tenant', 'UPLOAD', 'Insurance', 'Insurance Policy', 'LMN-RL-90417', { category: 'Compliance', detail: 'Renters insurance certificate uploaded' }),
    E('2026-10-03T19:10:00', 'MGHPM Assistant', 'AI', 'Operations Agent', 'PROPOSE', 'Property Readiness', 'Property', 'Mar de Plata I', { category: 'AI', result: 'Review', severity: 'High', detail: 'AI Review: required property insurance expired Sep 30 — Ready to Market blocked', chain: 'CH-0088', step: 'AI Proposed' }),
    E('2026-10-03T19:30:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'CONFIRM', 'Property Readiness', 'Property', 'Mar de Plata I', { category: 'AI', detail: 'Created task: request renewal proof from Plata Investments Group', chain: 'CH-0088', step: 'User Confirmed' }),
    E('2026-10-03T19:30:01', 'System', 'SYSTEM', 'System', 'EXECUTE', 'Action Center', 'Task', 'TSK-88120', { category: 'AI', detail: 'Task TSK-88120 created in Action Center', chain: 'CH-0088', step: 'System Executed' }),
    E('2026-10-03T16:00:00', 'Carlos Peña', 'USER', 'Accounting', 'CREATE', 'Payments', 'Owner Distribution', 'DIST-2026-10-03', { category: 'Financial', severity: 'High', detail: 'Owner distribution RD$ 212,400.00 to Calle Ocho Properties • Banreservas ••••1188' }),
    E('2026-10-03T15:12:00', 'Carlos Peña', 'USER', 'Accounting', 'CONVERT', 'Accounting', 'Exchange Rate', 'FX-2026-10-03', { category: 'Financial', changes: [['Original Amount', '—', 'RD$ 25,000.00'], ['Converted Amount', '—', 'US$ 412.54'], ['Exchange Rate', '—', '60.60 DOP/USD'], ['Rate Source', '—', 'Banco Central RD reference rate']] }),
    E('2026-10-03T12:00:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'PUBLISH', 'Templates', 'Template', 'Reservation Agreement v4', { category: 'Documents', changes: [['Version', 'v3', 'v4'], ['Status', 'Approved', 'Published']] }),
    E('2026-10-03T09:30:00', 'DocuSign', 'API', 'E-signature', 'SIGN', 'Documents', 'Document', 'Lease L-2026-0431', { category: 'Documents', detail: 'Executed by tenant and MGHPM • certificate SIG-L-2026-0431' }),
    E('2026-10-02T17:45:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'INVITE', 'Security', 'User', 'm.santos@mghpm.com', { category: 'Security', detail: 'User invited as Property Manager • scoped to Broward, Punta Cana' }),
    E('2026-10-02T11:10:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'CONNECT', 'Organizations', 'Integration', 'DocuSign', { category: 'Administration', changes: [['Status', 'Not Connected', 'Connected'], ['API Key', 'none', 'sk_live_9f2c'], ['Account', '—', 'docusign@mghpm.com']] }),
    E('2026-09-30T14:00:00', 'System', 'SYSTEM', 'System', 'EXPIRE', 'Insurance', 'Insurance Policy', 'THI-6021187', { category: 'Compliance', severity: 'Critical', result: 'Failed', detail: 'Property insurance expired — Mar de Plata I • no renewal on file' }),
    E('2026-09-28T16:45:00', 'Marcus Vance', 'USER', 'Portfolio Lead', 'SUSPEND', 'Security', 'User', 'e.cruz@mghpm.com', { category: 'Security', severity: 'High', changes: [['Status', 'Active', 'Suspended']], detail: 'Identity verification pending', reason: 'Staff identity verification not completed within 14 days' })
  ];
  var PROP_NAMES = ['Brickell Bay Residences', 'Ocean View Villa', 'Coral Gables Terrace', 'Las Olas Lofts', 'Wynwood Commons', 'Sunset Beach House', 'Mar de Plata I', 'Mar de Plata II', 'Key Biscayne Retreat', 'Doral Business Center', 'Coconut Grove Cottages', 'Hollywood Boardwalk Suites', 'Aventura Park Tower', 'Little Havana Flats', 'Hialeah Industrial Park', 'Homestead Land Parcel', 'North Bay Village Residences', 'Pompano Beach Duplex'];
  var USER_IDS = { 'm.vance@mghpm.com': 'USR-0001', 's.ramos@mghpm.com': 'USR-0002', 'e.cruz@mghpm.com': 'USR-0003', 'l.herrera@mghpm.com': 'USR-0004', 'd.brooks@mghpm.com': 'USR-0005', 'trustee@alvareztrust.com': 'USR-0006', 'm.santos@mghpm.com': 'USR-0007', 'c.pena@mghpm.com': 'USR-0008' };
  var ACTOR_IDS = { 'Marcus Vance': 'USR-0001', 'Sofia Ramos': 'USR-0002', 'Elena Cruz': 'USR-0003', 'Luis Herrera': 'USR-0004', 'Daniel Brooks': 'USR-0005', 'Ricardo Alvarez': 'OWN-0001', 'María Santos': 'USR-0007', 'Carlos Peña': 'USR-0008', 'Ana Torres': 'G-1005', 'Daniela Ortiz': 'TEN-0418', 'System': 'SYS', 'Automation': 'SYS-SCHED', 'MGHPM Assistant': 'AI-OPS-01', 'Payments API': 'API-STRIPE', 'DocuSign': 'API-DOCUSIGN' };
  var IDRX = /\b(\d{8}-[A-Z]{2}-\d{4}|G-\d{4}|TRX-\d+|ORG-\d{3}|BA-\d+|PAY-\d+|DIST-[\d-]+|INS-[\d-]+|L-\d{4}-\d{4}|TSK-\d+|FX-[\d-]+|JE-[\d-]+|PF-\d+|SVC-[\d-]+|INC-[\d-]+)\b/;
  function recordIdOf(e) {
    if (e.recordId) return e.recordId;
    var r = String(e.record || ''), m = r.match(IDRX); if (m) return m[1];
    var pi = PROP_NAMES.indexOf(r.split(' • ')[0]); if (pi >= 0) return 'PROP-' + String(pi + 1).padStart(3, '0');
    if (USER_IDS[r]) return USER_IDS[r]; if (/@/.test(r)) return 'USR-' + r.split('@')[0].replace(/\W/g, '').toUpperCase().slice(0, 8);
    var q = r.match(/^#(\d+)/); if (q) return 'REQ-' + q[1];
    if (/^PR-(\d+)/.test(r)) return 'PROP-' + String(r.match(/^PR-(\d+)/)[1]).padStart(3, '0');
    return (e.recordType || 'REC').replace(/\W/g, '').slice(0, 4).toUpperCase() + '-' + r.replace(/\W/g, '').slice(0, 14).toUpperCase();
  }
  // Sensitive actions require a reason (enforced at the write API, not only in the UI).
  var SENSITIVE = [
    [function (e) { return e.action === 'REVERSE'; }, 'Payment reversal'],
    [function (e) { return e.action === 'ADJUST'; }, 'Financial adjustment'],
    [function (e) { return e.recordType === 'Bank Account' && /CREATE|UPDATE|DELETE|DEACTIVATE/.test(e.action); }, 'Bank account change'],
    [function (e) { return /ROLE_CHANGE|SUSPEND|RESTORE|PERMISSION_CHANGE|ACCESS_CHANGE/.test(e.action); }, 'Permission / access change'],
    [function (e) { return e.action === 'OVERRIDE'; }, 'Compliance or readiness override'],
    [function (e) { return e.recordType === 'Reservation' && e.action === 'UPDATE' && (e.changes || []).some(function (c) { return /accommodation|nightly|rate|total|price|discount/i.test(c[0]) && c[1] !== c[2]; }); }, 'Confirmed-reservation price change']
  ];
  function sensitive(e) { var s = SENSITIVE.find(function (x) { return x[0](e); }); return s ? s[1] : null; }
  function sid() { var k = 'mghpm.session.id'; var v = sessionStorage.getItem(k); if (!v) { v = 'SES-' + Math.random().toString(36).slice(2, 10).toUpperCase(); try { sessionStorage.setItem(k, v); } catch (e) {} } return v; }
  function fnv(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  function body(e) { return [e.id, e.at, e.actor, e.action, e.recordId, e.recordVersion, e.correlationId, JSON.stringify(e.changes || []), e.reason || '', e.detail || ''].join('|'); }
  var CUR_CORR = null, CUR_T = 0;
  function begin(label) { CUR_CORR = 'COR-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Date.now()).slice(-4); CUR_T = Date.now(); return CUR_CORR; }
  function seq(at, n) { var d = new Date(at); return 'AUD-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + String(8400 + n).padStart(6, '0'); }
  function norm(e, n) {
    if (!e.id) e.id = seq(e.at || Date.now(), n);
    if (!e.actorType) e.actorType = /Assistant|Agent/.test(e.actor || '') ? 'AI' : 'USER';
    if (!e.source) e.source = SOURCE[e.actorType] || 'Admin Web';
    if (!e.module) { var a = e.action || ''; e.module = /document|readiness/.test(a) ? (a.indexOf('readiness') >= 0 ? 'Property Readiness' : 'Documents') : 'General'; }
    if (/^document\./.test(e.action || '')) { var m = { 'document.emailed': 'EMAIL', 'document.printed': 'PRINT', 'document.downloaded': 'DOWNLOAD', 'document.viewed': 'VIEW' }; e.detail = e.detail || ((e.doc || '') + (e.to ? ' • to ' + e.to.join(', ') : '') + (e.audience ? ' • ' + e.audience : '')); e.action = m[e.action] || e.action; e.module = 'Documents'; e.category = 'Documents'; e.record = e.recordNo || e.record; e.recordType = e.recordType || 'Document'; e.severity = e.severity || (e.action === 'EMAIL' ? 'Medium' : 'Low'); }
    if (e.action === 'readiness.approved') { e.action = 'APPROVE'; e.module = 'Property Readiness'; e.category = 'Property'; e.record = e.recordNo; e.detail = 'Approved Ready to Market • ' + (e.notes || ''); }
    e.result = e.result || 'Success'; e.severity = e.severity || 'Info'; e.category = e.category || 'Operations'; e.orgId = e.orgId || 'ORG-001';
    e.actorId = e.actorId || ACTOR_IDS[e.actor] || (e.actorType === 'USER' ? 'USR-UNKNOWN' : e.actorType);
    e.recordId = recordIdOf(e);
    e.correlationId = e.correlationId || e.corr || (e.chain ? e.chain.replace('CH-', 'COR-AI-') : 'COR-' + e.id.slice(4));
    if (!e.sessionId && /USER|PORTAL/.test(e.actorType)) { e.sessionId = 'SES-' + fnv(e.actor + new Date(e.at).toDateString()).toUpperCase(); }
    if (!e.requestId) e.requestId = 'REQ-' + fnv(e.id).toUpperCase();
    if (!e.userAgent) e.userAgent = e.actorType === 'USER' ? 'Chrome 129 • macOS' : /PORTAL/.test(e.actorType) ? 'Safari 18 • iOS' : e.actorType === 'API' ? 'Webhook client' : 'Server process';
    e.changes = (e.changes || []).map(function (c) { return [c[0], mask(c[0], c[1]), mask(c[0], c[2])]; });
    return e;
  }
  var MUT = /CREATE|UPDATE|VERIFY|REJECT|REVERSE|APPROVE|CANCEL|PUBLISH|SIGN|SUSPEND|RESTORE|ROLE_CHANGE|CONNECT|DISCONNECT|POST|EXPIRE|CONFIRM|EXECUTE|ADJUST|OVERRIDE|UPLOAD|CONVERT/;
  function seal(list) { var prev = '00000000'; list.forEach(function (e) { if (e.recordVersion == null) { /* set below */ } e.prevHash = prev; e.hash = fnv(prev + body(e)); prev = e.hash; }); return list; }
  function load() {
    var l = J(AKEY) || [];
    if (!l.some(function (x) { return x.seed === 2; })) {
      var live = l.filter(function (x) { return !x.seed; }).reverse();
      var seeds = SEED.slice().sort(function (a, b) { return a.at - b.at; }).map(function (x, i) { return norm(Object.assign({ seed: 2 }, x), i + 1); });
      var asc = seeds.concat(live.map(function (x, i) { return norm(Object.assign({}, x), seeds.length + i + 1); }));
      var ver = {}; asc.forEach(function (e) { if (MUT.test(e.action)) ver[e.recordId] = (ver[e.recordId] || 0) + 1; e.recordVersion = e.recordVersion || ver[e.recordId] || 1; });
      l = seal(asc).reverse(); put(AKEY, l);
    }
    return l;
  }
  function all() { return load().slice().sort(function (a, b) { return b.at - a.at; }).map(function (e) { return Object.freeze(Object.assign({}, e, { changes: Object.freeze((e.changes || []).map(function (c) { return Object.freeze(c.slice()); })) })); }); }
  function record(e) {
    var pend = window.__MGH_PENDING; if (pend && Date.now() - pend.at < 1500 && (!e.orgId || e.orgId === pend.orgId)) { e = Object.assign({}, e, { detail: e.detail || pend.text }); window.__MGH_PENDING = null; }
    var l = load(); var x = Object.assign({ at: Date.now(), userAgent: navigator.userAgent.indexOf('Mac') >= 0 ? 'Browser • macOS' : 'Browser', sessionId: /USER|PORTAL/.test(e.actorType || 'USER') ? sid() : undefined }, e);
    if (!x.correlationId && !x.corr && CUR_CORR && Date.now() - CUR_T < 2000) x.correlationId = CUR_CORR;
    var why = sensitive(Object.assign({ changes: [] }, x));
    if (why && !(x.reason && String(x.reason).trim().length >= 5)) {
      var denied = norm({ at: Date.now(), actor: x.actor, actorType: x.actorType, role: x.role, action: 'DENIED', module: x.module, recordType: x.recordType, record: x.record, recordId: x.recordId, orgId: x.orgId, category: 'Security', severity: 'High', result: 'Failed', detail: why + ' attempted without a reason — write rejected by audit policy', correlationId: x.correlationId }, l.length + 1);
      denied.recordVersion = 0; denied.prevHash = l.length ? l[0].hash : '00000000'; denied.hash = fnv(denied.prevHash + body(denied)); l.unshift(denied); put(AKEY, l);
      return { blocked: true, error: 'A reason is required for: ' + why, event: denied };
    }
    x = norm(x, l.length + 1);
    x.recordVersion = MUT.test(x.action) ? l.filter(function (y) { return y.recordId === x.recordId && MUT.test(y.action); }).length + 1 : (l.filter(function (y) { return y.recordId === x.recordId; }).length ? Math.max.apply(null, l.filter(function (y) { return y.recordId === x.recordId; }).map(function (y) { return y.recordVersion || 1; })) : 1);
    x.prevHash = l.length ? l[0].hash : '00000000'; x.hash = fnv(x.prevHash + body(x));
    l.unshift(x); put(AKEY, l); return Object.freeze(Object.assign({}, x));
  }
  function verify() { var l = load().slice().reverse(), prev = '00000000'; for (var i = 0; i < l.length; i++) { var e = l[i]; if (e.prevHash !== prev || e.hash !== fnv(prev + body(e))) return { ok: false, count: l.length, brokenAt: e.id }; prev = e.hash; } return { ok: true, count: l.length, head: prev }; }
  function annotate(id, note, by) { var ev = all().find(function (e) { return e.id === id; }); return record({ actor: by || 'Marcus Vance', role: 'Portfolio Lead', action: 'ANNOTATE', module: 'Audit Log', recordType: 'Audit Event', record: id, recordId: id, parentId: id, correlationId: ev ? ev.correlationId : undefined, category: 'Administration', detail: note }); }
  function forRecord(ids) { ids = [].concat(ids); return all().filter(function (e) { return ids.indexOf(e.recordId) >= 0 || ids.indexOf(e.record) >= 0; }); }
  function forOrg(orgId) { return all().filter(function (e) { return e.orgId === orgId; }); }
  function correlated(cid) { return all().filter(function (e) { return e.correlationId === cid; }).sort(function (a, b) { return a.at - b.at; }); }
  // Paginated query — mirrors GET /api/audit/events?page=&page_size=&… (server-side filtering in production).
  function query(pred, page, size) { var l = all().filter(pred || function () { return true; }); var pages = Math.max(1, Math.ceil(l.length / size)); var p = Math.min(Math.max(1, page), pages); return { total: l.length, pages: pages, page: p, rows: l.slice((p - 1) * size, p * size), all: l }; }
  function propId(pid) { return 'PROP-' + String(pid).padStart(3, '0'); }
  // Reason dialog used by every sensitive action.
  function askReason(title, cb, hint) {
    var F = "'Plus Jakarta Sans',system-ui,sans-serif", host = document.createElement('div'); host.setAttribute('data-export-exclude', ''); var sr = host.attachShadow({ mode: 'open' }); document.body.appendChild(host);
    sr.innerHTML = '<div id="ov" style="position:fixed;inset:0;z-index:2200;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:24px;font-family:' + F + '"><div role="dialog" style="width:min(480px,100%);background:#fff;border-radius:12px;box-shadow:0 24px 64px rgba(15,23,42,.24);padding:22px;display:flex;flex-direction:column;gap:14px"><span style="font:600 11px/1.2 ' + F + ';letter-spacing:.06em;text-transform:uppercase;color:#B45309">Sensitive Action • Reason Required</span><span style="font:700 17px/1.3 ' + F + ';color:#172033">' + title.replace(/</g, '&lt;') + '</span><span style="font:400 13px/1.5 ' + F + ';color:#64748B">' + (hint || 'The reason is stored permanently with the audit event and cannot be changed later.') + '</span><textarea id="r" rows="3" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #E2E8F0;border-radius:6px;font:400 14px/1.5 ' + F + ';color:#172033;outline:none;resize:vertical"></textarea><span id="err" style="font:500 12px/1.3 ' + F + ';color:#DC2626"></span><div style="display:flex;justify-content:flex-end;gap:8px"><button id="c" style="height:40px;padding:0 14px;border:0;border-radius:6px;background:transparent;color:#475569;font:600 14px/1 ' + F + ';cursor:pointer">Cancel</button><button id="ok" style="height:40px;padding:0 16px;border:0;border-radius:6px;background:#006B68;color:#fff;font:600 14px/1 ' + F + ';cursor:pointer">Confirm with Reason</button></div></div></div>';
    var close = function () { host.remove(); };
    sr.getElementById('c').onclick = close; sr.getElementById('ov').onclick = function (ev) { if (ev.target.id === 'ov') close(); };
    sr.getElementById('ok').onclick = function () { var v = sr.getElementById('r').value.trim(); if (v.length < 5) { sr.getElementById('err').textContent = 'Enter a reason of at least 5 characters.'; return; } close(); cb(v); };
    setTimeout(function () { var t = sr.getElementById('r'); t && t.focus(); }, 30);
  }
  window.MGH_AUDIT = Object.freeze({ KEY: AKEY, ACTOR_TYPES: ACTOR_TYPES, SOURCE: SOURCE, all: all, record: record, annotate: annotate, forRecord: forRecord, forOrg: forOrg, correlated: correlated, query: query, verify: verify, begin: begin, sensitive: sensitive, askReason: askReason, propId: propId, mask: mask, recordIdOf: recordIdOf });
})();
