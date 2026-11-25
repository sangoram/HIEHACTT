/* Shared checklist editor for the site-list page and the admin console.
   ListEditor.render(container, sections, { editable, onOps(ops) -> Promise, newTag }) */
(function () {
  var open = {};
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function btn(text, cls, fn) { var b = el('button', cls || 'ghost sm', text); b.type = 'button'; b.onclick = fn; return b; }
  function tag(text, cls) { return el('span', 'tag ' + cls, text); }

  function render(root, sections, o) {
    o = o || {}; root.textContent = '';
    var run = function (ops) { return Promise.resolve(o.onOps(ops)); };
    sections.forEach(function (s) {
      var d = el('details', 'lcard'); d.open = !!open[s.id]; d.ontoggle = function () { open[s.id] = d.open; };
      var sum = el('summary'); sum.appendChild(el('span', 'num', String(s.n)));
      var t = el('span', 'ttl', s.title); sum.appendChild(t);
      if (s.src) sum.appendChild(tag(s.src === 'site' ? 'Site card' : (s.src === 'draft' ? (o.newTag || 'New') : 'Admin card'), s.src));
      if (s.ed) sum.appendChild(tag('Renamed', s.ed));
      sum.appendChild(el('span', 'cnt', s.items.length + ' item' + (s.items.length === 1 ? '' : 's')));
      d.appendChild(sum);
      var body = el('div', 'lbody');
      s.items.forEach(function (it) {
        var row = el('div', 'litem');
        var lab = el('div', 'llab'); lab.appendChild(el('span', null, it.label));
        if (it.critical) lab.appendChild(tag('Time-critical', 'crit'));
        if (it.src) lab.appendChild(tag(it.src === 'site' ? 'Added by site' : (it.src === 'draft' ? (o.newTag || 'New') : 'Added by admin'), it.src));
        if (it.ed) lab.appendChild(tag(it.ed === 'site' ? 'Edited by site' : (it.ed === 'draft' ? 'Edited · ' + (o.newTag || 'new') : 'Edited by admin'), it.ed));
        row.appendChild(lab);
        if (o.editable) {
          var acts = el('div', 'lacts');
          acts.appendChild(btn('Edit', null, function () {
            row.textContent = ''; var inp = el('textarea'); inp.value = it.label; inp.rows = 2; inp.maxLength = 300;
            var cb = el('label', 'chk'); var c = el('input'); c.type = 'checkbox'; c.checked = !!it.critical; cb.appendChild(c); cb.appendChild(document.createTextNode(' Time-critical'));
            var save = btn('Save', 'sm', function () {
              var op = { t: 'edit_item', id: it.id }; var v = inp.value.trim();
              if (v && v !== it.label) op.label = v; if (c.checked !== !!it.critical) op.critical = c.checked;
              if (op.label == null && op.critical == null) { render(root, sections, o); return; } run([op]);
            });
            var wrap = el('div', 'ledit'); wrap.appendChild(inp); var bar = el('div', 'bar'); bar.appendChild(cb); bar.appendChild(el('span', 'grow'));
            bar.appendChild(btn('Cancel', null, function () { render(root, sections, o); })); bar.appendChild(save); wrap.appendChild(bar); row.appendChild(wrap); inp.focus();
          }));
          acts.appendChild(btn('Remove', 'ghost sm warn', function () { if (confirm('Remove “' + it.label + '”?')) run([{ t: 'remove_item', id: it.id }]); }));
          row.appendChild(acts);
        }
        body.appendChild(row);
      });
      if (!s.items.length) body.appendChild(el('div', 'muted', 'No items yet.'));
      if (o.editable) {
        var add = el('div', 'bar addrow'); var inp = el('input'); inp.placeholder = 'Add an item to this card'; inp.maxLength = 300;
        var cb = el('label', 'chk'); var c = el('input'); c.type = 'checkbox'; cb.appendChild(c); cb.appendChild(document.createTextNode(' Time-critical'));
        var go = function () { var v = inp.value.trim(); if (v) run([{ t: 'add_item', card: s.id, label: v, critical: c.checked }]); };
        inp.onkeydown = function (e) { if (e.key === 'Enter') go(); };
        add.appendChild(inp); add.appendChild(cb); add.appendChild(btn('+ Add', 'sm', go)); body.appendChild(add);
        var cardBar = el('div', 'bar'); cardBar.style.marginTop = '8px';
        cardBar.appendChild(btn('Rename card', 'ghost sm', function () { var v = prompt('New card title', s.title); if (v && v.trim() && v.trim() !== s.title) run([{ t: 'rename_card', id: s.id, title: v.trim() }]); }));
        cardBar.appendChild(btn('Remove card', 'ghost sm warn', function () { if (confirm('Remove the card “' + s.title + '” and all its items?')) run([{ t: 'remove_card', id: s.id }]); }));
        body.appendChild(cardBar);
      }
      d.appendChild(body); root.appendChild(d);
    });
    if (o.editable) {
      var nc = el('div', 'bar addrow newcard'); var ci = el('input'); ci.placeholder = 'Add a new card — e.g. Transport prep'; ci.maxLength = 80;
      var go2 = function () { var v = ci.value.trim(); if (v) run([{ t: 'add_card', title: v }]); };
      ci.onkeydown = function (e) { if (e.key === 'Enter') go2(); };
      nc.appendChild(ci); nc.appendChild(btn('+ Add card', 'sm', go2)); root.appendChild(nc);
    }
  }
  window.ListEditor = { render: render, open: open };
})();
