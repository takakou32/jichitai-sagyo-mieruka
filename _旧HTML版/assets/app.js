// 移行作業 見える化：表示ロジック
// 中身は data/*.js に書く。このファイルはデータを描画するだけ。
(function () {
  "use strict";

  var D = window.DATA || {};
  var SVG_NS = "http://www.w3.org/2000/svg";
  var KINDS = ["定型", "判断", "調整"];
  var UNDEFINED = "未定義";

  // ---------- データの索引 ----------

  var domains = D.domains || [];
  var events = D.events || [];
  var roles = D.roles || [];
  var taskIndex = {};
  domains.forEach(function (d) {
    d.tasks.forEach(function (t) {
      (t.steps || []).forEach(function (s, i) { if (!s.id) s.id = "s" + (i + 1); });
      taskIndex[t.id] = { task: t, domain: d };
    });
  });

  function eventsUsing(taskId) {
    return events.filter(function (e) {
      return e.items.some(function (it) { return it.task === taskId; });
    });
  }

  function allSteps() {
    var list = [];
    domains.forEach(function (d) {
      d.tasks.forEach(function (t) {
        (t.steps || []).forEach(function (s, i) { list.push({ domain: d, task: t, step: s, no: i + 1 }); });
      });
    });
    return list;
  }

  function isUndefinedJudge(s) {
    return !!s.judge && (s.judge.who === UNDEFINED || s.judge.basis === UNDEFINED);
  }

  // ---------- ページ定義 ----------

  var GROUPS = [
    { label: "新人向け", pages: [
      { id: "overview", label: "全体像", render: renderOverview },
      { id: "environment", label: "環境・システム構成", render: renderEnvironment },
      { id: "events", label: "イベント", render: renderEvents },
      { id: "tasks", label: "作業", render: renderTasks },
      { id: "glossary", label: "用語集", render: renderGlossary }
    ] },
    { label: "設計者向け", pages: [
      { id: "decisions", label: "判断ポイント", render: renderDecisions },
      { id: "requests", label: "決定依頼事項", render: renderRequests },
      { id: "automation", label: "自動化候補", render: renderAutomation }
    ] }
  ];
  // 詳細ページ（メニューには出さない）
  var DETAIL_PAGES = {
    event: { parent: "events", render: renderEventDetail },
    task: { parent: "tasks", render: renderTaskDetail }
  };

  // ---------- 共通 ----------

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    setAttrs(node, attrs);
    append(node, children);
    return node;
  }

  function svg(tag, attrs, children) {
    var node = document.createElementNS(SVG_NS, tag);
    setAttrs(node, attrs);
    append(node, children);
    return node;
  }

  function setAttrs(node, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
  }

  function append(node, children) {
    if (children === null || children === undefined) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
  }

  function unconfirmed(item) {
    return item && item.status === "要確認";
  }

  function badge(item) {
    return unconfirmed(item) ? el("span", { "class": "badge-todo", title: "要確認", text: "要確認" }) : null;
  }

  function undefinedText(text) {
    return text === UNDEFINED ? el("span", { "class": "undef", text: UNDEFINED }) : (text || "");
  }

  function section(title, children) {
    return el("section", null, [el("h2", null, title)].concat(children));
  }

  function table(headers, rows, widths) {
    return el("table", { "class": "grid" }, [
      widths ? el("colgroup", null, widths.map(function (w) { return el("col", w ? { style: "width:" + w } : null); })) : null,
      el("thead", null, el("tr", null, headers.map(function (h) { return el("th", { text: h }); }))),
      el("tbody", null, rows.length ? rows : el("tr", null, el("td", { colspan: headers.length, "class": "muted", text: "該当なし" })))
    ]);
  }

  function taskLink(taskId, label) {
    var hit = taskIndex[taskId];
    if (!hit) return el("span", { "class": "muted", text: taskId });
    return el("a", { href: "#task/" + taskId }, [label || hit.task.name, badge(hit.task)]);
  }

  function showDetail(title, rows, item) {
    var body = document.getElementById("detail-body");
    body.innerHTML = "";
    append(body, el("h3", null, [title, badge(item)]));
    var dl = el("dl");
    rows.forEach(function (r) {
      var v = r[1];
      if (!v || (Array.isArray(v) && !v.length)) return;
      dl.appendChild(el("dt", { text: r[0] }));
      dl.appendChild(el("dd", null, Array.isArray(v) ? v.join("、") : undefinedText(v)));
    });
    body.appendChild(dl);
    document.getElementById("detail").hidden = false;
  }

  function hideDetail() {
    document.getElementById("detail").hidden = true;
  }

  // ---------- 全体像 ----------

  function renderOverview() {
    var o = D.overview || {};
    var systems = el("ul", { "class": "chips" }, (o.systems || []).map(function (s) {
      return el("li", null, [s.name, s.note ? el("small", { text: "（" + s.note + "）" }) : null]);
    }));
    var domainCards = el("div", { "class": "cards" }, domains.map(function (d) {
      return el("a", { "class": "card", href: "#tasks" }, [
        el("div", { "class": "card-title", text: d.name }),
        el("div", { "class": "card-body", text: d.desc || "" }),
        el("div", { "class": "card-foot", text: "作業 " + d.tasks.length + " 件" })
      ]);
    }));
    var roleRows = roles.map(function (r) {
      return el("tr", null, [el("td", null, [r.name, badge(r)]), el("td", { text: r.desc })]);
    });
    return [
      el("p", { "class": "lead", text: o.intro || "" }),
      section("担当業務", [systems]),
      section("業務領域", [domainCards]),
      section("役割", [table(["役割", "やること"], roleRows, ["180px", null])]),
      section("年間の流れ", [renderTimeline(o.phases || [])])
    ];
  }

  function renderTimeline(phases) {
    // 4月始まり。13 = 翌年1月、15 = 翌年3月
    var months = [];
    for (var m = 4; m <= 15; m++) months.push(m);
    var head = el("div", { "class": "tl-row tl-head" }, [el("div", { "class": "tl-label" })].concat(
      months.map(function (m) { return el("div", { "class": "tl-cell", text: ((m - 1) % 12 + 1) + "月" }); })
    ));
    var rows = phases.map(function (p) {
      var bar = el("div", { "class": "tl-bar", style: "grid-column:" + (p.from - 3) + " / " + (p.to - 2), title: p.desc || "" }, p.name);
      return el("div", { "class": "tl-row" }, [
        el("div", { "class": "tl-label" }, [p.name, badge(p)]),
        el("div", { "class": "tl-track" }, bar)
      ]);
    });
    var notes = el("ul", { "class": "notes" }, phases.map(function (p) {
      return el("li", null, [el("b", { text: p.name }), "：" + (p.desc || "")]);
    }));
    return el("div", null, [el("div", { "class": "timeline" }, [head].concat(rows)), notes]);
  }

  // ---------- 環境・システム構成 ----------

  function renderEnvironment() {
    var env = D.environment || { zones: [], nodes: [], edges: [] };
    var UX = 110, UY = 90, NW = 180, NH = 62, PAD = 20;
    var byId = {};
    env.nodes.forEach(function (n) {
      byId[n.id] = { n: n, x: PAD + n.x * UX, y: PAD + 30 + n.y * UY };
    });
    var maxX = 0, maxY = 0;
    env.zones.forEach(function (z) {
      maxX = Math.max(maxX, z.x + z.w);
      maxY = Math.max(maxY, z.y + z.h);
    });
    var W = PAD * 2 + maxX * UX, H = PAD * 2 + 30 + maxY * UY;
    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, "class": "diagram", width: W, height: H });
    root.appendChild(arrowDefs());

    env.zones.forEach(function (z) {
      root.appendChild(svg("g", { "class": "zone" }, [
        svg("rect", { x: PAD + z.x * UX, y: PAD + z.y * UY, width: z.w * UX - 10, height: z.h * UY + 20, rx: 10 }),
        svg("text", { x: PAD + z.x * UX + 12, y: PAD + z.y * UY + 22, text: z.label + (unconfirmed(z) ? "（要確認）" : "") })
      ]));
    });

    env.edges.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (!a || !b) return;
      var ca = { x: a.x + NW / 2, y: a.y + NH / 2 }, cb = { x: b.x + NW / 2, y: b.y + NH / 2 };
      var p1 = clipToBox(cb, ca, NW, NH), p2 = clipToBox(ca, cb, NW, NH);
      root.appendChild(svg("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, "class": "edge", "marker-end": "url(#arrow)" }));
      if (e.label) root.appendChild(svg("text", { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 6, "class": "edge-label", text: e.label }));
    });

    env.nodes.forEach(function (n) {
      var p = byId[n.id];
      var g = svg("g", { "class": "node" + (unconfirmed(n) ? " todo" : ""), tabindex: 0 });
      g.appendChild(svg("rect", { x: p.x, y: p.y, width: NW, height: NH, rx: 8 }));
      var lines = n.label.split("\n");
      lines.forEach(function (line, i) {
        g.appendChild(svg("text", {
          x: p.x + NW / 2, y: p.y + NH / 2 + (i - (lines.length - 1) / 2) * 16 + 5,
          "class": i ? "node-sub" : "node-main", text: line
        }));
      });
      if (unconfirmed(n)) g.appendChild(svg("circle", { cx: p.x + NW - 6, cy: p.y + 6, r: 6, "class": "todo-dot" }));
      g.addEventListener("click", function () { showDetail(n.label.replace("\n", " "), [["説明", n.desc]], n); });
      root.appendChild(g);
    });

    return [
      el("p", { "class": "lead", text: "箱をクリックすると説明が出ます。赤い丸は要確認。" }),
      el("div", { "class": "scroll" }, root)
    ];
  }

  // 矩形の中心 to から from へ向かう線が、to の矩形の縁と交わる点
  function clipToBox(from, to, w, h) {
    var dx = from.x - to.x, dy = from.y - to.y;
    if (!dx && !dy) return to;
    var sx = dx ? (w / 2 + 4) / Math.abs(dx) : Infinity;
    var sy = dy ? (h / 2 + 4) / Math.abs(dy) : Infinity;
    var s = Math.min(sx, sy);
    return { x: to.x + dx * s, y: to.y + dy * s };
  }

  function arrowDefs() {
    return svg("defs", null, svg("marker", {
      id: "arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse"
    }, svg("path", { d: "M0,0 L10,5 L0,10 z", "class": "arrow-head" })));
  }

  // ---------- イベント ----------

  function renderEvents() {
    var rows = events.map(function (e) {
      var dom = domains.filter(function (d) { return d.id === e.domain; })[0];
      return el("tr", null, [
        el("td", null, [el("a", { href: "#event/" + e.id, text: e.name }), badge(e)]),
        el("td", { text: dom ? dom.name : "" }),
        el("td", { text: e.desc || "" }),
        el("td", null, e.items.map(function (it, i) {
          return el("span", null, [i ? " → " : "", taskLink(it.task)]);
        }))
      ]);
    });
    return [
      el("p", { "class": "lead", text: "作業を発生させる出来事の一覧。イベント名をクリックすると、発生する作業の流れが出ます。" }),
      table(["イベント", "領域", "内容", "発生する作業"], rows, ["16%", "16%", "24%", null])
    ];
  }

  function renderEventDetail(id) {
    var e = events.filter(function (x) { return x.id === id; })[0];
    if (!e) return [el("p", { text: "イベントが見つかりません。" })];
    var chain = el("div", { "class": "chain" });
    e.items.forEach(function (it, i) {
      if (i) chain.appendChild(el("div", { "class": "chain-arrow", text: "→" }));
      var hit = taskIndex[it.task];
      if (!hit) { chain.appendChild(el("div", { "class": "chain-card muted", text: it.task })); return; }
      var t = hit.task, steps = t.steps || [];
      chain.appendChild(el("a", { "class": "chain-card", href: "#task/" + t.id }, [
        el("div", { "class": "card-foot", text: hit.domain.name }),
        el("div", { "class": "card-title" }, [t.name, badge(t)]),
        it.note ? el("div", { "class": "card-body", text: it.note }) : null,
        el("div", { "class": "kind-counts" }, steps.length
          ? KINDS.map(function (k) {
            var n = steps.filter(function (s) { return s.kind === k; }).length;
            return n ? el("span", { "class": "kind-tag kind-" + k, text: k + " " + n }) : null;
          })
          : el("span", { "class": "muted", text: "ステップ未作成" }))
      ]));
    });
    return [
      el("p", null, el("a", { href: "#events", text: "← イベント一覧" })),
      el("h2", { "class": "page-title" }, [e.name, badge(e)]),
      el("p", { "class": "lead", text: e.desc || "" }),
      section("発生する作業", [chain, el("p", { "class": "muted", text: "作業をクリックすると、その作業のステップが出ます。" })])
    ];
  }

  // ---------- 作業 ----------

  function renderTasks() {
    var sections = domains.map(function (d) {
      var rows = d.tasks.map(function (t) {
        var steps = t.steps || [];
        return el("tr", null, [
          el("td", null, taskLink(t.id)),
          el("td", { text: t.purpose || "" }),
          el("td", { text: t.output || "" }),
          el("td", null, steps.length ? String(steps.length) : el("span", { "class": "muted", text: "未作成" })),
          el("td", { text: String(eventsUsing(t.id).length) })
        ]);
      });
      return section([d.name, badge(d)], [
        d.desc ? el("p", { "class": "lead", text: d.desc }) : null,
        table(["作業", "目的", "成果物", "ステップ", "使うイベント数"], rows, ["22%", null, "20%", "80px", "110px"])
      ]);
    });
    return [el("p", { "class": "lead", text: "業務領域ごとの作業（型）の一覧。作業名をクリックするとステップが出ます。" })].concat(sections);
  }

  var hiddenKinds = {};

  function renderTaskDetail(id) {
    var hit = taskIndex[id];
    if (!hit) return [el("p", { text: "作業が見つかりません。" })];
    var t = hit.task, steps = t.steps || [];
    var used = eventsUsing(id);

    var info = el("dl", { "class": "info" }, [
      el("dt", { text: "領域" }), el("dd", { text: hit.domain.name }),
      el("dt", { text: "目的" }), el("dd", { text: t.purpose || "" }),
      el("dt", { text: "成果物" }), el("dd", { text: t.output || "" }),
      el("dt", { text: "使うイベント" }), el("dd", null, used.length
        ? used.map(function (e, i) { return el("span", null, [i ? "、" : "", el("a", { href: "#event/" + e.id, text: e.name })]); })
        : el("span", { "class": "muted", text: "なし" })),
      t.note ? el("dt", { text: "補足" }) : null, t.note ? el("dd", { text: t.note }) : null
    ]);

    var flowPart;
    if (!steps.length) {
      flowPart = el("p", { "class": "muted", text: "ステップはまだ書かれていません。" });
    } else {
      var holder = el("div", { "class": "scroll" });
      var filters = el("div", { "class": "toolbar" }, [el("span", { "class": "muted", text: "表示：" })].concat(
        KINDS.map(function (k) {
          var cb = el("input", { type: "checkbox", checked: hiddenKinds[k] ? null : "checked" });
          cb.addEventListener("change", function () {
            hiddenKinds[k] = !cb.checked;
            holder.innerHTML = "";
            holder.appendChild(drawSwimlane(steps));
          });
          return el("label", { "class": "kind-toggle kind-" + k }, [cb, " " + k]);
        })
      ));
      holder.appendChild(drawSwimlane(steps));
      flowPart = el("div", null, [filters, holder,
        el("p", { "class": "muted", text: "ステップをクリックすると詳細が出ます。チェックを外した種別は薄く表示されます。" })]);
    }

    return [
      el("p", null, el("a", { href: "#tasks", text: "← 作業一覧" })),
      el("h2", { "class": "page-title" }, [t.name, badge(t)]),
      info,
      section("ステップ", [flowPart])
    ];
  }

  function drawSwimlane(steps) {
    var LW = 200, HEAD = 44, RH = 78, BW = 170, BH = 50, PAD = 10;
    // レーンは master の役割順。ステップに出てくる役割だけ並べる
    var used = {};
    steps.forEach(function (s) { used[s.role] = true; });
    var lanes = roles.map(function (r) { return r.name; }).filter(function (n) { return used[n]; });
    Object.keys(used).forEach(function (n) { if (lanes.indexOf(n) < 0) lanes.push(n); });
    var laneIdx = {};
    lanes.forEach(function (l, i) { laneIdx[l] = i; });

    var pos = {};
    steps.forEach(function (s, i) {
      pos[s.id] = { x: PAD + laneIdx[s.role] * LW + (LW - BW) / 2, y: HEAD + PAD + i * RH };
    });
    var W = PAD * 2 + lanes.length * LW;
    var H = HEAD + PAD * 2 + steps.length * RH;
    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, "class": "diagram", width: W, height: H });
    root.appendChild(arrowDefs());

    lanes.forEach(function (l, i) {
      root.appendChild(svg("g", { "class": "lane" + (i % 2 ? " alt" : "") }, [
        svg("rect", { x: PAD + i * LW, y: PAD, width: LW, height: H - PAD * 2 }),
        svg("text", { x: PAD + i * LW + LW / 2, y: PAD + 24, "class": "lane-title", text: l })
      ]));
    });

    steps.forEach(function (s, i) {
      var nexts = s.next !== undefined ? s.next : (steps[i + 1] ? [{ to: steps[i + 1].id }] : []);
      nexts.forEach(function (n) {
        var a = pos[s.id], b = pos[n.to];
        if (!a || !b) return;
        var x1 = a.x + BW / 2, y1 = a.y + BH, x2 = b.x + BW / 2, y2 = b.y;
        var midY = y1 + 14;
        var d = x1 === x2 ? "M" + x1 + "," + y1 + " L" + x2 + "," + (y2 - 2)
          : "M" + x1 + "," + y1 + " L" + x1 + "," + midY + " L" + x2 + "," + midY + " L" + x2 + "," + (y2 - 2);
        root.appendChild(svg("path", { d: d, "class": "edge", "marker-end": "url(#arrow)" }));
        if (n.label) root.appendChild(svg("text", { x: x1 === x2 ? x1 + 8 : (x1 + x2) / 2, y: midY - 4, "class": "edge-label", text: n.label }));
      });
    });

    steps.forEach(function (s, i) {
      var p = pos[s.id];
      var g = svg("g", {
        "class": "step kind-" + s.kind + (hiddenKinds[s.kind] ? " dim" : "") + (isUndefinedJudge(s) ? " undef-judge" : ""),
        tabindex: 0
      });
      g.appendChild(svg("rect", { x: p.x, y: p.y, width: BW, height: BH, rx: s.kind === "判断" ? 20 : 6 }));
      g.appendChild(svg("text", { x: p.x + 8, y: p.y + 15, "class": "step-meta", text: (i + 1) + "  " + s.kind + (isUndefinedJudge(s) ? "・判断者未定義" : "") }));
      g.appendChild(svg("text", { x: p.x + BW / 2, y: p.y + 35, "class": "step-title", text: s.title }));
      if (unconfirmed(s)) g.appendChild(svg("circle", { cx: p.x + BW - 6, cy: p.y + 6, r: 6, "class": "todo-dot" }));
      g.addEventListener("click", function () {
        var j = s.judge || {};
        showDetail((i + 1) + ". " + s.title, [
          ["担当", s.role], ["種別", s.kind], ["内容", s.detail],
          ["責任範囲", j.scope], ["判断者", j.who], ["判断の根拠", j.basis], ["現状", j.current]
        ], s);
      });
      root.appendChild(g);
    });
    return root;
  }

  // ---------- 用語集 ----------

  function renderGlossary() {
    return [table(["用語", "説明"], (D.glossary || []).map(function (g) {
      return el("tr", null, [el("td", null, [g.term, badge(g)]), el("td", { text: g.desc })]);
    }), ["240px", null])];
  }

  // ---------- 判断ポイント ----------

  var scopeFilter = "";

  function renderDecisions() {
    var list = allSteps().filter(function (x) { return x.step.kind === "判断"; });
    var holder = el("div");
    function draw() {
      holder.innerHTML = "";
      var rows = list.filter(function (x) { return !scopeFilter || (x.step.judge || {}).scope === scopeFilter; })
        .map(function (x) {
          var j = x.step.judge || {};
          return el("tr", null, [
            el("td", null, taskLink(x.task.id)),
            el("td", null, [x.no + ". " + x.step.title, badge(x.step)]),
            el("td", { text: j.scope || "" }),
            el("td", null, undefinedText(j.who)),
            el("td", null, undefinedText(j.basis))
          ]);
        });
      holder.appendChild(table(["作業", "ステップ", "責任範囲", "判断者", "判断の根拠"], rows, ["20%", "24%", "12%", "18%", null]));
    }
    var select = el("select", null, [el("option", { value: "", text: "すべて" })].concat(
      (D.scopes || []).map(function (s) { return el("option", { value: s, text: s }); })
    ));
    select.value = scopeFilter;
    select.addEventListener("change", function () { scopeFilter = select.value; draw(); });
    draw();
    return [
      el("p", { "class": "lead", text: "作業のステップのうち「判断」を集めた一覧。根拠が人の経験になっているものは、ルール化・自動化の候補。" }),
      el("div", { "class": "toolbar" }, [el("span", { "class": "muted", text: "責任範囲：" }), select]),
      holder
    ];
  }

  // ---------- 決定依頼事項 ----------

  function renderRequests() {
    var rows = allSteps().filter(function (x) { return isUndefinedJudge(x.step); }).map(function (x) {
      var j = x.step.judge;
      var ask = [];
      if (j.who === UNDEFINED) ask.push("判断者");
      if (j.basis === UNDEFINED) ask.push("判断基準");
      return el("tr", null, [
        el("td", null, taskLink(x.task.id)),
        el("td", { text: x.step.title }),
        el("td", { text: j.scope || "" }),
        el("td", { text: j.current || "" }),
        el("td", { text: ask.join("・") + "を決めてほしい" })
      ]);
    });
    return [
      el("p", { "class": "lead", text: "判断者や判断基準が決まっていない判断の一覧。自分たちの範囲外のものは、委託元に決定を依頼する。" }),
      table(["作業", "判断", "責任範囲", "現状", "依頼すること"], rows, ["18%", "18%", "10%", null, "22%"])
    ];
  }

  // ---------- 自動化候補 ----------

  function renderAutomation() {
    var list = [];
    domains.forEach(function (d) {
      d.tasks.forEach(function (t) {
        var steps = t.steps || [];
        if (!steps.length) return;
        var count = {};
        KINDS.forEach(function (k) { count[k] = steps.filter(function (s) { return s.kind === k; }).length; });
        list.push({ task: t, steps: steps, count: count, uses: eventsUsing(t.id).length });
      });
    });
    // 定型ステップが多く、多くのイベントで使われる作業ほど上に出す
    list.sort(function (a, b) { return b.count["定型"] * Math.max(b.uses, 1) - a.count["定型"] * Math.max(a.uses, 1); });
    var rows = list.map(function (x) {
      return el("tr", null, [
        el("td", null, taskLink(x.task.id)),
        el("td", { text: String(x.uses) }),
        el("td", null, kindBar(x.count, x.steps.length)),
        el("td", null, x.steps.filter(function (s) { return s.kind === "定型"; }).map(function (s, i) {
          return el("span", null, [i ? "、" : "", s.title]);
        }))
      ]);
    });
    return [
      el("p", { "class": "lead", text: "ステップが書かれている作業について、定型ステップの数と使われるイベントの数を並べたもの。上にあるほど、自動化・定型化の効果が大きい見込み。" }),
      table(["作業", "使うイベント数", "ステップの内訳", "定型ステップ"], rows, ["20%", "110px", "220px", null])
    ];
  }

  function kindBar(count, total) {
    return el("div", null, [
      el("div", { "class": "kind-bar" }, KINDS.map(function (k) {
        return count[k] ? el("span", { "class": "kind-" + k, style: "width:" + (count[k] / total * 100) + "%", title: k + " " + count[k] }) : null;
      })),
      el("div", { "class": "muted small" }, KINDS.map(function (k) { return k + " " + count[k]; }).join(" ／ "))
    ]);
  }

  // ---------- ルーティング ----------

  function findPage(id) {
    var hit = null;
    GROUPS.forEach(function (g) { g.pages.forEach(function (p) { if (p.id === id) hit = p; }); });
    return hit;
  }

  function route() {
    var hash = (location.hash || "#overview").slice(1).split("/");
    var detail = DETAIL_PAGES[hash[0]];
    var page = detail ? findPage(detail.parent) : (findPage(hash[0]) || GROUPS[0].pages[0]);

    var nav = document.getElementById("nav");
    nav.innerHTML = "";
    GROUPS.forEach(function (g) {
      nav.appendChild(el("div", { "class": "nav-group" }, [el("span", { "class": "nav-label", text: g.label })].concat(
        g.pages.map(function (p) { return el("a", { href: "#" + p.id, "class": p === page ? "active" : null, text: p.label }); })
      )));
    });

    var main = document.getElementById("main");
    main.innerHTML = "";
    if (detail) append(main, detail.render(decodeURIComponent(hash[1] || "")));
    else append(main, [el("h2", { "class": "page-title", text: page.label })].concat(page.render()));
    hideDetail();
    window.scrollTo(0, 0);
  }

  document.getElementById("detail-close").addEventListener("click", hideDetail);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideDetail(); });
  window.addEventListener("hashchange", route);
  route();
})();
