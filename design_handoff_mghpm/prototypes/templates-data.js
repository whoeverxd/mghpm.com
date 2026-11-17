// MGHPM Templates: reusable document DEFINITIONS (never business data). Generated/executed documents are written to
// the shared Document Center store and link back by templateId + version. All activity goes to the central Audit Log.
(function () {
  if (window.MGH_TPL) return;
  var TKEY = 'mghpm.templates.v1', DKEY = 'mghpm.str.docs.v2';
  var J = function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  var put = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var CATS = ['Agreements & Contracts', 'Forms', 'Notices & Letters', 'STR & Guest', 'Operations', 'Financial', 'Communications'];
  var KINDS = { CONTRACT: ['Contract', 'Signature • immutable executed version'], FORM: ['Electronic Form', 'Structured data captured into the record'], ACK: ['Acknowledgment', 'Person + version + timestamp'], REPORT: ['System Report / Statement', 'Generated from live records'], COMM: ['Communication', 'Email / SMS / Portal message'] };
  var STATUS = { DRAFT: ['Draft', 'neutral'], REVIEW: ['Ready for Review', 'warning'], APPROVED: ['Approved', 'info'], PUBLISHED: ['Published', 'success'], SUPERSEDED: ['Superseded', 'neutral'], ARCHIVED: ['Archived', 'neutral'] };
  var APPLIES = ['Owner', 'Property', 'Applicant', 'Tenant', 'Lease', 'Guest', 'Reservation', 'Vendor', 'Payment', 'Maintenance', 'Inspection', 'Cleaning', 'Incident'];
  var BLOCKS = ['Text', 'Heading', 'Table', 'Image', 'Logo', 'Checkbox', 'Date', 'Dynamic Field', 'Initials', 'Signature', 'Page Break'];
  var FIELDS = {
    Owner: ['owner.legal_name', 'owner.email', 'owner.phone', 'owner.address', 'owner.entity_type'],
    Property: ['property.name', 'property.address', 'property.currency', 'property.owner', 'property.code', 'property.rental_mode'],
    Tenant: ['tenant.legal_name', 'tenant.email', 'tenant.phone'],
    Lease: ['lease.number', 'lease.start_date', 'lease.end_date', 'lease.monthly_rent', 'lease.currency', 'lease.deposit'],
    Reservation: ['reservation.number', 'reservation.check_in', 'reservation.check_out', 'reservation.nights', 'reservation.guests', 'reservation.total', 'reservation.balance', 'reservation.currency'],
    Guest: ['guest.legal_name', 'guest.email', 'guest.phone', 'guest.country'],
    Payment: ['payment.amount', 'payment.currency', 'payment.method', 'payment.date', 'bank_transfer.reference', 'bank.name', 'bank.account_holder', 'bank.account_number', 'bank.swift'],
    Electricity: ['electricity.meter_in', 'electricity.meter_out', 'electricity.kwh', 'electricity.rate', 'electricity.total'],
    Organization: ['org.legal_name', 'org.rnc', 'org.address', 'org.phone', 'org.email', 'today']
  };
  var B = function (t, x) { return Object.assign({ t: t }, x || {}); };
  var H = function (s) { return B('Heading', { text: s }); }, P = function (s) { return B('Text', { text: s }); }, F = function (f, l) { return B('Dynamic Field', { field: f, label: l }); };
  var SIG = function (role, req, kind) { return { role: role, req: req || 'Required', kinds: kind || ['Signature', 'Printed Name', 'Date'] }; };
  // Body blocks for the core templates (approved legal language is owned by counsel — AI never edits it).
  var BODY = {
    PMA: [B('Logo'), H('Property Management Agreement / Contrato de Administración de Propiedad'), P('This Agreement is entered into on {{today}} between {{owner.legal_name}} ("Owner") and {{org.legal_name}}, RNC {{org.rnc}} ("Manager"), for the property {{property.name}}, located at {{property.address}}.'), H('1. Appointment & Authority'), P('[Counsel-approved clause — locked]'), H('2. Management Fee'), F('agreement.fee', 'Management fee (%)'), H('3. Approval Limits'), F('agreement.auto_limit', 'Auto-approval limit'), F('agreement.emergency_limit', 'Emergency authority'), H('4. Distributions'), P('Owner distributions are paid in {{property.currency}} to the payout account on file.'), H('5. Term & Termination'), P('[Counsel-approved clause — locked]'), B('Initials', { role: 'Owner' }), B('Page Break'), B('Signature', { role: 'Owner' }), B('Signature', { role: 'MGHPM Representative' })],
    LEASE: [B('Logo'), H('Residential Lease Agreement / Contrato de Arrendamiento'), P('Landlord agent {{org.legal_name}} leases {{property.name}}, {{property.address}}, to {{tenant.legal_name}}.'), B('Table', { rows: [['Term', '{{lease.start_date}} – {{lease.end_date}}'], ['Monthly Rent', '{{lease.monthly_rent}}'], ['Currency', '{{lease.currency}}'], ['Security Deposit', '{{lease.deposit}}']] }), H('Rules & Obligations'), P('[Counsel-approved clauses — locked]'), B('Checkbox', { text: 'Tenant acknowledges HOA/community rules' }), B('Initials', { role: 'Tenant' }), B('Signature', { role: 'Tenant' }), B('Signature', { role: 'Co-Tenant' }), B('Signature', { role: 'MGHPM Representative' })],
    STRA: [B('Logo'), H('Short-Term Rental Reservation Agreement / Contrato de Reservación'), B('Table', { rows: [['Reservation', '{{reservation.number}}'], ['Guest', '{{guest.legal_name}}'], ['Property', '{{property.name}}'], ['Check-In', '{{reservation.check_in}}'], ['Check-Out', '{{reservation.check_out}}'], ['Nights', '{{reservation.nights}}'], ['Guests', '{{reservation.guests}}'], ['Total', '{{reservation.total}}'], ['Currency', '{{reservation.currency}}']] }), H('Electricity'), P('Electricity is billed per the property policy using Meter In / Meter Out readings.'), H('Cancellation & House Rules'), P('[Counsel-approved clauses — locked]'), B('Checkbox', { text: 'I accept the House Rules and HOA rules for this reservation' }), B('Signature', { role: 'Primary Guest' }), B('Date')],
    HRA: [B('Logo'), H('House Rules Acknowledgment / Reconocimiento de Reglas'), F('reservation.number', 'Reservation'), F('property.name', 'Property'), P('Quiet hours, occupancy, parking, smoking and party rules as published for this property and version.'), B('Checkbox', { text: 'I have read and accept the House Rules for this reservation' }), B('Signature', { role: 'Primary Guest', kinds: ['Checkbox Acknowledgment', 'Printed Name', 'Date'] })],
    BTI: [B('Logo'), H('Bank Transfer Instructions / Instrucciones de Transferencia'), B('Table', { rows: [['Bank', '{{bank.name}}'], ['Account Holder', '{{bank.account_holder}}'], ['Account Number', '{{bank.account_number}}'], ['SWIFT', '{{bank.swift}}'], ['Currency', '{{payment.currency}}'], ['Amount', '{{payment.amount}}'], ['Reference', '{{reservation.number}}']] }), P('Upload your receipt after transferring. Funds are applied after MGHPM verifies the transfer.')],
    ELEC: [B('Logo'), H('Electricity Meter Record'), B('Table', { rows: [['Reservation', '{{reservation.number}}'], ['Property', '{{property.name}}'], ['Guest', '{{guest.legal_name}}'], ['Meter In', '{{electricity.meter_in}}'], ['Meter Out', '{{electricity.meter_out}}'], ['Total kWh', '{{electricity.kwh}}'], ['Rate per kWh', '{{electricity.rate}}'], ['Total Electricity Charge', '{{electricity.total}}']] }), B('Image', { text: 'Meter photos (In / Out)' })],
    FSS: [B('Logo'), H('Final Stay Statement'), F('reservation.number', 'Reservation'), F('guest.legal_name', 'Guest'), F('property.name', 'Property'), B('Table', { rows: [['Accommodation, cleaning & taxes', 'from reservation account'], ['Additional services', 'from reservation charges'], ['Electricity (Meter In / Out)', '{{electricity.total}}'], ['Payments & transfers', 'verified only'], ['Final Balance', '{{reservation.balance}}']] }), P('Totals are shown per currency — DOP (RD$) and USD (US$) are never combined.')],
    RCPT: [B('Logo'), H('Payment Receipt / Recibo de Pago'), B('Table', { rows: [['Amount', '{{payment.amount}}'], ['Currency', '{{payment.currency}}'], ['Method', '{{payment.method}}'], ['Date', '{{payment.date}}'], ['Reference', '{{bank_transfer.reference}}'], ['Applied To', '{{reservation.number}}']] })],
    RESCONF: [H('Reservation Confirmation — {{reservation.number}}'), P('Hello {{guest.legal_name}}, your stay at {{property.name}} from {{reservation.check_in}} to {{reservation.check_out}} is confirmed. Total {{reservation.total}}.')]
  };
  var BODY_FOR = { 'TPL-001': 'PMA', 'TPL-010': 'LEASE', 'TPL-020': 'STRA', 'TPL-022': 'HRA', 'TPL-040': 'BTI', 'TPL-027': 'ELEC', 'TPL-029': 'FSS', 'TPL-041': 'RCPT', 'TPL-050': 'RESCONF' };
  // [id, name, category, kind, appliesTo, lang, rental, status, version, phase, signers]
  var R = [
    ['TPL-001', 'Property Management Agreement', 0, 'CONTRACT', ['Owner', 'Property'], 'EN/ES', 'Both', 'PUBLISHED', 3, 1, [SIG('Owner'), SIG('MGHPM Representative', 'Required', ['Signature', 'Printed Name', 'Title', 'Date'])]],
    ['TPL-002', 'Owner Information & Onboarding Form', 1, 'FORM', ['Owner'], 'EN/ES', 'Both', 'PUBLISHED', 2, 1, [SIG('Owner')]],
    ['TPL-003', 'Owner Authorization & Limited Management Authority', 0, 'CONTRACT', ['Owner', 'Property'], 'EN/ES', 'Both', 'REVIEW', 1, 1, [SIG('Owner'), SIG('MGHPM Representative')]],
    ['TPL-004', 'Ownership Information / Declaration', 1, 'FORM', ['Owner', 'Property'], 'EN/ES', 'Both', 'PUBLISHED', 1, 1, [SIG('Owner')]],
    ['TPL-005', 'Property Information & Onboarding Form', 1, 'FORM', ['Property'], 'EN/ES', 'Both', 'PUBLISHED', 2, 1, [SIG('Owner', 'Conditional')]],
    ['TPL-006', 'Owner Banking & Payout Instructions', 1, 'FORM', ['Owner'], 'EN/ES', 'Both', 'PUBLISHED', 2, 1, [SIG('Owner')]],
    ['TPL-007', 'Maintenance & Repair Authorization', 0, 'ACK', ['Owner', 'Property'], 'EN/ES', 'Both', 'PUBLISHED', 1, 1, [SIG('Owner')]],
    ['TPL-008', 'Property Readiness Report', 4, 'REPORT', ['Property'], 'EN', 'Both', 'PUBLISHED', 1, 1, []],
    ['TPL-009', 'Rental Application', 1, 'FORM', ['Applicant', 'Property'], 'EN/ES', 'Long-Term', 'PUBLISHED', 4, 1, [SIG('Applicant')]],
    ['TPL-011', 'Screening Authorization & Consent', 1, 'ACK', ['Applicant'], 'EN/ES', 'Long-Term', 'PUBLISHED', 2, 1, [SIG('Applicant')]],
    ['TPL-012', 'Application Approval Letter', 2, 'COMM', ['Applicant'], 'EN/ES', 'Long-Term', 'PUBLISHED', 2, 1, []],
    ['TPL-013', 'Application Denial Notice', 2, 'COMM', ['Applicant'], 'EN', 'Long-Term', 'REVIEW', 2, 1, []],
    ['TPL-010', 'Residential Lease Agreement', 0, 'CONTRACT', ['Tenant', 'Lease', 'Property'], 'EN/ES', 'Long-Term', 'PUBLISHED', 5, 1, [SIG('Tenant'), SIG('Co-Tenant', 'Conditional'), SIG('MGHPM Representative')]],
    ['TPL-014', 'HOA / Community Rules Acknowledgment', 3, 'ACK', ['Tenant', 'Guest', 'Property'], 'EN/ES', 'Both', 'PUBLISHED', 3, 1, [SIG('Tenant / Guest', 'Required', ['Checkbox Acknowledgment', 'Date'])]],
    ['TPL-015', 'Move-In Inspection Report', 4, 'REPORT', ['Inspection', 'Lease', 'Property'], 'EN', 'Long-Term', 'PUBLISHED', 2, 1, [SIG('Tenant', 'Required', ['Signature', 'Date']), SIG('Inspector')]],
    ['TPL-016', 'Move-Out Inspection Report', 4, 'REPORT', ['Inspection', 'Lease', 'Property'], 'EN', 'Long-Term', 'PUBLISHED', 2, 1, [SIG('Inspector')]],
    ['TPL-017', 'Work Order', 4, 'REPORT', ['Maintenance', 'Vendor', 'Property'], 'EN/ES', 'Both', 'PUBLISHED', 3, 1, []],
    ['TPL-018', 'Owner Repair Approval', 2, 'ACK', ['Owner', 'Maintenance'], 'EN/ES', 'Both', 'PUBLISHED', 1, 1, [SIG('Owner', 'Required', ['Checkbox Acknowledgment', 'Date'])]],
    ['TPL-020', 'STR Reservation Agreement', 0, 'CONTRACT', ['Guest', 'Reservation', 'Property'], 'EN/ES', 'Short-Term', 'PUBLISHED', 2, 1, [SIG('Primary Guest'), SIG('MGHPM', 'Conditional')]],
    ['TPL-021', 'Guest Registration Form', 3, 'FORM', ['Guest', 'Reservation'], 'EN/ES', 'Short-Term', 'PUBLISHED', 2, 1, [SIG('Primary Guest')]],
    ['TPL-022', 'House Rules Acknowledgment', 3, 'ACK', ['Guest', 'Reservation'], 'EN/ES', 'Short-Term', 'PUBLISHED', 4, 1, [SIG('Primary Guest', 'Required', ['Checkbox Acknowledgment', 'Printed Name', 'Date'])]],
    ['TPL-023', 'Check-In Instructions', 3, 'COMM', ['Guest', 'Reservation'], 'EN/ES', 'Short-Term', 'PUBLISHED', 3, 1, []],
    ['TPL-027', 'Electricity Meter Record', 3, 'REPORT', ['Reservation', 'Property'], 'EN/ES', 'Short-Term', 'PUBLISHED', 1, 1, []],
    ['TPL-029', 'Final Stay Statement', 3, 'REPORT', ['Reservation', 'Guest'], 'EN/ES', 'Short-Term', 'PUBLISHED', 2, 1, []],
    ['TPL-040', 'Bank Transfer Instructions', 5, 'REPORT', ['Tenant', 'Guest', 'Owner', 'Payment'], 'EN/ES', 'Both', 'PUBLISHED', 4, 1, []],
    ['TPL-041', 'Payment Receipt', 5, 'REPORT', ['Payment', 'Reservation', 'Lease'], 'EN/ES', 'Both', 'PUBLISHED', 3, 1, []],
    ['TPL-042', 'Owner Distribution Statement', 5, 'REPORT', ['Owner', 'Payment'], 'EN', 'Both', 'PUBLISHED', 2, 1, []],
    ['TPL-043', 'Owner Monthly Statement', 5, 'REPORT', ['Owner', 'Property'], 'EN', 'Both', 'PUBLISHED', 2, 1, []],
    ['TPL-050', 'Reservation Confirmation', 6, 'COMM', ['Guest', 'Reservation'], 'EN/ES', 'Short-Term', 'PUBLISHED', 3, 1, []],
    ['TPL-051', 'Payment Received / Transfer Pending Verification', 6, 'COMM', ['Tenant', 'Guest', 'Payment'], 'EN/ES', 'Both', 'PUBLISHED', 1, 1, []],
    ['TPL-052', 'Owner Approval Required', 6, 'COMM', ['Owner', 'Maintenance'], 'EN/ES', 'Both', 'PUBLISHED', 1, 1, []],
    // Phase 2 — secondary library
    ['TPL-101', 'Pet Addendum', 0, 'CONTRACT', ['Lease', 'Tenant'], 'EN/ES', 'Long-Term', 'DRAFT', 1, 2, [SIG('Tenant'), SIG('MGHPM Representative')]],
    ['TPL-102', 'Lease Renewal Offer / Notice', 2, 'COMM', ['Lease', 'Tenant'], 'EN/ES', 'Long-Term', 'DRAFT', 1, 2, []],
    ['TPL-103', 'Non-Renewal Notice', 2, 'COMM', ['Lease', 'Tenant'], 'EN', 'Long-Term', 'DRAFT', 1, 2, []],
    ['TPL-104', 'Inspection Comparison — Move-In vs Move-Out', 4, 'REPORT', ['Inspection', 'Lease'], 'EN', 'Long-Term', 'DRAFT', 1, 2, []],
    ['TPL-105', 'STR Turnover Checklist', 4, 'FORM', ['Cleaning', 'Reservation'], 'EN/ES', 'Short-Term', 'APPROVED', 1, 2, []],
    ['TPL-106', 'Guest Incident Report', 4, 'REPORT', ['Incident', 'Guest', 'Reservation'], 'EN', 'Short-Term', 'REVIEW', 1, 2, []],
    ['TPL-107', 'Early Check-In / Late Check-Out Authorization', 3, 'ACK', ['Guest', 'Reservation'], 'EN/ES', 'Short-Term', 'DRAFT', 1, 2, []],
    ['TPL-108', 'Insurance Expiration Notice', 2, 'COMM', ['Owner', 'Tenant'], 'EN/ES', 'Both', 'APPROVED', 1, 2, []],
    ['TPL-109', 'Vendor Agreement', 0, 'CONTRACT', ['Vendor'], 'EN/ES', 'Both', 'DRAFT', 1, 2, [SIG('Vendor'), SIG('MGHPM Representative')]],
    ['TPL-110', 'Lease Agreement (Florida — legacy)', 0, 'CONTRACT', ['Tenant', 'Lease'], 'EN', 'Long-Term', 'ARCHIVED', 4, 2, [SIG('Tenant'), SIG('MGHPM Representative')]]
  ];
  var DAY = 864e5, T0 = Date.parse('2026-10-05T09:00:00');
  function seed() {
    return R.map(function (r, i) {
      var vers = []; for (var v = 1; v <= r[8]; v++) vers.push({ v: v, status: v === r[8] ? r[7] : (v === r[8] - 1 && r[7] === 'PUBLISHED' ? 'SUPERSEDED' : 'ARCHIVED'), at: T0 - (r[8] - v + 1) * 60 * DAY - i * DAY, by: v === r[8] ? 'Marcus Vance' : 'Sofia Ramos', approvedBy: v <= r[8] && r[7] !== 'DRAFT' && r[7] !== 'REVIEW' || v < r[8] ? 'Sofia Ramos (Compliance)' : '', notes: v === 1 ? 'Initial version' : 'Counsel revision ' + v });
      if (r[0] === 'TPL-001') vers.push({ v: 4, status: 'DRAFT', at: T0 - 2 * DAY, by: 'Marcus Vance', approvedBy: '', notes: 'Adds DOP distribution clause for DR portfolios' });
      var bodyKey = BODY_FOR[r[0]];
      return { id: r[0], name: r[1], desc: KINDS[r[3]][1], cat: CATS[r[2]], kind: r[3], applies: r[4], lang: r[5], rental: r[6], status: r[7], version: r[8], phase: r[9], signers: r[10], ordered: r[10].length > 1, country: r[0] === 'TPL-110' ? 'United States' : 'Dominican Republic', market: r[0] === 'TPL-110' ? 'Florida, US' : r[6] === 'Short-Term' ? 'DR — All markets' : 'DR — Distrito Nacional & La Altagracia', propType: 'All', orgId: 'ORG-001', legal: r[3] === 'CONTRACT', updated: T0 - i * 0.7 * DAY, versions: vers, body: bodyKey ? BODY[bodyKey] : [B('Logo'), H(r[1]), P('Template body to be configured — upload counsel-approved source or build electronically.')], source: r[3] === 'CONTRACT' ? 'Counsel-approved (uploaded DOCX, converted)' : 'Built in MGHPM' };
    });
  }
  function all() { var l = J(TKEY); if (!l) { l = seed(); put(TKEY, l); } return l; }
  function get(id) { return all().find(function (t) { return t.id === id; }); }
  function save(t, action, detail, extra) { var l = all(); var i = l.findIndex(function (x) { return x.id === t.id; }); t.updated = Date.now(); if (i >= 0) l[i] = t; else l.unshift(t); put(TKEY, l); if (window.MGH_AUDIT && action) window.MGH_AUDIT.record(Object.assign({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: action, module: 'Templates', recordType: 'Template', record: t.name + ' v' + t.version, recordId: t.id, category: 'Documents', detail: detail }, extra || {})); return t; }
  function nextId() { return 'TPL-' + String(Math.max.apply(null, all().map(function (t) { return +t.id.split('-')[1]; })) + 1).padStart(3, '0'); }
  function docs() { return J(DKEY) || []; }
  function usage(id) { return docs().filter(function (d) { return d.templateId === id; }); }
  // Live field resolution — reads Reservations, Guests, Properties/Readiness, Payments and Organization. Nothing is copied into the template.
  function resolve(ctx) {
    var out = {}, S = window.MGH_STR_DATA, G = window.MGH_GUEST, PY = window.MGH_PAY, O = window.MGH_ORG, RD = window.MGH_READY;
    var org = O ? O.org('ORG-001') : null;
    out['org.legal_name'] = org ? org.legal : 'My Global Hub Property Management SRL'; out['org.rnc'] = org ? org.rnc : ''; out['org.address'] = org ? org.address : ''; out['org.phone'] = org ? org.phone : ''; out['org.email'] = org ? org.email : '';
    out.today = new Date().toLocaleDateString(ctx.lang === 'Spanish' ? 'es-DO' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var r = ctx.resId && G ? G.reservations().find(function (x) { return x.id === ctx.resId; }) : null;
    if (r && G && S) {
      var a = G.account(r), st = G.stayOf(r), g = G.forReservation(r), cur = r.currency || 'USD', fm = function (n) { return PY ? PY.fmt(n, cur) : 'US$' + n.toFixed(2); };
      var dt = function (d) { return new Date(d + 'T12:00:00').toLocaleDateString(ctx.lang === 'Spanish' ? 'es-DO' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); };
      Object.assign(out, { 'reservation.number': r.id, 'reservation.check_in': dt(r.ci) + (st ? ' • ' + st.ci : ''), 'reservation.check_out': dt(r.co) + (st ? ' • ' + st.co : ''), 'reservation.nights': String(a.nights), 'reservation.guests': String(r.guests || ''), 'reservation.total': fm(a.total), 'reservation.balance': fm(a.balance), 'reservation.currency': cur === 'DOP' ? 'DOP — Dominican Peso (RD$)' : 'USD — US Dollar (US$)' });
      if (st) { out['property.name'] = st.name; out['property.address'] = st.addr; out['property.currency'] = out['reservation.currency']; ctx.pid = ctx.pid || st.pid; }
      if (g) { out['guest.legal_name'] = [g.first, g.middle, g.last].filter(Boolean).join(' '); out['guest.email'] = g.email; out['guest.phone'] = g.phone; out['guest.country'] = g.residence; }
      var ins = PY ? PY.instr(cur, 'Guest Reservation Payments') : null; if (ins) { out['bank.name'] = ins.bank; out['bank.account_holder'] = ins.holder; out['bank.account_number'] = ins.full; out['bank.swift'] = ins.swift; out['payment.currency'] = cur; out['payment.amount'] = fm(a.balance); }
      var tx = PY ? PY.forTarget('reservation', r.id)[0] : null; if (tx) { out['payment.method'] = tx.method; out['payment.date'] = tx.transferDate; out['bank_transfer.reference'] = tx.ref; out['payment.amount'] = PY.fmt(tx.amount, tx.currency); }
      var m = r.meter || {}; var ec = S.elecCfg ? S.elecCfg(st ? st.pid : 0) : {}; var kin = m.in != null ? m.in : null, kout = m.out != null ? m.out : null;
      out['electricity.meter_in'] = kin != null ? kin + ' kWh' : 'Pending at check-in'; out['electricity.meter_out'] = kout != null ? kout + ' kWh' : 'Pending at check-out'; out['electricity.kwh'] = kin != null && kout != null ? (kout - kin).toFixed(1) + ' kWh' : '—'; out['electricity.rate'] = ec && ec.rate ? fm(ec.rate) + ' / kWh' : 'Per property policy'; out['electricity.total'] = kin != null && kout != null && ec && ec.rate ? fm((kout - kin) * ec.rate) : 'Calculated at check-out';
    }
    if (ctx.pid && RD) { var b = RD.build(ctx.pid); if (b) { out['property.name'] = out['property.name'] || b.p.title; out['property.address'] = out['property.address'] || b.p.address + ', ' + b.p.city; out['property.owner'] = b.owner; out['property.code'] = b.p.code; out['property.rental_mode'] = b.mode; out['owner.legal_name'] = b.owner; var pc = PY ? PY.cfg(ctx.pid) : null; out['property.currency'] = out['property.currency'] || (pc && pc.currency ? (pc.currency === 'DOP' ? 'DOP — Dominican Peso (RD$)' : 'USD — US Dollar (US$)') : 'Not configured'); } }
    if (ctx.owner === 'Alvarez Family Trust' || out['owner.legal_name'] === 'Alvarez Family Trust') Object.assign(out, { 'owner.legal_name': 'Alvarez Family Trust', 'owner.email': 'trustee@alvareztrust.com', 'owner.phone': '(305) 555-0110', 'owner.address': '1200 Brickell Bay Dr, Apt 3801, Miami, FL 33131', 'owner.entity_type': 'Trust', 'agreement.fee': '8%', 'agreement.auto_limit': 'US$500.00', 'agreement.emergency_limit': 'US$2,500.00' });
    return out;
  }
  function fill(text, vals) { return String(text || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (m, k) { return vals[k] != null && vals[k] !== '' ? vals[k] : '[' + k + ' — missing]'; }); }
  function missing(t, vals) { var keys = {}; (t.body || []).forEach(function (b) { var s = JSON.stringify(b); (s.match(/\{\{\s*([\w.]+)\s*\}\}/g) || []).forEach(function (m) { keys[m.replace(/[{}\s]/g, '')] = 1; }); if (b.field) keys[b.field] = 1; }); return Object.keys(keys).filter(function (k) { return vals[k] == null || vals[k] === ''; }); }
  function generate(t, ctx, vals) {
    var l = docs(); var n = l.filter(function (d) { return d.templateId === t.id; }).length + 1;
    var doc = { id: 'DOC-' + t.id.slice(4) + '-' + String(n).padStart(4, '0'), templateId: t.id, templateVersion: t.version, pid: ctx.pid || 0, resId: ctx.resId || '', guestId: ctx.guestId || '', owner: ctx.owner || '', cat: t.kind === 'CONTRACT' ? 'Agreement' : t.kind === 'ACK' ? 'Acknowledgment' : t.kind === 'FORM' ? 'Form' : t.kind === 'COMM' ? 'Communication' : 'Report', vis: 'Shared', name: t.name + (ctx.resId ? ' — ' + ctx.resId : ctx.pid && vals['property.name'] ? ' — ' + vals['property.name'] : '') + '.pdf', meta: 'Generated from ' + t.id + ' v' + t.version + ' • ' + ctx.lang + ' • ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: t.signers.length ? 'Awaiting Signature' : 'Generated', person: vals['guest.legal_name'] || vals['tenant.legal_name'] || vals['owner.legal_name'] || '', related: ctx.resId || vals['property.name'] || '', at: Date.now(), snapshot: vals };
    l.push(doc); put(DKEY, l);
    if (window.MGH_AUDIT) window.MGH_AUDIT.record({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: 'GENERATE', module: 'Templates', recordType: 'Template', record: t.name + ' v' + t.version, recordId: t.id, category: 'Documents', detail: 'Generated ' + doc.id + ' for ' + (doc.related || '—') + (doc.person ? ' • ' + doc.person : '') + ' • ' + ctx.lang });
    return doc;
  }
  function setDocStatus(id, status, action) { var l = docs(); var d = l.find(function (x) { return x.id === id; }); if (!d) return; d.status = status; put(DKEY, l); var t = get(d.templateId); if (window.MGH_AUDIT) window.MGH_AUDIT.record({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: action, module: 'Documents', recordType: 'Document', record: d.name, recordId: d.id, category: 'Documents', detail: status + ' • ' + (t ? t.id + ' v' + d.templateVersion : '') }); }
  // Seed usage docs
  (function () { var l = docs(); if (l.some(function (d) { return d.templateId; })) return; [['TPL-020', 2, 13, '20261002-DR-0001', 'Ana Torres', 'Signed', '2026-10-05'], ['TPL-022', 4, 13, '20261002-DR-0001', 'Ana Torres', 'Signed', '2026-10-05'], ['TPL-001', 3, 1, '', 'Alvarez Family Trust', 'Signed', '2026-10-02'], ['TPL-001', 2, 2, '', 'Alvarez Family Trust', 'Signed', '2025-07-14'], ['TPL-040', 4, 13, '20261002-DR-0001', 'Ana Torres', 'Emailed', '2026-10-05'], ['TPL-029', 2, 6, '20260417-DR-0032', 'Ana Torres', 'Generated', '2026-04-24'], ['TPL-010', 5, 14, '', 'Rafael Peña', 'Signed', '2026-09-28']].forEach(function (u, i) { l.push({ id: 'DOC-' + u[0].slice(4) + '-' + String(9000 + i), templateId: u[0], templateVersion: u[1], pid: u[2], resId: u[3], cat: 'Agreement', vis: 'Shared', name: (get(u[0]) || {}).name + (u[3] ? ' — ' + u[3] : '') + '.pdf', meta: 'Generated from ' + u[0] + ' v' + u[1], status: u[5], person: u[4], related: u[3] || (window.MGH_ORG ? window.MGH_ORG.PROPS[u[2]] : 'Property ' + u[2]), at: Date.parse(u[6] + 'T12:00:00') }); }); put(DKEY, l); })();
  window.MGH_TPL = { CATS: CATS, KINDS: KINDS, STATUS: STATUS, APPLIES: APPLIES, BLOCKS: BLOCKS, FIELDS: FIELDS, all: all, get: get, save: save, nextId: nextId, usage: usage, resolve: resolve, fill: fill, missing: missing, generate: generate, setDocStatus: setDocStatus };
})();
