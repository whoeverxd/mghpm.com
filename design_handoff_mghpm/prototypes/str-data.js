// Shared short-term-rental catalog (mirrors Master 29 data): stays, blocks, pricing, rules.
(function(){
const TODAY = '2026-10-04', TAX = 0.13, KWH = 0.14;
const RULES_VERSION = 'HR-2026.10 v3', RULES_EFFECTIVE = '2026-10-01';
const D = s => new Date(s + 'T12:00:00');
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addDays = (s, n) => { const d = D(s); d.setDate(d.getDate() + n); return iso(d); };
const nightsOf = (a, b) => (a && b) ? Math.round((D(b) - D(a)) / 864e5) : 0;
const fmtS = s => D(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtY = s => D(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtL = s => D(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtTs = t => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const money = n => (n < 0 ? '−' : '') + 'US$' + Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = n => 'US$' + Math.round(n).toLocaleString('en-US');
const r2 = n => Math.round(n * 100) / 100;
const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

const AREAS = [['all', 'All South Florida'], ['miami-beach', 'Miami Beach'], ['brickell', 'Brickell & Downtown Miami'], ['aventura', 'Aventura'], ['fort-lauderdale', 'Fort Lauderdale']];
const AREA_VIEW = { all: [25.9, -80.15, 10], 'miami-beach': [25.83, -80.125, 12], brickell: [25.765, -80.192, 14], aventura: [25.955, -80.14, 14], 'fort-lauderdale': [26.12, -80.14, 14] };
const AM = { wifi: ['Essentials', 'Wi-Fi'], ac: ['Essentials', 'Air Conditioning'], hot: ['Essentials', 'Hot Water'], linens: ['Essentials', 'Bed Linens & Towels'], washer: ['Essentials', 'Washer & Dryer'], workspace: ['Essentials', 'Dedicated Workspace'], fridge: ['Kitchen', 'Refrigerator'], stove: ['Kitchen', 'Stove & Oven'], micro: ['Kitchen', 'Microwave'], coffee: ['Kitchen', 'Coffee Maker'], cook: ['Kitchen', 'Cookware & Utensils'], dish: ['Kitchen', 'Dishwasher'], pool: ['Outdoor', 'Pool'], balcony: ['Outdoor', 'Balcony'], garden: ['Outdoor', 'Garden'], bbq: ['Outdoor', 'BBQ Grill'], beach: ['Outdoor', 'Beach Access'], ocean: ['Outdoor', 'Ocean View'], bay: ['Outdoor', 'Bay View'], parking: ['Parking & Access', 'Parking'], elevator: ['Parking & Access', 'Elevator'], security: ['Parking & Access', '24-Hour Security'], gated: ['Parking & Access', 'Gated Community'], lock: ['Parking & Access', 'Smart Lock Self Check-In'], tv: ['Entertainment', 'Smart TV'], cable: ['Entertainment', 'Cable'], stream: ['Entertainment', 'Streaming Capability'], cleanS: ['Services', 'Cleaning'], house: ['Services', 'Housekeeping on Request'], concierge: ['Services', 'Concierge'], gym: ['Services', 'Fitness Center'], pet: ['Services', 'Pets Allowed'] };
const AM_CATS = ['Essentials', 'Kitchen', 'Outdoor', 'Parking & Access', 'Entertainment', 'Services'];
const BASE = 'wifi ac hot linens fridge stove micro coffee cook tv stream cleanS lock elevator ';
const TOP = ['ocean', 'bay', 'pool', 'beach', 'parking', 'wifi', 'ac', 'washer', 'workspace', 'gym', 'pet'];
const UT = [['electricity', 'Electricity', 'zap'], ['water', 'Water', 'droplet'], ['internet', 'Wi-Fi / Internet', 'wifi'], ['tv', 'Cable / Smart TV', 'tv'], ['gas', 'Gas', 'flame'], ['cleaning', 'Cleaning', 'sparkles'], ['housekeeping', 'Daily Housekeeping', 'spray-can']];
const US = { included: ['Included', 'success'], cap: ['Included • Allowance', 'success'], metered: ['Separately Charged', 'warning'], fee: ['Fee', 'neutral'], optional: ['Optional', 'info'] };
const USHORT = { included: ['Included', 'check', '#15803D'], cap: ['Allowance', 'check', '#15803D'], metered: ['Metered', 'zap', '#B45309'], fee: ['Fee', 'receipt', '#475569'], optional: ['Optional', 'plus', '#00739F'] };
const POLICY = {
  flexible: ['Flexible', ci => [['Full refund', 'Cancel by ' + fmtY(addDays(ci, -7))], ['50% refund', 'Until 48 hours before check-in'], ['No refund', 'Within 48 hours of check-in']]],
  moderate: ['Moderate', ci => [['Full refund', 'Cancel by ' + fmtY(addDays(ci, -14))], ['50% refund', 'Cancel by ' + fmtY(addDays(ci, -7))], ['No refund', 'After ' + fmtY(addDays(ci, -7))]]],
  strict: ['Strict', ci => [['Full refund', 'Within 48 hours of booking, if check-in is 30+ days away'], ['50% refund', 'Cancel by ' + fmtY(addDays(ci, -30))], ['No refund', 'After ' + fmtY(addDays(ci, -30))]]]
};

const STAYS = [
  { pid: 2, key: '2|Apt 101', name: 'Ocean View Villa', title: 'Ocean View Villa — Oceanfront Residence 101', area: 'Collins Park', city: 'Miami Beach', areaKey: 'miami-beach', addr: '2501 Collins Ave, Apt 101, Miami Beach, FL 33140', lat: 25.8015, lng: -80.1275, loc: 'approx', type: 'Condo', br: 2, beds: 3, ba: 2, sleeps: 5, base: 4, extra: 35, rate: 420, rating: 4.86, reviews: 64, mode: 'request', min: 3, max: 28, clean: 185, pet: null, cancel: 'moderate', ci: '4:00 PM', co: '11:00 AM',
    am: BASE + 'pool beach ocean parking gym balcony dish washer security concierge cable house',
    util: { electricity: ['included'], water: ['included'], internet: ['included', '500 Mbps fiber'], tv: ['included', '55" Smart TV with cable'], cleaning: ['fee', 'US$185 one-time, at check-out'], housekeeping: ['optional', 'US$95 per visit, 24-hour notice'] },
    sleep: [['Primary Bedroom', 'King bed', 'bed-double'], ['Bedroom 2', 'Queen bed + Twin bed', 'bed-double']],
    near: [['Beach access', '2 min walk'], ['Collins Park & Bass Museum', '0.3 mi'], ['Publix supermarket', '0.4 mi'], ['Lincoln Road dining', '1.1 mi'], ['Miami International Airport (MIA)', '13 mi']],
    desc: 'Oceanfront two-bedroom residence on the Collins Park stretch of Miami Beach with direct beach access, a heated pool deck and a private balcony facing the Atlantic. Renovated kitchen, fiber internet and an assigned garage space.',
    hoa: 'Ocean View Villa Condominium Association', rc: { pool: 'community', poolHours: '8:00 AM – 9:00 PM', parking: 'One assigned garage space (P1-12). Visitor parking is not available.', visitors: 'Day visitors must be registered with the front desk and leave by 10:00 PM.', trash: 'Trash chute on each floor; recycling bins on garage level P1.', smokeOutdoor: false, access: 'Building fob and smart lock code.', extra: ['Balcony furniture must not be moved or used for climbing.'] } },
  { pid: 6, key: '6|Main', name: 'Sunset Beach House', title: 'Sunset Beach House — Private Pool Home', area: 'North Beach', city: 'Miami Beach', areaKey: 'miami-beach', addr: '7800 Atlantic Way, Miami Beach, FL 33141', lat: 25.8655, lng: -80.1209, loc: 'approx', type: 'House', br: 4, beds: 5, ba: 3.5, sleeps: 8, base: 6, extra: 50, rate: 890, rating: 4.93, reviews: 41, mode: 'request', min: 4, max: 28, clean: 325, pet: 150, cancel: 'strict', ci: '4:00 PM', co: '10:00 AM',
    am: BASE + 'pool beach ocean parking garden bbq washer dish workspace cable house pet',
    util: { electricity: ['cap', 'Included up to 40 kWh per night; usage above the allowance is billed at US$0.14/kWh'], water: ['included'], internet: ['included', '1 Gbps fiber, mesh Wi-Fi'], tv: ['included', 'Smart TVs in living room and primary suite'], gas: ['included', 'Pool heater and gas range'], cleaning: ['fee', 'US$325 one-time, at check-out'], housekeeping: ['optional', 'US$140 per visit, 24-hour notice'] },
    sleep: [['Primary Suite', 'King bed', 'bed-double'], ['Bedroom 2', 'Queen bed', 'bed-double'], ['Bedroom 3', 'Queen bed', 'bed-double'], ['Bedroom 4', '2 Twin beds', 'bed-single']],
    near: [['Beach access', '4 min walk'], ['North Beach Bandshell', '0.6 mi'], ['Publix supermarket', '0.5 mi'], ['Bal Harbour Shops', '2.4 mi'], ['Miami International Airport (MIA)', '16 mi']],
    desc: 'Four-bedroom single-family home steps from the beach in North Beach, with a heated private pool, covered terrace with gas grill, fenced garden and a dedicated workspace. Standby generator for uninterrupted power.',
    hoa: 'North Beach Neighborhood Standards (City of Miami Beach)', backup: 'Whole-home standby generator with automatic transfer during outages.', rc: { pool: 'private', poolHours: '8:00 AM – 9:00 PM (neighborhood noise ordinance)', parking: 'Driveway parking for up to 2 vehicles. Street parking is restricted to residents with permits.', visitors: 'Up to 4 daytime visitors with prior approval; visitors leave by 9:00 PM.', trash: 'Bins collected Tuesday and Friday; place at curb after 6:00 PM the evening before.', smokeOutdoor: true, access: 'Smart lock code and garage remote.', extra: ['Pool gate must remain closed and latched at all times.', 'Exterior lights off after 11:00 PM (sea turtle nesting season May–Oct).'] } },
  { pid: 7, key: '7|Apt 101', name: 'Mar de Plata I', title: 'Mar de Plata I — Beachfront Studio Suite 101', area: 'Mid-Beach', city: 'Miami Beach', areaKey: 'miami-beach', addr: '6365 Collins Ave, Apt 101, Miami Beach, FL 33141', lat: 25.8456, lng: -80.1203, loc: 'approx', type: 'Condo', br: 1, beds: 2, ba: 1, sleeps: 3, base: 2, extra: 25, rate: 310, rating: 4.78, reviews: 112, mode: 'instant', min: 2, max: 28, clean: 145, pet: null, cancel: 'flexible', ci: '3:00 PM', co: '11:00 AM',
    am: BASE + 'pool beach ocean security cable',
    util: { electricity: ['metered', 'US$0.14/kWh, meter read at check-in and check-out'], water: ['included'], internet: ['included', '300 Mbps'], tv: ['included', 'Smart TV with cable'], cleaning: ['fee', 'US$145 one-time, at check-out'], housekeeping: ['optional', 'US$75 per visit'] },
    sleep: [['Bedroom', 'Queen bed', 'bed-double'], ['Living Room', 'Sleeper sofa', 'sofa']],
    near: [['Beach access', '1 min walk'], ['Indian Creek waterway', '0.2 mi'], ['Pharmacy & market', '0.3 mi'], ['Miami International Airport (MIA)', '15 mi']],
    desc: 'Ground-floor one-bedroom suite in a beachfront building on Mid-Beach Collins Avenue, with direct sand access, a shared oceanfront pool and self check-in.',
    hoa: 'Mar de Plata Condominium Association', rc: { pool: 'community', poolHours: '9:00 AM – 8:00 PM', parking: 'No on-site parking. Public garage at 64th St & Collins.', visitors: 'No overnight visitors. Day visitors must be accompanied by the registered guest.', trash: 'Trash room at the end of each hallway.', smokeOutdoor: false, access: 'Lobby fob and smart lock code.', extra: [] } },
  { pid: 8, key: '8|Apt 305', name: 'Mar de Plata II', title: 'Mar de Plata II — Two-Bedroom Residence 305', area: 'Mid-Beach', city: 'Miami Beach', areaKey: 'miami-beach', addr: '6345 Collins Ave, Apt 305, Miami Beach, FL 33141', lat: 25.845, lng: -80.1204, loc: 'approx', type: 'Condo', br: 2, beds: 2, ba: 2, sleeps: 4, base: 2, extra: 25, rate: 295, rating: 4.71, reviews: 88, mode: 'instant', min: 2, max: 28, clean: 155, pet: 75, cancel: 'flexible', ci: '3:00 PM', co: '11:00 AM',
    am: BASE + 'pool beach parking washer balcony dish pet',
    util: { electricity: ['metered', 'US$0.14/kWh, meter read at check-in and check-out'], water: ['included'], internet: ['included', '300 Mbps'], tv: ['included', 'Smart TV'], cleaning: ['fee', 'US$155 one-time, at check-out'], housekeeping: ['optional', 'US$85 per visit'] },
    sleep: [['Primary Bedroom', 'King bed', 'bed-double'], ['Bedroom 2', 'Queen bed', 'bed-double']],
    near: [['Beach access', '2 min walk'], ['Indian Creek waterway', '0.2 mi'], ['Pharmacy & market', '0.3 mi'], ['Miami International Airport (MIA)', '15 mi']],
    desc: 'Pet-friendly two-bedroom on the third floor with a partial-ocean balcony, in-unit washer and dryer and one covered parking space.',
    hoa: 'Mar de Plata Condominium Association', rc: { pool: 'community', poolHours: '9:00 AM – 8:00 PM', parking: 'One covered space (C-305). Guest vehicles must display the issued hang tag.', visitors: 'No overnight visitors. Day visitors must be accompanied by the registered guest.', trash: 'Trash room at the end of each hallway.', smokeOutdoor: false, access: 'Lobby fob and smart lock code.', extra: ['Pets must be leashed in all common areas and are not permitted on the pool deck.'] } },
  { pid: 4, key: '4|Unit 9', name: 'Las Olas Lofts', title: 'Las Olas Lofts — Downtown Loft 9', area: 'Las Olas', city: 'Fort Lauderdale', areaKey: 'fort-lauderdale', addr: '401 E Las Olas Blvd, Unit 9, Fort Lauderdale, FL 33301', lat: 26.1191, lng: -80.1393, loc: 'approx', type: 'Loft', br: 1, beds: 2, ba: 1, sleeps: 3, base: 2, extra: 25, rate: 265, rating: 4.82, reviews: 57, mode: 'instant', min: 2, max: 28, clean: 125, pet: 75, cancel: 'moderate', ci: '3:00 PM', co: '11:00 AM',
    am: BASE + 'parking gym workspace washer dish pet security',
    util: { electricity: ['metered', 'US$0.14/kWh, meter read at check-in and check-out'], water: ['included'], internet: ['included', '1 Gbps fiber'], tv: ['included', 'Smart TV, streaming only'], cleaning: ['fee', 'US$125 one-time, at check-out'] },
    sleep: [['Loft Bedroom', 'Queen bed', 'bed-double'], ['Living Area', 'Sleeper sofa', 'sofa']],
    near: [['Las Olas Boulevard dining', 'On site'], ['Riverwalk', '0.3 mi'], ['Fort Lauderdale Beach', '2.1 mi'], ['Fort Lauderdale–Hollywood Airport (FLL)', '5 mi']],
    desc: 'Industrial loft on Las Olas Boulevard with double-height ceilings, a dedicated workspace, building fitness center and garage parking. Walk to Riverwalk and downtown dining.',
    hoa: 'Las Olas Lofts Owners Association', rc: { pool: 'na', parking: 'One garage space (G-9). Oversized vehicles not permitted.', visitors: 'Day visitors must be registered with building security.', trash: 'Trash and recycling room on each floor.', smokeOutdoor: false, access: 'Garage remote, building fob and smart lock code.', extra: ['Freight elevator must be reserved for luggage carts over 2 pieces.'] } },
  { pid: 1, key: '1|Unit 2101', name: 'Brickell Bay Residences', title: 'Brickell Bay Residences — Bay-View Residence 2101', area: 'Brickell', city: 'Miami', areaKey: 'brickell', addr: '1200 Brickell Bay Dr, Unit 2101, Miami, FL 33131', lat: 25.7631, lng: -80.1903, loc: 'exact', type: 'Condo', br: 2, beds: 2, ba: 2, sleeps: 4, base: 4, extra: 0, rate: 380, rating: 4.89, reviews: 96, mode: 'instant', min: 2, max: 28, clean: 165, pet: null, cancel: 'moderate', ci: '4:00 PM', co: '11:00 AM',
    am: BASE + 'pool bay parking gym workspace washer dish balcony security concierge cable',
    util: { electricity: ['included'], water: ['included'], internet: ['included', '1 Gbps fiber'], tv: ['included', 'Smart TV with cable'], gas: ['included', 'Gas cooktop'], cleaning: ['fee', 'US$165 one-time, at check-out'], housekeeping: ['optional', 'US$90 per visit'] },
    sleep: [['Primary Bedroom', 'King bed', 'bed-double'], ['Bedroom 2', 'Queen bed', 'bed-double']],
    near: [['Brickell City Centre', '0.5 mi'], ['Metromover station', '0.2 mi'], ['Bayfront Park', '1.0 mi'], ['Miami International Airport (MIA)', '8 mi']],
    desc: 'Twenty-first-floor residence on Brickell Bay Drive with floor-to-ceiling bay views, resort pool, concierge and valet. All utilities included.',
    hoa: 'Brickell Bay Residences Condominium Association', rc: { pool: 'community', poolHours: '7:00 AM – 10:00 PM', parking: 'Valet parking for one vehicle; additional vehicles are not permitted.', visitors: 'Visitors must be announced by the concierge and leave by 11:00 PM.', trash: 'Trash chute on each floor.', smokeOutdoor: false, access: 'Concierge check-in, building fob and smart lock code.', extra: [] } },
  { pid: 13, key: '13|Unit 1802', name: 'Aventura Park Tower', title: 'Aventura Park Tower — Three-Bedroom Residence 1802', area: 'Aventura', city: 'Aventura', areaKey: 'aventura', addr: '19355 Turnberry Way, Unit 1802, Aventura, FL 33180', lat: 25.9537, lng: -80.1405, loc: 'approx', type: 'Condo', br: 3, beds: 4, ba: 2, sleeps: 6, base: 4, extra: 35, rate: 340, rating: 4.75, reviews: 39, mode: 'request', min: 3, max: 28, clean: 195, pet: null, cancel: 'strict', ci: '4:00 PM', co: '11:00 AM',
    am: BASE + 'pool parking gym washer workspace dish balcony gated security',
    util: { electricity: ['included'], water: ['included'], internet: ['included', '500 Mbps'], tv: ['included', 'Smart TVs in living room and primary bedroom'], cleaning: ['fee', 'US$195 one-time, at check-out'], housekeeping: ['optional', 'US$110 per visit'] },
    sleep: [['Primary Bedroom', 'King bed', 'bed-double'], ['Bedroom 2', 'Queen bed', 'bed-double'], ['Bedroom 3', '2 Twin beds', 'bed-single']],
    near: [['Aventura Mall', '0.6 mi'], ['Turnberry Isle golf', '0.4 mi'], ['Sunny Isles Beach', '2.0 mi'], ['Fort Lauderdale–Hollywood Airport (FLL)', '14 mi']],
    desc: 'Three-bedroom family residence in a gated Aventura tower with a resort pool, fitness center and two parking spaces, minutes from Aventura Mall.',
    hoa: 'Aventura Park Tower Condominium Association', rc: { pool: 'community', poolHours: '8:00 AM – 9:00 PM', parking: 'Two assigned spaces (A-1802, A-1803). Guest vehicles must be registered at the gate.', visitors: 'Gate registration required for every visitor; no overnight visitors.', trash: 'Trash chute on each floor; bulk items to loading dock only.', smokeOutdoor: false, access: 'Gate code, building fob and smart lock code.', extra: [] } }
];
const BLOCKS = [
  { key: '4|Unit 9', from: '2026-11-06', to: '2026-11-09', kind: 'Maintenance', ref: 'WO-2026-0512' },
  { key: '8|Apt 305', from: '2026-11-01', to: '2026-11-03', kind: 'Cleaning', ref: 'Deep clean' },
  { key: '6|Main', from: '2026-11-11', to: '2026-11-12', kind: 'Inspection', ref: 'Quarterly inspection' },
  { key: '13|Unit 1802', from: '2026-11-18', to: '2026-12-01', kind: 'Owner Block', ref: 'Owner stay' },
  { key: '1|Unit 2101', from: '2026-12-01', to: '2026-12-04', kind: 'Property Unavailable', ref: 'Building elevator works' }
];
const RES_KEY = 'mghpm.reservations.v2', SKEY = 'mghpm.str.session.v2';
const SEED = [
  ['20261002-DR-0001', 'Ana Torres', '13|Unit 1802', '2026-10-10', '2026-10-14', 'confirmed', 3, 'Direct', false], ['20260417-DR-0032', 'Ana Torres', '6|Main', '2026-04-20', '2026-04-24', 'checked_out', 3, 'Direct', false], ['20260212-DR-0007', 'Laura Méndez', '2|Apt 101', '2026-02-14', '2026-02-18', 'checked_out', 2, 'Direct', true], ['20260608-DR-0011', 'Tom Becker', '7|Apt 101', '2026-06-10', '2026-06-15', 'checked_out', 2, 'Airbnb', false], ['20260722-DR-0019', 'Kenji Watanabe', '1|Unit 2101', '2026-07-24', '2026-07-28', 'checked_out', 2, 'Airbnb', false],
  ['20260907-DR-0001', 'Tom Becker', '2|Apt 101', '2026-09-28', '2026-10-04', 'checked_out', 2, 'Airbnb', false], ['20260909-DR-0001', 'Mia Johnson', '7|Apt 101', '2026-09-30', '2026-10-04', 'checked_out', 3, 'Direct', false], ['20260910-DR-0001', 'Oliver Grant', '4|Unit 9', '2026-10-01', '2026-10-04', 'checked_out', 2, 'Vrbo', false], ['20260906-DR-0001', 'The Novak Family', '6|Main', '2026-09-27', '2026-10-04', 'checked_out', 6, 'Direct', false], ['20260913-DR-0001', 'Ana Torres', '1|Unit 2101', '2026-10-04', '2026-10-05', 'checked_in', 2, 'Booking.com', false], ['20260913-DR-0002', 'James Whitaker', '7|Apt 101', '2026-10-04', '2026-10-11', 'confirmed', 2, 'Airbnb', false], ['20260913-DR-0003', 'Laura Méndez', '2|Apt 101', '2026-10-04', '2026-10-09', 'confirmed', 2, 'Direct', true], ['20260913-DR-0004', 'Hannah Schultz', '4|Unit 9', '2026-10-04', '2026-10-06', 'confirmed', 1, 'Vrbo', false], ['20260909-DR-0002', 'Kenji Watanabe', '13|Unit 1802', '2026-09-30', '2026-10-05', 'checked_in', 2, 'Airbnb', false], ['20260914-DR-0001', 'Camila Rossi', '6|Main', '2026-10-05', '2026-10-10', 'pending', 4, 'Direct', false], ['20260915-DR-0001', 'Ethan Park', '8|Apt 305', '2026-10-06', '2026-10-13', 'confirmed', 2, 'Booking.com', false], ['20260921-DR-0001', 'Isla Fernández', '2|Apt 101', '2026-10-12', '2026-10-16', 'pending', 3, 'Airbnb', false], ['20260923-DR-0001', 'Daniel Okoro', '7|Apt 101', '2026-10-14', '2026-10-18', 'confirmed', 2, 'Direct', false], ['20260926-DR-0001', 'Sophie Laurent', '6|Main', '2026-10-17', '2026-10-24', 'confirmed', 5, 'Vrbo', false], ['20260929-DR-0001', 'Laura Méndez', '2|Apt 101', '2026-10-20', '2026-10-27', 'confirmed', 2, 'Direct', true], ['20261001-DR-0001', 'Lucas Meyer', '4|Unit 9', '2026-10-22', '2026-10-25', 'cancelled', 2, 'Airbnb', false], ['20261003-DR-0001', 'Priya Shah', '8|Apt 305', '2026-10-24', '2026-10-31', 'pending', 2, 'Direct', false]
].map(([id, guest, unit, ci, co, status, guests, channel, isTenant], i) => ({ id, guest, unit, ci, co, status, guests, channel, isTenant, ...(status === 'checked_out' ? { meterIn: String(18200 + i * 137), meterOut: String(18200 + i * 137 + 84 + i * 9) } : status === 'checked_in' ? { meterIn: String(20410 + i * 53) } : {}) }));
const loadRes = () => { try { return (JSON.parse(sessionStorage.getItem(RES_KEY)) || {}).res || SEED; } catch (e) { return SEED; } };
const loadS = () => { try { return JSON.parse(sessionStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } };
const BOOK0 = { step: 0, authMode: 'register', email: '', pw: '', name: '', phone: '', first: '', last: '', gEmail: '', gPhone: '', adults: '2', children: '0', arrival: '4:00 PM – 6:00 PM', notes: '', ag: {}, holder: '', card: '', exp: '', cvc: '', zip: '', err: '', resId: null };
const FILTERS0 = { maxPrice: 0, type: '', br: 0, ba: 0, amen: {}, elec: false, allUtil: false, instant: false };

const amSet = st => st.am.trim().split(/\s+/);
const has = (st, k) => { const A = window.MGH_AMEN; if (A) { if (A.ITEM[k]) return A.availIds(st.pid).includes(k); if (k === 'pet') return !!A.get(st.pid).pets.allowed; if (A.LEGACY[k] !== undefined) return A.has(st.pid, k); } return amSet(st).includes(k) || (k === 'pet' && st.pet != null); };
const posOf = st => st.loc === 'exact' ? [st.lat, st.lng] : [st.lat + ((st.pid * 37) % 7 - 3) * 0.0009, st.lng + ((st.pid * 53) % 5 - 2) * 0.0011];
const ACTIVE = ['pending', 'confirmed', 'checked_in'];
const ranges = (st, res) => res.filter(r => r.unit === st.key && ACTIVE.includes(r.status)).map(r => [r.ci, r.co]).concat(BLOCKS.filter(b => b.key === st.key).map(b => [b.from, b.to]));
const isFree = (st, ci, co, res) => ranges(st, res).every(([a, b]) => !(ci < b && a < co));
const nightBlocked = (st, d, res) => ranges(st, res).some(([a, b]) => a <= d && d < b);
const nextAvail = (st, ci, n, res) => { for (let i = 1; i <= 90; i++) { const a = addDays(ci, i); if (isFree(st, a, addDays(a, n), res)) return a; } return null; };
const rateFor = (st, d) => { let m = 1; const dow = D(d).getDay(); if (dow === 5 || dow === 6) m *= 1.12; const md = d.slice(5); if (md >= '12-18' || md <= '01-03') m *= 1.35; else if (md >= '11-25' && md <= '11-29') m *= 1.2; return Math.round(st.rate * m); };
const quoteOf = (st, ci, co, guests, pets) => {
  const n = nightsOf(ci, co); if (n <= 0) return null;
  const nights = Array.from({ length: n }, (_, i) => rateFor(st, addDays(ci, i)));
  const nightly = nights.reduce((a, b) => a + b, 0), avg = nightly / n, varies = nights.some(x => x !== nights[0]);
  const lines = [{ label: money(avg) + ' × ' + pl(n, 'night') + (varies ? ' (avg.)' : ''), amt: nightly }];
  const disc = n >= 28 ? 0.2 : n >= 7 ? 0.1 : 0, discAmt = r2(nightly * disc);
  if (disc) lines.push({ label: disc === 0.2 ? 'Monthly stay discount (20%)' : 'Weekly stay discount (10%)', amt: -discAmt });
  const xg = Math.max(0, guests - st.base), extra = xg * st.extra * n;
  if (extra) lines.push({ label: 'Additional guest fee (' + xg + ' × ' + money0(st.extra) + ' × ' + n + ')', amt: extra });
  const pet = pets > 0 && st.pet ? st.pet : 0;
  if (pet) lines.push({ label: 'Pet fee (one-time)', amt: pet });
  lines.push({ label: 'Cleaning fee', amt: st.clean });
  const taxable = nightly - discAmt + extra + pet + st.clean, tax = r2(taxable * TAX);
  lines.push({ label: 'Florida & county taxes (13%)', amt: tax });
  const total = r2(taxable + tax), daysOut = nightsOf(TODAY, ci), dueNow = daysOut > 30 ? r2(total * 0.5) : total;
  return { pid: st.pid, ci, co, n, guests, pets, nights, avg, varies, lines, total, dueNow, balance: r2(total - dueNow), balDate: addDays(ci, -30), id: 'Q-' + String(st.pid).padStart(3, '0') + '-' + ci.replace(/-/g, '') + '-' + n + 'N-' + guests + 'G', version: 1, metered: st.util.electricity && st.util.electricity[0] === 'metered' };
};
const matches = (st, q, S, f) => {
  if (S.area !== 'all' && st.areaKey !== S.area) return false;
  if (S.guests > st.sleeps) return false;
  if (S.pets > 0 && st.pet == null) return false;
  if (f.maxPrice && q && q.avg > f.maxPrice) return false;
  if (f.type && st.type !== f.type) return false;
  if (f.br && st.br < f.br) return false;
  if (f.ba && st.ba < f.ba) return false;
  if (Object.keys(f.amen).some(k => f.amen[k] && !has(st, k))) return false;
  const e = (st.util.electricity || [])[0];
  if (f.elec && !(e === 'included' || e === 'cap')) return false;
  if (f.allUtil && !['electricity', 'water', 'internet', 'tv'].every(k => (st.util[k] || [])[0] === 'included')) return false;
  if (f.instant && st.mode !== 'instant') return false;
  return true;
};
const compute = (S, f, sort, res) => {
  const n = nightsOf(S.ci, S.co);
  const all = STAYS.map(st => { const q = quoteOf(st, S.ci, S.co, S.guests, S.pets); const free = n > 0 && isFree(st, S.ci, S.co, res); const minOk = n >= st.min && n <= st.max; return { st, q, free, minOk, ok: free && minOk, match: matches(st, q, S, f) }; }).filter(x => x.match);
  const avail = all.filter(x => x.ok && x.q);
  const so = { price_asc: (a, b) => a.q.total - b.q.total, price_desc: (a, b) => b.q.total - a.q.total, bedrooms: (a, b) => b.st.br - a.st.br, capacity: (a, b) => b.st.sleeps - a.st.sleeps, recommended: (a, b) => (b.st.rating * Math.log(b.st.reviews + 1)) - (a.st.rating * Math.log(a.st.reviews + 1)) };
  avail.sort(so[sort] || so.recommended);
  return { n, avail, unavail: all.filter(x => !x.ok) };
};
const utilText = (k, u) => {
  const [s, note] = u; const n = note ? ' ' + note + '.' : '';
  if (k === 'electricity') return s === 'included' ? 'Electricity is included in the reservation price.' : s === 'cap' ? 'Electricity is included subject to the property\'s reasonable-use policy:' + n : 'Electricity is billed separately according to consumption:' + n;
  const L = { water: 'Water', internet: 'Internet / Wi-Fi', tv: 'Cable / TV', gas: 'Gas' }[k];
  return L ? L + (s === 'included' ? ' is included.' : s === 'metered' ? ' is billed separately.' : ' is ' + (US[s] || ['available'])[0].toLowerCase() + '.') + n : null;
};
const rulesOf = st => {
  const rc = st.rc, pets = st.pet == null ? 'no' : 'approval';
  const R = (key, title, icon, items, o) => ({ key, title, icon, items: items.filter(Boolean), status: (o && o.custom) ? 'Custom' : 'Required', tone: (o && o.custom) ? 'info' : 'neutral', lead: (o && o.lead) || '', hasLead: !!(o && o.lead), dot: (o && o.dot) || '#006B68' });
  const hoa = [
    R('noise', 'Noise & Disturbances', 'volume-x', ['No loud music inside or outside the property.', 'No speakers, sound systems, karaoke, DJs or amplified music that can be heard from neighboring properties.', 'Quiet hours: 10:00 PM – 8:00 AM.', 'Avoid shouting, excessive noise or disruptive behavior on balconies, terraces, pool areas, parking areas, hallways and other shared spaces.', 'Repeated neighbor complaints may result in intervention by property management, security or the HOA.']),
    R('parties', 'Parties & Events', 'party-popper', ['No parties.', 'No events, celebrations, gatherings, receptions or organized activities without prior written authorization.', 'Occupancy is limited to the number of guests authorized in the reservation.', 'Unregistered visitors may be restricted under the property or HOA rules.']),
    R('parking', 'Vehicles & Parking', 'car', [rc.parking, 'No large gatherings of vehicles at the property; do not invite groups that cause excessive cars, parking congestion or disturbance to neighbors.', 'Use authorized parking spaces only.', 'Do not block driveways, entrances, sidewalks, neighboring properties, emergency access or common areas.', 'No excessive engine revving, horns, loud vehicle music or other vehicle-related disturbance.'], { custom: true }),
    R('neighbors', 'Respect for Neighbors', 'handshake', ['Do not enter neighboring properties or disturb residents.', 'Do not leave trash or personal belongings in common areas.', 'Respect the privacy and peaceful enjoyment of surrounding homes.', 'Aggressive, threatening, abusive or disorderly behavior is prohibited.']),
    rc.pool !== 'na' ? R('pool', rc.pool === 'private' ? 'Pool Rules — Private Pool' : 'Pool Rules — Community Pool', 'waves', ['Pool hours: ' + rc.poolHours + '.', 'No glass containers around the pool.', 'No running, and no diving where prohibited.', 'Children must be supervised at all times.', 'No loud parties at the pool.', 'Do not move pool furniture outside designated areas.', rc.pool === 'community' ? 'No unauthorized visitors at the community pool.' : null], { custom: true }) : null,
    R('trash', 'Trash & Cleanliness', 'trash-2', [rc.trash, 'Place garbage in designated containers and follow HOA waste-disposal instructions.', 'Do not leave garbage outside the unit unless authorized.', 'Excessive trash or abnormal cleaning requirements may be documented according to the booking terms.'], { custom: true })
  ].filter(Boolean);
  const owner = [
    R('occupancy', 'Registered Guests Only', 'users', ['Only guests included in the approved reservation may stay overnight unless management provides written authorization.'], { lead: 'Maximum occupancy: ' + st.sleeps + ' guests' }),
    R('gatherings', 'No Parties or Unauthorized Gatherings', 'ban', ['The property is intended for residential accommodation only.', 'Prohibited: parties; bachelor/bachelorette events unless specifically approved; large birthday celebrations; commercial or ticketed events; nightclub-style gatherings; unauthorized photo or video productions.']),
    R('music', 'Music', 'music', ['Music must remain at a reasonable residential level.', 'Not permitted: large external speakers, event subwoofers, DJs, amplified outdoor music, or music audible throughout the neighborhood.']),
    R('visitors', 'Visitors', 'user-plus', [rc.visitors, 'Visitors must comply with all property and HOA rules.', 'The primary guest is responsible for registered guests, visitors, children and invited service providers.'], { custom: true }),
    R('smoking', 'Smoking', 'cigarette-off', ['No cigarettes, cigars, hookah, vaping or smoking substances inside the property.', rc.smokeOutdoor ? 'Smoking is permitted only in the designated exterior area; dispose of materials in the provided container.' : 'No smoking on balconies, terraces or any exterior area of the property.'], { lead: 'Smoking: Not permitted' + (rc.smokeOutdoor ? ' indoors' : ''), custom: rc.smokeOutdoor }),
    R('pets', 'Pets', 'paw-print', pets === 'no' ? ['Pets are not permitted, including visiting pets. Service animals are accommodated as required by law.'] : ['Pets must not disturb neighbors.', 'Waste must be collected immediately.', 'Pets must comply with HOA rules.', 'Guests are responsible for pet-related damage.', 'One-time pet fee: ' + money0(st.pet) + '; maximum 2 pets.'], { lead: 'Pets: ' + (pets === 'no' ? 'Not Allowed' : 'Prior Approval Required'), custom: pets !== 'no' })
  ];
  const utilItems = UT.filter(([k]) => ['electricity', 'water', 'internet', 'gas', 'tv'].includes(k) && st.util[k]).map(([k]) => utilText(k, st.util[k])).filter(Boolean);
  if (st.backup) utilItems.push(st.backup);
  const prop = [
    R('care', 'Property Care', 'house', ['Keep the property reasonably clean and use furniture and appliances properly.', 'Report damage, leaks or maintenance problems promptly.', 'Do not move furniture between rooms without permission, make alterations, drill holes or install equipment.', 'Do not tamper with security systems, routers, electrical panels, cameras, locks or pool equipment.'].concat(rc.extra), { custom: rc.extra.length > 0 }),
    R('utilities', 'Electricity & Utilities', 'zap', utilItems, { custom: true }),
    R('ac', 'Air Conditioning', 'air-vent', ['Close doors and windows while air conditioning is operating.', 'Do not operate A/C with exterior doors left open.', 'Do not alter technical equipment or thermostats beyond normal guest controls.', 'Report malfunctioning equipment instead of attempting repairs.']),
    R('security', 'Security & Access', 'key-round', ['Access: ' + rc.access, 'Do not share access codes with unauthorized individuals or duplicate keys.', 'Do not allow unknown persons into gated areas; keep gates and exterior doors secured.', 'Report lost keys, cards or remotes immediately.', 'Building and security staff instructions must be respected.'], { custom: true }),
    R('checkin', 'Check-In / Check-Out', 'clock', ['Check-in: ' + st.ci + ' • Check-out: ' + st.co + '.', 'Early check-in is subject to availability.', 'Late check-out requires approval.', 'Keys, remotes and access cards must be returned as instructed.'], { custom: true }),
    R('prohibited', 'Prohibited Activities', 'octagon-alert', ['Illegal activities.', 'Unauthorized commercial activity.', 'Weapons where prohibited by applicable rules or law.', 'Intentional property damage or tampering with safety equipment.', 'Disturbing neighbors, overcrowding or unauthorized events.', 'Unauthorized subletting, or use of the property for purposes other than the approved stay.'], { dot: '#DC2626' })
  ];
  return {
    hoaName: st.hoa,
    summary: [['ban', 'No parties'], ['volume-x', 'No loud music'], ['moon', 'Quiet hours 10 PM – 8 AM'], ['cigarette-off', 'No smoking'], ['users', 'Maximum ' + st.sleeps + ' guests'], ['paw-print', pets === 'no' ? 'No pets' : 'Pets with approval'], ['car', 'Authorized parking only'], ['clock', 'Check-in ' + st.ci + ' • Out ' + st.co]],
    groups: [
      { key: 'g-hoa', title: 'HOA / Community Rules', source: st.hoa.includes('City') ? 'Neighborhood' : 'HOA', tone: 'info', sub: 'Set by ' + st.hoa + ' to protect neighbors, common areas, security and the peaceful use of the community.', sections: hoa },
      { key: 'g-owner', title: 'Owner Rules', source: 'Owner', tone: 'warning', sub: 'Set by the property owner for this residence and enforced by MGHPM as managing agent.', sections: owner },
      { key: 'g-prop', title: 'Property-Specific Rules', source: 'Property', tone: 'success', sub: 'Operating rules for ' + st.name + ', including utilities, access and check-in details from the property configuration.', sections: prop }
    ],
    na: rc.pool === 'na' ? ['Pool Rules'] : []
  };
};

window.MGH_STR_DATA = { TODAY, TAX, KWH, RULES_VERSION, RULES_EFFECTIVE, D, iso, addDays, nightsOf, fmtS, fmtY, fmtL, money, money0, r2, pl, AREAS, AREA_VIEW, AM, TOP, UT, US, USHORT, POLICY, STAYS, BLOCKS, RES_KEY, SEED, loadRes, amSet, has, posOf, ACTIVE, ranges, isFree, nextAvail, rateFor, quoteOf, rulesOf };
})();

// Stay folio: electricity configuration, guest services catalog, currency formatting.
(function(){
  const S = window.MGH_STR_DATA; if (!S) return;
  S.CUR = { USD: 'US$', DOP: 'RD$', EUR: '€' };
  S.fmtC = (n, c) => (n < -0.004 ? '−' : '') + (S.CUR[c] || (c + ' ')) + Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  S.ELEC_DEFAULT = {
    2: { method: 'included', currency: 'USD', meterNo: 'FPL-4471-2091', location: 'Electrical closet, unit entry' },
    6: { method: 'allowance', rate: 0.14, currency: 'USD', allowance: 40, meterNo: 'FPL-4476-3310', location: 'Exterior wall, driveway side' },
    7: { method: 'metered', rate: 0.14, currency: 'USD', meterNo: 'FPL-5207-1185', location: 'Ground-floor meter room, bank B' },
    8: { method: 'metered', rate: 0.14, currency: 'USD', meterNo: 'FPL-5208-3051', location: 'Third-floor meter room' },
    4: { method: 'metered', rate: 0.14, currency: 'USD', meterNo: 'FPL-3904-0912', location: 'Garage level G1 meter room' },
    1: { method: 'included', currency: 'USD', meterNo: 'FPL-4401-2101', location: 'Utility closet, service corridor' },
    13: { method: 'included', currency: 'USD', meterNo: 'FPL-6113-1802', location: 'Floor 18 electrical room' }
  };
  S.ELEC_METHODS = { included: ['Included', 'success'], allowance: ['Included With Allowance', 'success'], metered: ['Metered Separately', 'warning'], fixed: ['Fixed Fee', 'neutral'], na: ['Not Applicable', 'neutral'] };
  S.SETTINGS_KEY = 'mghpm.str.settings.v1';
  S.elecCfg = pid => { let o = {}; try { o = ((JSON.parse(sessionStorage.getItem(S.SETTINGS_KEY)) || {}).elec || {})[pid] || {}; } catch (e) {} return Object.assign({ method: 'na', rate: 0, currency: 'USD', allowance: 0, fixed: 0, meterNo: '', location: '' }, S.ELEC_DEFAULT[pid] || {}, o); };
  S.PRICING = { fixed: ['Fixed', 'Quantity'], person: ['Per Person', 'Guests'], day: ['Per Day', 'Days'], hour: ['Per Hour', 'Hours'], trip: ['Per Trip', 'Trips'], actual: ['Actual Cost', 'Quantity'], actualFee: ['Actual Cost + Fee', 'Quantity'], custom: ['Custom', 'Quantity'] };
  S.CATALOG = [
    ['chef', 'Private Chef', 'In-residence chef for breakfast, lunch or dinner', 'fixed', 175, 'taxable', true, ['Groceries (actual cost)', 'Delivery / Transport', 'Gratuity']],
    ['grocery', 'Grocery Shopping', 'Shopping service; groceries billed at actual receipt cost', 'actualFee', 35, 'taxable', true, ['Groceries (actual cost)', 'Delivery Fee']],
    ['grocery_delivery', 'Grocery Delivery', 'Delivery of guest-ordered groceries', 'trip', 15, 'taxable', true, []],
    ['airport_pickup', 'Airport Pickup', 'MIA / FLL arrival transfer', 'trip', 45, 'taxable', true, []],
    ['airport_drop', 'Airport Drop-Off', 'MIA / FLL departure transfer', 'trip', 45, 'taxable', true, []],
    ['extra_clean', 'Additional Cleaning', 'Mid-stay or extra cleaning visit', 'fixed', 95, 'taxable', true, []],
    ['housekeeping', 'Daily Housekeeping', 'Daily tidy, fresh towels and linens', 'day', 95, 'taxable', true, []],
    ['laundry', 'Laundry', 'Wash, dry and fold, per load', 'fixed', 40, 'taxable', true, []],
    ['early', 'Early Check-In', 'Arrival before standard check-in, subject to turnover', 'fixed', 50, 'taxable', false, []],
    ['late', 'Late Check-Out', 'Departure after standard check-out, requires approval', 'fixed', 50, 'taxable', false, []],
    ['extra_guest', 'Extra Guest', 'Additional registered guest, per night', 'day', 35, 'taxable', false, []],
    ['pet', 'Pet Fee', 'One-time pet fee', 'fixed', 75, 'taxable', false, []],
    ['baby', 'Baby Equipment', 'Crib, high chair or stroller rental, per day', 'day', 15, 'taxable', true, []],
    ['transport', 'Transportation', 'Private driver, hourly', 'hour', 65, 'taxable', true, []],
    ['concierge', 'Excursions / Concierge', 'Tickets and reservations at actual cost plus coordination fee', 'actualFee', 25, 'taxable', false, ['Tickets / reservations (actual cost)']],
    ['other', 'Other', 'Custom charge', 'custom', 0, 'taxable', false, ['Charge']]
  ].map(([key, name, desc, method, price, tax, vendor, lines]) => ({ key, name, desc, method, price, tax, vendor, visible: true, lines }));
  S.applyCatalog = () => { let o = {}; try { o = ((JSON.parse(sessionStorage.getItem(S.SETTINGS_KEY)) || {}).catalog) || {}; } catch (e) {} S.CATALOG.forEach(c => { const x = o[c.key]; if (!c.base) c.base = { price: c.price, visible: c.visible }; c.price = x && x.price != null ? +x.price : c.base.price; c.visible = x && x.visible != null ? !!x.visible : c.base.visible; }); };
  S.applyCatalog();
  S.VENDORS = ['MGHPM In-House', 'Chef Marisol Catering', 'Coastal Concierge Services', 'Brickell Car Service', 'SparkleClean Miami', 'Little Travelers Rentals', 'Publix Instacart'];
  S.SVC_STATUS = [['requested', 'Requested', 'warning'], ['approved', 'Approved', 'info'], ['confirmed', 'Confirmed', 'brand'], ['scheduled', 'Scheduled', 'info'], ['completed', 'Completed', 'success'], ['cancelled', 'Cancelled', 'neutral']];
  S.BILLABLE = ['approved', 'confirmed', 'scheduled', 'completed'];
  S.chargeCalc = (c, cat) => { const m = c.method || (cat && cat.method); const base = ['actual', 'custom'].includes(m) ? 0 : (+c.rate || 0) * Math.max(0, +c.qty || 0); const cost = (c.lines || []).reduce((a, l) => a + (+l.amt || 0), 0); const tax = cat && cat.tax === 'taxable' ? Math.round(base * S.TAX * 100) / 100 : 0; return { base, cost, tax, total: Math.round((base + cost + tax) * 100) / 100 }; };
  S.DOCS_KEY = 'mghpm.str.docs.v2';
})();

(function(){ const S = window.MGH_STR_DATA; if (!S) return;
S.SEED_CHARGES = {
  '20260913-DR-0002': [
    { id: 'SVC-0002-01', svc: 'airport_pickup', name: 'Airport Pickup', method: 'trip', date: '2026-10-04', qty: 1, rate: 45, vendor: 'Brickell Car Service', status: 'completed', lines: [], desc: 'MIA arrival 2:40 PM • AA 1187', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1791000000000 },
    { id: 'SVC-0002-02', svc: 'housekeeping', name: 'Daily Housekeeping', method: 'day', date: '2026-10-07', qty: 2, rate: 95, vendor: 'SparkleClean Miami', status: 'scheduled', lines: [], desc: 'Oct 7 & Oct 9 • 10:00 AM', notes: '', currency: 'USD', by: 'James Whitaker', at: 1791100000000 }
  ],
  '20260914-DR-0001': [
    { id: 'SVC-0003-01', svc: 'chef', name: 'Private Chef', method: 'fixed', date: '2026-10-07', qty: 1, rate: 175, vendor: '', status: 'requested', lines: [], desc: 'Family dinner for 4 • Italian menu', notes: '', currency: 'USD', by: 'Camila Rossi', at: 1791190000000 },
    { id: 'SVC-0003-02', svc: 'baby', name: 'Baby Equipment', method: 'day', date: '2026-10-05', qty: 5, rate: 15, vendor: '', status: 'requested', lines: [], desc: 'Crib and high chair', notes: '', currency: 'USD', by: 'Camila Rossi', at: 1791191000000 }
  ],
  '20260915-DR-0001': [
    { id: 'SVC-0004-01', svc: 'airport_pickup', name: 'Airport Pickup', method: 'trip', date: '2026-10-06', qty: 1, rate: 45, vendor: '', status: 'requested', lines: [], desc: 'FLL arrival 6:15 PM • B6 412', notes: '', currency: 'USD', by: 'Ethan Park', at: 1791195000000 }
  ],
  '20260926-DR-0001': [
    { id: 'SVC-0005-01', svc: 'concierge', name: 'Excursions / Concierge', method: 'actualFee', date: '2026-10-19', qty: 1, rate: 25, vendor: 'Coastal Concierge Services', status: 'approved', lines: [{ label: 'Everglades airboat tour (actual cost)', amt: 340 }], desc: 'Airboat tour for 5', notes: '', currency: 'USD', by: 'Sophie Laurent', at: 1791196000000 },
    { id: 'SVC-0005-02', svc: 'grocery', name: 'Grocery Shopping', method: 'actualFee', date: '2026-10-17', qty: 1, rate: 35, vendor: 'Publix Instacart', status: 'confirmed', lines: [], desc: 'Pre-arrival stocking', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1791197000000 }
  ],
  '20260906-DR-0001': [
    { id: 'SVC-0006-01', svc: 'extra_clean', name: 'Additional Cleaning', method: 'fixed', date: '2026-09-30', qty: 1, rate: 95, vendor: 'SparkleClean Miami', status: 'completed', lines: [], desc: 'Mid-stay clean', notes: '', currency: 'USD', by: 'Marek Novak', at: 1790600000000 },
    { id: 'SVC-0006-02', svc: 'grocery', name: 'Grocery Shopping', method: 'actualFee', date: '2026-09-27', qty: 1, rate: 35, vendor: 'Publix Instacart', status: 'completed', lines: [{ label: 'Groceries (actual cost)', amt: 412.6 }], desc: 'Arrival stocking for 6', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1790500000000 }
  ],
  '20261002-DR-0001': [
    { id: 'SVC-0001-01', svc: 'chef', name: 'Private Chef', method: 'fixed', date: '2026-10-12', qty: 1, rate: 175, vendor: 'Chef Marisol Catering', status: 'confirmed', meal: 'Dinner', mealGuests: '2', lines: [], desc: 'Anniversary dinner • seafood menu', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1791203600000 },
    { id: 'SVC-0001-02', svc: 'grocery', name: 'Grocery Shopping', method: 'actualFee', date: '2026-10-10', qty: 1, rate: 35, vendor: 'Publix Instacart', status: 'confirmed', lines: [{ label: 'Groceries (actual cost)', amt: 240 }], desc: 'Pre-arrival stocking list', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1791204000000 },
    { id: 'SVC-0001-03', svc: 'grocery_delivery', name: 'Grocery Delivery', method: 'trip', date: '2026-10-10', qty: 1, rate: 35, vendor: 'Publix Instacart', status: 'requested', lines: [], desc: 'Deliver before 3:00 PM', notes: '', currency: 'USD', by: 'Ana Torres', at: 1791204400000 }
  ],
  '20260909-DR-0002': [
    { id: 'SVC-0739-01', svc: 'airport_pickup', name: 'Airport Pickup', method: 'trip', date: '2026-09-30', qty: 1, rate: 45, vendor: 'Brickell Car Service', status: 'completed', lines: [], desc: 'MIA arrival • 2 guests, 3 bags', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1790762400000 },
    { id: 'SVC-0739-02', svc: 'grocery', name: 'Grocery Shopping', method: 'actualFee', date: '2026-09-30', qty: 1, rate: 35, vendor: 'Publix Instacart', status: 'completed', lines: [{ label: 'Groceries (actual cost)', amt: 286.4 }, { label: 'Delivery Fee', amt: 15 }], desc: 'Pre-arrival stocking list', notes: '', receipt: true, currency: 'USD', by: 'Marcus Vance', at: 1790766000000 },
    { id: 'SVC-0739-03', svc: 'chef', name: 'Private Chef', method: 'fixed', date: '2026-10-03', qty: 1, rate: 175, vendor: 'Chef Marisol Catering', status: 'confirmed', meal: 'Dinner', mealGuests: '2', lines: [{ label: 'Groceries (actual cost)', amt: 240 }, { label: 'Delivery / Transport', amt: 35 }], desc: 'Seafood tasting menu', notes: 'Shellfish OK', currency: 'USD', by: 'Marcus Vance', at: 1790956800000 },
    { id: 'SVC-0739-04', svc: 'late', name: 'Late Check-Out', method: 'fixed', date: '2026-10-05', qty: 1, rate: 50, vendor: '', status: 'requested', lines: [], desc: 'Depart 2:00 PM', notes: '', currency: 'USD', by: 'Marcus Vance', at: 1791043200000 }
  ]
};
})();

// Reservation numbering: YYYYMMDD-CC-#### • CC = property's configured market code.
(function(){ const S = window.MGH_STR_DATA; if (!S) return;
  S.MARKETS = { DR: 'Dominican Republic', PR: 'Puerto Rico', US: 'United States' };
  S.PROPERTY_MARKET = { '2|Apt 101': 'DR', '6|Main': 'DR', '7|Apt 101': 'DR', '8|Apt 305': 'DR', '4|Unit 9': 'DR', '1|Unit 2101': 'DR', '13|Unit 1802': 'DR' };
  S.marketOf = unit => S.PROPERTY_MARKET[unit] || 'DR';
})();
