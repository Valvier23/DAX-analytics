const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../docs'),copyModule={exports:{}};
require('node:vm').runInNewContext(fs.readFileSync(path.join(root,'site-copy.js'),'utf8'),{module:copyModule});
const copy=copyModule.exports.es;
const text=(tag,key,attrs='')=>`<${tag} data-copy="${key}"${attrs?' '+attrs:''}>${copy[key]}</${tag}>`;
const months=()=>`<div class="months">${copy.shortMonths.map((m,i)=>`<span data-month-index="${i}">${m}</span>`).join('')}</div>`;
const download='https://github.com/Valvier23/DAX-analytics/raw/refs/heads/main/public/downloads/people-analytics-dax-kit-free.zip?v=20261008-bilingual';
const html=`<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${copy.description}"><title>${copy.title}</title>
<script src="theme.js?v=20261008"></script>
<link rel="stylesheet" href="site.css?v=20261008-cards"><link rel="stylesheet" href="theme.css?v=20261008-header">
<script src="site-copy.js?v=20261008-cards" defer></script><script src="demo.js?v=20261008-story" defer></script><script src="language.js?v=20261008-story" defer></script>
</head><body>
<nav aria-label="${copy.nav}" data-copy-aria="nav"><a class="logo" href="#">axzify<span>↗</span></a>
<div class="links">${text('a','how','href="#como"')}${text('a','demo','href="#demo"')}${text('a','roadmapNav','href="#roadmap"')}${text('a','download','class="pill" href="#descarga"')}</div>
<div class="header-preferences" role="group" aria-label="${copy.preferences}" data-copy-aria="preferences">
<label class="theme-control" for="language-select">${text('span','language','class="control-label"')}<select id="language-select" aria-label="${copy.language}" data-copy-aria="language"><option value="es" lang="es" selected>Español</option><option value="en" lang="en">English</option></select></label>
<label class="theme-control" for="theme-select">${text('span','theme','class="control-label"')}<select id="theme-select" aria-label="${copy.theme}" data-copy-aria="theme">${text('option','system','value="system"')}${text('option','light','value="light"')}${text('option','dark','value="dark"')}</select></label>
</div></nav>
<main><div class="hero"><div><div class="eyebrow"><span class="dot"></span> PEOPLE ANALYTICS · POWER BI</div>
${text('h1','heroTitle')}${text('p','heroBody')}<div class="actions">${text('a','heroCta','href="#descarga" class="pill primary"')}${text('a','heroSecondary','href="#demo" class="pill"')}</div>${text('div','heroNote','class="note"')}</div>
<div class="visual" aria-label="${copy.visualLabel}" data-copy-aria="visualLabel"><div class="sheet"><div class="sheet-title">${text('b','sourceFile')}${text('span','source')}</div>
<table><thead><tr>${text('th','personId')}${text('th','startDate')}${text('th','department')}</tr></thead><tbody><tr><td>P001</td><td>2024-02-01</td>${text('td','operations')}</tr><tr><td>P002</td><td>2025-03-15</td>${text('td','finance')}</tr><tr><td>P003</td><td>2026-01-02</td>${text('td','people')}</tr></tbody></table></div>
${text('div','transform','class="transform"')}<div class="dashboard"><div class="dash-head">${text('b','snapshot')}${text('span','sample','class="live"')}</div><div class="kpis"><div>${text('small','headcount')}<b>820</b>${text('i','active')}</div><div>${text('small','joiners')}<b>30</b>${text('i','june')}</div><div>${text('small','leavers')}<b>18</b>${text('i','departures')}</div></div><div class="chart" aria-hidden="true">${[38,49,44,66,78,94].map(h=>`<div class="bar" style="height:${h}%"></div>`).join('')}</div>${months()}</div></div></div>
<div class="strip">${text('span','stripAudience')}${text('span','stripLocal')}${text('span','stripReports')}</div>
<section class="content" id="como"><div class="section-top"><div>${text('div','benefitsEyebrow','class="eyebrow"')}${text('h2','benefitsTitle')}</div>${text('p','benefitsIntro')}</div><div class="steps">${[1,2,3].map(i=>`<article class="step"><span class="number">0${i}</span>${text('h3',`benefit${i}Title`)}${text('p',`benefit${i}Body`)}</article>`).join('')}</div></section>
<section class="content" id="demo"><div class="demo-wrap"><div>${text('div','demoEyebrow','class="eyebrow"')}${text('h2','demoTitle')}${text('p','demoBody')}<div class="tabs" role="tablist" aria-label="${copy.tabLabel}" data-copy-aria="tabLabel">${[['plantilla','tabHeadcount'],['movimientos','tabChanges'],['ausencias','tabAbsence']].map(([id,key],i)=>text('button',key,`role="tab" aria-selected="${i===0}" data-area="${id}"`)).join('')}</div>${text('p','demoNote','class="note"')}</div>
<div class="dashboard" id="demo-panel" role="tabpanel" aria-live="polite"><div class="dash-head"><b id="demo-title"></b>${text('span','sample','class="live"')}</div><div class="kpis" id="demo-kpis"></div><div class="dash-head" style="margin:22px 0 16px"><span id="chart-title"></span>${text('span','period','style="font-size:10px;color:#bbc9c1"')}</div><div class="chart" id="demo-chart" role="img"></div>${months()}</div></div></section>
<section class="content" id="descarga"><div class="download-panel"><div>${text('div','kitEyebrow','class="eyebrow"')}${text('h2','kitTitle')}${text('p','kitBody')}<div class="actions">${text('a','kitCta',`class="pill primary" href="${download}" download`)}</div>${text('p','kitNote','class="note"')}</div><ul class="feature-list">${[1,2,3].map(i=>text('li','feature'+i)).join('')}</ul></div></section>
<section class="content roadmap-section" id="roadmap" aria-labelledby="roadmap-title"><div class="roadmap-heading">${text('div','roadmapEyebrow','class="eyebrow"')}${text('h2','roadmapTitle','id="roadmap-title"')}${text('p','roadmapBody')}</div><ol class="roadmap-track">${[1,2,3,4].map(i=>`<li class="roadmap-card roadmap-card-${i}"><div class="roadmap-stage"><span class="roadmap-number" aria-hidden="true">0${i}</span>${text('span',`roadmap${i}Label`,'class="roadmap-label"')}</div>${text('h3',`roadmap${i}Title`)}${text('p',`roadmap${i}Body`)}${text('div',`roadmap${i}Outcome`,'class="roadmap-outcome"')}</li>`).join('')}</ol>${text('p','roadmapNote','class="roadmap-note"')}</section>
<section class="content" id="preguntas" style="padding-top:0"><div class="faq">${text('h2','faqTitle')}<div>${[1,2,3].map(i=>`<details>${text('summary','faq'+i)}${text('p','answer'+i)}</details>`).join('')}</div></div></section>
</main><footer><a href="#" class="logo">axzify<span>↗</span></a>${text('span','footer')}${text('a','guide','href="https://github.com/Valvier23/DAX-analytics/tree/main/kit-free"')}</footer>
</body></html>
`;
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Single-URL bilingual landing page generated.');
