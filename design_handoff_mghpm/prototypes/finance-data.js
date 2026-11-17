// MGHPM Finance 360 shared store — General Ledger, Property Ledger, AR, AP / Vendor Payments, Payroll Payables,
// Bank Reconciliation, Closing Periods, Budgets, Recurring Transactions, Taxes.
// Prototype-only: persisted in localStorage (mghpm.fin360.v1). Reads the Deposits, Owner Distributions, Payroll and
// Operations 360 stores (when present) so KPIs and links stay consistent. No backend exists for these modules yet.
(function () {
  if (window.MGH_FIN) return;
  var KEY = 'mghpm.fin360.v1', VER = 1, TODAY = '2026-10-06', subs = [];
  var ACCTS = {
    1010: ['Operating Cash ••••9012', 'Asset', 'debit'], 1020: ['Trust / Escrow Cash ••••4471', 'Asset', 'debit'], 1200: ['Accounts Receivable', 'Asset', 'debit'],
    2010: ['Accounts Payable', 'Liability', 'credit'], 2100: ['Security Deposits Held', 'Liability', 'credit'], 2200: ['Owner Payables', 'Liability', 'credit'], 2300: ['Payroll Liabilities', 'Liability', 'credit'], 2400: ['Sales & Tourist Tax Payable', 'Liability', 'credit'],
    4010: ['Rent Income', 'Income', 'credit'], 4020: ['Reservation Income', 'Income', 'credit'], 4030: ['Cleaning Fees', 'Income', 'credit'], 4040: ['Management Fee Income', 'Income', 'credit'],
    5010: ['Maintenance & Repairs', 'Expense', 'debit'], 5020: ['Utilities', 'Expense', 'debit'], 5030: ['HOA Dues', 'Expense', 'debit'], 5040: ['Payroll Expense', 'Expense', 'debit'], 5050: ['Vendor Services — Cleaning', 'Expense', 'debit'], 5060: ['Insurance', 'Expense', 'debit']
  };
  var M = function (n) { return 'Master ' + n + '.dc.html'; };
  var SRC = {
    payment: function (id) { return ['Payment', id, M('16 - Payments') + '?id=' + id]; }, expense: function (id) { return ['Expense', id, M('64 - Accounts Payable') + '?tab=expenses&id=' + id]; },
    wo: function (id) { return ['Work Order', id, M('57 - Work Order 360') + '?id=' + id]; }, res: function (id) { return ['Reservation', id, M('31 - Reservation 360') + '?id=' + id]; },
    sd: function (id) { return ['Security Deposit', id, M('48 - Deposits') + '?id=' + id]; }, dep: function (id) { return ['Bank Deposit', id, M('48 - Deposits') + '?id=' + id]; },
    dist: function (id) { return ['Owner Distribution', id, M('49 - Owner Distributions') + '?id=' + id]; }, payroll: function (id) { return ['Pay Run', id, M('50 - Payroll') + '?id=' + id]; },
    bill: function (id) { return ['Bill', id, M('64 - Accounts Payable') + '?id=' + id]; }, cleaning: function (id) { return ['Cleaning', id, M('56 - Cleaning') + '?id=' + id]; },
    lease: function (id) { return ['Lease', id, M('41 - Lease 360') + '?id=' + id]; }, rec: function (id) { return ['Recurring', id, M('66 - Financial Close') + '?id=' + id]; }, manual: function () { return ['Manual Entry', '—', '']; }
  };
  function je(id, date, memo, src, pid, lines, status) { return { id: id, date: date, memo: memo, src: src, pid: pid, lines: lines, status: status || 'Posted', by: 'Ana Castillo' }; }
  function seed() {
    var G = [
      je('JE-2026-10-0001', '2026-10-01', 'Rent received — Daniela Ortiz, Unit 1204', SRC.payment('PAY-50421'), 1, [[1010, 3850, 0], [4010, 0, 3850]]),
      je('JE-2026-10-0002', '2026-10-01', 'Rent received — Kenji Watanabe, Unit 3', SRC.payment('PAY-50419'), 2, [[1010, 4200, 0], [4010, 0, 4200]]),
      je('JE-2026-10-0003', '2026-10-01', 'Management fee — October (8% of collected rent)', SRC.rec('REC-001'), 1, [[2200, 644, 0], [4040, 0, 644]]),
      je('JE-2026-10-0004', '2026-10-02', 'Security deposit received — Oliver Grant', SRC.sd('SD-0452'), 13, [[1020, 7200, 0], [2100, 0, 7200]]),
      je('JE-2026-10-0005', '2026-10-02', 'Security deposit received — Sophie Laurent', SRC.sd('SD-0455'), 8, [[1020, 6100, 0], [2100, 0, 6100]]),
      je('JE-2026-10-0006', '2026-10-03', 'Reservation income — 20261002-MB-0142 (net of tax)', SRC.res('20261002-MB-0142'), 6, [[1010, 4280.5, 0], [4020, 0, 3787.17], [2400, 0, 493.33]]),
      je('JE-2026-10-0007', '2026-10-03', 'Reservation income — 20260928-KB-0137 (net of tax)', SRC.res('20260928-KB-0137'), 9, [[1010, 6125, 0], [4020, 0, 5420.35], [2400, 0, 704.65]]),
      je('JE-2026-10-0008', '2026-10-03', 'Owner distribution — Turnberry Capital Trust, Sep 2026', SRC.dist('DIST-2026-09-0005'), 13, [[2200, 89930, 0], [1010, 0, 89930]]),
      je('JE-2026-10-0009', '2026-10-01', 'Balcony railing inspection — Bright Spark invoice BSE-88214', SRC.wo('WO-2026-1030'), 1, [[5010, 420, 0], [2010, 0, 420]]),
      je('JE-2026-10-0010', '2026-10-04', 'Turnover cleaning — Spotless Turnover Co. (CLN-2026-0410)', SRC.cleaning('CLN-2026-0410'), 2, [[5050, 145, 0], [2010, 0, 145]]),
      je('JE-2026-10-0011', '2026-10-04', 'Cleaning fee billed — reservation 20260913-DR-0003', SRC.res('20260913-DR-0003'), 2, [[1200, 175, 0], [4030, 0, 175]]),
      je('JE-2026-10-0012', '2026-10-05', 'Rent received — Mia Johnson, Unit 210', SRC.payment('PAY-50433'), 3, [[1010, 3450, 0], [4010, 0, 3450]]),
      je('JE-2026-10-0013', '2026-10-05', 'Rent received — Tom Becker, Unit L-5', SRC.payment('PAY-50434'), 4, [[1010, 2980, 0], [4010, 0, 2980]]),
      je('JE-2026-10-0014', '2026-10-05', 'HOA dues — Brickell Bay Residences, October', SRC.rec('REC-002'), 1, [[5030, 1180, 0], [2010, 0, 1180]]),
      je('JE-2026-10-0015', '2026-10-05', 'FPL electric — Ocean View Villa common area', SRC.rec('REC-004'), 2, [[5020, 312.48, 0], [1010, 0, 312.48]]),
      je('JE-2026-09-0188', '2026-09-22', 'Payroll PR-2026-09-02 — net pay & withholding', SRC.payroll('PR-2026-09-02'), null, [[5040, 18640, 0], [2300, 0, 4035.56], [1010, 0, 14604.44]]),
      je('JE-2026-09-0189', '2026-09-23', 'Garbage disposal — internal labor & parts (WO-2026-1012)', SRC.wo('WO-2026-1012'), 1, [[5010, 64.5, 0], [1010, 0, 64.5]]),
      je('JE-2026-10-0016', '2026-10-04', 'Duplicate posting — FPL autopay (reversed)', SRC.rec('REC-004'), 2, [[5020, 312.48, 0], [1010, 0, 312.48]], 'Reversed'),
      je('JE-2026-10-0017', '2026-10-04', 'Reversal of JE-2026-10-0016', SRC.manual(), 2, [[1010, 312.48, 0], [5020, 0, 312.48]]),
      je('JE-2026-10-0018', '2026-10-06', 'Accrue Miami-Dade tourist tax — September STR revenue', SRC.manual(), null, [[4020, 0, 0], [2400, 0, 0]], 'Draft')
    ];
    G[17].reversedBy = 'JE-2026-10-0017'; G[18].reverses = 'JE-2026-10-0016';
    var AR = [
      ['AR-2026-0601', 'Tenant', 'Daniela Ortiz', 1, 'Unit 1204', 'CHG-1204-10 • October rent', '2026-10-01', 3850, 3850, 'LSE-2026-0091'],
      ['AR-2026-0602', 'Tenant', 'Hannah Schultz', 7, 'Unit 804', 'CHG-0804-10 • October rent', '2026-10-01', 3100, 1500, 'LSE-2025-0390'],
      ['AR-2026-0598', 'Tenant', 'Hannah Schultz', 7, 'Unit 804', 'CHG-0804-09 • September rent', '2026-09-01', 3100, 2400, 'LSE-2025-0390'],
      ['AR-2026-0577', 'Tenant', 'Oliver Grant', 13, 'Unit 2107', 'CHG-2107-08 • HOA fine pass-through (VIO-2026-0041)', '2026-08-03', 250, 0, 'LSE-2026-0044'],
      ['AR-2026-0540', 'Tenant', 'Lucas Romero', 11, 'Cottage 3', 'CHG-C3-06 • Utility reimbursement', '2026-06-20', 412.6, 0, 'LSE-2024-0255'],
      ['AR-2026-0603', 'Tenant', 'Sophie Laurent', 8, 'Unit 1102', 'CHG-1102-10 • October rent', '2026-10-01', 3050, 0, 'LSE-2026-0102'],
      ['AR-2026-0604', 'Guest', 'Ana Torres', 13, 'Unit 1802', 'Reservation 20261002-DR-0001 • balance due', '2026-10-08', 2860, 0, '20261002-DR-0001'],
      ['AR-2026-0605', 'Guest', 'Reservation 20260913-DR-0003', 2, 'Unit 204', 'Cleaning fee', '2026-10-04', 175, 0, '20260913-DR-0003'],
      ['AR-2026-0590', 'Guest', 'Michael Brennan', 6, 'Main', 'Damage claim — broken patio glass (INC-2026-0104)', '2026-09-12', 2400, 0, '20260906-DR-0001'],
      ['AR-2026-0606', 'Owner', 'Las Olas Partners LP', 4, '—', 'Owner funding request — roof reserve shortfall', '2026-10-10', 6500, 0, ''],
      ['AR-2026-0571', 'Owner', 'Plata Investments Group', 8, '—', 'Reimbursement — elevator emergency call-out', '2026-08-28', 1875, 0, '']
    ].map(function (r) { return { id: r[0], type: r[1], party: r[2], pid: r[3], unit: r[4], ref: r[5], due: r[6], amount: r[7], paid: r[8], link: r[9], notes: [] }; });
    var AP = [
      ['BILL-2026-0412', 'Vendor', 'VEN-103', 'Bright Spark Electric', 1, 'Maintenance & Repairs', 'BSE-88214', '2026-10-16', 420, 'Approved', 'Unpaid', 'WO-2026-1030'],
      ['BILL-2026-0413', 'Vendor', 'VEN-104', 'Spotless Turnover Co.', 2, 'Vendor Services — Cleaning', 'STC-10-0410', '2026-10-11', 145, 'Pending Review', 'Unpaid', 'CLN-2026-0410'],
      ['BILL-2026-0414', 'Vendor', 'VEN-104', 'Spotless Turnover Co.', 7, 'Vendor Services — Cleaning', 'STC-10-0411', '2026-10-11', 125, 'Approved', 'Scheduled', 'CLN-2026-0411'],
      ['BILL-2026-0415', 'Vendor', 'VEN-102', 'Coastal HVAC Services', 2, 'Maintenance & Repairs', 'CHV-5521 (deposit 50%)', '2026-10-12', 2430, 'Pending Review', 'Unpaid', 'WO-2026-1041'],
      ['BILL-2026-0409', 'Vendor', 'VEN-105', 'Pinch-A-Penny Pool', 6, 'Maintenance & Repairs', 'PAP-77310 (pump motor)', '2026-10-06', 1340, 'Approved', 'Unpaid', 'WO-2026-1039'],
      ['BILL-2026-0410', 'Vendor', 'VEN-106', 'SecureLock Systems', 4, 'Maintenance & Repairs', 'SLS-2026-118', '2026-09-30', 680, 'On Hold', 'Unpaid', ''],
      ['BILL-2026-0402', 'Vendor', 'HOA', 'Brickell Bay Condominium Assn.', 1, 'HOA Dues', 'HOA-OCT-1204', '2026-10-10', 1180, 'Approved', 'Paid', ''],
      ['BILL-2026-0416', 'Contractor', 'CTR-001', 'Miguel Torres (1099)', 3, 'Maintenance & Repairs', 'MT-0930', '2026-10-09', 510, 'Pending Review', 'Unpaid', ''],
      ['BILL-2026-0417', 'Employee', 'STF-003', 'Rosa Martínez — reimbursement', 6, 'Vendor Services — Cleaning', 'RMB-0928 (supplies)', '2026-10-08', 86.4, 'Approved', 'Unpaid', ''],
      ['BILL-2026-0405', 'Vendor', 'UTIL', 'Florida Power & Light', 2, 'Utilities', 'FPL-0925-OV', '2026-10-05', 312.48, 'Approved', 'Paid', '']
    ].map(function (r) { return { id: r[0], payeeType: r[1], vid: r[2], payee: r[3], pid: r[4], cat: r[5], billNo: r[6], due: r[7], amount: r[8], approval: r[9], pay: r[10], wo: /^WO-/.test(r[11]) ? r[11] : '', cleaning: /^CLN-/.test(r[11]) ? r[11] : '', method: r[10] === 'Unpaid' ? '' : 'ACH', paidOn: r[10] === 'Paid' ? r[7] : '', schedOn: r[10] === 'Scheduled' ? '2026-10-10' : '', notes: [] }; });
    var PP = [
      ['PP-2026-10-01', 'Net pay — PR-2026-10-01 (Sep 16 – Sep 30)', 'Employees (direct deposit)', '2026-10-08', 14920.37, 'Payroll', 'PR-2026-10-01', 'Pending Approval'],
      ['PP-2026-10-02', 'Federal withholding & FICA — Form 941 deposit', 'IRS (EFTPS)', '2026-10-15', 5264.18, 'Tax', 'PR-2026-10-01', 'Unpaid'],
      ['PP-2026-10-03', 'Florida reemployment tax — Q3 2026', 'Florida Dept. of Revenue', '2026-10-31', 412.9, 'Tax', 'PR-2026-09-02', 'Unpaid'],
      ['PP-2026-09-04', 'Net pay — PR-2026-09-02 (Sep 1 – Sep 15)', 'Employees (direct deposit)', '2026-09-22', 14604.44, 'Payroll', 'PR-2026-09-02', 'Paid']
    ].map(function (r) { return { id: r[0], desc: r[1], payee: r[2], due: r[3], amount: r[4], kind: r[5], run: r[6], status: r[7] }; });
    var BK = [
      ['BT-9012-001', 1010, '2026-10-01', 'ACH CREDIT MGHPM RENT BATCH 77031', 8050, 'Matched', 'JE-2026-10-0001'],
      ['BT-9012-002', 1010, '2026-10-03', 'CARD SETTLEMENT STL-55092', 10405.5, 'Matched', 'JE-2026-10-0006'],
      ['BT-9012-003', 1010, '2026-10-03', 'ACH DEBIT TURNBERRY CAPITAL TRUST', -89930, 'Matched', 'JE-2026-10-0008'],
      ['BT-9012-004', 1010, '2026-10-05', 'FPL AUTOPAY 0925-OV', -312.48, 'Matched', 'JE-2026-10-0015'],
      ['BT-9012-005', 1010, '2026-10-05', 'ACH CREDIT MGHPM RENT BATCH 77120', 9530, 'Imported', ''],
      ['BT-9012-006', 1010, '2026-10-05', 'BANK SERVICE FEE SEP', -45, 'Exception', ''],
      ['BT-9012-007', 1010, '2026-10-06', 'STRIPE TRANSFER 20261004 PAYOUT', 1632.18, 'Exception', ''],
      ['BT-9012-008', 1010, '2026-10-04', 'FPL AUTOPAY 0925-OV DUPLICATE', -312.48, 'Matched', 'JE-2026-10-0016'],
      ['BT-9012-009', 1010, '2026-10-04', 'FPL REFUND DUPLICATE AUTOPAY', 312.48, 'Matched', 'JE-2026-10-0017'],
      ['BT-9012-010', 1010, '2026-10-02', 'INTERNAL TRANSFER TO PAYROLL CLEARING', -2500, 'Excluded', ''],
      ['BT-4471-001', 1020, '2026-10-02', 'CHECK DEPOSIT CHK-1002', 13300, 'Matched', 'JE-2026-10-0004'],
      ['BT-4471-002', 1020, '2026-10-05', 'INTEREST CREDIT ESCROW', 18.72, 'Imported', '']
    ].map(function (r) { return { id: r[0], acct: r[1], date: r[2], desc: r[3], amount: r[4], status: r[5], je: r[6], split: [] }; });
    var RECS = [{ acct: 1010, period: 'Oct 1 – Oct 6, 2026', opening: 214880.22, status: 'In Progress', stmt: 'STMT-9012-2026-10A' }, { acct: 1020, period: 'Oct 1 – Oct 6, 2026', opening: 486210, status: 'In Progress', stmt: 'STMT-4471-2026-10A' }];
    var PERIODS = [
      ['2026-07', 'July 2026', 'Closed', '2026-08-06', 'Ana Castillo'], ['2026-08', 'August 2026', 'Closed', '2026-09-07', 'Ana Castillo'], ['2026-09', 'September 2026', 'Closing', '', ''], ['2026-10', 'October 2026', 'Open', '', '']
    ].map(function (r) { var cl = r[2] === 'Closed'; return { id: 'PER-' + r[0], key: r[0], name: r[1], status: r[2], closedOn: r[3], by: r[4], checklist: [['Bank accounts reconciled', cl], ['AR reviewed & bad-debt assessed', cl || r[2] === 'Closing'], ['AP accruals posted', cl], ['Payroll journal posted', cl || r[2] === 'Closing'], ['Security deposit trust reconciled (FL § 83.49)', cl], ['Owner statements generated', cl], ['Tourist & sales tax accrued', cl], ['Management review & sign-off', cl]] }; });
    var BUD = [[1, 46200, 520000, 38000, 14160], [2, 50400, 610000, 52000, 3600], [3, 41400, 455000, 31000, 0], [4, 35760, 390000, 28000, 0], [6, 0, 720000, 44000, 0], [7, 37200, 410000, 30000, 0], [8, 36600, 395000, 29000, 0], [13, 43200, 480000, 33000, 0]].map(function (r, i) { var ytd = [0.74, 0.77, 0.72, 0.69, 0.81, 0.73, 0.71, 0.76][i]; return { id: 'BUD-2026-' + String(r[0]).padStart(2, '0'), pid: r[0], year: 2026, rentMo: r[1], income: r[2], opex: r[3], capex: r[4], actIncome: Math.round(r[2] * ytd), actOpex: Math.round(r[3] * (ytd + [0.04, 0.12, -0.03, 0.08, 0.02, 0.15, -0.05, 0.01][i])), status: i === 3 ? 'Draft' : 'Approved' }; });
    var REC = [
      ['REC-001', 'Management fee — 8% of collected rent', 'Journal', 'All managed properties', 'Monthly • 1st', '2026-11-01', 'Active', 4040, 'Calculated'],
      ['REC-002', 'HOA dues — Brickell Bay Residences', 'Bill', 'Brickell Bay Residences', 'Monthly • 5th', '2026-11-05', 'Active', 5030, 1180],
      ['REC-003', 'Property insurance premium — Citizens policy', 'Bill', 'Ocean View Villa', 'Monthly • 15th', '2026-10-15', 'Active', 5060, 940],
      ['REC-004', 'FPL electric autopay — common areas', 'Bank', 'Ocean View Villa', 'Monthly • 25th', '2026-10-25', 'Active', 5020, 'Variable'],
      ['REC-005', 'Rent charges — all active leases', 'Charge', 'Portfolio', 'Monthly • 1st', '2026-11-01', 'Active', 4010, 'Per lease'],
      ['REC-006', 'Pool service — Pinch-A-Penny', 'Bill', 'Sunset Beach House', 'Weekly • Tue', '2026-10-13', 'Paused', 5010, 95]
    ].map(function (r) { return { id: r[0], name: r[1], kind: r[2], scope: r[3], freq: r[4], next: r[5], status: r[6], acct: r[7], amount: r[8], history: [] }; });
    var TAX = [
      ['TAX-2026-09-FLST', 'Florida sales tax on transient rentals (6% + 1% surtax)', 'Florida Dept. of Revenue • DR-15', 'September 2026', '2026-10-20', 1835.42, 'Due'],
      ['TAX-2026-09-MDTT', 'Miami-Dade tourist development tax (6%)', 'Miami-Dade Tax Collector', 'September 2026', '2026-10-20', 1573.22, 'Due'],
      ['TAX-2026-Q3-941', 'Form 941 — federal payroll (Q3)', 'IRS', 'Q3 2026', '2026-10-31', 15792.54, 'Prepared'],
      ['TAX-2026-Q3-RT6', 'RT-6 Florida reemployment tax (Q3)', 'Florida Dept. of Revenue', 'Q3 2026', '2026-10-31', 412.9, 'Prepared'],
      ['TAX-2026-08-FLST', 'Florida sales tax on transient rentals', 'Florida Dept. of Revenue • DR-15', 'August 2026', '2026-09-20', 2210.08, 'Filed & Paid'],
      ['TAX-2026-1099', 'Form 1099-NEC — vendors & contractors', 'IRS / recipients', 'Tax year 2026', '2027-01-31', 0, 'Tracking'],
      ['TAX-2026-PROP', 'Property tax — Miami-Dade (11 parcels)', 'Miami-Dade Tax Collector', 'Tax year 2026', '2026-11-30', 148220, 'Upcoming']
    ].map(function (r) { return { id: r[0], name: r[1], agency: r[2], period: r[3], due: r[4], amount: r[5], status: r[6], conf: r[6] === 'Filed & Paid' ? 'FL-DR15-55120933' : '' }; });
    var PL = { 1: [46200, 0, 0, 0, 1180, 1420.5, 3960, 2400, 3696, 39800], 2: [50400, 9210.35, 175, 145, 0, 1312.48, 2430, 1100, 4032, 44300], 3: [41400, 0, 0, 0, 0, 980, 1210, 1800, 3312, 33400], 4: [35760, 0, 0, 0, 0, 742, 680, 950, 2861, 30900], 6: [0, 61840, 1260, 1890, 0, 1904, 1340, 2200, 4947, 49100], 7: [37200, 8840, 420, 125, 0, 1102, 520, 1500, 3682, 39900], 8: [36600, 4120, 210, 0, 0, 1210, 1875, 1500, 3258, 32800], 13: [43200, 6420, 345, 145, 0, 1288, 610, 1750, 3970, 41000] };
    return { v: VER, gl: G, ar: AR, ap: AP, pp: PP, bank: BK, recs: RECS, periods: PERIODS, budgets: BUD, recurring: REC, taxes: TAX, pl: PL, log: [] };
  }
  var db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!db || db.v !== VER) db = seed();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { try { db = JSON.parse(e.newValue) || db; } catch (x) {} subs.forEach(function (f) { f(); }); } });
  var read = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var money = function (n) { return n == null ? '—' : (n < 0 ? '−' : '') + 'US$' + Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var days = function (d) { return Math.round((new Date(TODAY + 'T12:00') - new Date(d + 'T12:00')) / 864e5); };
  var bucket = function (a) { var bal = r2(a.amount - a.paid); if (bal <= 0) return 'Paid'; var d = days(a.due); return d <= 0 ? 'Current' : d <= 30 ? '1–30' : d <= 60 ? '31–60' : d <= 90 ? '61–90' : '90+'; };
  var jeTotal = function (j) { return r2(j.lines.reduce(function (a, l) { return a + l[1]; }, 0)); };
  var acctBal = function (acct) { return r2(db.gl.filter(function (j) { return j.status !== 'Draft'; }).reduce(function (a, j) { return a + j.lines.filter(function (l) { return l[0] == acct; }).reduce(function (b, l) { return b + l[1] - l[2]; }, 0); }, 0)); };
  var rec = function (acct) { var R = db.recs.find(function (r) { return r.acct == acct; }), T = db.bank.filter(function (t) { return t.acct == acct; }); var bank = r2(R.opening + T.filter(function (t) { return t.status !== 'Excluded'; }).reduce(function (a, t) { return a + t.amount; }, 0)); var open = T.filter(function (t) { return t.status === 'Imported' || t.status === 'Exception'; }); var diff = r2(open.reduce(function (a, t) { return a + t.amount; }, 0)); return { R: R, T: T, bank: bank, book: r2(bank - diff), diff: diff, matched: T.filter(function (t) { return t.status === 'Matched'; }).length, unmatched: T.filter(function (t) { return t.status === 'Imported'; }).length, exceptions: T.filter(function (t) { return t.status === 'Exception'; }).length }; };
  var plOf = function (pid) { var p = db.pl[pid]; if (!p) return null; var inc = p[0] + p[1] + p[2], exp = p[3] + p[4] + p[5] + p[6] + p[7] + p[8]; return { rent: p[0], res: p[1], cleanFee: p[2], vendorClean: p[3], hoa: p[4], util: p[5], maint: p[6], payroll: p[7], fee: p[8], dist: p[9], income: r2(inc), expense: r2(exp), net: r2(inc - exp) }; };
  function syncOps() {
    var O = read('mghpm.ops360.v1'); if (!O || !O.wos) return;
    var V = { 'VEN-101': 'Aqua Pro Plumbing', 'VEN-102': 'Coastal HVAC Services', 'VEN-103': 'Bright Spark Electric', 'VEN-104': 'Spotless Turnover Co.', 'VEN-105': 'Pinch-A-Penny Pool', 'VEN-106': 'SecureLock Systems' }, changed = false;
    O.wos.forEach(function (w) { if (!w.invoice || w.aType !== 'vendor') return; var b = db.ap.find(function (x) { return x.wo === w.id && x.billNo.indexOf(w.invoice.no) === 0; }); if (!b) { db.ap.unshift({ id: 'BILL-' + w.id, payeeType: 'Vendor', vid: w.assignee, payee: V[w.assignee] || w.assignee, pid: w.pid, cat: 'Maintenance & Repairs', billNo: w.invoice.no, due: TODAY, amount: w.invoice.amount, approval: w.invoice.status === 'Pending Approval' ? 'Pending Review' : 'Approved', pay: w.invoice.status === 'Paid' ? 'Paid' : 'Unpaid', wo: w.id, cleaning: '', method: '', paidOn: '', schedOn: '', notes: [] }); changed = true; } else if (w.invoice.status === 'Paid' && b.pay !== 'Paid') { b.pay = 'Paid'; b.paidOn = TODAY; changed = true; } });
    if (changed) try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  syncOps();
  // Lote 5 — Expenses consolidated into AP (single authoritative record: db.ap). Legacy Payments ?expense records are
  // migrated once (by id, never duplicated). Vendor invoices become paid Bills; non-vendor costs become Direct expenses.
  // Records that duplicate an existing source (management fee REC-001, HOA BILL-2026-0402) are migrated as Excluded / On Hold and NOT posted.
  function migrateExpenses() {
    if (db.expMigrated) return;
    var legacy = (read('mghpm.payments.v2') || {}).exps || [
      { id: 'EXP-8845', date: '2026-10-04', pid: 1, cat: 'maintenance', vendor: 'Aqua Pro Plumbing', amount: 1240, desc: 'Invoice #INV-20481 — supply line repair' },
      { id: 'EXP-8841', date: '2026-10-02', pid: 2, cat: 'admin_fee', vendor: 'MGHPM', amount: 3412, desc: 'Management fee (8%) — September' },
      { id: 'EXP-8836', date: '2026-10-01', pid: 1, cat: 'other_expense', vendor: 'Brickell Bay HOA', amount: 2340, desc: 'HOA dues Q4' },
      { id: 'EXP-8824', date: '2026-09-30', pid: 6, cat: 'cleaning_services', vendor: 'Spotless Turnover Co.', amount: 640, desc: 'Turnover cleaning — 3 stays' },
      { id: 'EXP-8817', date: '2026-09-29', pid: 6, cat: 'utilities', vendor: 'FPL', amount: 418.25, desc: 'Electricity — September' }];
    var CAT = { maintenance: 'Maintenance & Repairs', cleaning_services: 'Vendor Services — Cleaning', utilities: 'Utilities', admin_fee: 'Management Fee', other_expense: 'HOA Dues' };
    var VID = { 'Aqua Pro Plumbing': 'VEN-101', 'Spotless Turnover Co.': 'VEN-104' };
    legacy.forEach(function (x) {
      if (db.ap.some(function (b) { return b.id === x.id; })) return;
      var cat = CAT[x.cat] || 'Maintenance & Repairs', vid = VID[x.vendor], r = { id: x.id, payeeType: vid ? 'Vendor' : 'Direct', vid: vid || '', payee: x.vendor, pid: x.pid, cat: cat, billNo: x.desc, due: x.date, amount: x.amount, approval: 'Approved', pay: 'Paid', wo: '', cleaning: '', method: vid ? 'ACH' : 'Card', paidOn: x.date, schedOn: '', notes: [], origin: 'Migrated from Payments › Expenses', je: '' };
      if (x.cat === 'admin_fee') { r.approval = 'Excluded'; r.pay = 'Not Posted'; r.notes.push('Duplicate of management fee REC-001 (owner-statement deduction, GL 4040) — not an AP expense'); }
      else if (x.vendor === 'Brickell Bay HOA') { r.approval = 'On Hold'; r.pay = 'Not Posted'; r.notes.push('Possible overlap with BILL-2026-0402 (HOA-OCT-1204) — review before posting'); }
      else { var acct = { 'Maintenance & Repairs': 5010, 'Vendor Services — Cleaning': 5050, Utilities: 5020 }[cat] || 5010; r.je = 'JE-MIG-' + x.id.slice(4); db.gl.push({ id: r.je, date: x.date, memo: x.desc + ' — ' + x.vendor + ' (migrated expense)', src: SRC.expense(x.id), pid: x.pid, lines: [[acct, x.amount, 0], [1010, 0, x.amount]], status: 'Posted', by: 'Migration' }); }
      db.ap.push(r);
    });
    db.expMigrated = TODAY; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  migrateExpenses();
  // Repair (Oct 8): one Payment ↔ Ledger relation. The Payment (Master 16) is the authoritative source; each JE references it by id (src[1]).
  // Legacy TRX-… ids are remapped once; completed payments without a JE get exactly one posting (idempotent by source id).
  function linkPayments() {
    if (db.payLinked) return;
    var MAP = { 'TRX-2026-10-0391': 'PAY-50421', 'TRX-2026-10-0393': 'PAY-50419', 'TRX-2026-10-0431': 'PAY-50433', 'TRX-2026-10-0433': 'PAY-50434' };
    db.gl.forEach(function (j) { if (j.src && MAP[j.src[1]]) j.src = SRC.payment(MAP[j.src[1]]); });
    var has = function (id) { return db.gl.some(function (j) { return j.src && j.src[1] === id; }); };
    [['JE-2026-10-0101', '2026-10-03', 'PAY-50417', 'Reservation payment — Laura Méndez, 20260929-DR-0001', 2, 4020, 2940],
     ['JE-2026-10-0102', '2026-10-02', 'PAY-50410', 'Rent received — Michael Chen, Unit 305', 3, 4010, 3450],
     ['JE-2026-10-0103', '2026-10-01', 'PAY-50404', 'Partial rent received — Sofia Martinez, Unit 102 (CHK 1182)', 2, 4010, 1325],
     ['JE-2026-10-0104', '2026-10-01', 'PAY-50398', 'Rent received — Priya Nair, Unit 301', 2, 4010, 4100],
     ['JE-2026-09-0190', '2026-09-20', 'PAY-50355', 'Reservation payment — Kenji Watanabe, 20260825-DR-0001', 13, 4020, 1260]].forEach(function (r) {
      if (has(r[2])) return; db.gl.push({ id: r[0], date: r[1], memo: r[3], src: SRC.payment(r[2]), pid: r[4], lines: [[1010, r[6], 0], [r[5], 0, r[6]]], status: 'Posted', by: 'Migration' });
    });
    if (!db.gl.some(function (j) { return j.id === 'JE-2026-09-0191'; })) db.gl.push({ id: 'JE-2026-09-0191', date: '2026-09-21', memo: 'Refund — Kenji Watanabe, 20260825-DR-0001 (PAY-50355)', src: SRC.payment('PAY-50355'), pid: 13, lines: [[4020, 1260, 0], [1010, 0, 1260]], status: 'Posted', by: 'Migration', refundOf: 'JE-2026-09-0190' });
    db.payLinked = TODAY; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  linkPayments();
  function markWoPaid(woId) { var O = read('mghpm.ops360.v1'); if (!O) return; var w = O.wos.find(function (x) { return x.id === woId; }); if (w && w.invoice) { w.invoice.status = 'Paid'; w.timeline.unshift([new Date().toISOString().slice(0, 16), 'Vendor invoice paid via Accounts Payable', 'Ana Castillo']); try { localStorage.setItem('mghpm.ops360.v1', JSON.stringify(O)); } catch (e) {} } }
  function kpis() {
    var dep = read('mghpm.deposits.v1'), dist = read('mghpm.distributions.v1'), pay = read('mghpm.payroll.v2');
    var sdHeld = dep && dep.sds ? dep.sds.filter(function (x) { return x.status !== 'Refunded'; }).reduce(function (a, x) { return a + x.amount; }, 0) : 47660;
    var ownerPay = dist && dist.list ? dist.list.filter(function (d) { return ['Paid', 'Reconciled', 'Rejected'].indexOf(d.status) < 0; }).reduce(function (a, d) { return a + (d.gross - d.fee - d.exp - d.reserve) + (d.adj || []).reduce(function (s, x) { return s + x.amt; }, 0); }, 0) : 412318.75;
    var cash = rec(1010).bank + rec(1020).bank;
    var ar = db.ar.reduce(function (a, x) { return a + Math.max(0, x.amount - x.paid); }, 0);
    var vendorAP = db.ap.filter(function (b) { return b.pay !== 'Paid' && b.approval !== 'Rejected'; }).reduce(function (a, b) { return a + b.amount; }, 0);
    var payroll = db.pp.filter(function (p) { return p.status !== 'Paid'; }).reduce(function (a, p) { return a + p.amount; }, 0);
    var noi = Object.keys(db.pl).reduce(function (a, k) { return a + plOf(k).net; }, 0);
    return { cash: r2(cash), ar: r2(ar), ap: r2(vendorAP + payroll), sdHeld: r2(sdHeld), ownerPay: r2(ownerPay), vendorAP: r2(vendorAP), payroll: r2(payroll), noi: r2(noi), payRunsPending: pay && pay.runs ? pay.runs.filter(function (r) { return r.status !== 'Paid'; }).length : 1 };
  }
  var nextJe = function () { var n = db.gl.filter(function (j) { return j.id.indexOf('JE-2026-10-') === 0; }).reduce(function (m, j) { return Math.max(m, +j.id.slice(-4)); }, 0) + 1; return 'JE-2026-10-' + String(n).padStart(4, '0'); };
  window.MGH_FIN = { TODAY: TODAY, ACCTS: ACCTS, SRC: SRC, get db() { return db; }, save: save, reset: function () { db = seed(); save(); },
    subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    money: money, r2: r2, days: days, bucket: bucket, jeTotal: jeTotal, acctBal: acctBal, rec: rec, plOf: plOf, kpis: kpis, nextJe: nextJe, markWoPaid: markWoPaid,
    acctName: function (a) { return a + ' • ' + (ACCTS[a] ? ACCTS[a][0] : 'Unknown'); },
    jeFor: function (srcId) { return db.gl.filter(function (j) { return j.src && j.src[1] === srcId; }); },
    log: function (id, text) { db.log.unshift({ id: id, text: text, at: new Date().toISOString(), by: 'Ana Castillo' }); },
    logFor: function (id) { return db.log.filter(function (l) { return l.id === id; }); },
    postJe: function (memo, src, pid, lines, status) { var id = nextJe(); db.gl.unshift({ id: id, date: TODAY, memo: memo, src: src, pid: pid, lines: lines, status: status || 'Posted', by: 'Ana Castillo' }); return id; },
    periodOf: function (d) { return db.periods.find(function (p) { return p.key === String(d).slice(0, 7); }); },
    isClosed: function (d) { var p = db.periods.find(function (x) { return x.key === String(d).slice(0, 7); }); return !!p && p.status === 'Closed'; },
    reverseJe: function (id, why) { var j = db.gl.find(function (x) { return x.id === id; }); if (!j || j.status === 'Reversed') return ''; var rid = nextJe(); db.gl.unshift({ id: rid, date: TODAY, memo: 'Reversal of ' + id + (why ? ' — ' + why : ''), src: j.src, pid: j.pid, lines: j.lines.map(function (l) { return [l[0], l[2], l[1]]; }), status: 'Posted', by: 'Ana Castillo', reverses: id }); j.status = 'Reversed'; j.reversedBy = rid; return rid; },
    addBankTx: function (acct, desc, amount, je, status) { var n = db.bank.filter(function (t) { return t.acct == acct; }).length + 1; var id = 'BT-' + (acct == 1020 ? '4471' : '9012') + '-' + String(100 + n); db.bank.unshift({ id: id, acct: acct, date: TODAY, desc: desc, amount: amount, status: status || 'Imported', je: je || '', split: [] }); return id; },
    matchBankTx: function (id, je) { var t = db.bank.find(function (x) { return x.id === id; }); if (!t) return false; t.status = 'Matched'; t.je = je; return true; },
    href: { gl: function (q) { return M('61 - General Ledger') + (q ? '?id=' + q : ''); }, pl: function (pid) { return M('62 - Property Ledger') + (pid ? '?id=' + pid : ''); }, ar: function (id) { return M('63 - Accounts Receivable') + (id ? '?id=' + id : ''); }, ap: function (id, tab) { return M('64 - Accounts Payable') + (id ? '?id=' + id : tab ? '?tab=' + tab : ''); }, bank: function (id) { return M('65 - Bank Reconciliation') + (id ? '?id=' + id : ''); }, close: function (id, tab) { return M('66 - Financial Close') + (id ? '?id=' + id : tab ? '?tab=' + tab : ''); } }
  };
})();
