// MGHPM — Compliance data layer (Repair 03): HOA, Assets, Incidents, Notifications.
// Prototype store (localStorage). Links every record to Property / Owner / Tenant / Work Order / Expense / Documents.
(function () {
  if (window.MGH_COMP) return;
  var KEY = 'mghpm.compliance.v1', TODAY = '2026-10-06';
  var PROPS = [[1, 'Brickell Bay Residences', 'Alvarez Family Trust', 'Miami'], [2, 'Ocean View Villa', 'Alvarez Family Trust', 'Miami Beach'], [3, 'Coral Gables Terrace', 'Coral Ventures Trust', 'Coral Gables'], [4, 'Las Olas Lofts', 'Las Olas Partners LP', 'Fort Lauderdale'], [5, 'Wynwood Commons', 'Wynwood Urban Fund', 'Miami'], [6, 'Sunset Beach House', 'Alvarez Family Trust', 'Miami Beach'], [7, 'Mar de Plata I', 'Plata Investments Group', 'Miami Beach'], [8, 'Mar de Plata II', 'Plata Investments Group', 'Miami Beach'], [9, 'Key Biscayne Retreat', 'Harbor Key Trust', 'Key Biscayne'], [10, 'Doral Business Center', 'Doral Commercial REIT', 'Doral'], [11, 'Coconut Grove Cottages', 'Grove Heritage Trust', 'Miami'], [12, 'Hollywood Boardwalk Suites', 'Boardwalk Equities LLC', 'Hollywood'], [13, 'Aventura Park Tower', 'Turnberry Capital Trust', 'Aventura'], [14, 'Little Havana Flats', 'Calle Ocho Housing LLC', 'Miami'], [15, 'Hialeah Industrial Park', 'Hialeah Logistics LLC', 'Hialeah'], [16, 'Homestead Land Parcel', 'Southland Land Co.', 'Homestead'], [17, 'North Bay Village Residences', 'Bay Village Holdings', 'North Bay Village'], [18, 'Pompano Beach Duplex', 'Pompano Family Trust', 'Pompano Beach']].map(function (r) { return { id: r[0], title: r[1], owner: r[2], city: r[3] }; });
  var OWNER_ID = { 'Alvarez Family Trust': 'OWN-0001' };
  var TENANTS = [['TEN-0418', 'Daniela Ortiz', 1, '1204'], ['TEN-0422', 'Kenji Watanabe', 2, '3'], ['TEN-0431', 'Mia Johnson', 3, '210'], ['TEN-0436', 'Tom Becker', 4, 'L-5'], ['TEN-0447', 'Hannah Schultz', 7, '804'], ['TEN-0452', 'Oliver Grant', 13, '2107'], ['TEN-0455', 'Sophie Laurent', 8, '1102']].map(function (r) { return { id: r[0], name: r[1], pid: r[2], unit: r[3] }; });
  var RULE_CATS = ['Bylaws', 'Parking Rules', 'Pet Rules', 'Noise Rules', 'Guest Rules', 'Short-Term Rental Restrictions', 'Move-In / Move-Out Rules', 'Pool / Amenity Rules', 'Trash Rules', 'Exterior / Modification Rules'];
  var RULE_TXT = { 'Bylaws': 'Declaration of condominium, articles of incorporation and bylaws — board powers, assessments, voting.', 'Parking Rules': 'One assigned space per unit; guest parking max 72 h with registered tag; no commercial vehicles.', 'Pet Rules': 'Max 2 pets, 35 lb limit; leashed in common areas; registration and vaccination record required.', 'Noise Rules': 'Quiet hours 10:00 PM – 8:00 AM; construction noise Mon–Fri 8:30 AM – 5:00 PM only.', 'Guest Rules': 'Guests registered with front desk; max 4 overnight guests; amenity access with resident present.', 'Short-Term Rental Restrictions': 'Minimum lease term 6 months; max 2 leases per year; association approval and FL § 718.112 application.', 'Move-In / Move-Out Rules': 'Reserve service elevator 72 h ahead; Mon–Sat 9:00 AM – 5:00 PM; US$500 refundable deposit.', 'Pool / Amenity Rules': 'Pool 7:00 AM – 9:00 PM; no glass; children under 14 accompanied; gym by key fob.', 'Trash Rules': 'Bagged trash in chute; recycling in Level 1 room; bulk pickup by appointment only.', 'Exterior / Modification Rules': 'Architectural review required for windows, balconies, flooring and hurricane shutters.' };
  var HOAS = [
    { id: 'HOA-001', name: 'Brickell Bay Condominium Association', pids: [1], community: 'Brickell Bay Residences', manager: 'Lucía Fernández', company: 'Castle Group', phone: '(305) 555-0141', email: 'board@brickellbaycondo.org', dues: 812.4, version: 'v4.2', effective: '2026-01-15', renewal: '2026-12-31', str: 'Minimum lease 6 months • no short-term rentals' },
    { id: 'HOA-002', name: 'Ocean View Villas HOA', pids: [2, 6], community: 'Collins Ave Oceanfront', manager: 'Daniel Reyes', company: 'FirstService Residential', phone: '(305) 555-0188', email: 'manager@oceanviewvillas.org', dues: 640, version: 'v3.0', effective: '2025-06-01', renewal: '2026-10-31', str: 'Short-term rentals allowed with city BTR and registration' },
    { id: 'HOA-003', name: 'Coral Gables Terrace Condominium Assn.', pids: [3], community: 'Coral Gables Terrace', manager: 'Patricia Gómez', company: 'KW Property Management', phone: '(305) 555-0172', email: 'office@cgterrace.org', dues: 575.25, version: 'v2.1', effective: '2024-09-01', renewal: '2026-11-15', str: 'Minimum lease 12 months' },
    { id: 'HOA-004', name: 'Mar de Plata Master Association', pids: [7, 8], community: 'Mar de Plata I & II', manager: 'Andrés Molina', company: 'Plata Community Services', phone: '(305) 555-0119', email: 'master@mardeplata.org', dues: 698, version: 'v5.0', effective: '2026-03-01', renewal: '2027-02-28', str: 'Minimum stay 30 nights • max 4 rentals per year' },
    { id: 'HOA-005', name: 'Aventura Park Tower Condominium', pids: [13], community: 'Turnberry Isle', manager: 'Rachel Stein', company: 'Associa Gulf Coast', phone: '(305) 555-0164', email: 'admin@aventuraparktower.org', dues: 905, version: 'v3.3', effective: '2025-11-01', renewal: '2026-10-20', str: 'No leases under 3 months' },
    { id: 'HOA-006', name: 'Las Olas Lofts Owners Association', pids: [4], community: 'Las Olas Boulevard', manager: 'Marcus Lee', company: 'Campbell Property Mgmt', phone: '(954) 555-0133', email: 'board@lasolaslofts.org', dues: 488.6, version: 'v1.8', effective: '2025-02-01', renewal: '2027-01-31', str: 'Minimum lease 7 months for residential units' }
  ];
  function rulesFor(h, i) {
    var tn = TENANTS.filter(function (t) { return h.pids.indexOf(t.pid) >= 0; });
    return RULE_CATS.map(function (c, n) {
      var acks = tn.filter(function (t, k) { return (k + n + i) % 3 !== 0; }).map(function (t) { return [t.name, '2026-0' + (1 + (n % 9)) + '-1' + (n % 9)]; });
      return { id: h.id + '-R' + String(n + 1).padStart(2, '0'), hoaId: h.id, cat: c, text: c === 'Short-Term Rental Restrictions' ? h.str + '. ' + RULE_TXT[c] : RULE_TXT[c], version: h.version, effective: h.effective, expires: h.renewal, tenants: tn.map(function (t) { return t.name; }), acks: acks };
    });
  }
  var VIOS = [
    { id: 'VIO-2026-0041', hoaId: 'HOA-001', pid: 1, unit: '1204', tenant: 'Daniela Ortiz', cat: 'Noise Rules', desc: 'Repeated noise complaints after 11:00 PM from Unit 1204 (3 reports in 10 days).', reported: '2026-09-28', due: '2026-10-12', fine: 150, fineStatus: 'Issued', status: 'Corrective Action', actions: [['Written warning delivered to tenant', true], ['Tenant acknowledgment of quiet hours', false], ['Follow-up check with front desk', false]], notices: [['Owner', '2026-09-28 10:14', 'Email'], ['Tenant', '2026-09-28 10:20', 'Email + Portal']], wo: '' },
    { id: 'VIO-2026-0044', hoaId: 'HOA-001', pid: 1, unit: '907', tenant: '', cat: 'Exterior / Modification Rules', desc: 'Balcony enclosure installed without architectural review approval.', reported: '2026-09-30', due: '2026-10-30', fine: 500, fineStatus: 'Pending', status: 'Open', actions: [['Submit architectural review application', false], ['Remove enclosure or obtain approval', false]], notices: [['Owner', '2026-09-30 15:02', 'Certified mail']], wo: 'WO-2026-0512' },
    { id: 'VIO-2026-0038', hoaId: 'HOA-002', pid: 2, unit: '3', tenant: 'Kenji Watanabe', cat: 'Parking Rules', desc: 'Guest vehicle parked over 72 h in visitor space without tag.', reported: '2026-09-18', due: '2026-09-25', fine: 75, fineStatus: 'Paid', status: 'Resolved', actions: [['Vehicle moved', true], ['Guest tag issued', true]], notices: [['Owner', '2026-09-18 09:40', 'Email'], ['Tenant', '2026-09-18 09:41', 'SMS']], wo: '', resolved: '2026-09-22' },
    { id: 'VIO-2026-0046', hoaId: 'HOA-002', pid: 6, unit: '—', tenant: '', cat: 'Short-Term Rental Restrictions', desc: 'Guest registration not submitted 24 h before arrival for reservation 20261002-MB-0142.', reported: '2026-10-02', due: '2026-10-09', fine: 250, fineStatus: 'Pending', status: 'Open', actions: [['Submit guest registration form', false], ['Confirm city BTR on file', true]], notices: [['Owner', '2026-10-02 18:05', 'Email']], wo: '' },
    { id: 'VIO-2026-0035', hoaId: 'HOA-003', pid: 3, unit: '210', tenant: 'Mia Johnson', cat: 'Pet Rules', desc: 'Unregistered dog in unit; vaccination record missing.', reported: '2026-09-10', due: '2026-10-10', fine: 0, fineStatus: 'None', status: 'Corrective Action', actions: [['Pet registration form', true], ['Vaccination record upload', false]], notices: [['Owner', '2026-09-10 11:00', 'Email'], ['Tenant', '2026-09-10 11:02', 'Portal']], wo: '' },
    { id: 'VIO-2026-0047', hoaId: 'HOA-004', pid: 7, unit: '804', tenant: 'Hannah Schultz', cat: 'Trash Rules', desc: 'Bulk furniture left in trash room without pickup appointment.', reported: '2026-10-04', due: '2026-10-08', fine: 100, fineStatus: 'Issued', status: 'Fine Issued', actions: [['Schedule bulk pickup', false]], notices: [['Owner', '2026-10-04 08:30', 'Email']], wo: 'WO-2026-0519' },
    { id: 'VIO-2026-0039', hoaId: 'HOA-005', pid: 13, unit: '2107', tenant: 'Oliver Grant', cat: 'Move-In / Move-Out Rules', desc: 'Move-in on Sunday without service-elevator reservation.', reported: '2026-09-21', due: '2026-10-05', fine: 200, fineStatus: 'Disputed', status: 'Open', actions: [['Owner response to board', false], ['Hearing scheduled', false]], notices: [['Owner', '2026-09-21 12:10', 'Certified mail'], ['Tenant', '2026-09-21 12:12', 'Email']], wo: '' },
    { id: 'VIO-2026-0029', hoaId: 'HOA-006', pid: 4, unit: 'L-5', tenant: 'Tom Becker', cat: 'Pool / Amenity Rules', desc: 'Glass containers in pool deck area.', reported: '2026-08-30', due: '2026-09-06', fine: 0, fineStatus: 'None', status: 'Resolved', actions: [['Verbal warning', true]], notices: [['Tenant', '2026-08-30 17:20', 'Email']], wo: '', resolved: '2026-08-31' }
  ];
  var ASSETS = [
    ['AST-0001', 'Rooftop Chiller #1', 'HVAC', 1, 'Rooftop', 'TR-CVHF-99021', 'CVHF 500', 'Trane', '2019-05-14', 186400, '2026-05-14', 'Fair', 'Quarterly', '2026-07-10', '2026-10-10', '2034-05-01', 240000, 'Polar Air Mechanical', 'Active', ['WO-2026-0488'], [['EXP-2026-0931', 4820]]],
    ['AST-0002', 'Fire Pump & Controller', 'Security', 1, 'Basement B1', 'AC-FP-7731', '8100 Series', 'Aurora', '2018-02-01', 64200, '2025-02-01', 'Good', 'Annual', '2026-02-12', '2027-02-12', '2033-02-01', 78000, 'Siemens Fire Safety', 'Active', [], []],
    ['AST-0003', 'Pool Heat Pump', 'Pool Equipment', 2, 'Pool equipment room', 'HY-HP21-4410', 'HeatPro HP21404T', 'Hayward', '2022-04-08', 7850, '2027-04-08', 'Poor', 'Monthly', '2026-09-02', '2026-10-02', '2027-06-01', 8400, 'Blue Wave Pools', 'Out of Service', ['WO-2026-0516'], [['EXP-2026-0958', 640]]],
    ['AST-0004', 'Standby Generator 150 kW', 'Generator', 3, 'Service yard', 'GN-150-22871', 'SG150', 'Generac', '2020-08-20', 52300, '2025-08-20', 'Good', 'Monthly', '2026-09-15', '2026-10-15', '2035-08-01', 61000, 'Florida Power Systems', 'Active', [], [['EXP-2026-0904', 395]]],
    ['AST-0005', 'Refrigerator — Unit 1204', 'Appliances', 1, 'Unit 1204 kitchen', 'SS-RF28-55190', 'RF28T5001SR', 'Samsung', '2023-01-12', 1899, '2027-01-12', 'Good', 'Annual', '2026-01-20', '2027-01-20', '2033-01-01', 2100, 'Miami Appliance Pros', 'Active', [], []],
    ['AST-0006', 'Split AC 3-Ton — Villa', 'HVAC', 6, 'Main house attic', 'CA-24ACC6-0918', '24ACC636', 'Carrier', '2021-06-03', 6400, '2026-06-03', 'Failed', 'Quarterly', '2026-06-18', '2026-09-18', '2026-11-01', 7200, 'Polar Air Mechanical', 'Out of Service', ['WO-2026-0521'], []],
    ['AST-0007', 'Access Control Panel', 'Security', 7, 'Lobby', 'BR-ACP-4471', 'Synergis', 'Genetec', '2024-03-11', 18900, '2027-03-11', 'Excellent', 'Semi-annual', '2026-09-11', '2027-03-11', '2034-03-01', 21000, 'SecureLink Integrators', 'Active', [], []],
    ['AST-0008', 'Electrical Switchgear', 'Electrical', 4, 'Electrical room', 'SQ-SG-30112', 'QED-2', 'Square D', '2015-10-01', 41200, '2020-10-01', 'Fair', 'Annual', '2025-10-04', '2026-10-04', '2030-10-01', 55000, 'Volt Electric Co.', 'Active', [], []],
    ['AST-0009', 'Domestic Water Booster Pump', 'Plumbing', 13, 'Mechanical room', 'GR-BP-90034', 'Hydro MPC-E', 'Grundfos', '2017-07-22', 23600, '2022-07-22', 'Fair', 'Quarterly', '2026-07-30', '2026-10-30', '2029-07-01', 28000, 'Atlantic Plumbing', 'Active', ['WO-2026-0503'], [['EXP-2026-0941', 1260]]],
    ['AST-0010', 'Lobby Furniture Set', 'Furniture', 7, 'Lobby', '—', 'Custom', 'RH Contract', '2024-03-01', 14800, '—', 'Excellent', 'Annual', '2026-03-01', '2027-03-01', '2032-03-01', 16000, 'RH Contract', 'Active', [], []],
    ['AST-0011', 'Smart TV 65" — Beach House', 'Electronics', 6, 'Living room', 'LG-65UQ-77120', 'OLED65C3', 'LG', '2024-11-05', 1799, '2026-11-05', 'Good', 'Annual', '2025-11-10', '2026-11-10', '2030-11-01', 1900, 'Best Buy Business', 'Active', [], []],
    ['AST-0012', 'Maintenance Van', 'Vehicles', 5, 'Wynwood garage', '1FTBW3XM5NKA10293', 'Transit 250', 'Ford', '2022-02-15', 46800, '2025-02-15', 'Good', 'Quarterly', '2026-08-20', '2026-11-20', '2030-02-01', 52000, 'Ford Fleet Miami', 'Active', [], [['EXP-2026-0889', 312]]],
    ['AST-0013', 'Pressure Washer Kit', 'Tools', 5, 'Wynwood garage', 'KA-PW-5521', 'HD 3.5/30', 'Kärcher', '2023-05-09', 2150, '2025-05-09', 'Good', 'Semi-annual', '2026-05-12', '2026-11-12', '2029-05-01', 2300, '—', 'Active', [], []],
    ['AST-0014', 'Elevator Cab #2', 'Other', 8, 'Core B', 'OT-GEN2-11873', 'Gen2', 'Otis', '2012-09-01', 128000, '2017-09-01', 'Poor', 'Monthly', '2026-09-28', '2026-10-28', '2027-09-01', 165000, 'Otis Elevator', 'Active', ['WO-2026-0509'], [['EXP-2026-0950', 2980]]],
    ['AST-0015', 'Water Heater 50 gal (retired)', 'Plumbing', 11, 'Cottage 3', 'RH-50-22911', 'ProTerra', 'Rheem', '2014-03-01', 1150, '2020-03-01', 'Failed', '—', '2025-12-01', '—', '2026-01-10', 1400, 'Atlantic Plumbing', 'Retired', [], []]
  ].map(function (r) { return { id: r[0], name: r[1], cat: r[2], pid: r[3], location: r[4], unit: /Unit (\w+)/.test(r[4]) ? r[4].match(/Unit (\w+)/)[1] : '—', serial: r[5], model: r[6], maker: r[7], purchased: r[8], cost: r[9], warrantyExp: r[10], warranty: r[10] === '—' ? 'No warranty' : 'Manufacturer', condition: r[11], schedule: r[12], last: r[13], next: r[14], replace: r[15], replaceCost: r[16], vendor: r[17], status: r[18], wos: r[19], exps: r[20], docs: 2, photos: 3 }; });
  var INCS = [
    { id: 'INC-2026-0112', at: '2026-10-05T21:40', pid: 6, unit: '—', people: ['Guest • Laura Méndez party'], type: 'Guest Damage', severity: 'High', desc: 'Broken sliding glass door on pool terrace during checkout night; glass cleaned, door boarded.', photos: 6, videos: 1, docs: 1, police: '', claim: '', est: 2400, actual: 0, responsible: 'Guest (security deposit)', follow: 'Replace glass panel; claim against deposit', staff: 'Carlos Rivera', status: 'Action Required', resolution: '', closed: '', res: '20261002-MB-0142', tenant: '', wo: 'WO-2026-0524', exp: '' },
    { id: 'INC-2026-0110', at: '2026-10-04T08:15', pid: 1, unit: '1204', people: ['Tenant • Daniela Ortiz'], type: 'Utility Failure', severity: 'Medium', desc: 'Water leak from A/C condensate line into kitchen ceiling of Unit 1104.', photos: 4, videos: 0, docs: 0, police: '', claim: '', est: 850, actual: 640, responsible: 'Building (common element)', follow: 'Ceiling patch & paint in 1104', staff: 'Miguel Torres', status: 'Under Review', resolution: '', closed: '', res: '', tenant: 'Daniela Ortiz', wo: 'WO-2026-0518', exp: 'EXP-2026-0962' },
    { id: 'INC-2026-0108', at: '2026-10-02T14:05', pid: 13, unit: 'Pool deck', people: ['Visitor • minor (name withheld)'], type: 'Injury', severity: 'Critical', desc: 'Visitor slipped on wet pool deck; first aid given, EMS called, transported for evaluation.', photos: 5, videos: 1, docs: 3, police: 'APD-26-104882', claim: 'CLM-HX-55120', est: 15000, actual: 0, responsible: 'Under investigation', follow: 'Insurer adjuster site visit Oct 9', staff: 'Rachel Stein', status: 'Insurance Pending', resolution: '', closed: '', res: '', tenant: '', wo: '', exp: '' },
    { id: 'INC-2026-0105', at: '2026-09-29T02:30', pid: 4, unit: 'Garage P2', people: ['Tenant • Tom Becker'], type: 'Theft', severity: 'High', desc: 'Bicycle storage cage forced open; two bicycles reported stolen.', photos: 3, videos: 2, docs: 1, police: 'FLPD-26-093311', claim: '', est: 3100, actual: 0, responsible: 'Unknown third party', follow: 'Install additional camera at P2 cage', staff: 'Marcus Lee', status: 'Awaiting Documentation', resolution: '', closed: '', res: '', tenant: 'Tom Becker', wo: 'WO-2026-0511', exp: '' },
    { id: 'INC-2026-0101', at: '2026-09-24T19:10', pid: 7, unit: 'Lobby', people: ['Staff • front desk'], type: 'Access / Key Incident', severity: 'Medium', desc: 'Master key fob lost by contractor; fob deactivated and access log reviewed.', photos: 0, videos: 0, docs: 1, police: '', claim: '', est: 180, actual: 180, responsible: 'SecureLink Integrators', follow: 'Re-key fob series B', staff: 'Andrés Molina', status: 'Resolved', resolution: 'Fob deactivated; contractor charged replacement.', closed: '', res: '', tenant: '', wo: '', exp: 'EXP-2026-0937' },
    { id: 'INC-2026-0097', at: '2026-09-18T11:45', pid: 2, unit: '3', people: ['Tenant • Kenji Watanabe'], type: 'Tenant Damage', severity: 'Low', desc: 'Wall damage in bedroom from furniture move.', photos: 2, videos: 0, docs: 0, police: '', claim: '', est: 320, actual: 290, responsible: 'Tenant', follow: 'Charge to tenant ledger', staff: 'Carlos Rivera', status: 'Closed', resolution: 'Repaired; US$290.00 charged to tenant.', closed: '2026-09-26', res: '', tenant: 'Kenji Watanabe', wo: 'WO-2026-0497', exp: 'EXP-2026-0921' },
    { id: 'INC-2026-0113', at: '2026-10-06T07:20', pid: 8, unit: 'Core B', people: ['Residents (4) trapped 18 min'], type: 'Emergency', severity: 'Critical', desc: 'Elevator Cab #2 stopped between floors 9 and 10; fire rescue released passengers.', photos: 2, videos: 1, docs: 1, police: '', claim: '', est: 4500, actual: 0, responsible: 'Otis Elevator (service contract)', follow: 'Root-cause report from Otis within 48 h', staff: 'Andrés Molina', status: 'New', resolution: '', closed: '', res: '', tenant: '', wo: 'WO-2026-0526', exp: '', asset: 'AST-0014' },
    { id: 'INC-2026-0099', at: '2026-09-21T23:55', pid: 13, unit: '2107', people: ['Tenant • Oliver Grant'], type: 'HOA Complaint', severity: 'Low', desc: 'Neighbour complaint forwarded by association regarding Sunday move-in.', photos: 0, videos: 0, docs: 2, police: '', claim: '', est: 0, actual: 0, responsible: 'Tenant', follow: 'Linked to HOA violation VIO-2026-0039', staff: 'Rachel Stein', status: 'Under Review', resolution: '', closed: '', res: '', tenant: 'Oliver Grant', wo: '', exp: '', vio: 'VIO-2026-0039' }
  ];
  var N = function (id, cat, title, desc, module, record, href, at, pr, read, who, action) { return { id: id, cat: cat, title: title, desc: desc, module: module, record: record, href: href, at: at, priority: pr, read: read, assignee: who, action: action, dismissed: false, snooze: '' }; };
  var M = function (n) { return 'Master ' + n + '.dc.html'; };
  var NOTIFS = [
    N('NTF-9081', 'Maintenance', 'Maintenance overdue', 'Work order WO-2026-0488 (Rooftop Chiller #1) is 3 days past SLA.', 'Work Orders', 'WO-2026-0488', M('13 - Work Orders') + '?id=WO-2026-0488', '2026-10-06T08:02', 'High', false, 'Miguel Torres', 'Open Work Order'),
    N('NTF-9080', 'Owner Approvals', 'Owner approval required', 'Alvarez Family Trust must approve a US$2,400.00 glass replacement at Sunset Beach House.', 'Action Center', 'APR-2026-0217', M('28 - Action Center') + '?id=APR-2026-0217', '2026-10-06T07:55', 'High', false, 'Marcus Vance', 'Review Approval'),
    N('NTF-9079', 'Security', 'Emergency incident reported', 'Elevator entrapment at Mar de Plata II — 4 residents released by fire rescue.', 'Incidents', 'INC-2026-0113', M('46 - Incidents') + '?id=INC-2026-0113', '2026-10-06T07:24', 'Critical', false, 'Andrés Molina', 'Open Incident'),
    N('NTF-9078', 'HOA', 'HOA violation recorded', 'Bulk furniture in trash room • Mar de Plata I • Unit 804 • US$100.00 fine issued.', 'HOA', 'VIO-2026-0047', M('44 - HOA and Compliance') + '?violation=VIO-2026-0047', '2026-10-05T16:40', 'Normal', false, 'Marcus Vance', 'Open Violation'),
    N('NTF-9077', 'Documents', 'Document expiring', 'HOA rules package v3.3 for Aventura Park Tower expires Oct 20, 2026.', 'Documents', 'DOC-HOA-005', M('12 - Documents') + '?q=HOA-005', '2026-10-05T09:00', 'Normal', false, 'Marcus Vance', 'Open Document'),
    N('NTF-9076', 'Compliance', 'Asset warranty expired', 'Electrical Switchgear at Las Olas Lofts — warranty expired; annual service due Oct 4.', 'Assets', 'AST-0008', M('45 - Assets and Equipment') + '?id=AST-0008', '2026-10-04T10:12', 'Normal', true, 'Marcus Vance', 'Open Asset'),
    N('NTF-9075', 'Reservations', 'Arrival tomorrow — registration missing', 'Reservation 20261007-MB-0151 needs HOA guest registration before check-in.', 'Reservations', '20261007-MB-0151', M('31 - Reservation 360') + '?id=20261007-MB-0151', '2026-10-05T18:30', 'High', false, 'Sofía Herrera', 'Open Reservation'),
    N('NTF-9074', 'Payments', 'Rent payment failed', 'ACH return R01 on October rent for Unit 210, Coral Gables Terrace — US$3,450.00.', 'Payments', 'TRX-2026-10-0412', M('16 - Payments') + '?q=TRX-2026-10-0412', '2026-10-03T06:10', 'High', true, 'Ana Castillo', 'Open Payment'),
    N('NTF-9073', 'Leasing', 'Application ready for decision', 'APP-2026-0163 screening complete — score 742, income 3.4× rent.', 'Rental Applications', 'APP-2026-0163', M('08 - Application Detail') + '?id=APP-2026-0163', '2026-10-03T13:22', 'Normal', true, 'Sofía Herrera', 'Open Application'),
    N('NTF-9072', 'Cleaning', 'Turnover cleaning not started', 'Sunset Beach House turnover was due to start at 11:00 AM.', 'Cleaning', 'CLN-2026-0331', M('22 - Supplies and Inventory') + '?tab=jobs', '2026-10-05T11:20', 'High', false, 'Carlos Rivera', 'Open Cleaning Job'),
    N('NTF-9071', 'Operations', 'Property not ready for arrival', 'Sunset Beach House readiness blocked: A/C failed (AST-0006) and open incident INC-2026-0112.', 'Property Readiness', 'PR-6', M('36 - Property Readiness') + '?id=6', '2026-10-05T12:00', 'Critical', false, 'Marcus Vance', 'Open Readiness'),
    N('NTF-9070', 'Tenant Actions', 'Tenant acknowledgment pending', 'Daniela Ortiz has not acknowledged Noise Rules v4.2 (VIO-2026-0041 corrective action).', 'Tenants', 'TEN-0418', M('26 - Tenant Profile') + '?id=TEN-0418', '2026-10-02T09:15', 'Normal', true, 'Marcus Vance', 'Open Tenant'),
    N('NTF-9069', 'Staff', 'Shift not covered', 'Front desk overnight shift at Aventura Park Tower on Oct 7 has no assignee.', 'Staff', 'SHIFT-1007-APT', M('19 - People') + '?type=staff', '2026-10-04T15:45', 'Normal', true, 'Ana Castillo', 'Open Staff'),
    N('NTF-9068', 'Security', 'Unusual sign-in blocked', 'Sign-in from a new device was blocked for user ana.castillo — MFA challenge failed twice.', 'Audit Log', 'AUD-SEC-2210', M('38 - Audit Log') + '?q=ana.castillo', '2026-10-03T22:04', 'High', true, 'Marcus Vance', 'Open Audit Event'),
    N('NTF-9067', 'System', 'Bank feed reconnected', 'Operating account ••••9012 bank feed resumed after token refresh.', 'Settings', 'INT-BANK-01', M('21 - Settings') + '?section=integrations', '2026-10-02T07:00', 'Informational', true, 'System', 'Open Settings'),
    N('NTF-9066', 'Operations', 'Inspection scheduled', 'Pre-arrival inspection for Ocean View Villa assigned to Carlos Rivera, Oct 7 at 10:00 AM.', 'Operations Center', 'INSP-2026-0288', M('09 - Operations Center'), '2026-10-04T08:00', 'Informational', true, 'Carlos Rivera', 'Open Operations'),
    N('NTF-9065', 'HOA', 'HOA rules renewal due', 'Ocean View Villas HOA rules package v3.0 renews Oct 31, 2026 — upload new version.', 'HOA', 'HOA-002', M('44 - HOA and Compliance') + '?hoa=HOA-002', '2026-10-01T09:00', 'Normal', false, 'Marcus Vance', 'Open HOA'),
    N('NTF-9064', 'Compliance', 'Insurance claim awaiting adjuster', 'Claim CLM-HX-55120 for INC-2026-0108 — adjuster visit Oct 9.', 'Incidents', 'INC-2026-0108', M('46 - Incidents') + '?id=INC-2026-0108', '2026-10-03T12:40', 'High', false, 'Rachel Stein', 'Open Incident')
  ];
  function seed() { return { v: 3, hoas: HOAS, rules: [].concat.apply([], HOAS.map(rulesFor)), vios: VIOS, assets: ASSETS, incs: INCS, notifs: NOTIFS, log: [] }; }
  var db;
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 3) return s; } catch (e) {} return seed(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  var subs = [];
  db = load();
  var D = function (s) { return new Date(String(s).length <= 10 ? s + 'T12:00:00' : s); };
  var fmtD = function (s) { if (!s || s === '—') return '—'; var d = D(s); return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  var fmtT = function (s) { if (!s) return '—'; var d = D(s); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
  var money = function (n) { return 'US$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var days = function (s) { if (!s || s === '—') return null; return Math.round((D(s) - D(TODAY)) / 864e5); };
  var prop = function (id) { return PROPS.find(function (p) { return p.id === +id; }) || { id: id, title: 'Property ' + id, owner: '—', city: '' }; };
  var href = {
    property: function (pid) { return 'Master 04 - Property Detail.dc.html?id=' + pid; },
    owner: function (name) { return 'Master 25 - Owner Profile.dc.html?' + (OWNER_ID[name] ? 'id=' + OWNER_ID[name] : 'name=' + encodeURIComponent(name)); },
    tenant: function (name) { var t = TENANTS.find(function (x) { return x.name === name; }); return 'Master 26 - Tenant Profile.dc.html?' + (t ? 'id=' + t.id : 'name=' + encodeURIComponent(name)); },
    wo: function (id) { return 'Master 13 - Work Orders.dc.html?id=' + id; },
    expense: function (id) { return 'Master 64 - Accounts Payable.dc.html?tab=expenses&q=' + id; },
    docs: function (q) { return 'Master 12 - Documents.dc.html?q=' + encodeURIComponent(q); },
    reservation: function (id) { return 'Master 31 - Reservation 360.dc.html?id=' + id; },
    hoa: function (id) { return 'Master 44 - HOA and Compliance.dc.html?hoa=' + id; },
    violation: function (id) { return 'Master 44 - HOA and Compliance.dc.html?violation=' + id; },
    asset: function (id) { return 'Master 45 - Assets and Equipment.dc.html?id=' + id; },
    incident: function (id) { return 'Master 46 - Incidents.dc.html?id=' + id; },
    insurance: function () { return 'Master 27 - Insurance and Compliance.dc.html'; },
    readiness: function (pid) { return 'Master 36 - Property Readiness.dc.html?id=' + pid; },
    notifications: function (q) { return 'Master 47 - Notifications.dc.html' + (q ? '?' + q : ''); }
  };
  // Appends return context so the destination shows a back link (no dead ends).
  var withBack = function (url, label) { var here = location.pathname.split('/').pop() + location.search; return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'back=' + encodeURIComponent(decodeURIComponent(here)) + '&backLabel=' + encodeURIComponent('Back to ' + label); };
  var OPEN_V = function (v) { return v.status !== 'Resolved'; }, OPEN_I = function (i) { return i.status !== 'Resolved' && i.status !== 'Closed'; }, ACTIVE_A = function (a) { return a.status !== 'Retired'; };
  var ownerPids = function (owner) { return PROPS.filter(function (p) { return p.owner === owner; }).map(function (p) { return p.id; }); };
  var counts = function (pids) {
    var inP = function (x) { return !pids || pids.indexOf(x.pid) >= 0; };
    return { vios: db.vios.filter(function (v) { return inP(v) && OPEN_V(v); }).length, assets: db.assets.filter(function (a) { return inP(a) && ACTIVE_A(a); }).length, failed: db.assets.filter(function (a) { return inP(a) && (a.condition === 'Failed' || a.status === 'Out of Service') && ACTIVE_A(a); }).length, incs: db.incs.filter(function (i) { return inP(i) && OPEN_I(i); }).length, hoas: db.hoas.filter(function (h) { return !pids || h.pids.some(function (p) { return pids.indexOf(p) >= 0; }); }).length };
  };
  var audit = function (action, module, recordType, record, recordId, detail) { try { window.MGH_AUDIT && window.MGH_AUDIT.record({ actor: 'Marcus Vance', role: 'Portfolio Lead', action: action, module: module, recordType: recordType, record: record, recordId: recordId, category: 'Compliance', detail: detail }); } catch (e) {} };
  var nextId = function (list, prefix, pad) { var n = list.reduce(function (m, x) { var k = +String(x.id).replace(/\D/g, '').slice(-pad); return k > m ? k : m; }, 0) + 1; return prefix + String(n).padStart(pad, '0'); };
  window.MGH_COMP = {
    TODAY: TODAY, PROPS: PROPS, TENANTS: TENANTS, RULE_CATS: RULE_CATS, OWNER_ID: OWNER_ID,
    ASSET_CATS: ['HVAC', 'Appliances', 'Electrical', 'Plumbing', 'Pool Equipment', 'Generator', 'Security', 'Furniture', 'Electronics', 'Vehicles', 'Tools', 'Other'],
    INC_TYPES: ['Injury', 'Property Damage', 'Guest Damage', 'Tenant Damage', 'Theft', 'Security Event', 'Police Report', 'HOA Complaint', 'Insurance Claim', 'Emergency', 'Utility Failure', 'Access / Key Incident'],
    INC_STATUS: ['New', 'Under Review', 'Action Required', 'Awaiting Documentation', 'Insurance Pending', 'Resolved', 'Closed'],
    NOTIF_CATS: ['Operations', 'Maintenance', 'Cleaning', 'Reservations', 'Leasing', 'Payments', 'Owner Approvals', 'Tenant Actions', 'Compliance', 'HOA', 'Documents', 'Staff', 'Security', 'System'],
    get db() { return db; }, save: save, subscribe: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    reset: function () { db = seed(); save(); },
    prop: prop, ownerPids: ownerPids, counts: counts, href: href, withBack: withBack, audit: audit, nextId: nextId,
    isOpenV: OPEN_V, isOpenI: OPEN_I, isActiveA: ACTIVE_A,
    fmtD: fmtD, fmtT: fmtT, money: money, days: days,
    hoaOf: function (pid) { return db.hoas.find(function (h) { return h.pids.indexOf(+pid) >= 0; }); },
    tenantsOf: function (pid) { return TENANTS.filter(function (t) { return t.pid === +pid; }); },
    log: function (kind, id, text) { db.log.unshift({ kind: kind, id: id, text: text, at: new Date().toISOString(), by: 'Marcus Vance' }); },
    logFor: function (id) { return db.log.filter(function (l) { return l.id === id; }); },
    unread: function () { return db.notifs.filter(function (n) { return !n.read && !n.dismissed; }).length; },
    pushNotif: function (o) { db.notifs.unshift(Object.assign({ id: nextId(db.notifs, 'NTF-', 4), at: new Date().toISOString().slice(0, 16), read: false, dismissed: false, snooze: '', assignee: 'Marcus Vance' }, o)); }
  };

  // <mgh-return> — global back chip when a page was opened from a linked record (?back=&backLabel=).
  function ensureReturn() {
    var q = new URLSearchParams(location.search), b = q.get('back'), l = q.get('backLabel');
    if (!b || !l || document.querySelector('[data-mgh-return]')) return;
    if (Array.prototype.some.call(document.querySelectorAll('button,a'), function (e) { return e.textContent.trim() === l; })) return;
    var a = document.createElement('a'); a.setAttribute('data-mgh-return', ''); a.href = b.replace(/ /g, '%20'); a.textContent = '← ' + l;
    a.style.cssText = "position:fixed;top:76px;right:24px;z-index:45;display:flex;align-items:center;height:34px;padding:0 14px;border-radius:999px;background:#006B68;color:#fff;font:600 12px/1 'Plus Jakarta Sans',sans-serif;text-decoration:none;box-shadow:0 4px 12px rgba(15,23,42,0.18)";
    document.body.appendChild(a);
  }
  window.MGH_COMP.ensureReturn = ensureReturn;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(ensureReturn, 1200); }); else setTimeout(ensureReturn, 1200);

  // <mgh-compliance-summary scope="property|owner|tenant|ops"> — connected counters + top items for 360 pages.
  var F = "'Plus Jakarta Sans',system-ui,sans-serif";
  var TONE = { red: ['#FEF2F2', '#B91C1C'], amber: ['#FFFAEB', '#B45309'], teal: ['#DDF3F1', '#004F4D'], navy: ['#EEF2FF', '#132A52'], slate: ['#F1F5F9', '#475569'] };
  function icon(name, size, color) { try { var L = window.lucide; var key = name.split('-').map(function (s) { return s[0].toUpperCase() + s.slice(1); }).join(''); var node = L && L.icons && L.icons[key]; if (!node) return document.createElement('span'); var el = L.createElement(node); el.setAttribute('width', size); el.setAttribute('height', size); el.style.color = color || 'currentColor'; el.style.flexShrink = '0'; return el; } catch (e) { return document.createElement('span'); } }
  function h(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  if (!customElements.get('mgh-compliance-summary')) customElements.define('mgh-compliance-summary', class extends HTMLElement {
    connectedCallback() { var self = this; this.style.display = 'block'; this.render(); this._u = window.MGH_COMP.subscribe(function () { self.render(); }); this._t = setTimeout(function () { self.render(); }, 600); }
    disconnectedCallback() { this._u && this._u(); clearTimeout(this._t); }
    ctx() {
      var q = new URLSearchParams(location.search), scope = this.getAttribute('scope') || 'property';
      var label = scope === 'ops' ? 'Operations Center' : scope === 'owner' ? 'Owner 360' : scope === 'tenant' ? 'Tenant 360' : 'Property 360';
      if (scope === 'property') { var pid = +(this.getAttribute('pid') || q.get('id') || 2); return { scope: scope, pids: [pid], label: label, pid: pid }; }
      if (scope === 'owner') { var id = q.get('id'), nm = q.get('name'); var owner = nm || Object.keys(OWNER_ID).find(function (k) { return OWNER_ID[k] === id; }) || 'Alvarez Family Trust'; return { scope: scope, pids: ownerPids(owner), owner: owner, label: label }; }
      if (scope === 'tenant') { var tid = q.get('id'), tnm = q.get('name'); var t = TENANTS.find(function (x) { return x.id === tid || x.name === tnm; }) || TENANTS[0]; return { scope: scope, pids: [t.pid], tenant: t, label: label }; }
      return { scope: 'ops', pids: null, label: label };
    }
    render() {
      var C = window.MGH_COMP, c = this.ctx(), db = C.db, inP = function (x) { return !c.pids || c.pids.indexOf(x.pid) >= 0; };
      var back = function (u) { return C.withBack(u, c.label); };
      var vios = db.vios.filter(function (v) { return inP(v) && C.isOpenV(v) && (c.scope !== 'tenant' || v.tenant === c.tenant.name); });
      var incs = db.incs.filter(function (i) { return inP(i) && C.isOpenI(i) && (c.scope !== 'tenant' || i.tenant === c.tenant.name); });
      var assets = db.assets.filter(function (a) { return inP(a) && C.isActiveA(a); });
      var failed = assets.filter(function (a) { return a.condition === 'Failed' || a.status === 'Out of Service'; });
      var pq = c.scope === 'property' ? '?pid=' + c.pid : c.scope === 'owner' ? '?owner=' + encodeURIComponent(c.owner) : '';
      var tiles, items = [], title, sub;
      if (c.scope === 'tenant') {
        var rules = db.rules.filter(function (r) { return r.tenants.indexOf(c.tenant.name) >= 0; });
        var pend = rules.filter(function (r) { return !r.acks.some(function (a) { return a[0] === c.tenant.name; }); });
        title = 'HOA Notices & Incidents'; sub = 'Association rules applicable to this tenant, tenant-related incidents and rule acknowledgments. Internal notes and costs are not shown.';
        tiles = [['scale', 'HOA Notices', vios.length, 'amber', back(C.href.hoa((C.hoaOf(c.tenant.pid) || {}).id || '') + '&tenant=' + encodeURIComponent(c.tenant.name))], ['triangle-alert', 'Tenant Incidents', incs.length, 'red', back(C.href.incident('') + '&tenant=' + encodeURIComponent(c.tenant.name))], ['file-check', 'Acknowledgments Pending', pend.length + ' / ' + rules.length, 'navy', back(C.href.hoa((C.hoaOf(c.tenant.pid) || {}).id || '') + '&tab=rules')]];
        vios.forEach(function (v) { items.push(['scale', v.cat + ' • ' + v.status, 'Unit ' + v.unit + ' • due ' + C.fmtD(v.due), 'amber', back(C.href.violation(v.id))]); });
        pend.slice(0, 3).forEach(function (r) { items.push(['file-check', 'Acknowledge: ' + r.cat, r.version + ' • effective ' + C.fmtD(r.effective), 'navy', back(C.href.hoa(r.hoaId) + '&tab=rules')]); });
        incs.forEach(function (i) { items.push(['triangle-alert', i.type + ' • ' + i.status, i.id + ' • ' + C.fmtT(i.at), 'red', back(C.href.incident(i.id))]); });
      } else if (c.scope === 'owner') {
        title = 'HOA Issues, Incidents & Documents'; sub = 'Across ' + c.pids.length + ' properties owned by ' + c.owner + '.';
        tiles = [['scale', 'HOA Issues', vios.length, 'amber', back(C.href.hoa('') + '&tab=violations&owner=' + encodeURIComponent(c.owner))], ['triangle-alert', 'Incidents Affecting Property', incs.length, 'red', back(C.href.incident('') + '&owner=' + encodeURIComponent(c.owner))], ['file-text', 'Related Documents', vios.length + incs.length + assets.length * 2, 'navy', back(C.href.docs(c.owner))]];
        vios.forEach(function (v) { items.push(['scale', v.cat + ' • ' + C.prop(v.pid).title, v.id + ' • ' + v.status + (v.fine ? ' • fine ' + C.money(v.fine) : ''), 'amber', back(C.href.violation(v.id))]); });
        incs.forEach(function (i) { items.push(['triangle-alert', i.type + ' • ' + C.prop(i.pid).title, i.id + ' • ' + i.status + ' • ' + i.severity, i.severity === 'Critical' ? 'red' : 'amber', back(C.href.incident(i.id))]); });
      } else if (c.scope === 'ops') {
        var blocked = C.PROPS.filter(function (p) { return db.incs.some(function (i) { return i.pid === p.id && C.isOpenI(i) && (i.severity === 'Critical' || i.severity === 'High'); }) || failed.some(function (a) { return a.pid === p.id; }); });
        var act = vios.filter(function (v) { return C.days(v.due) !== null && C.days(v.due) <= 7; });
        title = 'Incidents, HOA & Asset Risk'; sub = 'Open incidents, readiness blocks, HOA issues requiring action and asset failures affecting operations.';
        tiles = [['triangle-alert', 'Open Incidents', incs.length, 'red', back(C.href.incident(''))], ['list-checks', 'Readiness Problems', blocked.length, 'amber', 'Master 36 - Property Readiness.dc.html'], ['scale', 'HOA Action Required', act.length, 'navy', back(C.href.hoa('') + '&tab=violations')], ['package', 'Asset Failures', failed.length, 'slate', back('Master 45 - Assets and Equipment.dc.html?status=failed')]];
        incs.filter(function (i) { return i.severity === 'Critical' || i.severity === 'High'; }).forEach(function (i) { items.push(['triangle-alert', i.type + ' • ' + C.prop(i.pid).title, i.id + ' • ' + i.status + ' • ' + i.staff, i.severity === 'Critical' ? 'red' : 'amber', back(C.href.incident(i.id))]); });
        failed.forEach(function (a) { items.push(['package', a.name + ' • ' + a.condition, C.prop(a.pid).title + ' • ' + a.status, 'slate', back(C.href.asset(a.id))]); });
        act.forEach(function (v) { items.push(['scale', v.cat + ' • ' + C.prop(v.pid).title, v.id + ' • due ' + C.fmtD(v.due), 'navy', back(C.href.violation(v.id))]); });
      } else {
        var hoa = C.hoaOf(c.pid);
        title = 'HOA, Assets & Incidents'; sub = hoa ? hoa.name + ' • dues ' + C.money(hoa.dues) + '/mo • rules ' + hoa.version : 'No homeowners association linked to this property.';
        tiles = [['scale', 'Open HOA Violations', vios.length, 'amber', back(hoa ? C.href.hoa(hoa.id) + '&tab=violations&pid=' + c.pid : 'Master 44 - HOA and Compliance.dc.html?pid=' + c.pid)], ['package', 'Active Assets', assets.length, 'teal', back('Master 45 - Assets and Equipment.dc.html' + pq)], ['triangle-alert', 'Open Incidents', incs.length, 'red', back('Master 46 - Incidents.dc.html' + pq)]];
        vios.forEach(function (v) { items.push(['scale', v.cat, v.id + ' • ' + v.status + ' • due ' + C.fmtD(v.due), 'amber', back(C.href.violation(v.id))]); });
        incs.forEach(function (i) { items.push(['triangle-alert', i.type + ' • ' + i.severity, i.id + ' • ' + i.status, 'red', back(C.href.incident(i.id))]); });
        failed.forEach(function (a) { items.push(['package', a.name + ' • ' + a.condition, a.id + ' • ' + a.status, 'slate', back(C.href.asset(a.id))]); });
      }
      this.innerHTML = '';
      var card = h('section', 'background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 2px rgba(15,23,42,0.05);padding:20px 24px;display:flex;flex-direction:column;gap:16px;font-family:' + F);
      var hd = h('div', 'display:flex;flex-direction:column;gap:4px');
      hd.appendChild(h('h3', 'margin:0;font:600 16px/1.3 ' + F + ';color:#172033', title));
      hd.appendChild(h('p', 'margin:0;font:400 13px/1.45 ' + F + ';color:#64748B;text-wrap:pretty', sub));
      card.appendChild(hd);
      var grid = h('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px');
      tiles.forEach(function (t) { var tn = TONE[t[3]]; var a = h('a', 'display:flex;flex-direction:column;gap:10px;padding:14px 16px;border:1px solid #E2E8F0;border-radius:8px;background:#F8FAFC;text-decoration:none;transition:border-color 140ms ease'); a.href = t[4].replace(/ /g, '%20'); a.onmouseenter = function () { a.style.borderColor = '#99D5D0'; }; a.onmouseleave = function () { a.style.borderColor = '#E2E8F0'; };
        var top = h('span', 'display:flex;align-items:center;gap:10px'); var ic = h('span', 'width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:' + tn[0]); ic.appendChild(icon(t[0], 15, tn[1])); top.appendChild(ic); top.appendChild(h('span', 'font:600 11px/1.2 ' + F + ';letter-spacing:0.06em;text-transform:uppercase;color:#64748B', t[1])); a.appendChild(top);
        a.appendChild(h('span', 'font:700 24px/1 ' + F + ';color:#172033;font-variant-numeric:tabular-nums', String(t[2]))); grid.appendChild(a); });
      card.appendChild(grid);
      if (items.length) { var list = h('div', 'display:flex;flex-direction:column');
        items.slice(0, 6).forEach(function (it) { var tn = TONE[it[3]]; var a = h('a', 'display:flex;align-items:center;gap:12px;padding:10px 4px;border-top:1px solid #F1F5F9;text-decoration:none'); a.href = it[4].replace(/ /g, '%20'); var ic = h('span', 'width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + tn[0]); ic.appendChild(icon(it[0], 14, tn[1])); a.appendChild(ic);
          var tx = h('span', 'display:flex;flex-direction:column;gap:2px;min-width:0;flex:1'); tx.appendChild(h('span', 'font:600 13px/1.3 ' + F + ';color:#172033', it[1])); tx.appendChild(h('span', 'font:400 12px/1.3 ' + F + ';color:#64748B;font-variant-numeric:tabular-nums', it[2])); a.appendChild(tx); a.appendChild(icon('chevron-right', 14, '#94A3B8')); list.appendChild(a); });
        card.appendChild(list);
      } else card.appendChild(h('p', 'margin:0;padding:10px 0 0;border-top:1px solid #F1F5F9;font:500 13px/1.4 ' + F + ';color:#64748B', 'No open compliance items.'));
      this.appendChild(card);
    }
  });
})();
