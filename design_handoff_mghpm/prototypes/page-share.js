// <mgh-page-share> — MGHPM global "Export & Share" capability: Preview • Print • Download PDF • Email.
// Generates a branded business document from the live record (page provider) or from the page's structured
// content (tables, key/value rows) — never a screenshot, never the app chrome. Audience-aware redaction,
// in-app Email Document with Communications + Audit records.
//
// Page provider API (optional, preferred for records):
//   window.MGH_EXPORT.register(() => ({ type, title, recordNo, subject:[label,value], meta:[[k,v]],
//     sections:[{ title, restricted, kv:[[k,v]], table:{cols,rows}, text:[..] }], recipients:[{name,email,role}],
//     audiences:['Internal Use','Guest'], party:{guestId|ownerId|tenantId}, resId, executed:{ name, version, completed, signers:[[name,at]], certificate } }))
(function () {
  if (customElements.get('mgh-page-share')) return;
  var F = "'Plus Jakarta Sans',system-ui,sans-serif";
  var USER = { name: 'Marcus Vance', role: 'Portfolio Lead', email: 'marcus.vance@mghpm.com' };
  var COMPANY = 'My Global Hub Property Management';
  var AKEY = 'mghpm.audit.v1', MKEY = 'mghpm.messages.v1';
  var ic = function (d, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var I = {
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    pdf: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', chev: '<path d="m6 9 6 6 6-6"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    clip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var stamp = function (d) { d = d || new Date(); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
  var get = function (k, d) { try { var v = JSON.parse(sessionStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var put = function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var clean = function (t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); };
  var RESTRICT_SEC = /internal|staff note|notes|bank|payout account|screening|credit report|background|incident|vendor cost|cost basis|payroll|audit|ledger|ops agent/i;
  var RESTRICT_KEY = /bank|routing|account (no|number|#)|ssn|social security|\bein\b|tax id|date of birth|\bdob\b|internal|vendor cost|margin|commission|payout/i;

  var provider = null;
  window.MGH_EXPORT = { register: function (fn) { provider = fn; }, clear: function () { provider = null; } };

  // ---------- Generic extraction from the page (structured content only) ----------
  function visible(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)) && !el.closest('[data-export-exclude],[role="dialog"],aside,header,mgh-assistant'); }
  function tableOf(t) {
    var cols = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th) { return clean(th.innerText); });
    var rows = Array.prototype.filter.call(t.querySelectorAll('tbody tr'), visible).slice(0, 300).map(function (tr) { return Array.prototype.map.call(tr.children, function (td) { return clean(td.innerText.replace(/\n+/g, ' • ')); }); });
    var keep = cols.map(function (c, i) { return c || rows.some(function (r) { return r[i]; }); });
    var drop = cols.map(function (c, i) { return /^actions?$/i.test(c) || (!c && !rows.some(function (r) { return r[i]; })); });
    return { cols: cols.filter(function (c, i) { return !drop[i]; }), rows: rows.map(function (r) { return r.filter(function (c, i) { return !drop[i]; }); }) };
  }
  function kvOf(root) {
    var out = [];
    Array.prototype.forEach.call(root.querySelectorAll('div,label,li'), function (el) {
      if (el.children.length !== 2 || !visible(el)) return;
      var a = el.children[0], b = el.children[1];
      if (a.querySelector('div,table,section') || b.querySelector('div,table,section')) return;
      var k = clean(a.innerText), v = clean(b.innerText);
      if (!k || !v || k.length > 48 || v.length > 240 || /\n/.test(a.innerText)) return;
      var cs = getComputedStyle(el); if (cs.display !== 'flex' && cs.display !== 'grid') return;
      out.push([k, v]);
    });
    return out;
  }
  function extract() {
    var main = document.querySelector('main') || document.body;
    var h1 = main.querySelector('h1');
    var title = h1 ? clean(h1.innerText) : document.title || 'MGHPM';
    var eyebrow = h1 && h1.previousElementSibling ? clean(h1.previousElementSibling.innerText) : '';
    var lead = h1 && h1.nextElementSibling && h1.nextElementSibling.tagName === 'P' ? clean(h1.nextElementSibling.innerText) : '';
    var qp = new URLSearchParams(location.search);
    var rec = (title.match(/\b\d{8}-[A-Z]{2}-\d{4}\b|\b[A-Z]{1,4}-\d{2,}(-\d+)*\b/) || [])[0] || qp.get('id') || '';
    var sections = [], used = [];
    var heads = Array.prototype.filter.call(main.querySelectorAll('h2,h3'), visible);
    var firstGrid = Array.prototype.find.call(main.querySelectorAll('[style*="grid-template-columns"]'), function (g) { return visible(g) && !g.querySelector('h2,h3,table') && g.children.length >= 2 && g.children.length <= 8; });
    if (firstGrid) { var kv = Array.prototype.map.call(firstGrid.children, function (c) { var ls = c.innerText.split('\n').map(clean).filter(Boolean); return ls.length >= 2 ? [ls[0], ls.slice(1, 3).join(' • ')] : null; }).filter(Boolean); if (kv.length) { sections.push({ title: 'Summary', kv: kv }); used.push(firstGrid); } }
    heads.forEach(function (h) {
      var box = h.closest('section') || (h.parentElement && h.parentElement.parentElement) || h.parentElement;
      if (!box || box === main || used.some(function (u) { return u === box || u.contains(box); })) return;
      used.push(box);
      var sec = { title: clean(h.innerText) };
      var tbls = Array.prototype.filter.call(box.querySelectorAll('table'), visible);
      if (tbls.length) { sec.table = tableOf(tbls[0]); sec.note = sec.table.rows.length + ' row' + (sec.table.rows.length === 1 ? '' : 's') + ' • current filtered view'; }
      else {
        var kv2 = kvOf(box);
        if (kv2.length >= 2) sec.kv = kv2.slice(0, 60);
        else sec.text = box.innerText.split('\n').map(clean).filter(function (l, i, a) { return l && l !== sec.title && l.length > 2 && a.indexOf(l) === i; }).slice(0, 40);
      }
      if ((sec.table && sec.table.rows.length) || (sec.kv && sec.kv.length) || (sec.text && sec.text.length)) sections.push(sec);
    });
    Array.prototype.filter.call(main.querySelectorAll('table'), visible).forEach(function (t) {
      if (used.some(function (u) { return u.contains(t); })) return; used.push(t);
      var tb = tableOf(t); if (tb.rows.length) sections.push({ title: title, table: tb, note: tb.rows.length + ' rows • current filtered view' });
    });
    return { type: eyebrow && eyebrow.length < 40 ? eyebrow.replace(/\s*•.*$/, '') : 'Page Export', title: title, recordNo: rec, meta: lead ? [['Description', lead]] : [], sections: sections, recipients: [] };
  }
  function build() {
    var d = null; try { var pv = provider || window.MGH_EXPORT_PROVIDER; d = pv ? pv() : null; } catch (e) { d = null; }
    d = d || extract();
    d.sections = (d.sections || []).map(function (s, i) { return Object.assign({ id: 's' + i, restricted: s.restricted != null ? s.restricted : RESTRICT_SEC.test(s.title || '') }, s); });
    d.audiences = d.audiences || ['Internal Use', 'External Recipient'];
    d.fileName = d.fileName || ((d.type || 'Document') + (d.recordNo ? ' — ' + d.recordNo : '') + '.pdf').replace(/[\\/:*?"<>|]/g, '-');
    return d;
  }
  // Audience filter: same-or-stricter than the page. External audiences never receive restricted sections or fields.
  function filtered(d, aud, pick) {
    var ext = aud !== 'Internal Use';
    var removed = [];
    var secs = d.sections.filter(function (s) { if (!pick[s.id]) return false; if (ext && s.restricted) { removed.push(s.title); return false; } return true; }).map(function (s) {
      if (!ext || !s.kv) return s;
      var kv = s.kv.filter(function (r) { if (RESTRICT_KEY.test(r[0])) { removed.push(s.title + ' › ' + r[0]); return false; } return true; });
      return Object.assign({}, s, { kv: kv });
    });
    var meta = (d.meta || []).filter(function (r) { return !(ext && RESTRICT_KEY.test(r[0])); });
    return { secs: secs, meta: meta, removed: removed, ext: ext };
  }

  // ---------- Document HTML (preview + print) ----------
  function docHtml(d, f, gen, forPrint) {
    var logo = new URL('assets/logo-mark.png', location.href).href;
    var head = '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:12px;border-bottom:2px solid #006B68">' +
      '<div style="display:flex;align-items:center;gap:10px"><img src="' + logo + '" style="width:34px;height:34px;object-fit:contain"><div style="display:flex;flex-direction:column;gap:3px"><span style="font:700 13px/1.2 ' + F + ';color:#132A52">' + COMPANY + '</span><span style="font:600 9px/1.2 ' + F + ';letter-spacing:.08em;text-transform:uppercase;color:#64748B">' + esc(d.type || 'Document') + '</span></div></div>' +
      '<div style="text-align:right;font:500 9.5px/1.5 ' + F + ';color:#64748B">' + (d.recordNo ? '<div style="font:700 11px/1.3 ' + F + ';color:#172033">' + esc(d.recordNo) + '</div>' : '') + 'Generated ' + esc(gen) + '<br>' + esc(USER.name) + ' • ' + esc(f.ext ? 'Prepared for external recipient' : 'Internal use') + '</div></div>';
    var title = '<div style="display:flex;flex-direction:column;gap:6px;margin:18px 0 10px"><h1 style="margin:0;font:700 20px/1.25 ' + F + ';color:#172033">' + esc(d.title) + '</h1>' + (d.subject ? '<span style="font:500 12px/1.4 ' + F + ';color:#475569">' + esc(d.subject[0]) + ': <strong style="color:#172033">' + esc(d.subject[1]) + '</strong></span>' : '') + '</div>';
    var meta = f.meta.length ? kvHtml(f.meta) : '';
    var exe = d.executed ? '<div style="margin:12px 0;padding:10px 12px;border:1px solid #BBF7D0;background:#F0FDF4;border-radius:6px;font:500 11px/1.5 ' + F + ';color:#166534">Executed document • ' + esc(d.executed.name) + ' • Version ' + esc(d.executed.version) + ' • Completed ' + esc(d.executed.completed) + ' — exported as the immutable executed version.</div>' : '';
    var body = f.secs.map(function (s) {
      var h = '<div style="margin-top:18px;break-inside:avoid-page"><div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding-bottom:6px;border-bottom:1px solid #E2E8F0"><span style="font:700 11px/1.2 ' + F + ';letter-spacing:.06em;text-transform:uppercase;color:#006B68">' + esc(s.title) + '</span>' + (s.note ? '<span style="font:500 9.5px/1 ' + F + ';color:#94A3B8">' + esc(s.note) + '</span>' : '') + '</div>';
      if (s.kv) h += kvHtml(s.kv);
      if (s.table) h += '<table style="width:100%;border-collapse:collapse;margin-top:6px;font:500 10.5px/1.4 ' + F + ';color:#172033"><thead><tr>' + s.table.cols.map(function (c) { return '<th style="text-align:left;padding:6px 8px;background:#006B68;color:#fff;font:600 9.5px/1.2 ' + F + ';letter-spacing:.04em;text-transform:uppercase">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + s.table.rows.map(function (r, i) { return '<tr style="background:' + (i % 2 ? '#F0F7F7' : '#fff') + ';break-inside:avoid">' + r.map(function (c) { return '<td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;vertical-align:top">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      if (s.text) h += '<div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;font:400 11px/1.5 ' + F + ';color:#334155">' + s.text.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>';
      return h + '</div>';
    }).join('');
    var cert = d.executed && d.executed.signers ? '<div style="margin-top:22px;break-inside:avoid"><div style="padding-bottom:6px;border-bottom:1px solid #E2E8F0;font:700 11px/1.2 ' + F + ';letter-spacing:.06em;text-transform:uppercase;color:#006B68">Signature Certificate</div>' + kvHtml(d.executed.signers.concat([['Certificate', d.executed.certificate || '—']])) + '</div>' : '';
    var foot = forPrint ? '' : '<div style="margin-top:28px;padding-top:10px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font:500 9.5px/1.3 ' + F + ';color:#94A3B8"><span>Generated by ' + COMPANY + '</span><span>Page numbers are applied on Print and PDF</span></div>';
    return head + title + meta + exe + body + cert + foot;
  }
  function kvHtml(rows) { return '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:24px;margin-top:4px">' + rows.map(function (r) { return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #F1F5F9;font:500 10.5px/1.4 ' + F + '"><span style="color:#64748B">' + esc(r[0]) + '</span><span style="color:#172033;font-weight:600;text-align:right">' + esc(r[1]) + '</span></div>'; }).join('') + '</div>'; }

  function printDoc(d, f, gen) {
    var fr = document.createElement('iframe'); fr.setAttribute('data-export-exclude', ''); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(fr);
    var fonts = new URL('_ds/mghpm-design-system-f422809c-7418-4624-b891-a1bfa5eeb3cd/tokens/fonts.css', location.href).href;
    var w = fr.contentWindow; w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(d.fileName.replace(/\.pdf$/, '')) + '</title><link rel="stylesheet" href="' + fonts + '"><style>@page{size:letter;margin:14mm 14mm 18mm;@bottom-left{content:"Generated by ' + COMPANY + ' • ' + gen.replace(/"/g, '') + '";font:9px ' + F.replace(/'/g, '') + ';color:#94A3B8}@bottom-right{content:"Page " counter(page) " of " counter(pages);font:9px sans-serif;color:#94A3B8}}html,body{margin:0;font-family:' + F + ';font-variant-numeric:tabular-nums;-webkit-print-color-adjust:exact;print-color-adjust:exact}thead{display:table-header-group}</style></head><body>' + docHtml(d, f, gen, true) + '</body></html>');
    w.document.close();
    var go = function () { try { w.focus(); w.print(); } catch (e) {} setTimeout(function () { fr.remove(); }, 1500); };
    setTimeout(go, 500);
  }

  // ---------- PDF (vector text via jsPDF) ----------
  var libs = null;
  function loadLibs() {
    if (libs) return libs;
    var ld = function (src) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); };
    libs = (window.jspdf ? Promise.resolve() : ld('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')).then(function () { return window.jspdf && window.jspdf.jsPDF.API.autoTable ? null : ld('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'); });
    return libs;
  }
  var logoData = null;
  function loadLogo() { return logoData ? Promise.resolve(logoData) : new Promise(function (ok) { var im = new Image(); im.onload = function () { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); try { logoData = c.toDataURL('image/png'); } catch (e) { logoData = ''; } ok(logoData); }; im.onerror = function () { ok(''); }; im.src = 'assets/logo-mark.png'; }); }
  var pdfTxt = function (s) { return String(s == null ? '' : s).replace(/[✓✔]/g, 'Yes').replace(/[→↗]/g, '->').replace(/↑/g, '+').replace(/−/g, '-').replace(/⌘/g, 'Cmd').replace(/[^\x00-\xFF•—–…‘’“”€]/g, ''); };
  function makePdf(d, f, gen) {
    return Promise.all([loadLibs(), loadLogo()]).then(function (r) {
      var logo = r[1], J = window.jspdf.jsPDF, pdf = new J({ unit: 'pt', format: 'letter' }), W = 612, H = 792, M = 40, TOP = 92;
      var y = TOP;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(17); pdf.setTextColor(23, 32, 51);
      pdf.splitTextToSize(pdfTxt(d.title), W - 2 * M).forEach(function (l) { pdf.text(l, M, y); y += 20; });
      if (d.subject) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(71, 85, 105); pdf.text(pdfTxt(d.subject[0] + ': ' + d.subject[1]), M, y); y += 14; }
      var kvTable = function (rows) { pdf.autoTable({ startY: y, margin: { left: M, right: M, top: TOP, bottom: 54 }, body: rows.map(function (x) { return [pdfTxt(x[0]), pdfTxt(x[1])]; }), theme: 'plain', styles: { font: 'helvetica', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, textColor: [23, 32, 51] }, columnStyles: { 0: { textColor: [100, 116, 139], cellWidth: 170 }, 1: { fontStyle: 'bold' } }, alternateRowStyles: { fillColor: [240, 247, 247] } }); y = pdf.lastAutoTable.finalY + 6; };
      if (f.meta.length) kvTable(f.meta);
      if (d.executed) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(22, 101, 52); pdf.text(pdfTxt('Executed document • ' + d.executed.name + ' • Version ' + d.executed.version + ' • Completed ' + d.executed.completed), M, y + 8); y += 20; }
      f.secs.forEach(function (s) {
        if (y > H - 120) { pdf.addPage(); y = TOP; }
        y += 12; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(0, 107, 104); pdf.text(pdfTxt(s.title).toUpperCase(), M, y);
        if (s.note) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(148, 163, 184); pdf.text(pdfTxt(s.note), W - M, y, { align: 'right' }); }
        pdf.setDrawColor(226, 232, 240); pdf.line(M, y + 5, W - M, y + 5); y += 10;
        if (s.kv && s.kv.length) kvTable(s.kv);
        if (s.table && s.table.rows.length) { pdf.autoTable({ startY: y, margin: { left: M, right: M, top: TOP, bottom: 54 }, head: [s.table.cols.map(pdfTxt)], body: s.table.rows.map(function (rw) { return rw.map(pdfTxt); }), styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: [23, 32, 51], lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 } }, headStyles: { fillColor: [0, 107, 104], textColor: 255, fontStyle: 'bold', fontSize: 8 }, alternateRowStyles: { fillColor: [240, 247, 247] }, theme: 'plain' }); y = pdf.lastAutoTable.finalY + 6; }
        if (s.text && s.text.length) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(51, 65, 85); s.text.forEach(function (t) { pdf.splitTextToSize(pdfTxt(t), W - 2 * M).forEach(function (l) { if (y > H - 64) { pdf.addPage(); y = TOP; } y += 12; pdf.text(l, M, y); }); }); y += 6; }
      });
      if (d.executed && d.executed.signers) { y += 12; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(0, 107, 104); pdf.text('SIGNATURE CERTIFICATE', M, y); y += 10; kvTable(d.executed.signers.concat([['Certificate', d.executed.certificate || '—']])); }
      var n = pdf.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        pdf.setPage(i);
        if (logo) try { pdf.addImage(logo, 'PNG', M, 26, 30, 30); } catch (e) {}
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(19, 42, 82); pdf.text(COMPANY, M + 38, 40);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(100, 116, 139); pdf.text(pdfTxt((d.type || 'Document').toUpperCase()), M + 38, 52);
        pdf.setFontSize(8); pdf.setTextColor(23, 32, 51); if (d.recordNo) { pdf.setFont('helvetica', 'bold'); pdf.text(pdfTxt(d.recordNo), W - M, 38, { align: 'right' }); }
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139); pdf.text(pdfTxt('Generated ' + gen), W - M, 49, { align: 'right' }); pdf.text(pdfTxt(f.ext ? 'Prepared for external recipient' : 'Internal use • ' + USER.name), W - M, 59, { align: 'right' });
        pdf.setDrawColor(0, 107, 104); pdf.setLineWidth(1.5); pdf.line(M, 68, W - M, 68); pdf.setLineWidth(0.5);
        pdf.setDrawColor(226, 232, 240); pdf.line(M, H - 40, W - M, H - 40);
        pdf.setFontSize(7.5); pdf.setTextColor(148, 163, 184); pdf.text('Generated by ' + COMPANY, M, H - 28); pdf.text('Page ' + i + ' of ' + n, W - M, H - 28, { align: 'right' });
      }
      return pdf;
    });
  }

  // ---------- Records: Audit + Communications ----------
  function audit(action, d, extra) { if (window.MGH_AUDIT) { window.MGH_AUDIT.record(Object.assign({ actor: USER.name, role: USER.role, actorType: USER.role === 'Guest' ? 'GUEST_PORTAL' : 'USER', action: action, recordType: d.type, recordNo: d.recordNo || d.title, doc: d.fileName }, extra || {})); return; } var l = get(AKEY, []) || []; l.unshift(Object.assign({ at: Date.now(), actor: USER.name, role: USER.role, action: action, recordType: d.type, recordNo: d.recordNo || d.title, doc: d.fileName, version: d.executed ? d.executed.version : 'Generated ' + stamp() }, extra || {})); put(AKEY, l.slice(0, 500)); }
  function announce(text, d, extra) { try { window.dispatchEvent(new CustomEvent('mgh:export', { detail: Object.assign({ text: text, recordNo: d.recordNo, type: d.type }, extra || {}) })); } catch (e) {} }

  function toast(msg) {
    var t = document.createElement('div'); t.setAttribute('data-export-exclude', '');
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2100;padding:12px 16px;border-radius:8px;background:#132A52;color:#fff;font:500 13px/1.3 ' + F + ';box-shadow:0 8px 24px rgba(15,23,42,.2);max-width:90vw';
    t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  }

  // ---------- Preview / Email modal ----------
  var BTN = 'height:40px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border-radius:6px;cursor:pointer;font:600 14px/1 ' + F + ';white-space:nowrap;transition:background .15s';
  var FIELD = 'width:100%;height:40px;padding:0 12px;border:1px solid #E2E8F0;border-radius:6px;font:400 14px/1.2 ' + F + ';color:#172033;outline:none;box-sizing:border-box;background:#fff';
  var LBL = 'display:flex;flex-direction:column;gap:6px;font:600 12px/1.2 ' + F + ';color:#475569';
  var EYEBROW = 'font:600 11px/1.2 ' + F + ';letter-spacing:.06em;text-transform:uppercase;color:#64748B';

  function openModal(mode) {
    if (window.MGH_EXPORT_USER) Object.assign(USER, window.MGH_EXPORT_USER);
    try { var bo = window.MGH_ORG && window.MGH_ORG.brandOf('ORG-001'); if (bo && bo.display) COMPANY = bo.display; } catch (e) {}
    var d = build(), gen = stamp();
    try { audit('document.viewed', d, { audience: d.defaultAudience || (d.audiences || [])[0], channel: 'Preview' }); } catch (e) {}
    var st = { aud: d.defaultAudience || d.audiences[0], pick: {}, mode: mode || 'preview', busy: false, attach: true, to: '', cc: '', subject: '', msg: '', err: '' };
    d.sections.forEach(function (s) { st.pick[s.id] = s.include !== false; });
    var host = document.createElement('div'); host.setAttribute('data-export-exclude', '');
    var sr = host.attachShadow({ mode: 'open' }); document.body.appendChild(host);
    var css = '<style>*{box-sizing:border-box}button{font-family:inherit}input:focus,textarea:focus{border-color:#006B68!important;box-shadow:0 0 0 3px rgba(0,107,104,.18)}.p:hover{background:#005A57!important}.o:hover{background:#F8FAFC!important}.g:hover{background:#F1F5F9!important}.dis{opacity:.5;pointer-events:none}</style>';
    var defaultsFor = function () {
      var ext = st.aud !== 'Internal Use';
      var rc = (d.recipients || []).filter(function (r) { return ext ? r.role !== 'staff' : true; });
      st.to = rc.length && ext ? rc.map(function (r) { return r.email; }).join(', ') : '';
      st.subject = (d.type || 'Document') + (d.recordNo ? ' ' + d.recordNo : '') + (d.subject && ext ? '' : '');
      var first = rc[0] && ext ? (rc[0].name || '').split(' ')[0] : '';
      st.msg = (first ? 'Hello ' + first + ',\n\n' : 'Hello,\n\n') + 'Please find attached the ' + (d.type || 'document') + (d.recordNo ? ' for ' + d.recordNo : '') + '.\n\nKind regards,\n' + USER.name + '\n' + USER.role + ' • ' + COMPANY;
    };
    defaultsFor();
    var close = function () { host.remove(); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    function render() {
      var f = filtered(d, st.aud, st.pick), ext = f.ext;
      var audOpts = d.audiences.map(function (a) { var on = a === st.aud; return '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid ' + (on ? '#006B68' : '#E2E8F0') + ';background:' + (on ? '#F0FAF9' : '#fff') + ';border-radius:8px;cursor:pointer;font:600 13px/1.2 ' + F + ';color:#172033"><input type="radio" name="aud" value="' + esc(a) + '"' + (on ? ' checked' : '') + ' style="accent-color:#006B68;margin:0">' + esc(a) + '</label>'; }).join('');
      var secOpts = d.sections.map(function (s) { var locked = ext && s.restricted; return '<label style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-top:1px solid #F1F5F9;cursor:' + (locked ? 'not-allowed' : 'pointer') + ';font:500 13px/1.35 ' + F + ';color:' + (locked ? '#94A3B8' : '#172033') + '"><input type="checkbox" data-sec="' + s.id + '"' + (st.pick[s.id] && !locked ? ' checked' : '') + (locked ? ' disabled' : '') + ' style="accent-color:#006B68;margin:2px 0 0;width:15px;height:15px;flex-shrink:0"><span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span>' + esc(s.title) + '</span>' + (locked ? '<span style="display:flex;align-items:center;gap:4px;font:500 11px/1.3 ' + F + ';color:#B45309">' + ic(I.lock, 11) + 'Internal only • excluded for this audience</span>' : s.restricted ? '<span style="font:500 11px/1.3 ' + F + ';color:#64748B">Internal section</span>' : '') + '</span></label>'; }).join('');
      var left = st.mode === 'email' ? emailPanel(f) :
        '<div style="display:flex;flex-direction:column;gap:10px"><span style="' + EYEBROW + '">Prepared For</span>' + audOpts + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:2px"><span style="' + EYEBROW + ';padding-bottom:6px">Include Sections</span>' + (secOpts || '<span style="font:400 13px/1.4 ' + F + ';color:#64748B">No structured sections found on this page.</span>') + '</div>' +
        '<div style="display:flex;gap:10px;padding:12px;border-radius:8px;background:#F8FAFC;font:400 12px/1.5 ' + F + ';color:#475569"><span style="color:#006B68;flex-shrink:0">' + ic(I.shield, 16) + '</span><span>Generated with your page permissions (' + USER.role + '). ' + (ext ? 'External audience: internal notes, banking, screening, vendor costs, incidents and other parties\u2019 data are removed.' : 'Internal use: do not forward outside MGHPM.') + (f.removed.length ? '<br><strong style="color:#172033">Removed:</strong> ' + esc(f.removed.join(', ')) : '') + '</span></div>';
      var actions = st.mode === 'email'
        ? '<button id="back" class="o" style="' + BTN + ';border:1px solid #E2E8F0;background:#fff;color:#172033">Back to Preview</button><span style="flex:1"></span><button id="cancel" class="g" style="' + BTN + ';border:0;background:transparent;color:#475569">Cancel</button><button id="send" class="p' + (st.busy ? ' dis' : '') + '" style="' + BTN + ';border:0;background:#006B68;color:#fff">' + ic(I.mail, 16) + (st.busy ? 'Sending…' : 'Send Email') + '</button>'
        : '<button id="cancel" class="g" style="' + BTN + ';border:0;background:transparent;color:#475569">Cancel</button><span style="flex:1"></span><button id="print" class="o" style="' + BTN + ';border:1px solid ' + (st.mode === 'print' ? '#006B68' : '#E2E8F0') + ';background:#fff;color:#172033">' + ic(I.print, 16) + 'Print</button><button id="pdf" class="o' + (st.busy ? ' dis' : '') + '" style="' + BTN + ';border:1px solid ' + (st.mode === 'pdf' ? '#006B68' : '#E2E8F0') + ';background:#fff;color:#172033">' + ic(I.pdf, 16) + (st.busy ? 'Generating…' : 'Download PDF') + '</button><button id="email" class="p" style="' + BTN + ';border:0;background:#006B68;color:#fff">' + ic(I.mail, 16) + 'Email</button>';
      sr.innerHTML = css + '<div id="ov" style="position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:24px;font-family:' + F + ';font-variant-numeric:tabular-nums">' +
        '<div role="dialog" aria-label="Export &amp; Share" style="width:min(1180px,100%);height:min(860px,100%);background:#fff;border-radius:12px;box-shadow:0 24px 64px rgba(15,23,42,.24);display:flex;flex-direction:column;overflow:hidden">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;border-bottom:1px solid #E2E8F0"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span style="' + EYEBROW + '">Export &amp; Share • ' + (st.mode === 'email' ? 'Email Document' : 'Preview') + '</span><span style="font:600 18px/1.3 ' + F + ';color:#172033;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(d.type) + (d.recordNo ? ' — ' + esc(d.recordNo) : '') + '</span></div><button id="x" class="g" title="Close" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:0;border-radius:6px;background:transparent;cursor:pointer;color:#475569;flex-shrink:0">' + ic(I.x) + '</button></div>' +
        '<div style="flex:1;min-height:0;display:grid;grid-template-columns:' + (innerWidth < 860 ? 'minmax(0,1fr)' : '340px minmax(0,1fr)') + '">' +
        '<div style="overflow:auto;padding:20px 24px;display:flex;flex-direction:column;gap:20px;border-right:1px solid #E2E8F0">' + left + '</div>' +
        (innerWidth < 860 ? '' : '<div style="overflow:auto;background:#E2E8F0;padding:24px;display:flex;justify-content:center"><div style="width:100%;max-width:760px;min-height:980px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.12);padding:40px 44px;height:max-content">' + docHtml(d, f, gen, false) + '</div></div>') +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:14px 24px;border-top:1px solid #E2E8F0">' + actions + '</div></div></div>';
      wire(f);
    }
    function emailPanel(f) {
      var size = st.size ? ' • ' + st.size : '';
      return '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<label style="' + LBL + '">To<input id="to" value="' + esc(st.to) + '" placeholder="name@example.com" style="' + FIELD + '"></label>' +
        (d.recipients && d.recipients.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px">' + d.recipients.filter(function (r) { return f.ext ? r.role !== 'staff' : true; }).map(function (r) { return '<button data-rc="' + esc(r.email) + '" class="o" style="height:28px;padding:0 10px;border:1px solid #E2E8F0;border-radius:999px;background:#fff;cursor:pointer;font:600 12px/1 ' + F + ';color:#172033">' + esc(r.name) + ' <span style="color:#64748B;font-weight:500">&lt;' + esc(r.email) + '&gt;</span></button>'; }).join('') + '</div>' : '') +
        '<label style="' + LBL + '">CC<input id="cc" value="' + esc(st.cc) + '" placeholder="Optional" style="' + FIELD + '"></label>' +
        '<label style="' + LBL + '">Subject<input id="sb" value="' + esc(st.subject) + '" style="' + FIELD + '"></label>' +
        '<label style="' + LBL + '">Message<textarea id="msg" rows="8" style="' + FIELD + ';height:auto;padding:10px 12px;line-height:1.5;resize:vertical">' + esc(st.msg) + '</textarea></label>' +
        '<div style="display:flex;flex-direction:column;gap:8px"><span style="' + EYEBROW + '">Attachment</span><label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #E2E8F0;border-radius:8px;cursor:pointer"><input id="att" type="checkbox"' + (st.attach ? ' checked' : '') + ' style="accent-color:#006B68;margin:0;width:15px;height:15px"><span style="color:#006B68">' + ic(I.clip, 15) + '</span><span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span style="font:600 13px/1.3 ' + F + ';color:#172033;overflow-wrap:anywhere">' + esc(d.fileName) + '</span><span style="font:400 12px/1.3 ' + F + ';color:#64748B">' + esc(f.ext ? 'Prepared for external recipient' : 'Internal use') + ' • ' + f.secs.length + ' sections' + esc(size) + '</span></span></label></div>' +
        '<div style="display:flex;gap:8px;padding:10px 12px;border-radius:8px;background:#F8FAFC;font:400 12px/1.5 ' + F + ';color:#475569"><span style="color:#006B68;flex-shrink:0">' + ic(I.shield, 15) + '</span><span>Sending records a Communications entry and an Audit event (sender, recipients, record, document version, timestamp).</span></div>' +
        (st.err ? '<span style="font:500 12px/1.4 ' + F + ';color:#DC2626">' + esc(st.err) + '</span>' : '') + '</div>';
    }
    function wire(f) {
      var q = function (id) { return sr.getElementById(id); };
      sr.getElementById('ov').addEventListener('click', function (e) { if (e.target.id === 'ov') close(); });
      q('x').onclick = close; if (q('cancel')) q('cancel').onclick = close;
      Array.prototype.forEach.call(sr.querySelectorAll('input[name="aud"]'), function (r) { r.onchange = function () { st.aud = r.value; defaultsFor(); render(); }; });
      Array.prototype.forEach.call(sr.querySelectorAll('input[data-sec]'), function (c) { c.onchange = function () { st.pick[c.getAttribute('data-sec')] = c.checked; render(); }; });
      if (q('print')) q('print').onclick = function () { printDoc(d, f, gen); audit('document.printed', d, { audience: st.aud, sections: f.secs.map(function (s) { return s.title; }) }); announce(d.type + ' printed by ' + USER.name, d, { action: 'print' }); };
      if (q('pdf')) q('pdf').onclick = function () { st.busy = true; render(); makePdf(d, f, gen).then(function (pdf) { pdf.save(d.fileName); st.busy = false; render(); audit('document.downloaded', d, { audience: st.aud, sections: f.secs.map(function (s) { return s.title; }) }); announce(d.type + ' PDF downloaded by ' + USER.name, d, { action: 'pdf' }); toast(d.fileName + ' downloaded'); }, function () { st.busy = false; render(); toast('PDF engine unavailable — use Print › Save as PDF'); }); };
      if (q('email')) q('email').onclick = function () { st.mode = 'email'; render(); makePdf(d, f, gen).then(function (pdf) { var b = pdf.output('blob'); st.size = (b.size / 1024).toFixed(0) + ' KB'; if (st.mode === 'email') render(); }, function () {}); };
      if (q('back')) q('back').onclick = function () { st.mode = 'preview'; render(); };
      ['to', 'cc', 'sb', 'msg'].forEach(function (id) { if (q(id)) q(id).oninput = function () { st[id === 'sb' ? 'subject' : id] = q(id).value; }; });
      if (q('att')) q('att').onchange = function () { st.attach = q('att').checked; };
      Array.prototype.forEach.call(sr.querySelectorAll('[data-rc]'), function (b) { b.onclick = function () { var e = b.getAttribute('data-rc'); var l = st.to.split(/[,;\s]+/).filter(Boolean); if (l.indexOf(e) < 0) l.push(e); st.to = l.join(', '); render(); }; });
      if (q('send')) q('send').onclick = function () {
        var re = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/, split = function (v) { return v.split(/[,;\s]+/).filter(Boolean); };
        var to = split(st.to), cc = split(st.cc);
        if (!to.length || !to.concat(cc).every(function (x) { return re.test(x); })) { st.err = 'Enter at least one valid recipient email (separate several with commas).'; return render(); }
        if (!st.subject.trim()) { st.err = 'Subject is required.'; return render(); }
        st.err = ''; st.busy = true; render();
        setTimeout(function () {
          var names = to.map(function (e) { var r = (d.recipients || []).find(function (x) { return x.email.toLowerCase() === e.toLowerCase(); }); return r ? r.name : e; });
          var att = st.attach ? [d.fileName] : [];
          var th = { id: 'TH-' + Date.now().toString().slice(-6), channel: 'Email', topic: 'Document', subject: st.subject, recordType: d.type, recordNo: d.recordNo, resId: d.resId || '', to: to, cc: cc, attachments: att,
            msgs: [['staff', USER.name, st.msg + (att.length ? '\n\nAttachment: ' + att[0] : ''), Date.now()]] };
          Object.assign(th, d.party || {});
          var l = get(MKEY, []); l = Array.isArray(l) ? l : []; l.unshift(th); put(MKEY, l);
          audit('document.emailed', d, { to: to, cc: cc, audience: st.aud, attachment: att[0] || null, sections: f.secs.map(function (s) { return s.title; }), thread: th.id });
          var text = (st.attach ? d.type + ' PDF' : d.type) + ' emailed to ' + names.join(', ') + ' by ' + USER.name;
          announce(text, d, { action: 'email', thread: th });
          close(); toast(text);
        }, 600);
      };
    }
    render();
  }

  // ---------- Trigger ----------
  class PageShare extends HTMLElement {
    connectedCallback() {
      if (this._r) return; this._r = 1;
      var root = this.attachShadow({ mode: 'open' }), self = this;
      var wide = function () { return innerWidth >= 1280 && !self.hasAttribute('compact'); };
      var item = function (id, i, l, s) { return '<button class="mi" role="menuitem" id="' + id + '" style="width:100%;display:flex;align-items:flex-start;gap:10px;padding:10px;border:0;border-radius:6px;background:transparent;cursor:pointer;text-align:left;color:#172033;font-family:' + F + '"><span style="color:#006B68;margin-top:1px">' + ic(i, 16) + '</span><span style="display:flex;flex-direction:column;gap:3px"><span style="font:600 13px/1.2 ' + F + '">' + l + '</span><span style="font:400 12px/1.3 ' + F + ';color:#64748B">' + s + '</span></span></button>'; };
      var paint = function () {
        var w = wide();
        root.innerHTML = '<style>:host{display:inline-flex;position:relative}.mi:hover{background:#F8FAFC}.tb:hover{background:#F8FAFC}button:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(0,107,104,.18)}</style>' +
          '<button class="tb" id="t" title="Export &amp; Share" aria-haspopup="menu" style="height:40px;display:flex;align-items:center;gap:6px;padding:0 ' + (w ? '12px' : '0') + ';width:' + (w ? 'auto' : '40px') + ';justify-content:center;border:' + (w ? '1px solid #E2E8F0' : '0') + ';border-radius:' + (w ? '6px' : '8px') + ';background:transparent;color:' + (w ? '#172033' : '#475569') + ';cursor:pointer;font:600 13px/1 ' + F + ';white-space:nowrap">' + ic(I.share, w ? 16 : 18) + (w ? 'Export &amp; Share' + ic(I.chev, 14) : '') + '</button>' +
          '<div id="m" role="menu" style="display:none;position:absolute;top:46px;right:0;z-index:60;width:256px;padding:6px;background:#fff;border:1px solid #E2E8F0;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.12)">' +
          item('pv', I.eye, 'Preview', 'Review exactly what will be shared') + item('pr', I.print, 'Print', 'Branded layout • no app chrome') + item('pd', I.pdf, 'Download PDF', 'Page numbers • record identity') + item('em', I.mail, 'Email', 'Send with PDF attached • logged') + '</div>';
        var m = root.getElementById('m');
        root.getElementById('t').onclick = function (e) { e.stopPropagation(); m.style.display = m.style.display === 'none' ? 'block' : 'none'; };
        [['pv', 'preview'], ['pr', 'print'], ['pd', 'pdf'], ['em', 'email']].forEach(function (p) { root.getElementById(p[0]).onclick = function () { m.style.display = 'none'; openModal(p[1]); }; });
      };
      paint(); this._w = wide();
      this._rs = function () { if (wide() !== self._w) { self._w = wide(); paint(); } };
      this._close = function () { var m = root.getElementById('m'); if (m) m.style.display = 'none'; };
      addEventListener('resize', this._rs); document.addEventListener('click', this._close);
      if (window.MGH_EXPORT_AUTOOPEN) { /* reserved */ }
    }
    disconnectedCallback() { removeEventListener('resize', this._rs); document.removeEventListener('click', this._close); }
  }
  customElements.define('mgh-page-share', PageShare);
  window.MGH_EXPORT.open = openModal;
  // Ctrl/Cmd+P opens the MGHPM print preview instead of printing the app UI.
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P') && document.querySelector('mgh-page-share')) { e.preventDefault(); openModal('print'); } });
})();
