// <mgh-assistant role="staff|owner|tenant|applicant"> — one role-aware, context-aware assistant for every MGHPM screen.
// Reads records through MGH_OPS.snapshot(role, ctx); answers via window.claude.complete; never performs high-impact actions.
(function () {
  if (customElements.get('mgh-assistant')) return;
  var F = "'Plus Jakarta Sans',system-ui,sans-serif";
  var ICON = {
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', check: '<path d="M20 6 9 17l-5-5"/>', arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>'
  };
  var svg = function (k, s, c) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[k] + '</svg>'; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var go = function (h) { window.location.href = String(h).replace(/ /g, '%20'); };
  var ROLE = {
    staff: ['Staff', 'All authorized records'], owner: ['Owner', 'Your properties only'], tenant: ['Tenant', 'Your tenancy only'], applicant: ['Applicant', 'Your application only'], guest: ['Guest', 'Public listings & your stays']
  };
  var M = function () { return (window.MGH_OPS && window.MGH_OPS.M) || {}; };
  var ACTIONS = function (role) {
    var m = M();
    if (role === 'tenant') return { pay_rent: ['Pay Rent', m.tenantPortal + '?tab=payments'], upload_insurance: ['Upload Insurance', m.tenantPortal + '?tab=insurance'], view_ticket: ['View Ticket', m.tenantPortal + '?tab=maintenance'], create_request: ['Create Maintenance Request', m.tenantPortal + '?tab=maintenance'], my_lease: ['View My Lease', m.tenantPortal + '?tab=lease'], documents: ['My Documents', m.tenantPortal + '?tab=documents'], message_manager: ['Message Manager', m.tenantPortal + '?tab=messages'] };
    if (role === 'owner') return { view_statement: ['View Statement', m.ownerPortal], review_maintenance: ['Review Maintenance', m.ownerPortal], approve_repair: ['Approve Repair', m.ownerPortal], view_properties: ['View Properties', m.ownerPortal] };
    if (role === 'guest') return (window.MGH_STR && window.MGH_STR.actions()) || {};
    if (role === 'applicant') return { continue_application: ['Continue Application', m.wizard], upload_documents: ['Upload Documents', m.wizard] };
    return { action_center: ['Open Action Center', m.action], review_insurance: ['Review Insurance', m.insurance], review_applications: ['Review Applications', m.apps], view_leases: ['Open Leases', m.leases], work_orders: ['Open Work Orders', m.wo], payments: ['Open Payments', m.payments], people: ['Open Directory', m.people], owner_360: ['Open Owner 360', m.owner], tenant_360: ['Open Tenant 360', m.tenant] };
  };
  var PROMPTS = {
    staff: ['What needs my attention today?', 'Which properties are not ready to market?', 'Which leases expire in the next 60 days?', 'Do we have duplicate records?', 'Show owners missing banking information.'],
    tenant: ['When is my rent due?', 'Is my renters insurance verified?', 'What is happening with my maintenance request?', 'How do I report a leak?', 'When does my lease expire?'],
    owner: ['Did my tenants pay?', 'How much will my next distribution be?', 'What maintenance is open?', 'What expenses were charged this month?', 'When is the next inspection?'],
    guest: ['Show stays near the beach for 6 guests with a pool', 'Which stays include electricity?', 'Which one is cheapest for my dates?', 'Which stays allow pets?'],
    applicant: ['What documents do I still need?', 'Has my application been reviewed?', 'How do I upload my employment letter?']
  };
  function pageContext() {
    var c = window.MGH_CTX || {};
    var file = decodeURIComponent(location.pathname.split('/').pop() || '');
    var page = (file.match(/Master \d+ - ([^.]+)/) || [])[1] || document.title || 'MGHPM';
    var params = {}; new URLSearchParams(location.search).forEach(function (v, k) { if (!/^(tab|back|backLabel)$/.test(k)) params[k] = v; });
    var pv = Object.keys(params).map(function (k) { return params[k]; })[0];
    return { page: page, type: c.type || null, label: c.label || (pv ? page + ' — ' + pv : null), record: c.record || (pv ? { page: page, params: params } : null), readiness: c.readiness || null, url: file + location.search };
  }

  class MghAssistant extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.msgs = []; this.busy = false; this.open = false; this.pendingTasks = null;
      this.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:120;font-family:' + F;
      this.render();
      this._onEvt = (e) => { var d = (e && e.detail) || {}; this.toggle(true); if (d.prompt) this.ask(d.prompt, d.review); };
      window.addEventListener('mgh-assistant', this._onEvt);
    }
    disconnectedCallback() { window.removeEventListener('mgh-assistant', this._onEvt); }
    get role() { var r = this.getAttribute('role') || 'staff'; return ROLE[r] ? r : 'staff'; }
    toggle(v) { this.open = v === undefined ? !this.open : v; this.render(); if (this.open) setTimeout(() => { var i = this.querySelector('textarea'); i && i.focus(); }, 40); }
    render() {
      var r = this.role, ctx = pageContext(), ro = ROLE[r];
      if (!this.open) {
        this.innerHTML = '<button aria-label="Open MGHPM Assistant" style="display:flex;align-items:center;gap:10px;height:52px;padding:0 20px 0 16px;border:0;border-radius:26px;background:#006B68;color:#fff;cursor:pointer;box-shadow:0 12px 32px rgba(15,23,42,.24);font:600 14px/1 ' + F + '">' + svg('spark', 20, '#D4A637') + 'Ask MGHPM Assistant</button>';
        this.firstChild.onmouseenter = function () { this.style.background = '#005A57'; }; this.firstChild.onmouseleave = function () { this.style.background = '#006B68'; };
        this.firstChild.onclick = () => this.toggle(true); return;
      }
      var mob = window.innerWidth < 560;
      var box = 'width:' + (mob ? 'calc(100vw - 32px)' : '420px') + ';height:' + (mob ? 'calc(100vh - 96px)' : 'min(640px,calc(100vh - 48px))');
      var ctxLine = ctx.label ? ctx.label : ctx.page;
      var html = '<div role="dialog" aria-label="MGHPM Assistant" style="' + box + ';display:flex;flex-direction:column;background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 24px 64px rgba(15,23,42,.24);overflow:hidden">';
      html += '<div style="display:flex;align-items:flex-start;gap:12px;padding:16px 16px 12px;background:#006B68;color:#fff"><span style="width:36px;height:36px;border-radius:8px;background:rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + svg('spark', 20, '#D4A637') + '</span><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span style="font:700 15px/1.2 ' + F + '">MGHPM Assistant</span><span style="font:500 12px/1.3 ' + F + ';color:rgba(255,255,255,.78)">' + esc(ro[0]) + ' • ' + esc(ro[1]) + '</span></div><button data-x aria-label="Close" style="width:32px;height:32px;border:0;border-radius:6px;background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">' + svg('x', 18) + '</button></div>';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#F0FAF9;border-bottom:1px solid #CDEBE8;font:500 12px/1.4 ' + F + ';color:#134E4A"><span style="font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:10px">Context</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(ctxLine) + '</span></div>';
      html += '<div data-log style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#F8FAFC">';
      if (!this.msgs.length) {
        html += '<div style="font:400 13px/1.55 ' + F + ';color:#475569">Ask about records you are allowed to see. Answers come from MGHPM data and include links to act. ' + (r === 'staff' ? 'Findings are recommendations — approvals, verifications, merges, bank changes and distributions always need a person.' : '') + '</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
        var qs = PROMPTS[r].slice(); if (ctx.record && r === 'staff') qs.unshift('AI Review this record');
        qs.forEach(function (q, i) { html += '<button data-q="' + i + '" style="text-align:left;padding:8px 12px;border:1px solid #E2E8F0;border-radius:999px;background:#fff;cursor:pointer;font:500 12px/1.3 ' + F + ';color:#172033">' + esc(q) + '</button>'; });
        html += '</div>'; this._qs = qs;
      }
      this.msgs.forEach((m, i) => {
        if (m.role === 'user') html += '<div style="align-self:flex-end;max-width:85%;padding:10px 12px;border-radius:12px;background:#006B68;color:#fff;font:400 13px/1.5 ' + F + ';white-space:pre-wrap">' + esc(m.text) + '</div>';
        else {
          html += '<div style="align-self:flex-start;max-width:92%;display:flex;flex-direction:column;gap:8px"><div style="padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #E2E8F0;color:#172033;font:400 13px/1.55 ' + F + ';white-space:pre-wrap;text-wrap:pretty">' + esc(m.text) + '</div>';
          if (m.findings && m.findings.length) { html += '<div style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:8px;background:#fff;border:1px solid #E2E8F0">'; m.findings.forEach(function (f) { var c = f.level === 'ok' ? '#15803D' : f.level === 'critical' ? '#DC2626' : '#B45309'; html += '<div style="display:flex;gap:8px;font:500 12px/1.45 ' + F + ';color:#172033"><span style="width:8px;height:8px;border-radius:4px;background:' + c + ';margin-top:5px;flex-shrink:0"></span><span>' + esc(f.text) + '</span></div>'; }); html += '</div>'; }
          if (m.actions && m.actions.length) { html += '<div style="display:flex;flex-wrap:wrap;gap:6px">'; m.actions.forEach(function (a, j) { html += '<button data-a="' + i + ':' + j + '" style="display:flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:1px solid #006B68;border-radius:6px;background:#fff;color:#006B68;cursor:pointer;font:600 12px/1 ' + F + '">' + esc(a.label) + svg('arrow', 13) + '</button>'; }); html += '</div>'; }
          if (m.tasks && m.tasks.length) html += '<button data-t="' + i + '" ' + (m.tasksCreated ? 'disabled ' : '') + 'style="align-self:flex-start;display:flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:0;border-radius:6px;background:' + (m.tasksCreated ? '#DCFCE7' : '#006B68') + ';color:' + (m.tasksCreated ? '#15803D' : '#fff') + ';cursor:pointer;font:600 12px/1 ' + F + '">' + (m.tasksCreated ? svg('check', 13) + m.tasks.length + ' tasks added to Action Center' : 'Create ' + m.tasks.length + ' Task' + (m.tasks.length > 1 ? 's' : '')) + '</button>';
          html += '</div>';
        }
      });
      if (this.busy) html += '<div style="align-self:flex-start;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #E2E8F0;color:#64748B;font:500 13px/1.4 ' + F + '">Reviewing records…</div>';
      html += '</div>';
      html += '<div style="padding:12px;border-top:1px solid #E2E8F0;display:flex;gap:8px;align-items:flex-end;background:#fff"><textarea rows="1" placeholder="Ask a question…" style="flex:1;min-height:40px;max-height:120px;resize:none;padding:10px 12px;border:1px solid #CBD5E1;border-radius:8px;outline:none;font:400 13px/1.4 ' + F + ';color:#172033"></textarea><button data-send aria-label="Send" style="width:40px;height:40px;border:0;border-radius:8px;background:#006B68;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + svg('send', 17) + '</button></div></div>';
      this.innerHTML = html;
      var log = this.querySelector('[data-log]'); log.scrollTop = log.scrollHeight;
      this.querySelector('[data-x]').onclick = () => this.toggle(false);
      var ta = this.querySelector('textarea');
      ta.onfocus = function () { this.style.borderColor = '#006B68'; this.style.boxShadow = '0 0 0 3px rgba(0,107,104,.18)'; }; ta.onblur = function () { this.style.borderColor = '#CBD5E1'; this.style.boxShadow = 'none'; };
      ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.ask(ta.value); } };
      this.querySelector('[data-send]').onclick = () => this.ask(ta.value);
      this.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => { var q = this._qs[+b.dataset.q]; this.ask(q, q === 'AI Review this record'); }; });
      this.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { var p = b.dataset.a.split(':'); var a = this.msgs[+p[0]].actions[+p[1]]; a.href && go(a.href); }; });
      this.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => { var m = this.msgs[+b.dataset.t]; if (m.tasksCreated || !window.MGH_OPS) return; var c = pageContext(); window.MGH_OPS.addTasks(m.tasks, { label: 'AI Review — ' + (c.label || c.page), record: c.label || c.page, href: c.url }); m.tasksCreated = true; this.render(); }; });
    }
    async ask(text, review) {
      text = String(text || '').trim(); if (!text || this.busy) return;
      var role = this.role, ctx = pageContext();
      this.msgs.push({ role: 'user', text: text }); this.busy = true; this.render();
      var acts = ACTIONS(role);
      var snap = role === 'guest' && window.MGH_STR ? window.MGH_STR.snapshot() : window.MGH_OPS ? window.MGH_OPS.snapshot(role, ctx) : { context: ctx };
      var findings = role === 'staff' && window.MGH_OPS ? window.MGH_OPS.run().filter(function (f) { return f.status === 'open'; }) : [];
      var sys = 'You are the MGHPM Assistant inside MGHPM Enterprise, a property-management app (Miami portfolio, USD). Role of the person asking: ' + role.toUpperCase() + '.\n' +
        'RULES: Answer only from DATA. If DATA lacks the answer, say what is missing and where to look. ' +
        (role === 'staff' ? 'Staff may see all records in DATA. ' : role === 'tenant' ? 'This is a TENANT: only discuss their own tenancy (lease, rent, ledger, maintenance status, inspections, renters insurance, documents). Never reveal owner identity details, other tenants, vendor costs, screening reports or internal notes. ' : role === 'guest' ? 'This is a GUEST browsing short-term stays: only discuss public listing data, live quotes and their own reservations in DATA. Never reveal owners, other guests, internal blocks or reasons a stay is unavailable. Prices must come from DATA.results quotes, never estimated. To change the search add "filters": {area, guests, checkIn, checkOut, pets, pool, beach, ocean, parking, pet, gym, workspace, washer, electricityIncluded, allUtilitiesIncluded, maxPrice, bedrooms, instant, sort: recommended|price_asc|price_desc|bedrooms|capacity} with only the keys you need. ' : role === 'owner' ? 'This is an OWNER: only their own properties, statements, distributions, maintenance and inspections. Never reveal tenant personal data beyond names, screening data or internal staff notes. ' : 'This is an APPLICANT: only their own application status and required documents. Never reveal screening thresholds, decision criteria or internal notes. ') +
        'Never claim you approved, verified, merged, paid, changed bank data, issued distributions or signed anything — you can only recommend; a person must act. Be concise (max ~120 words), institutional tone, no emoji, money with cents.\n' +
        'Reply with ONLY a JSON object: {"answer": string, "actions": [string], "findings": [{"text": string, "level": "ok"|"warn"|"critical"}], "tasks": [{"title": string, "priority": "High"|"Medium"|"Low"}]}. ' +
        '"actions" may contain up to 3 keys from ACTIONS or "finding:F-xx" ids from DATA.findings. Use "findings" and "tasks" only for record reviews (otherwise empty arrays).';
      var user = 'ACTIONS: ' + JSON.stringify(Object.keys(acts).reduce(function (o, k) { o[k] = acts[k][0]; return o; }, {})) + '\nDATA: ' + JSON.stringify(snap).slice(0, 14000) + '\n\n' + (review ? 'Perform an AI Review of the record in DATA.context: list findings (what is complete = ok, what is missing or risky = warn/critical) and propose follow-up tasks. ' : '') + 'QUESTION: ' + text;
      var out = { role: 'assistant', text: '', actions: [], findings: [], tasks: [] };
      try {
        if (!window.claude || !window.claude.complete) throw new Error('offline');
        var raw = await window.claude.complete({ system: sys, max_tokens: 900, messages: [{ role: 'user', content: user }] });
        var m = String(raw).match(/\{[\s\S]*\}/); var j = m ? JSON.parse(m[0]) : { answer: String(raw) };
        out.text = j.answer || '';
        if (role === 'guest' && j.filters && window.MGH_STR) window.MGH_STR.apply(j.filters);
        out.findings = Array.isArray(j.findings) ? j.findings.slice(0, 8) : [];
        out.tasks = Array.isArray(j.tasks) ? j.tasks.slice(0, 6) : [];
        out.actions = (j.actions || []).slice(0, 3).map(function (k) { if (/^finding:/.test(k)) { var f = findings.find(function (x) { return x.id === k.split(':')[1]; }); return f ? { label: f.action, href: f.actionHref } : null; } return acts[k] ? { label: acts[k][0], href: acts[k][1] } : null; }).filter(Boolean);
      } catch (e) {
        if (role === 'guest' && window.MGH_STR) { var la = window.MGH_STR.localAnswer(text); out.text = la.text; out.actions = la.actions || []; }
        else if (role === 'staff' && findings.length) { var crit = findings.filter(function (f) { return f.sev === 'critical'; }); out.text = 'The assistant is offline, so here is the Operations Agent summary: ' + findings.length + ' open findings, ' + crit.length + ' critical.' + (crit[0] ? ' Top item: ' + crit[0].title + ' — ' + crit[0].record + '.' : ''); out.actions = [{ label: 'Open Action Center', href: M().action }]; }
        else out.text = 'The assistant could not reach MGHPM records right now. Please try again in a moment or use Messages to contact your property manager.';
      }
      this.busy = false; this.msgs.push(out); this.render();
    }
  }
  customElements.define('mgh-assistant', MghAssistant);
})();
