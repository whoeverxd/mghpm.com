// MGHPM Operations Agent — deterministic review engine shared by Action Center and the MGHPM Assistant.
// Findings are recommendations only; every resolution requires a human.
(function () {
  if (window.MGH_OPS) return;
  var TKEY = 'mghpm.agent.tasks.v1', SKEY = 'mghpm.ops.state.v1';
  var M = {
    owner: 'Master 25 - Owner Profile.dc.html', tenant: 'Master 26 - Tenant Profile.dc.html', property: 'Master 04 - Property Detail.dc.html', insurance: 'Master 27 - Insurance and Compliance.dc.html',
    leases: 'Master 15 - Leases.dc.html', wo: 'Master 13 - Work Orders.dc.html', req: 'Master 14 - Maintenance Requests.dc.html', inspections: 'Master 10 - Digital Inspection.dc.html',
    payments: 'Master 16 - Payments.dc.html', apps: 'Master 07 - Rental Applications.dc.html', people: 'Master 19 - People.dc.html', ownerPortal: 'Master 05 - Owner Portal.dc.html',
    tenantPortal: 'Master 06 - Tenant Portal.dc.html', accounting: 'Master 11 - Accounting.dc.html', action: 'Master 28 - Action Center.dc.html', wizard: 'Master 23 - Rental Application Wizard.dc.html'
  };
  var enc = encodeURIComponent;
  var J = function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } };
  var today = function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  var days = function (iso) { if (!iso) return null; var p = String(iso).slice(0, 10).split('-').map(Number); return Math.round((new Date(p[0], p[1] - 1, p[2]) - today()) / 86400000); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fmtD = function (iso) { if (!iso) return '—'; var p = String(iso).slice(0, 10).split('-').map(Number); return MON[p[1] - 1] + ' ' + p[2] + ', ' + p[0]; };
  var usd = function (n) { return Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); };

  // Fallback facts mirroring the seeded Masters, used when a module has not been opened in this session.
  var LEASES = [['L-2026-0420', 'Marco Bellini', 'Brickell Bay Residences • Unit 1507', '2026-11-01', '2027-10-31', 'Pending Signature'], ['L-2025-0392', 'Jonathan Reyes', 'Brickell Bay Residences • Unit 806', '2025-06-01', '2027-05-31', 'Active'], ['L-2024-0298', 'Priya Nair', 'Ocean View Villa • Unit 301', '2024-12-01', '2026-11-30', 'Active'], ['L-2025-0344', 'Michael Chen', 'Coral Gables Terrace • Unit 305', '2024-12-01', '2026-11-30', 'Active'], ['L-2026-0418', 'Daniela Ortiz', 'Brickell Bay Residences • Unit 1204', '2026-10-01', '2027-09-30', 'Active']];
  var WOS = [['WO-2026-1041', 'A/C compressor replacement', 'Ocean View Villa • Unit 204', '2026-10-03', 'Awaiting Owner Approval', 4860, 'Alvarez Family Trust', 1500], ['WO-2026-1018', 'Pool heater not igniting', 'Sunset Beach House', '2026-09-26', 'Awaiting Parts', 920, 'Alvarez Family Trust', 1500], ['WO-2026-1042', 'Water leak under kitchen sink', 'Brickell Bay Residences • Unit 1507', '2026-10-04', 'Dispatched', 380, 'Alvarez Family Trust', 1500]];

  function people() { var s = J('mghpm.people.v1'); return (s && s.people) || null; }
  function run() {
    var F = [], n = 0;
    var add = function (o) { n++; F.push(Object.assign({ id: 'F-' + String(n).padStart(2, '0'), cats: [], due: false }, o)); };
    var ins = window.MGH_INS, insD = ins ? ins.load() : null;
    // Compliance — insurance
    if (insD) {
      insD.policies.forEach(function (p) {
        var st = ins.status(p), d = ins.daysTo(p.exp);
        var href = p.entity === 'Tenant' ? M.tenant + '?tenant=' + enc(p.ref) + '&tab=insurance' : p.entity === 'Owner' ? M.owner + '?owner=' + enc(p.ref) + '&tab=insurance' : M.insurance + '?edit=' + p.id;
        if (st === 'Expired') add({ sev: p.entity === 'Vendor' || p.entity === 'Tenant' ? 'critical' : 'critical', cats: ['Compliance'], title: (p.entity === 'Tenant' ? 'Renters' : p.type) + ' insurance expired', detail: p.type + ' • ' + p.carrier + ' ' + p.number + ' expired ' + fmtD(p.exp) + (p.entity === 'Vendor' ? ' — vendor blocked from new work orders' : ''), record: p.ref, recordHref: href, action: p.entity === 'Tenant' ? 'Request new proof' : 'Review insurance', actionHref: M.insurance + '?edit=' + p.id });
        else if (st === 'Expiring Soon') add({ sev: d <= 15 ? 'high' : 'medium', cats: ['Compliance'], due: d <= 7, title: 'Insurance expires in ' + d + ' days', detail: p.type + ' • ' + p.carrier + ' — renewal proof not yet received', record: p.ref, recordHref: href, action: 'Request renewal proof', actionHref: M.insurance + '?edit=' + p.id });
        else if (st === 'Pending Verification') add({ sev: 'medium', cats: ['Compliance'], title: 'Insurance awaiting verification', detail: p.type + ' • ' + p.number + (p.portal_state ? ' — uploaded by tenant' : ''), record: p.ref, recordHref: href, action: 'Review insurance', actionHref: M.insurance + '?edit=' + p.id });
      });
      ins.missing(insD).forEach(function (r) {
        var blocker = r.entity === 'Tenant' || r.entity === 'Property';
        add({ sev: blocker ? 'critical' : 'high', cats: blocker ? ['Compliance', 'Workflow Blockers'] : ['Compliance'], title: 'Required ' + r.type + ' insurance missing', detail: 'Required by ' + r.source + (r.entity === 'Tenant' ? ' — blocks lease activation' : r.entity === 'Property' ? ' — property cannot be Ready to Market' : ''), record: r.ref, recordHref: r.entity === 'Tenant' ? M.tenant + '?tenant=' + enc(r.ref) + '&tab=insurance' : M.insurance + '?q=' + enc(r.ref), action: r.entity === 'Tenant' ? 'Request proof from tenant' : 'Add policy', actionHref: M.insurance + '?new=' + r.entity + '&ref=' + enc(r.ref) + '&type=' + enc(r.type) });
      });
    }
    // Ownership verification
    var o360 = J('mghpm.owner360.v1') || {};
    var alv = o360['Alvarez Family Trust'];
    var sunset = alv && alv.own && alv.own[6] ? alv.own[6].status : 'In Review';
    if (!window.MGH_READY && sunset !== 'Verified') add({ sev: 'critical', cats: ['Workflow Blockers', 'Compliance'], title: 'Ownership not verified', detail: 'Sunset Beach House — title verification ' + sunset.toLowerCase() + '; co-owner authorization (Isabel Alvarez, 25%) not received', record: 'Sunset Beach House', recordHref: M.owner + '?owner=' + enc('Alvarez Family Trust') + '&tab=ownership', action: 'Review ownership', actionHref: M.owner + '?owner=' + enc('Alvarez Family Trust') + '&tab=ownership' });
    // Workflow blockers — leases
    LEASES.forEach(function (l) {
      var d = days(l[3]);
      if (l[5] === 'Pending Signature' && d !== null && d <= 30) add({ sev: 'high', cats: ['Workflow Blockers', 'Awaiting Tenant'], due: d <= 7, title: 'Lease unsigned ' + d + ' days before move-in', detail: l[0] + ' • ' + l[2] + ' — tenant signature and initial funds outstanding', record: l[1], recordHref: M.leases + '?id=' + l[0], action: 'Send signature reminder', actionHref: M.leases + '?id=' + l[0] });
      var e = days(l[4]);
      if (l[5] === 'Active' && e !== null && e >= 0 && e <= 60) add({ sev: e <= 30 ? 'high' : 'medium', cats: ['Awaiting Tenant'], title: 'Lease expires in ' + e + ' days', detail: l[0] + ' • ' + l[2] + ' — no renewal decision recorded', record: l[1], recordHref: M.leases + '?id=' + l[0], action: 'Start renewal', actionHref: M.leases + '?id=' + l[0] });
    });
    // Awaiting owner — approvals
    WOS.forEach(function (w) {
      var age = -days(w[3]);
      if (w[4] === 'Awaiting Owner Approval') add({ sev: 'high', cats: ['Awaiting Owner'], due: age >= 1, title: 'Owner approval pending ' + age + ' day' + (age === 1 ? '' : 's'), detail: w[0] + ' ' + w[1] + ' — ' + usd(w[5]) + ' exceeds the ' + usd(w[7]) + ' approval limit', record: w[6], recordHref: M.owner + '?owner=' + enc(w[6]) + '&tab=maintenance', action: 'Send owner reminder', actionHref: M.req + '?workOrder=' + w[0].replace('WO-2026-', '') });
      else if (w[4] === 'Awaiting Parts' && age >= 7) add({ sev: 'medium', cats: ['Workflow Blockers'], title: 'Work order stalled ' + age + ' days', detail: w[0] + ' ' + w[1] + ' • ' + w[2] + ' — awaiting parts, no update since ' + fmtD(w[3]), record: w[2].split(' • ')[0], recordHref: M.wo, action: 'Request vendor update', actionHref: M.wo });
    });
    // Inspections
    add({ sev: 'medium', cats: ['Compliance'], title: 'Inspection overdue', detail: 'Mar de Plata II — no periodic inspection on record in the last 6 months', record: 'Mar de Plata II', recordHref: M.property + '?id=8', action: 'Schedule inspection', actionHref: M.inspections + '?property=8' });
    // Financial issues
    var ppl = people();
    var reyes = ppl ? ppl.find(function (x) { return x.name === 'Jonathan Reyes'; }) : { balance: 7200 };
    if (reyes && reyes.balance > 0) add({ sev: 'high', cats: ['Financial Issues', 'Due Today'], due: true, title: 'Rent past due', detail: 'Jonathan Reyes • Brickell Bay Residences Unit 806 — ' + usd(reyes.balance) + ' outstanding', record: 'Jonathan Reyes', recordHref: M.tenant + '?tenant=' + enc('Jonathan Reyes') + '&tab=payments', action: 'Send payment notice', actionHref: M.tenant + '?tenant=' + enc('Jonathan Reyes') + '&tab=communications' });
    add({ sev: 'high', cats: ['Financial Issues'], title: 'Distribution scheduled with unresolved owner charges', detail: 'Alvarez Family Trust — Nov 1 distribution while 3 owner charges (' + usd(8325) + ') are unpaid', record: 'Alvarez Family Trust', recordHref: M.owner + '?owner=' + enc('Alvarez Family Trust') + '&tab=financials', action: 'Review owner ledger', actionHref: M.owner + '?owner=' + enc('Alvarez Family Trust') + '&tab=financials' });
    add({ sev: 'medium', cats: ['Financial Issues'], dq: 'Missing Information', title: 'Expense without responsibility', detail: 'EXP-8824 Cleaning • Sunset Beach House — Owner / Tenant / MGHPM not assigned', record: 'EXP-8824', recordHref: 'Master 64 - Accounts Payable.dc.html?tab=expenses&id=EXP-8824', action: 'Assign responsibility', actionHref: 'Master 64 - Accounts Payable.dc.html?tab=expenses&id=EXP-8824' });
    // Data quality
    add({ sev: 'medium', cats: ['Duplicate Records'], dq: 'Duplicates', title: 'Possible duplicate tenant', detail: 'Daniela Ortiz (TEN-0418) and contact request CR-0091 “Daniela Ortiz R.” share email daniela.ortiz@email.com and phone (305) 555-1742', record: 'Daniela Ortiz', recordHref: M.tenant + '?tenant=' + enc('Daniela Ortiz'), action: 'Compare records', actionHref: M.tenant + '?tenant=' + enc('Daniela Ortiz'), pair: ['Daniela Ortiz — TEN-0418 (Tenant)', 'Daniela Ortiz R. — CR-0091 (Contact Request)'], financial: false });
    if (ppl) { var seen = {}; ppl.forEach(function (x) { var k = (x.email || '').toLowerCase(); if (!k || k === '—') return; if (seen[k] && seen[k].name !== x.name) add({ sev: 'medium', cats: ['Duplicate Records'], dq: 'Duplicates', title: 'Two people share the same email', detail: seen[k].name + ' and ' + x.name + ' — ' + k, record: x.name, recordHref: M.people, action: 'Compare records', actionHref: M.people, pair: [seen[k].name + ' (' + seen[k].type + ')', x.name + ' (' + x.type + ')'], financial: false }); else seen[k] = x; }); }
    add({ sev: 'medium', cats: ['Duplicate Records', 'Financial Issues'], dq: 'Duplicates', title: 'Possible duplicate payment', detail: 'PMT-50388 and PMT-50391 — Sofia Martinez, ' + usd(2875) + ', same day (Oct 2) via Stripe', record: 'Sofia Martinez', recordHref: M.payments, action: 'Compare payments', actionHref: M.payments, pair: ['PMT-50388 • Stripe • Oct 2 • $2,875.00', 'PMT-50391 • Stripe • Oct 2 • $2,875.00'], financial: true });
    add({ sev: 'medium', cats: ['Financial Issues'], dq: 'Conflicts', title: 'Rent conflict between lease and property', detail: 'Lease L-2025-0392 rent ' + usd(3600) + ' • Brickell Bay Unit 806 listed rent ' + usd(3750), record: 'L-2025-0392', recordHref: M.leases + '?id=L-2025-0392', action: 'Review rent', actionHref: M.leases + '?id=L-2025-0392' });
    add({ sev: 'medium', cats: ['Workflow Blockers'], dq: 'Broken Relationships', title: 'Payment linked to a lease with no active tenant', detail: 'PMT-50177 references L-2025-0351 (Unit 204) — tenant Tom Becker is Moved Out', record: 'PMT-50177', recordHref: M.payments, action: 'Relink payment', actionHref: M.payments });
    add({ sev: 'medium', cats: ['Missing Information'], dq: 'Unlinked Records', title: 'Maintenance request without a property', detail: 'MT-2026-0599 “Gate remote not working” — submitted by phone, no property or unit assigned', record: 'MT-2026-0599', recordHref: M.req, action: 'Assign property', actionHref: M.req });
    // Missing information
    var o = ppl ? ppl.filter(function (x) { return x.type === 'owner' && x.name !== 'Alvarez Family Trust'; }) : [{ name: 'Plata Investments Group' }, { name: 'Las Olas Partners LP' }, { name: 'Turnberry Capital Trust' }, { name: 'Southland Land Co.' }];
    var noBank = o.filter(function (x) { var r = o360[x.name]; return !r || !r.bank || r.bank.status !== 'Verified'; });
    if (noBank.length) add({ sev: 'medium', cats: ['Missing Information'], dq: 'Missing Information', title: noBank.length + ' owners missing verified banking', detail: noBank.map(function (x) { return x.name; }).join(', ') + ' — distributions cannot be issued', record: noBank[0].name, recordHref: M.owner + '?owner=' + enc(noBank[0].name) + '&tab=financials', action: 'Request bank details', actionHref: M.owner + '?owner=' + enc(noBank[0].name) + '&tab=financials' });
    var t360 = J('mghpm.tenant360.v1') || {};
    var dan = t360['Daniela Ortiz'];
    if (!dan || !(dan.portal && dan.portal.miAck)) add({ sev: 'medium', cats: ['Awaiting Tenant'], title: 'Move-in condition not acknowledged', detail: 'Daniela Ortiz • Brickell Bay Unit 1204 — move-in inspection completed Sep 30, tenant acknowledgment pending', record: 'Daniela Ortiz', recordHref: M.tenant + '?tenant=' + enc('Daniela Ortiz') + '&tab=inspections', action: 'Send reminder', actionHref: M.tenant + '?tenant=' + enc('Daniela Ortiz') + '&tab=communications' });
    add({ sev: 'info', cats: ['Compliance'], title: 'Inspection scheduled', detail: 'Sunset Beach House — initial inspection Oct 9, 2026 (Luis Herrera)', record: 'Sunset Beach House', recordHref: M.property + '?id=6', action: 'View inspection', actionHref: M.inspections + '?property=6' });
    add({ sev: 'info', cats: ['Financial Issues'], title: 'Inventory running low', detail: 'Multi-surface cleaner — 4 units left at the Brickell storage room', record: 'Supplies', recordHref: 'Master 22 - Supplies and Inventory.dc.html', action: 'Record purchase', actionHref: 'Master 22 - Supplies and Inventory.dc.html' });
    if (window.MGH_READY) { try { window.MGH_READY.findings().forEach(function (f) { add(f); }); } catch (e) {} }
    var st = state();
    return F.map(function (f) { var k = f.title + '|' + f.record; var x = st[k] || {}; return Object.assign(f, { key: k, status: x.status || 'open', snoozedUntil: x.until || '' }); });
  }
  function state() { return J(SKEY) || {}; }
  function setState(key, v) { var s = state(); s[key] = Object.assign({}, s[key] || {}, v); sessionStorage.setItem(SKEY, JSON.stringify(s)); }
  function tasks() { var t = J(TKEY); return Array.isArray(t) ? t : []; }
  function saveTasks(t) { sessionStorage.setItem(TKEY, JSON.stringify(t)); }
  function addTasks(list, source) { var t = tasks(); var now = new Date().toISOString(); list.forEach(function (x, i) { t.unshift({ id: 'TSK-' + String(Date.now() + i).slice(-5), title: x.title, priority: x.priority || 'Medium', record: x.record || (source && source.record) || '', href: x.href || (source && source.href) || '', assignee: x.assignee || 'Unassigned', due: x.due || '', status: 'Open', source: (source && source.label) || 'Operations Agent', created: now }); }); saveTasks(t); return t; }
  function snapshot(role, ctx) {
    var f = run().filter(function (x) { return x.status === 'open'; });
    if (role === 'staff') return { findings: f.map(function (x) { return { id: x.id, severity: x.sev, title: x.title, detail: x.detail, record: x.record, recommended: x.action }; }), people: (people() || []).map(function (p) { return [p.type, p.name, p.status, p.balance || 0, p.prop || (p.props || []).join(', ') || p.category || p.role || ''].join(' | '); }), leases: LEASES.map(function (l) { return l.join(' | '); }), workOrders: WOS.map(function (w) { return w.slice(0, 6).join(' | '); }), insurance: window.MGH_INS ? window.MGH_INS.load().policies.map(function (p) { return [p.entity, p.ref, p.type, p.carrier, p.exp, window.MGH_INS.status(p)].join(' | '); }) : [], context: ctx || null };
    if (role === 'tenant') return { context: ctx || null, note: 'Only this tenant’s own tenancy. Never reveal owner, other tenants, vendor costs, screening or internal notes.' };
    if (role === 'owner') return { context: ctx || null, owner: 'Alvarez Family Trust', properties: ['Brickell Bay Residences (46/48 leased)', 'Ocean View Villa (11/12 leased)', 'Sunset Beach House (vacant — preparation)'], lastDistribution: 'Oct 1, 2026 — $18,742.36', nextDistribution: 'Nov 1, 2026 (estimated after owner charges of $8,325.00)', openMaintenance: WOS.map(function (w) { return w[0] + ' ' + w[1] + ' — ' + w[4] + ' — ' + usd(w[5]); }), monthCharges: ['Management fee (8%) $3,412.00', 'HOA dues $2,340.00', 'Maintenance $1,240.00', 'Cleaning $640.00', 'Utilities $418.25'], nextInspection: 'Sunset Beach House — Oct 9, 2026', note: 'Only this owner’s properties. Never reveal tenant personal data beyond names, screening or internal notes.' };
    return { context: ctx || null, note: 'Applicant: only their own application status and required documents. Never reveal screening criteria thresholds or internal decision notes.' };
  }
  window.MGH_OPS = { run: run, setStatus: setState, tasks: tasks, saveTasks: saveTasks, addTasks: addTasks, snapshot: snapshot, M: M, fmtD: fmtD };
})();
