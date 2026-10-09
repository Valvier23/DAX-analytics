// Local SVG charts: no third-party scripts, inline styles or HTML from CSV data.
export const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const svgNode = (tag, attrs = {}, text) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
};
const fmt = (value, language) => new Intl.NumberFormat(language, {maximumFractionDigits: 1}).format(value);
function tipFor(plot) {
  const tip = node('div', undefined, 'chart-tooltip');
  tip.hidden = true; tip.setAttribute('role', 'status'); plot.append(tip);
  plot.addEventListener('keydown', event => { if (event.key === 'Escape') tip.hidden = true; });
  plot.addEventListener('pointerleave', () => { if (!plot.contains(document.activeElement)) tip.hidden = true; });
  return (target, text) => {
    const show = () => { tip.textContent = text; tip.hidden = false; };
    const hide = () => { tip.hidden = true; };
    // Keep the tooltip while the pointer moves from its mark onto the tooltip.
    target.addEventListener('pointerenter', show);
    target.addEventListener('focus', show); target.addEventListener('blur', hide);
    target.setAttribute('aria-label', text);
    target.setAttribute('tabindex', '0'); target.setAttribute('data-chart-point', '');
  };
}
export function timeChart({title, labels, series, kind = 'line', language, dataLabel, wide = false}) {
  const wrapper = node('div', undefined, 'time-chart');
  const plot = node('div', undefined, 'chart-plot');
  const compact = window.innerWidth < 650, width = compact ? 360 : wide ? 720 : 420, height = 270;
  const left = 46, right = width - 14, top = 24, bottom = 226;
  const maximum = Math.max(1, ...series.flatMap(s => s.values));
  const rawStep = maximum / 4, power = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map(n => n * power).find(n => n >= rawStep);
  const ceiling = step * 4;
  const y = value => bottom - value / ceiling * (bottom - top);
  const cell = (right - left) / labels.length;
  const x = index => left + cell * (index + .5);
  const svg = svgNode('svg', {viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': title});
  svg.append(svgNode('title', {}, title));
  for (let i = 0; i <= 4; i++) {
    const value = i * step;
    svg.append(svgNode('line', {x1: left, x2: right, y1: y(value), y2: y(value), class: 'chart-grid'}));
    svg.append(svgNode('text', {x: left - 10, y: y(value) + 4, 'text-anchor': 'end', class: 'chart-axis'}, fmt(value, language)));
  }
  labels.forEach((label, i) => {
    if (!compact || i % 2 === 0 || i === labels.length - 1) svg.append(svgNode('text', {x: x(i), y: bottom + 25, 'text-anchor': 'middle', class: 'chart-axis'}, label));
  });
  const bindTip = tipFor(plot);
  series.forEach((s, index) => {
    const color = `series-${index % 5}`;
    if (kind === 'line') {
      const points = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      svg.append(svgNode('polygon', {points: `${x(0)},${bottom} ${points} ${x(labels.length - 1)},${bottom}`, class: `${color} chart-area`}));
      svg.append(svgNode('polyline', {points, class: `${color} chart-line`}));
      s.values.forEach((value, i) => {
        const dot = svgNode('circle', {cx: x(i), cy: y(value), r: compact ? 5 : 4, class: `${color} chart-dot`});
        bindTip(dot, `${labels[i]} · ${s.label}: ${fmt(value, language)}`);svg.append(dot);
      });
    } else {
      const barWidth = cell * .62 / series.length;
      s.values.forEach((value, i) => {
        const bar = svgNode('rect', {x: x(i) - cell * .31 + index * barWidth, y: y(value), width: barWidth - 2, height: bottom - y(value), rx: 3, class: `${color} chart-bar`});
        bindTip(bar, `${labels[i]} · ${s.label}: ${fmt(value, language)}`);svg.append(bar);
      });
    }
  });
  plot.prepend(svg); wrapper.append(plot);
  const legend = node('div', undefined, 'chart-legend');
  series.forEach((s, i) => legend.append(node('span', s.label, `series-${i % 5}`)));wrapper.append(legend);
  const details = node('details', undefined, 'chart-data');details.append(node('summary', dataLabel));
  const table = node('table');const caption = node('caption', title);table.append(caption);
  const head = node('thead'), headRow = node('tr');
  [language === 'en' ? 'Month' : 'Mes', ...series.map(s => s.label)].forEach(text => {const th = node('th', text);th.scope = 'col';headRow.append(th);});head.append(headRow);table.append(head);
  const body = node('tbody');labels.forEach((label, i) => {const row = node('tr');const th = node('th', label);th.scope = 'row';row.append(th);series.forEach(s => row.append(node('td', fmt(s.values[i], language))));body.append(row);});table.append(body);details.append(table);wrapper.append(details);
  return wrapper;
}
export function rankingChart({rows, language, onSelect, empty, percentage = false, suffix = ''}) {
  const wrapper = node('div', undefined, 'ranking-chart');
  if (!rows.length) {wrapper.append(node('p', empty, 'chart-empty'));return wrapper;}
  const max = Math.max(1, ...rows.map(r => r.value)), total = rows.reduce((n, r) => n + r.value, 0);
  rows.forEach((r, i) => {
    const row = node(onSelect ? 'button' : 'div', undefined, 'ranking-row');
    if (onSelect) {row.type = 'button';row.dataset.department = r.name;row.addEventListener('click', () => onSelect(r.name));}
    row.append(node('span', String(i + 1).padStart(2, '0'), 'ranking-order'), node('span', r.name, 'ranking-name'));
    const bar = svgNode('svg', {viewBox: '0 0 180 12', 'aria-hidden': 'true', class: 'ranking-bar', preserveAspectRatio: 'none'});
    bar.append(svgNode('rect', {x: 0, y: 0, width: 180, height: 12, rx: 6, class: 'bar-track'}), svgNode('rect', {x: 0, y: 0, width: 180 * r.value / max, height: 12, rx: 6, class: 'series-0 chart-bar'}));row.append(bar);
    const values = node('span', undefined, 'ranking-value');values.append(node('b', fmt(r.value, language) + suffix));
    if (percentage) values.append(node('small', fmt(total ? r.value / total * 100 : 0, language) + '%'));
    row.append(values);wrapper.append(row);
  });
  return wrapper;
}
export function compositionChart({rows, language, title, totalLabel, empty}) {
  const wrapper = node('div', undefined, 'composition-chart');const total = rows.reduce((n, r) => n + r[1], 0);
  if (!total) {wrapper.append(node('p', empty, 'chart-empty'));return wrapper;}
  const plot = node('div', undefined, 'donut-plot');const bindTip = tipFor(plot);
  const svg = svgNode('svg', {viewBox: '0 0 240 240', role: 'group', 'aria-label': title});
  const circumference = 2 * Math.PI * 84;let offset = 0;
  rows.forEach(([label, value], i) => {
    const arc = svgNode('circle', {cx: 120, cy: 120, r: 84, fill: 'none', 'stroke-width': 24, 'stroke-dasharray': `${value / total * circumference} ${circumference}`, 'stroke-dashoffset': -offset, transform: 'rotate(-90 120 120)', class: `series-${i % 5} donut-arc`});
    bindTip(arc, `${label}: ${fmt(value, language)} · ${fmt(value / total * 100, language)}%`);svg.append(arc);offset += value / total * circumference;
  });
  svg.append(svgNode('text', {x: 120, y: 118, 'text-anchor': 'middle', class: 'donut-total'}, fmt(total, language)),svgNode('text', {x: 120, y: 143, 'text-anchor': 'middle', class: 'donut-caption'}, totalLabel));
  plot.prepend(svg);wrapper.append(plot);
  const legend = node('ul', undefined, 'composition-legend');rows.forEach(([label, value], i) => {const row = node('li');row.append(node('span', label, `series-${i % 5}`), node('b', fmt(value / total * 100, language) + '%'),node('small', fmt(value, language)));legend.append(row);});wrapper.append(legend);
  return wrapper;
}
export function sparkline(values) {
  const svg = svgNode('svg', {viewBox: '0 0 120 36', class: 'kpi-sparkline', 'aria-hidden': 'true'});
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  svg.append(svgNode('polyline', {points: values.map((v, i) => `${i / Math.max(1, values.length - 1) * 116 + 2},${32 - (v - min) / range * 28}`).join(' '), class: 'series-0 chart-line'}));return svg;
}
