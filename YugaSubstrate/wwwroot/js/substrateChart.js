/**
 * Highcharts column chart — olive / green theme.
 * One bar per category; values are precomputed averages (ml).
 */
(function () {
  let chartInstance = null;

  const THEME = {
    chartBg: "#f4f7ec",
    text: "#2d3319",
    muted: "#5c6338",
    grid: "#c5d4a3",
    axisLine: "#7d8a52",
    barTop: "#8bc34a",
    barBottom: "#558b2f",
    dataLabel: "#2d3319",
  };

  window.substrateChart = {
    /**
     * @param {string} containerId
     * @param {{ categories: string[], values: number[], title: string, subtitle?: string }} payload
     */
    render: function (containerId, payload) {
      const el = document.getElementById(containerId);
      if (!el) {
        throw new Error(
          'Chart container not found (#' + containerId + "). Try refreshing the page."
        );
      }
      if (typeof Highcharts === "undefined") {
        throw new Error(
          "Highcharts is not on the page. Ensure js/highcharts.js loads before js/substrateChart.js."
        );
      }

      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      el.innerHTML = "";

      const categories = payload.categories || [];
      const values = (payload.values || []).map((v) => Number(v));
      const title = payload.title || "Substrate";
      const subtitle = payload.subtitle || "";

      const options = {
        chart: {
          type: "column",
          backgroundColor: THEME.chartBg,
          height: 400,
          style: { fontFamily: "'Segoe UI', 'Lucida Grande', Arial, sans-serif" },
        },
        title: {
          text: title,
          style: { color: THEME.text, fontWeight: "700", fontSize: "17px" },
        },
        xAxis: {
          categories,
          title: { text: "Time window", style: { color: THEME.muted, fontWeight: "600" } },
          crosshair: true,
          lineColor: THEME.axisLine,
          tickColor: THEME.axisLine,
          labels: { style: { color: THEME.text } },
        },
        yAxis: {
          min: 0,
          title: {
            text: "Average volume (ml)",
            style: { color: THEME.muted, fontWeight: "600" },
          },
          gridLineColor: THEME.grid,
          lineColor: THEME.axisLine,
          tickColor: THEME.axisLine,
          labels: { style: { color: THEME.text } },
        },
        legend: { enabled: false },
        tooltip: {
          backgroundColor: "rgba(244,247,236,0.95)",
          borderColor: THEME.axisLine,
          style: { color: THEME.text },
          headerFormat: "<b>{point.key}</b><br/>",
          pointFormat:
            "Average: <b>{point.y:.2f}</b> ml<br/><span style=\"font-size:11px;opacity:0.85\">(mean of measurement 1 & 2)</span>",
        },
        plotOptions: {
          column: {
            borderRadius: 4,
            pointPadding: 0.15,
            groupPadding: 0.12,
            borderWidth: 0,
            dataLabels: {
              enabled: values.length > 0 && values.length <= 12,
              format: "{y:.2f}",
              style: {
                fontWeight: "700",
                fontSize: "11px",
                color: THEME.dataLabel,
                textOutline: "1px contrast",
              },
            },
          },
          series: {
            animation: { duration: 450 },
          },
        },
        series: [
          {
            name: "Average (ml)",
            data: values,
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, THEME.barTop],
                [1, THEME.barBottom],
              ],
            },
          },
        ],
        credits: {
          enabled: true,
          style: { color: THEME.muted },
        },
      };

      if (subtitle) {
        options.subtitle = {
          text: subtitle,
          style: { color: THEME.muted, fontSize: "12px" },
        };
      }

      chartInstance = Highcharts.chart(containerId, options);
    },

    destroy: function () {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      const el = document.getElementById("substrate-chart-root");
      if (el) el.innerHTML = "";
    },
  };
})();
