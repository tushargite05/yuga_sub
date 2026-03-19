/**
 * Kartsen substrate UI — olive theme, two tabs:
 * 1) Kartsen Test Measurement — checkboxes + two measurements per window
 * 2) Kartsen Test Diagram — Highcharts (generated when this tab is selected; no Generate button)
 */
(function () {
  const T = {
    fontFamily: "'Segoe UI', 'Lucida Grande', 'Helvetica Neue', Arial, sans-serif",
    text: "#2d3319",
    muted: "#5c6338",
    border: "#8a9460",
    panelBg: "#e8edd8",
    panelInner: "#f6f8ef",
    accent: "#556b2f",
    accentHover: "#3d4d22",
    tabInactiveBg: "#d4dcc0",
    tabInactiveText: "#3d4429",
    tabBarBg: "#c8d2b0",
    inputBg: "#fefff8",
    error: "#7a1f1f",
    diagramHint: "#5c6338",
  };

  const WINDOWS = [
    { id: "m10", label: "10 min" },
    { id: "m30", label: "30 min" },
    { id: "h1", label: "1 hour" },
    { id: "h2", label: "2 hour" },
    { id: "h3", label: "3 hour" },
    { id: "h4", label: "4 hour" },
    { id: "h6", label: "6 hour" },
    { id: "h24", label: "24 hour" },
    { id: "d1", label: "1 day" },
  ];

  const TAB_MEASURE = 0;
  const TAB_DIAGRAM = 1;

  let hostEl = null;
  let errorEl = null;
  let diagramErrorEl = null;
  let nameInput = null;
  let paneMeasure = null;
  let paneDiagram = null;
  let tabButtons = [];

  function el(tag, styles, attrs) {
    const n = document.createElement(tag);
    if (styles) Object.assign(n.style, styles);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "text") n.textContent = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function")
          n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
    }
    return n;
  }

  function parseMl(s) {
    if (s == null || String(s).trim() === "") return null;
    const n = Number(String(s).trim().replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }

  function toggleRow(row, checked) {
    row.style.display = checked ? "flex" : "none";
    if (!checked) {
      row.querySelectorAll('input[type="text"]').forEach((i) => (i.value = ""));
    }
  }

  function collect() {
    const name = (nameInput.value || "").trim();
    const categories = [];
    const values = [];

    for (const w of WINDOWS) {
      const cb = hostEl.querySelector("#cb-" + w.id);
      if (!cb.checked) continue;

      const m1 = parseMl(hostEl.querySelector("#m1-" + w.id).value);
      const m2 = parseMl(hostEl.querySelector("#m2-" + w.id).value);

      if (!Number.isFinite(m1) || !Number.isFinite(m2)) {
        throw new Error(
          'Window "' +
            w.label +
            '" needs numeric Measurement 1 and Measurement 2 (ml).'
        );
      }

      categories.push(w.label);
      values.push((m1 + m2) / 2);
    }

    if (categories.length === 0) {
      throw new Error(
        "Select at least one time window and enter both measurements (ml) on the Measurement tab."
      );
    }

    return {
      title:
        name.length > 0
          ? name + " — average of two measurements (ml)"
          : "Substrate — average of two measurements (ml)",
      subtitle:
        "One bar per selected window: (measurement 1 + measurement 2) ÷ 2",
      categories,
      values,
    };
  }

  function showMeasureError(msg) {
    errorEl.textContent = msg || "";
    errorEl.style.display = msg ? "block" : "none";
  }

  function showDiagramError(msg) {
    diagramErrorEl.textContent = msg || "";
    diagramErrorEl.style.display = msg ? "block" : "none";
  }

  function tryRenderDiagram() {
    showDiagramError("");
    const chartHost = document.getElementById("substrate-chart-root");
    if (!chartHost) return;

    try {
      const data = collect();
      if (window.substrateChart) window.substrateChart.render("substrate-chart-root", data);
    } catch (e) {
      if (window.substrateChart) window.substrateChart.destroy();
      chartHost.innerHTML = "";
      showDiagramError(e.message || String(e));
    }
  }

  function setActiveTab(index) {
    tabButtons.forEach((btn, i) => {
      const on = i === index;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.style.backgroundColor = on ? T.accent : T.tabInactiveBg;
      btn.style.color = on ? "#f8faf0" : T.tabInactiveText;
      btn.style.borderBottomColor = on ? T.accent : T.border;
      btn.style.fontWeight = on ? "700" : "600";
    });

    paneMeasure.style.display = index === TAB_MEASURE ? "block" : "none";
    paneDiagram.style.display = index === TAB_DIAGRAM ? "block" : "none";

    if (index === TAB_DIAGRAM) {
      tryRenderDiagram();
    }
  }

  window.substrateApp = {
    mount: function (hostId) {
      const root = document.getElementById(hostId);
      if (!root) throw new Error("substrateApp.mount: #" + hostId + " not found.");
      if (hostEl) window.substrateApp.unmount();

      hostEl = root;
      hostEl.innerHTML = "";

      const wrap = el("div", {
        fontFamily: T.fontFamily,
        color: T.text,
        maxWidth: "1200px",
      });

      const tabBar = el("div", {
        display: "flex",
        flexWrap: "wrap",
        gap: "0",
        backgroundColor: T.tabBarBg,
        border: "1px solid " + T.border,
        borderBottom: "none",
        borderRadius: "6px 6px 0 0",
        overflow: "hidden",
      });
      tabBar.setAttribute("role", "tablist");
      tabBar.setAttribute("aria-label", "Kartsen test sections");

      function makeTab(label, index) {
        const btn = el(
          "button",
          {
            flex: "1",
            minWidth: "160px",
            padding: "12px 16px",
            fontSize: "13px",
            fontFamily: T.fontFamily,
            border: "none",
            borderBottom: "3px solid transparent",
            cursor: "pointer",
            transition: "background-color 0.15s, color 0.15s",
          },
          { type: "button", text: label }
        );
        btn.setAttribute("role", "tab");
        btn.setAttribute("id", "kartsen-tab-" + index);
        btn.setAttribute("aria-controls", "kartsen-panel-" + index);
        btn.addEventListener("click", () => setActiveTab(index));
        btn.addEventListener("mouseenter", () => {
          if (btn.getAttribute("aria-selected") !== "true") {
            btn.style.backgroundColor = "#c5cfa8";
          }
        });
        btn.addEventListener("mouseleave", () => {
          const on = btn.getAttribute("aria-selected") === "true";
          btn.style.backgroundColor = on ? T.accent : T.tabInactiveBg;
          btn.style.color = on ? "#f8faf0" : T.tabInactiveText;
        });
        return btn;
      }

      const tabMeasure = makeTab("Kartsen Test Measurement", TAB_MEASURE);
      const tabDiagram = makeTab("Kartsen Test Diagram", TAB_DIAGRAM);
      tabButtons = [tabMeasure, tabDiagram];
      tabBar.appendChild(tabMeasure);
      tabBar.appendChild(tabDiagram);
      wrap.appendChild(tabBar);

      const shell = el("div", {
        border: "1px solid " + T.border,
        borderTop: "1px solid " + T.border,
        borderRadius: "0 0 6px 6px",
        backgroundColor: T.panelBg,
        boxSizing: "border-box",
      });

      paneMeasure = el("div", {
        padding: "16px 18px",
        display: "block",
      });
      paneMeasure.setAttribute("role", "tabpanel");
      paneMeasure.setAttribute("id", "kartsen-panel-0");
      paneMeasure.setAttribute("aria-labelledby", "kartsen-tab-0");

      const h = el("h2", {
        margin: "0 0 6px 0",
        fontSize: "18px",
        fontWeight: "700",
        color: T.accent,
      });
      h.textContent = "Measurements";
      paneMeasure.appendChild(h);

      const hint = el("p", {
        margin: "0 0 14px 0",
        fontSize: "12px",
        color: T.muted,
        lineHeight: "1.45",
      });
      hint.textContent =
        "Select time windows and enter Measurement 1 and 2 (ml) for each. Open Kartsen Test Diagram to render the chart — no separate button.";
      paneMeasure.appendChild(hint);

      const nameRow = el("div", {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        marginBottom: "14px",
      });
      nameRow.appendChild(
        el("label", { fontSize: "13px", fontWeight: "700", color: T.text }, { text: "Substrate name" })
      );
      nameInput = el("input", {
        flex: "1",
        minWidth: "200px",
        maxWidth: "420px",
        padding: "8px 12px",
        fontSize: "13px",
        fontFamily: T.fontFamily,
        border: "1px solid " + T.border,
        borderRadius: "4px",
        backgroundColor: T.inputBg,
        color: T.text,
      });
      nameInput.type = "text";
      nameInput.placeholder = "e.g. Batch A";
      nameRow.appendChild(nameInput);
      paneMeasure.appendChild(nameRow);

      const list = el("div", {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      });

      for (const w of WINDOWS) {
        const block = el("div", {
          border: "1px solid " + T.border,
          borderRadius: "4px",
          padding: "10px 12px",
          backgroundColor: T.panelInner,
        });

        const head = el("div", {
          display: "flex",
          alignItems: "center",
          gap: "10px",
        });

        const cb = el("input", {}, { type: "checkbox", id: "cb-" + w.id });
        cb.style.width = "17px";
        cb.style.height = "17px";
        cb.style.accentColor = T.accent;

        const lab = el(
          "label",
          { fontSize: "13px", fontWeight: "700", cursor: "pointer", userSelect: "none", color: T.text },
          { for: "cb-" + w.id, text: w.label }
        );

        head.appendChild(cb);
        head.appendChild(lab);
        block.appendChild(head);

        const measRow = el("div", {
          display: "none",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "1px dashed " + T.border,
        });

        function addMeas(num, suffix) {
          const col = el("div", {
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "140px",
          });
          const ml = el(
            "label",
            { fontSize: "11px", color: T.muted, fontWeight: "600" },
            { text: "Measurement " + num + " (ml)" }
          );
          const inp = el("input", {
            padding: "8px 10px",
            fontSize: "13px",
            fontFamily: T.fontFamily,
            border: "1px solid " + T.border,
            borderRadius: "4px",
            width: "140px",
            boxSizing: "border-box",
            backgroundColor: T.inputBg,
            color: T.text,
          });
          inp.type = "text";
          inp.inputMode = "decimal";
          inp.id = suffix + "-" + w.id;
          inp.setAttribute("aria-label", w.label + " measurement " + num);
          col.appendChild(ml);
          col.appendChild(inp);
          return col;
        }

        measRow.appendChild(addMeas(1, "m1"));
        measRow.appendChild(addMeas(2, "m2"));
        block.appendChild(measRow);

        cb.addEventListener("change", () => {
          toggleRow(measRow, cb.checked);
          showMeasureError("");
        });

        list.appendChild(block);
      }

      paneMeasure.appendChild(list);

      const clearBtn = el(
        "button",
        {
          marginTop: "16px",
          padding: "8px 16px",
          fontSize: "13px",
          fontFamily: T.fontFamily,
          fontWeight: "600",
          color: "#f8faf0",
          backgroundColor: T.accent,
          border: "1px solid " + T.accentHover,
          borderRadius: "4px",
          cursor: "pointer",
        },
        { type: "button", text: "Clear all measurements" }
      );
      clearBtn.addEventListener("mouseenter", () => {
        clearBtn.style.backgroundColor = T.accentHover;
      });
      clearBtn.addEventListener("mouseleave", () => {
        clearBtn.style.backgroundColor = T.accent;
      });
      clearBtn.addEventListener("click", () => {
        showMeasureError("");
        nameInput.value = "";
        for (const w of WINDOWS) {
          const cb = hostEl.querySelector("#cb-" + w.id);
          cb.checked = false;
          const inp1 = hostEl.querySelector("#m1-" + w.id);
          const inp2 = hostEl.querySelector("#m2-" + w.id);
          if (inp1) inp1.value = "";
          if (inp2) inp2.value = "";
          const measRow = inp1 ? inp1.parentElement.parentElement : null;
          if (measRow) toggleRow(measRow, false);
        }
        if (window.substrateChart) window.substrateChart.destroy();
        const chartHost = document.getElementById("substrate-chart-root");
        if (chartHost) chartHost.innerHTML = "";
        showDiagramError("");
      });

      paneMeasure.appendChild(clearBtn);

      errorEl = el("p", {
        margin: "12px 0 0 0",
        fontSize: "12px",
        color: T.error,
        display: "none",
      });
      paneMeasure.appendChild(errorEl);

      paneDiagram = el("div", {
        padding: "16px 18px",
        display: "none",
      });
      paneDiagram.setAttribute("role", "tabpanel");
      paneDiagram.setAttribute("id", "kartsen-panel-1");
      paneDiagram.setAttribute("aria-labelledby", "kartsen-tab-1");

      const dh = el("h2", {
        margin: "0 0 8px 0",
        fontSize: "18px",
        fontWeight: "700",
        color: T.accent,
      });
      dh.textContent = "Diagram";
      paneDiagram.appendChild(dh);

      const dHint = el("p", {
        margin: "0 0 12px 0",
        fontSize: "12px",
        color: T.diagramHint,
      });
      dHint.textContent =
        "Chart refreshes each time you open this tab from your current measurements.";
      paneDiagram.appendChild(dHint);

      diagramErrorEl = el("div", {
        margin: "0 0 12px 0",
        padding: "12px 14px",
        fontSize: "13px",
        color: T.error,
        backgroundColor: "#f5e6e6",
        border: "1px solid #c9a0a0",
        borderRadius: "4px",
        display: "none",
        whiteSpace: "pre-wrap",
      });
      paneDiagram.appendChild(diagramErrorEl);

      const chartHost = el("div", {
        minHeight: "420px",
        width: "100%",
        border: "1px solid " + T.border,
        borderRadius: "4px",
        backgroundColor: T.panelInner,
        boxSizing: "border-box",
      });
      chartHost.id = "substrate-chart-root";
      paneDiagram.appendChild(chartHost);

      shell.appendChild(paneMeasure);
      shell.appendChild(paneDiagram);
      wrap.appendChild(shell);
      hostEl.appendChild(wrap);

      setActiveTab(TAB_MEASURE);
    },

    unmount: function () {
      if (window.substrateChart) window.substrateChart.destroy();
      tabButtons = [];
      nameInput = null;
      paneMeasure = null;
      paneDiagram = null;
      errorEl = null;
      diagramErrorEl = null;
      if (hostEl) {
        hostEl.innerHTML = "";
        hostEl = null;
      }
    },
  };
})();
