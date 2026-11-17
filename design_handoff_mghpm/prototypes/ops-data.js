// MGHPM Operations 360 shared store — Work Orders (full lifecycle), Cleaning, Inspections, Staff, Vendors.
// Prototype-only: persisted in localStorage (mghpm.ops360.v1). No backend exists for these modules yet.
(function () {
  if (window.MGH_OPS360) return;
  var KEY = 'mghpm.ops360.v1', VER = 3, subs = [];
  var STAGES = ['Request', 'Review', 'Approval', 'Assignment', 'Schedule', 'Work', 'Photos', 'Labor & Materials', 'Invoice', 'Completion', 'Final Inspection', 'Closed'];
  var APPROVAL_LIMIT = 500;
  var STAFF = [
    ['STF-001', 'Luis Herrera', 'Maintenance & Inspection Technician', 'Maintenance', '(305) 555-0201', 'lherrera@mghpm.com', 'On Shift', '7:00 AM – 3:30 PM', 28, '2023-03-14'],
    ['STF-002', 'Daniel Brooks', 'Smart Home & Access Technician', 'Maintenance', '(305) 555-0202', 'dbrooks@mghpm.com', 'On Shift', '9:00 AM – 5:30 PM', 30, '2024-01-08'],
    ['STF-003', 'Rosa Martínez', 'Housekeeping Lead', 'Cleaning', '(305) 555-0203', 'rmartinez@mghpm.com', 'On Shift', '8:00 AM – 4:30 PM', 22, '2022-11-02'],
    ['STF-004', 'Ana Castillo', 'Housekeeper', 'Cleaning', '(305) 555-0204', 'acastillo@mghpm.com', 'On Shift', '9:00 AM – 5:30 PM', 19.5, '2025-02-17'],
    ['STF-005', 'Carlos Rivera', 'Property Inspector', 'Inspections', '(305) 555-0205', 'crivera@mghpm.com', 'On Shift', '8:00 AM – 4:30 PM', 26, '2023-08-21'],
    ['STF-006', 'Sofia Ramos', 'Leasing Coordinator', 'Leasing', '(305) 555-0206', 'sramos@mghpm.com', 'Off Today', '—', 25, '2024-05-06'],
    ['STF-007', 'Marcus Vance', 'Portfolio Lead', 'Management', '(305) 555-0200', 'mvance@mghpm.com', 'On Shift', '8:30 AM – 6:00 PM', 0, '2021-06-01']
  ].map(function (r) { return { id: r[0], name: r[1], role: r[2], team: r[3], phone: r[4], email: r[5], status: r[6], shift: r[7], rate: r[8], hired: r[9] }; });
  var VENDORS = [
    ['VEN-101', 'Aqua Pro Plumbing', 'Plumbing', 'Mike Duran', '(305) 555-0311', 'dispatch@aquapro.com', '2027-03-31', true, 4.7, 'Net 15', '••••4410'],
    ['VEN-102', 'Coastal HVAC Services', 'HVAC', 'Rita Pérez', '(305) 555-0322', 'service@coastalhvac.com', '2026-11-15', true, 4.5, 'Net 30', '••••7782'],
    ['VEN-103', 'Bright Spark Electric', 'Electrical', 'Tony Grant', '(954) 555-0333', 'jobs@brightspark.com', '2027-01-20', true, 4.8, 'Net 15', '••••1029'],
    ['VEN-104', 'Spotless Turnover Co.', 'Cleaning', 'Gloria Núñez', '(786) 555-0344', 'ops@spotlessturnover.com', '2026-12-31', true, 4.6, 'Net 7', '••••5530'],
    ['VEN-105', 'Pinch-A-Penny Pool', 'Pool & Spa', 'Ray Collins', '(305) 555-0355', 'brickell@pinchapenny.com', '2027-05-01', true, 4.2, 'Due on receipt', '••••3318'],
    ['VEN-106', 'SecureLock Systems', 'Access Control', 'Ivan Petrov', '(305) 555-0366', 'support@securelock.io', '2026-09-30', false, 3.9, 'Net 30', '••••9091']
  ].map(function (r) { return { id: r[0], name: r[1], trade: r[2], contact: r[3], phone: r[4], email: r[5], coi: r[6], w9: r[7], rating: r[8], terms: r[9], ein: r[10] }; });
  var PROPS = { 1: 'Brickell Bay Residences', 2: 'Ocean View Villa', 3: 'Coral Gables Terrace', 4: 'Las Olas Lofts', 5: 'Wynwood Commons', 6: 'Sunset Beach House', 7: 'Mar de Plata I', 8: 'Mar de Plata II', 12: 'Hollywood Boardwalk Suites', 13: 'Aventura Park Tower' };
  function wo(n, title, pid, unit, cat, prio, stage, aType, who, est, fin, sched, src, desc, extra) {
    return Object.assign({ id: 'WO-2026-' + n, req: n, title: title, pid: pid, unit: unit, cat: cat, prio: prio, stage: stage, aType: aType, assignee: who, estimate: est, final: fin, scheduled: sched, source: src, desc: desc, approval: est > APPROVAL_LIMIT ? (stage > 2 ? 'Approved by owner' : 'Owner approval required') : 'Within PM limit', labor: [], materials: [], photos: [], invoice: null, finalInsp: null, timeline: [], res: '', tenant: '', cleaning: '', inspection: '', incident: '', reported: '2026-10-04' }, extra || {});
  }
  function seed() {
    var W = [
      wo(1044, 'Bathroom exhaust fan making loud noise', 1, 'Unit 1204', 'Electrical', 'Medium', 0, 'vendor', 'VEN-103', 180, null, '', 'Tenant portal • Daniela Ortiz', 'Fan rattles loudly when switched on; started this morning. Tenant available all week.', { tenant: 'Daniela Ortiz' }),
      wo(1042, 'Water leak under kitchen sink', 1, 'Unit 1507', 'Plumbing', 'Urgent', 7, 'vendor', 'VEN-101', 1240, null, '2026-10-04T11:30', 'Building staff', 'Active leak at the supply line; shut-off valve closed by building staff. Cabinet base is wet.', {
        labor: [['Mike Duran (Aqua Pro)', 2.5, 95]], materials: [['Braided supply line, 3/8 in', 2, 18.4], ['Shut-off valve, ¼-turn', 1, 32.9], ['Cabinet base panel', 1, 145]],
        photos: [['Before', 'sink-supply-leak-01.jpg'], ['Before', 'cabinet-base-water-02.jpg'], ['After', 'new-supply-line-03.jpg']] }),
      wo(1041, 'A/C not cooling — master bedroom', 2, 'Unit 204', 'HVAC', 'High', 2, 'vendor', 'VEN-102', 4860, null, '', 'Guest • Reservation 20260913-DR-0003', 'Compressor failure confirmed. Replacement quote exceeds the owner approval threshold.', { res: '20260913-DR-0003', inspection: 'INS-2026-0311' }),
      wo(1039, 'Pool pump replacement', 6, 'Common Area', 'Pool & Spa', 'Medium', 5, 'staff', 'STF-001', 1890, null, '2026-10-08T09:00', 'Inspection INS-2026-0312', 'Pump motor seized. Replacement part ordered from Pinch-A-Penny.', { inspection: 'INS-2026-0312', materials: [['Pentair 1.5 HP pump motor', 1, 1340]] }),
      wo(1036, 'Front door smart lock offline', 4, 'Unit 9', 'Access Control', 'High', 5, 'staff', 'STF-002', 260, null, '2026-10-04T15:30', 'Cleaning CLN-2026-0412', 'Lock not responding to app; guest arriving at 5:00 PM.', { res: '20260913-DR-0004', cleaning: 'CLN-2026-0412' }),
      wo(1033, 'Dishwasher not draining', 5, 'Unit 2A', 'Appliance', 'Low', 1, 'none', '', 150, null, '', 'Tenant portal', 'Standing water after cycle completes.'),
      wo(1030, 'Balcony railing inspection', 1, 'Unit 2201', 'Structural', 'Medium', 10, 'vendor', 'VEN-103', 420, 420, '2026-10-01T10:00', 'HOA requirement', 'Annual railing load inspection per HOA requirement.', {
        labor: [['Tony Grant (Bright Spark)', 3, 95]], materials: [['Anchor bolts, stainless', 12, 8.75]], photos: [['Before', 'railing-north-01.jpg'], ['After', 'railing-certified-02.jpg']],
        invoice: { no: 'BSE-88214', amount: 420, status: 'Approved', exp: 'EXP-2026-0388' } }),
      wo(1012, 'Garbage disposal jammed', 1, 'Unit 1204', 'Appliance', 'Low', 11, 'staff', 'STF-001', 0, 64.5, '2026-09-22T16:00', 'Tenant portal • Daniela Ortiz', 'Disposal humming but not turning.', {
        tenant: 'Daniela Ortiz', labor: [['Luis Herrera', 1, 28]], materials: [['Disposal reset wrench', 1, 8.5]], photos: [['Before', 'disposal-01.jpg'], ['After', 'disposal-02.jpg']],
        invoice: { no: 'INT-2026-0922', amount: 64.5, status: 'Paid', exp: 'EXP-2026-0341' }, finalInsp: { by: 'Carlos Rivera', result: 'Pass', at: '2026-09-23T10:00' } })
    ];
    W.forEach(function (w) { for (var i = 0; i <= w.stage; i++) w.timeline.push([w.reported + 'T' + String(8 + i).padStart(2, '0') + ':00', STAGES[i] + (i === 0 ? ' — ' + w.source : ' completed'), i === 0 ? 'System' : 'Marcus Vance']); w.timeline.reverse(); });
    var CL = [
      ['CLN-2026-0410', 2, 'Unit 204', 'Turnover', '20260907-DR-0001', '20260913-DR-0003', 'vendor', 'VEN-104', '2026-10-04T12:00', '2026-10-04T16:00', 'In Progress', 145, 'INS-2026-0311'],
      ['CLN-2026-0411', 7, 'Apt 101', 'Turnover', '20260909-DR-0001', '20260913-DR-0002', 'vendor', 'VEN-104', '2026-10-04T10:30', '2026-10-04T15:00', 'Approved', 125, 'INS-2026-0309'],
      ['CLN-2026-0412', 4, 'Unit 9', 'Turnover', '20260910-DR-0001', '20260913-DR-0004', 'staff', 'STF-003', '2026-10-04T10:00', '2026-10-04T17:00', 'Completed', 0, 'INS-2026-0308'],
      ['CLN-2026-0413', 6, 'Main', 'Turnover + Linen', '20260906-DR-0001', '', 'vendor', 'VEN-104', '2026-10-04T12:00', '2026-10-05T15:00', 'Scheduled', 210, 'INS-2026-0312'],
      ['CLN-2026-0414', 8, 'Apt 305', 'Deep Clean', '', '', 'staff', 'STF-004', '2026-10-04T11:00', '2026-10-06T16:00', 'In Progress', 0, 'INS-2026-0313'],
      ['CLN-2026-0415', 12, 'Unit 7B', 'Move-In Clean', '', '', 'staff', 'STF-003', '2026-10-03T09:00', '2026-10-06T09:00', 'Needs Re-clean', 0, 'INS-2026-0314'],
      ['CLN-2026-0416', 13, 'Unit 1802', 'Turnover', '20260909-DR-0002', '20261002-DR-0001', 'vendor', 'VEN-104', '2026-10-05T12:00', '2026-10-10T15:00', 'Scheduled', 145, 'INS-2026-0315']
    ].map(function (r) {
      var items = ['Strip & remake beds (fresh linen)', 'Kitchen: appliances, counters, sink', 'Bathrooms sanitized & restocked', 'Floors vacuumed & mopped', 'Trash removed & bins relined', 'Amenity kit & consumables restocked', 'Damage & missing-item check', 'Thermostat & lights reset, doors locked'];
      var done = { 'Approved': 8, 'Completed': 8, 'In Progress': 4, 'Needs Re-clean': 7, 'Scheduled': 0 }[r[10]];
      return { id: r[0], pid: r[1], unit: r[2], type: r[3], resOut: r[4], resIn: r[5], aType: r[6], assignee: r[7], start: r[8], due: r[9], status: r[10], cost: r[11], inspection: r[12],
        checklist: items.map(function (t, i) { return [t, i < done]; }), photos: done >= 8 ? [['After', 'living-room.jpg'], ['After', 'kitchen.jpg'], ['After', 'primary-bath.jpg']] : [],
        supplies: done ? [['Linen set (queen)', 2], ['Amenity kit', 1], ['Toilet paper', 4]] : [], issues: r[0] === 'CLN-2026-0412' ? [['Smart lock not responding', 'WO-2026-1036']] : r[0] === 'CLN-2026-0415' ? [['Inspector: dust on vents, oven not cleaned', '']] : [], log: [] };
    });
    var IN = [
      ['INS-2026-0311', 'Move-Out', 2, 'Unit 204', 'STF-001', '2026-10-04T13:00', 'Scheduled', null, '20260907-DR-0001', 'CLN-2026-0410', []],
      ['INS-2026-0309', 'Pre-Arrival', 7, 'Apt 101', 'STF-005', '2026-10-04T12:15', 'Passed', 98, '20260913-DR-0002', 'CLN-2026-0411', []],
      ['INS-2026-0308', 'Pre-Arrival', 4, 'Unit 9', 'STF-005', '2026-10-04T11:30', 'Passed with Findings', 91, '20260913-DR-0004', 'CLN-2026-0412', [['Smart lock offline', 'High', 'WO-2026-1036']]],
      ['INS-2026-0312', 'Pre-Arrival', 6, 'Main', 'STF-005', '2026-10-05T09:00', 'Failed', 64, '', 'CLN-2026-0413', [['Pool heater not heating — pump seized', 'High', 'WO-2026-1039']]],
      ['INS-2026-0313', 'Pre-Arrival', 8, 'Apt 305', 'STF-005', '2026-10-06T10:00', 'Scheduled', null, '', 'CLN-2026-0414', []],
      ['INS-2026-0314', 'Move-In', 12, 'Unit 7B', 'STF-005', '2026-10-03T14:00', 'Failed', 72, '', 'CLN-2026-0415', [['Dust on vents, oven not cleaned', 'Medium', ''], ['Bedroom blind slat broken', 'Low', '']]],
      ['INS-2026-0315', 'Pre-Arrival', 13, 'Unit 1802', 'STF-005', '2026-10-07T10:00', 'Scheduled', null, '20261002-DR-0001', 'CLN-2026-0416', []],
      ['INS-2026-0298', 'Quarterly', 3, 'Unit 305', 'STF-005', '2026-09-26T10:00', 'Passed', 95, '', '', []],
      ['INS-2026-0301', 'Final (Work Order)', 1, 'Unit 2201', 'STF-005', '2026-10-06T15:00', 'Scheduled', null, '', '', []]
    ].map(function (r) { return { id: r[0], type: r[1], pid: r[2], unit: r[3], inspector: r[4], at: r[5], status: r[6], score: r[7], res: r[8], cleaning: r[9], findings: r[10], wo: r[0] === 'INS-2026-0301' ? 'WO-2026-1030' : '', log: [] }; });
    var TS = {}; STAFF.forEach(function (s, i) { TS[s.id] = { period: 'Sep 28 – Oct 11, 2026', hours: [8, 8, 7.5, 8, 8, 0, 0, 8, 8.5].map(function (h) { return s.status === 'Off Today' ? Math.max(0, h - 1) : h; }), status: i % 3 === 0 ? 'Approved' : 'Submitted' }; });
    return { v: VER, wos: W, cleanings: CL, inspections: IN, timesheets: TS, log: [] };
  }
  var db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || db.v !== VER) db = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { try { db = JSON.parse(e.newValue) || db; } catch (x) {} subs.forEach(function (f) { f(); }); } });
  var staff = function (id) { return STAFF.find(function (s) { return s.id === id || s.name === id; }); };
  var vendor = function (id) { return VENDORS.find(function (v) { return v.id === id || v.name === id; }); };
  var who = function (aType, id) { var x = aType === 'vendor' ? vendor(id) : aType === 'staff' ? staff(id) : null; return x ? x.name : 'Unassigned'; };
  var href = {
    wo: function (id) { return 'Master 57 - Work Order 360.dc.html?id=' + id; },
    cleaning: function (id) { return 'Master 56 - Cleaning.dc.html?id=' + id; },
    inspection: function (id) { return 'Master 60 - Inspections.dc.html?id=' + id; },
    checklist: function (i) { return 'Master 10 - Digital Inspection.dc.html?id=' + i.id + '&type=' + (/Move-In/.test(i.type) ? 'move-in' : 'move-out') + '&pid=' + i.pid + '&unit=' + encodeURIComponent(i.unit); },
    staff: function (id) { return 'Master 58 - Staff.dc.html?id=' + id; },
    vendor: function (id) { return 'Master 59 - Vendors.dc.html?id=' + id; },
    assignee: function (aType, id) { return aType === 'vendor' ? href.vendor(id) : aType === 'staff' ? href.staff(id) : ''; },
    reservation: function (id) { return id ? 'Master 31 - Reservation 360.dc.html?id=' + id : ''; },
    property: function (pid) { return 'Master 04 - Property Detail.dc.html?id=' + pid; },
    readiness: function (pid) { return 'Master 36 - Property Readiness.dc.html?id=' + pid; },
    expense: function (id) { return 'Master 64 - Accounts Payable.dc.html?tab=expenses&q=' + id; },
    payroll: function (name) { return 'Master 50 - Payroll.dc.html?q=' + encodeURIComponent(name); },
    messages: function (name) { return 'Master 24 - Messages.dc.html?to=' + encodeURIComponent(name); },
    docs: function (q) { return 'Master 12 - Documents.dc.html?q=' + encodeURIComponent(q); },
    incidentNew: function (q) { return 'Master 46 - Incidents.dc.html?new=1&' + q; },
    supplies: function () { return 'Master 22 - Supplies and Inventory.dc.html'; }
  };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var totals = function (w) { var lab = w.labor.reduce(function (a, l) { return a + l[1] * l[2]; }, 0), mat = w.materials.reduce(function (a, m) { return a + m[1] * m[2]; }, 0); return { labor: r2(lab), materials: r2(mat), actual: r2(lab + mat), final: w.final != null ? w.final : (w.invoice ? w.invoice.amount : null) }; };
  var money = function (n) { return n == null ? '—' : 'US$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var fmtT = function (t) { if (!t) return '—'; var d = new Date(t.length > 10 ? t : t + 'T12:00'); return isNaN(d) ? t : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };
  var nextId = function (list, prefix) { var n = list.reduce(function (m, x) { var k = parseInt(String(x.id).split('-').pop(), 10); return k > m ? k : m; }, 0) + 1; return prefix + String(n).padStart(4, '0'); };
  var stageLabel = function (w) { return w.stage >= 11 ? 'Closed' : STAGES[w.stage]; };
  var openWos = function () { return db.wos.filter(function (w) { return w.stage < 11; }); };
  window.MGH_OPS360 = { STAGES: STAGES, APPROVAL_LIMIT: APPROVAL_LIMIT, STAFF: STAFF, VENDORS: VENDORS, PROPS: PROPS, get db() { return db; }, save: save,
    subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    reset: function () { db = seed(); save(); }, staff: staff, vendor: vendor, who: who, href: href, totals: totals, money: money, fmtT: fmtT, nextId: nextId, stageLabel: stageLabel, openWos: openWos,
    propName: function (pid) { return PROPS[pid] || 'Property ' + pid; },
    coiOk: function (v) { return v && v.coi >= '2026-10-06'; },
    log: function (id, text) { db.log.unshift({ id: id, text: text, at: new Date().toISOString(), by: 'Marcus Vance' }); },
    logFor: function (id) { return db.log.filter(function (l) { return l.id === id; }); },
    assignedTo: function (id) { return { wos: db.wos.filter(function (w) { return w.assignee === id; }), cleanings: db.cleanings.filter(function (c) { return c.assignee === id; }), inspections: db.inspections.filter(function (i) { return i.inspector === id; }) }; },
    counts: function () { return { openWo: openWos().length, urgent: openWos().filter(function (w) { return w.prio === 'Urgent'; }).length, approvals: db.wos.filter(function (w) { return w.stage === 2; }).length, cleanOpen: db.cleanings.filter(function (c) { return ['Scheduled', 'In Progress', 'Needs Re-clean'].indexOf(c.status) >= 0; }).length, reclean: db.cleanings.filter(function (c) { return c.status === 'Needs Re-clean'; }).length, inspDue: db.inspections.filter(function (i) { return i.status === 'Scheduled'; }).length, inspFailed: db.inspections.filter(function (i) { return i.status === 'Failed'; }).length, onShift: STAFF.filter(function (s) { return s.status === 'On Shift'; }).length, vendorsBlocked: VENDORS.filter(function (v) { return !(v.coi >= '2026-10-06') || !v.w9; }).length }; }
  };
})();
