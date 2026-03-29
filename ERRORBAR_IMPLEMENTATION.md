# How the Error Bar Feature Was Implemented

Step-by-step explanation of every change made to the YugaSubstrate Highcharts chart to add error bars, per-series tooltips, and clean up static labels.

---

## The Goal

> Each selected time window produces **one bar**.  
> The bar height = **average** of Measurement 1 and Measurement 2.  
> An **error bar line** sits on top of each bar spanning from min to max measurement.  
> **No static text labels** are drawn on the bars or error lines.  
> Hovering the **bar** shows only the average. Hovering the **error line** shows only the deviation.

---

## Step 1 — Understand the data model

Each checked time window has two inputs: **Measurement 1 (m1)** and **Measurement 2 (m2)**.

| Value | Formula | Meaning |
|-------|---------|---------|
| **Average** | `(m1 + m2) / 2` | Height of the bar |
| **Deviation** | `\|m1 − m2\| / 2` | Half-range — how far each measurement is from the average |
| **Error low** | `avg − dev` = `min(m1, m2)` | Bottom of the error line |
| **Error high** | `avg + dev` = `max(m1, m2)` | Top of the error line |

Example: m1 = 4, m2 = 6  
→ avg = **5.00**, dev = **1.00**, error range = [4.00 – 6.00]

---

## Step 2 — Update `collect()` in `substrateApp.js`

**File:** `YugaSubstrate/wwwroot/js/substrateApp.js`

**Before** — only computed the average per window:
```js
categories.push(w.label);
values.push((m1 + m2) / 2);
```

**After** — also computes the deviation and includes it in the payload:
```js
const avg = (m1 + m2) / 2;
const dev = Math.abs(m1 - m2) / 2;   // half-range

categories.push(w.label);
values.push(avg);
deviations.push(dev);
```

The `collect()` function now returns:
```js
{
  title: "...",
  subtitle: "...",
  categories: ["10 min", "30 min", ...],
  values:     [5.00, 8.50, ...],      // bar heights (averages)
  deviations: [1.00, 0.50, ...]       // error bar half-widths
}
```

---

## Step 3 — Build the error bar data in `substrateChart.js`

**File:** `YugaSubstrate/wwwroot/js/substrateChart.js`

Highcharts `errorbar` series expects each data point as `[low, high]`.  
We build this from the averages and deviations:

```js
const errorData = values.map((avg, i) => {
  const dev = deviations[i] || 0;
  return [avg - dev, avg + dev];   // spans from min(m1,m2) to max(m1,m2)
});
```

---

## Step 4 — Add the `errorbar` series to the chart

Two series are declared instead of one:

```js
series: [
  {
    name: "Average (ml)",
    type: "column",       // the green bar
    data: values,
    color: { /* green gradient */ }
  },
  {
    name: "Deviation",
    type: "errorbar",     // the error line on top of each bar
    data: errorData,      // [[low, high], [low, high], ...]
    color: "#7d8a52"
  }
]
```

Highcharts aligns errorbar points with column points automatically by index.

---

## Step 5 — Add the missing Highcharts module

**Problem:** `errorbar` is not included in Highcharts core. Without the extra module, the browser throws:

```
Highcharts error #17: missing module for errorbar
```

**Fix 1 — Download the module** (must match your Highcharts version — 11.4.8):
```bash
curl -L "https://cdn.jsdelivr.net/npm/highcharts@11.4.8/highcharts-more.js" \
     -o wwwroot/js/highcharts-more.js
```

**Fix 2 — Load it in `Components/App.razor`** between core and your chart scripts:
```html
<script src="@Assets["js/highcharts.js"]"></script>
<script src="@Assets["js/highcharts-more.js"]"></script>   <!-- ← added -->
<script src="@Assets["js/substrateChart.js"]"></script>
<script src="@Assets["js/substrateApp.js"]"></script>
```

Load order matters: `highcharts-more.js` must register the `errorbar` type before any chart is created.

---

## Step 6 — Set up separate tooltips per series

**Problem (first attempt):** A single `shared: true` tooltip with a global `formatter` was used. This caused two issues:
1. Both average and deviation showed together on every hover — not what was wanted.
2. `this.x` inside `formatter` with a shared tooltip is a **numeric index**, not the category string, so `categories.indexOf(this.x)` always returned `-1`.

**Fix:** Removed `shared: true` and the global formatter. Added an individual `tooltip` block directly on each series:

```js
// Column series — shows only average on hover
{
  type: "column",
  tooltip: {
    headerFormat: "<b>{point.key}</b><br/>",
    pointFormatter: function () {
      return "Average: <b>" + this.y.toFixed(2) + " ml</b>";
    }
  }
}

// Errorbar series — shows only deviation on hover
{
  type: "errorbar",
  tooltip: {
    headerFormat: "<b>{point.key}</b><br/>",
    pointFormatter: function () {
      const dev = deviations[this.index];
      return "Deviation: <b>±" + dev.toFixed(2) + " ml</b>";
    }
  }
}
```

Now Highcharts shows the right tooltip depending on exactly which element the cursor is over.

| Hover target | Tooltip shows |
|---|---|
| Green bar | `10 min` → `Average: 5.00 ml` |
| Error line | `10 min` → `Deviation: ±1.00 ml` |

---

## Step 7 — Remove static labels from bars and error lines

**Problem:** The average value was drawn as a static white label inside every bar, and `±deviation` was drawn as a static label above every error whisker. These made the chart cluttered.

**Fix:** Disabled `dataLabels` on both `plotOptions.column` and `plotOptions.errorbar`:

```js
plotOptions: {
  column: {
    dataLabels: { enabled: false }   // no average text on bars
  },
  errorbar: {
    dataLabels: { enabled: false }   // no ±deviation text above whiskers
  }
}
```

Values are now only visible on hover via the tooltips.

---

## Final visual layout per bar

```
    ┬             ← top whisker    (= max(m1, m2))
    │             ← stem line
    ┴             ← bottom whisker (= min(m1, m2))
 ┌──────┐
 │      │        ← bar height = average  (no static label)
 │      │
 └──────┘

 Hover bar   → tooltip: "Average: 5.00 ml"
 Hover line  → tooltip: "Deviation: ±1.00 ml"
```

---

## Files changed

| File | What changed |
|------|-------------|
| `wwwroot/js/substrateApp.js` | `collect()` computes and returns `deviations[]` alongside `values[]` |
| `wwwroot/js/substrateChart.js` | Added errorbar series, per-series tooltips, disabled static data labels |
| `wwwroot/js/highcharts-more.js` | New file — downloaded Highcharts extended module v11.4.8 |
| `Components/App.razor` | Added `<script>` tag for `highcharts-more.js` in correct load order |
