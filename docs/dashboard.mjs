import {parseCSV, metrics, monthlySeries, departmentBreakdown, annualComparison} from './dashboard-core.mjs?v=20261009-v2';
import {node as el, timeChart, rankingChart, compositionChart, sparkline} from './dashboard-charts.mjs?v=20261009-v2';

const copy = {
 es: {
  title:'People Analytics', sample:'Datos de ejemplo', workspace:'ESPACIO DE ANÁLISIS', summary:'Resumen', workforce:'Plantilla', absence:'Absentismo',
  summaryTitle:'Resumen ejecutivo', workforceTitle:'Tu plantilla, al detalle', absenceTitle:'Ausencia médica',
  summaryIntro:'Una visión de tu equipo, sus movimientos y su evolución.', workforceIntro:'Entiende cómo se distribuye la plantilla y dónde se concentra.', absenceIntro:'Analiza los días registrados y la exposición de cada departamento.',
  year:'Año', department:'Departamento', center:'Centro', all:'Todos', reset:'Restablecer', filters:'Filtrar análisis',
  headcount:'Plantilla al cierre', joiners:'Altas del período', leavers:'Bajas del período', average:'Plantilla media diaria', turnover:'Rotación del período',
  days:'Días de baja médica', episodes:'Episodios imputables', affected:'Personas afectadas', rate:'Tasa de ausencia registrada',
  evolution:'Evolución de plantilla', evolutionSub:'Personas activas al último día de cada mes', movements:'Altas y bajas', movementsSub:'Movimientos registrados durante el período',
  medical:'Días de baja por mes', medicalSub:'Días naturales únicos por persona; un solapamiento cuenta una vez',
  departments:'Distribución por departamento', departmentSub:'Plantilla al cierre · selecciona un área para filtrar', centers:'Distribución por centro', centerSub:'Personas activas al cierre del período',
  composition:'Composición por sexo', compositionSub:'Campo informado en la instantánea del archivo', women:'Mujeres', men:'Hombres', unreported:'Sin informar', people:'personas',
  absenceRanking:'Días médicos por departamento', absenceRankingSub:'Volumen de días registrados · selecciona un área para filtrar',
  absenceRateRanking:'Tasa médica por departamento', absenceRateRankingSub:'Días médicos / exposición persona-día · no anualizada',
  detail:'Detalle por departamento', detailSub:'Volumen, movimientos y tasas en un mismo contexto', share:'Peso en plantilla', net:'Cambio neto', medicalRate:'Tasa médica',
  insightTitle:'Lectura del período', insightHeadcount:'personas al cierre', insightNet:'Variación neta', insightMedical:'de exposición con ausencia registrada', insightAffected:'Personas con días médicos',
  largest:'Mayor departamento', concentration:'de la plantilla seleccionada', reported:'Fuente disponible', medicalAvailable:'Hay episodios médicos en el archivo',
  viewData:'Ver datos del gráfico', methodology:'Cómo se calculan los indicadores', noComparison:'Sin comparación disponible', compared:'vs.', percentagePoints:'pp',
  empty:'No hay registros para esta selección.', loading:'Preparando tu espacio de análisis…', failed:'No se han podido cargar los datos. Vuelve a intentarlo.', retry:'Reintentar',
  method:'Plantilla al cierre; la baja de empresa es el primer día fuera. Rotación = bajas / plantilla media diaria. Los días médicos son naturales, únicos por persona y limitados al empleo y al período. La tasa médica divide esos días entre la exposición persona/día. No son días laborables ni horas perdidas.',
  coverage:'Las comparativas usan el año natural anterior y los datos registrados. Un cero no acredita ausencia real ni cobertura completa. Departamento, centro y sexo son la instantánea del CSV; no reconstruyen cambios históricos.',
  source:'Kit Plus · 1.000 personas y 540 episodios sintéticos. Fuente: personas.csv y bajas_medicas.csv. No son datos de tu cuenta.',
  snapshot:'Corte', unknown:'Sin dato', calendarDays:'días naturales', annual:'Año natural', closing:'al cierre del período', recorded:'registros del período',
 },
 en: {
  title:'People Analytics', sample:'Sample data', workspace:'ANALYTICS WORKSPACE', summary:'Overview', workforce:'Workforce', absence:'Absence',
  summaryTitle:'Executive overview', workforceTitle:'Your workforce, in detail', absenceTitle:'Medical absence',
  summaryIntro:'A view of your team, its movements and its evolution.', workforceIntro:'Understand how your workforce is distributed and where it is concentrated.', absenceIntro:'Explore recorded days and exposure across departments.',
  year:'Year', department:'Department', center:'Location', all:'All', reset:'Reset filters', filters:'Filter analytics',
  headcount:'Closing headcount', joiners:'Period joiners', leavers:'Period leavers', average:'Daily average headcount', turnover:'Period turnover',
  days:'Medical absence days', episodes:'Attributable episodes', affected:'People affected', rate:'Recorded absence rate',
  evolution:'Workforce evolution', evolutionSub:'Active people at the last day of each month', movements:'Joiners and leavers', movementsSub:'Recorded movements during the period',
  medical:'Medical days by month', medicalSub:'Unique calendar days per person; overlaps count once',
  departments:'Workforce by department', departmentSub:'Closing headcount · select a department to filter', centers:'Workforce by location', centerSub:'Active people at the end of the period',
  composition:'Composition by sex', compositionSub:'Reported field in the current file snapshot', women:'Women', men:'Men', unreported:'Not reported', people:'people',
  absenceRanking:'Medical days by department', absenceRankingSub:'Recorded day volume · select a department to filter',
  absenceRateRanking:'Medical rate by department', absenceRateRankingSub:'Medical days / person-day exposure · not annualized',
  detail:'Department detail', detailSub:'Volume, movements and rates in the same context', share:'Workforce share', net:'Net change', medicalRate:'Medical rate',
  insightTitle:'Period at a glance', insightHeadcount:'people at period end', insightNet:'Net change', insightMedical:'of exposure with recorded absence', insightAffected:'People with medical days',
  largest:'Largest department', concentration:'of the selected workforce', reported:'Source available', medicalAvailable:'Medical episodes exist in the file',
  viewData:'View chart data', methodology:'How the indicators are calculated', noComparison:'No comparison available', compared:'vs.', percentagePoints:'pp',
  empty:'No records for this selection.', loading:'Preparing your analytics workspace…', failed:'Sample data could not be loaded. Please try again.', retry:'Retry',
  method:'Closing headcount; departure is the first day out of employment. Turnover = leavers / daily average headcount. Medical days are unique calendar days per person, clipped to employment and period. The medical rate divides those days by person-day exposure. These are not working days or lost hours.',
  coverage:'Comparisons use the previous calendar year and recorded data. Zero does not establish zero real absence or complete coverage. Department, location and sex reflect the CSV snapshot; historical changes are not reconstructed.',
  source:'Plus Kit · 1,000 synthetic people and 540 episodes. Source: personas.csv and bajas_medicas.csv. These are not your account data.',
  snapshot:'As of', unknown:'No data', calendarDays:'calendar days', annual:'Calendar year', closing:'at period end', recorded:'period records',
 },
};

export function createDashboard(root) {
 let people=[], episodes=[], language='es', visible=false, loaded=false, loading=false, failed=false, area='summary';
 const breakpoint=()=>[window.innerWidth<650,window.innerWidth<1000].join(':');
 let year='', department='', center='', size=breakpoint();
 const t=key=>copy[language][key];
 const number=n=>n===null || !Number.isFinite(n)?t('unknown'):new Intl.NumberFormat(language,{maximumFractionDigits:1}).format(n);
 const percent=n=>n===null?t('unknown'):number(n*100)+'%';
 const signed=n=>(n>0?'+':'')+number(n);
 function filter(key,values,value,change) {
  const label=el('label'), caption=el('span',t(key)), select=el('select');select.setAttribute('aria-label',t(key));select.dataset.filter=key;
  for(const [v,name] of values){const option=el('option',name);option.value=v;option.selected=v===value;select.append(option);}
  select.addEventListener('change',()=>{change(select.value);render();root.querySelector('[data-filter='+key+']')?.focus();});label.append(caption,select);return label;
 }
 function card(key,value,previous,comparable,values,rate=false) {
  const box=el('article',undefined,'kpi-card');box.append(el('span',t(key),'kpi-label'));
  const main=el('div',undefined,'kpi-main');main.append(el('strong',rate?percent(value):number(value),value===null?'kpi-no-data':undefined),sparkline(values));box.append(main);
  const change=el('div',undefined,'kpi-comparison');
  if(comparable && value!==null && previous!==null){
   const delta=rate?(value-previous)*100:value-previous;
   change.append(el('span',signed(delta)+(rate?' '+t('percentagePoints'):''),'delta '+(delta===0?'delta-flat':'delta-change')),el('span',t('compared')+' '+(Number(year)-1)));
  }else change.append(el('span',t('noComparison')));
  box.append(change);return box;
 }
 function chartCard(title,subtitle,content,wide=false,extra) {
  const box=el('section',undefined,'analytics-chart'+(wide?' chart-wide':''));
  const head=el('div',undefined,'chart-heading');head.append(el('h3',t(title)),el('p',t(subtitle)));if(extra)head.append(extra);box.append(head,content);return box;
 }
 function table(rows,medical=false) {
  const section=el('section',undefined,'department-detail');section.append(el('h3',t('detail')),el('p',t('detailSub')));
  const wrap=el('div',undefined,'table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',t('detail'));
  const table=el('table',undefined,'department-table');const caption=el('caption',t('detail')+' · '+year,'visually-hidden');table.append(caption);
  const columns=medical?['department','days','affected','episodes','medicalRate']:['department','headcount','share','joiners','leavers','turnover'];
  const thead=el('thead'),head=el('tr');columns.forEach(key=>{const th=el('th',t(key));th.scope='col';head.append(th);});thead.append(head);table.append(thead);
  const tbody=el('tbody');
  for(const r of rows){const row=el('tr');const name=el('th');name.scope='row';const button=el('button',r.name);button.type='button';button.dataset.department=r.name;button.addEventListener('click',()=>selectDepartment(r.name));name.append(button);row.append(name);
   const values=medical?[number(r.absenceDays),number(r.affected),number(r.episodes),percent(r.absenceRate)]:[number(r.headcount),percent(r.share),number(r.joiners),number(r.leavers),percent(r.turnover)];values.forEach(v=>row.append(el('td',v)));tbody.append(row);
  }
  table.append(tbody);wrap.append(table);section.append(wrap);if(!rows.length)section.append(el('p',t('empty'),'chart-empty'));return section;
 }
 function selectDepartment(name){department=name==='—'?'':name;render();root.querySelector('[data-filter=department]')?.focus();}
 function sidebar(){
  const rail=el('aside',undefined,'workspace-rail');rail.append(el('div',t('workspace'),'rail-eyebrow'));
  const tabs=el('div',undefined,'analytics-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',t('title'));tabs.setAttribute('aria-orientation',window.innerWidth<1000?'horizontal':'vertical');
  const keys=['summary','workforce','absence'];
  keys.forEach((key,i)=>{const button=el('button');button.type='button';button.id='analytics-tab-'+key;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(area===key));button.setAttribute('aria-controls','analytics-panel');button.tabIndex=area===key?0:-1;button.append(el('span','0'+(i+1),'tab-number'),el('span',t(key)));
   const activate=k=>{area=k;render();root.querySelector('#analytics-tab-'+k)?.focus();};button.addEventListener('click',()=>activate(key));button.addEventListener('keydown',event=>{let n=keys.indexOf(area);if(['ArrowRight','ArrowDown'].includes(event.key))n=(n+1)%3;else if(['ArrowLeft','ArrowUp'].includes(event.key))n=(n+2)%3;else if(event.key==='Home')n=0;else if(event.key==='End')n=2;else return;event.preventDefault();activate(keys[n]);});tabs.append(button);
  });rail.append(tabs);
  const note=el('div',undefined,'rail-source');note.append(el('span','KIT PLUS','rail-eyebrow'),el('b',t('title')),el('p',t('sample')));rail.append(note);return rail;
 }
 function render(){
  root.hidden=!visible;root.replaceChildren();if(!visible)return;
  if(!loaded){const loadingBox=el('div',undefined,'analytics-loading');loadingBox.append(el('h2',t('title')));const status=el('p',t(failed?'failed':'loading'));status.setAttribute('role','status');loadingBox.append(status);if(failed){const retry=el('button',t('retry'),'pill primary');retry.type='button';retry.addEventListener('click',load);loadingBox.append(retry);}root.append(loadingBox);return;}
  const dates=[...people.map(p=>p.FechaAlta),...people.map(p=>p.FechaBajaEmpresa),...episodes.map(e=>e.FechaInicio),...episodes.map(e=>e.FechaFin)].filter(Boolean);
  const datedYears=dates.map(d=>Number(d.slice(0,4))),min=Math.min(...datedYears),max=Math.max(...datedYears);
  const years=Array.from({length:max-min+1},(_,i)=>String(max-i));
  if(!year)year=episodes.map(e=>e.FechaInicio.slice(0,4)).sort().at(-1)||years[0];
  const selected={start:year+'-01-01',end:year+'-12-31',department,center};
  const comparison=annualComparison(people,episodes,selected),m=comparison.current,previous=comparison.previous;
  const series=monthlySeries(people,episodes,selected),departments=departmentBreakdown(people,episodes,selected);
  const labels=series.map(r=>new Intl.DateTimeFormat(language,{month:'short',timeZone:'UTC'}).format(new Date(r.month+'-01T00:00:00Z')));
  const workspace=el('div',undefined,'analytics-workspace'),main=el('div',undefined,'workspace-main');workspace.append(sidebar(),main);root.append(workspace);
  const heading=el('header',undefined,'analytics-heading');const intro=el('div');intro.append(el('span',t('title'),'analytics-eyebrow'),el('h2',t(area+'Title')),el('p',t(area+'Intro')));
  const badge=el('div',undefined,'analytics-badge');badge.append(el('span',undefined,'sample-dot'),el('span',t('sample')));heading.append(intro,badge);main.append(heading);
  const filters=el('div',undefined,'analytics-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label',t('filters'));
  const options=key=>[['',t('all')],...[...new Set(people.map(p=>p[key]).filter(Boolean))].sort().map(v=>[v,v])];
  filters.append(filter('year',years.map(y=>[y,y]),year,v=>year=v),filter('department',options('Departamento'),department,v=>department=v),filter('center',options('Centro'),center,v=>center=v));
  const reset=el('button',t('reset'),'filter-reset');reset.type='button';reset.dataset.resetFilters='';reset.disabled=!department&&!center;reset.addEventListener('click',()=>{department='';center='';render();root.querySelector('[data-filter=year]')?.focus();});filters.append(reset);main.append(filters);
  const panel=el('div');panel.id='analytics-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','analytics-tab-'+area);main.append(panel);
  const strip=el('div',undefined,'analytics-period');strip.append(el('span',t('annual')+' '+year),el('span',t('snapshot')+' · '+new Intl.DateTimeFormat(language,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(selected.end+'T00:00:00Z'))));panel.append(strip);
  const cards=el('div',undefined,'analytics-kpis');
  const fields=area==='absence'?[['days','absenceDays'],['episodes','episodes'],['affected','affected'],['rate','absenceRate',true]]:area==='workforce'?[['headcount','headcount'],['average','average'],['turnover','turnover',true],['joiners','joiners']]:[['headcount','headcount'],['joiners','joiners'],['leavers','leavers'],['rate','absenceRate',true]];
  fields.forEach(([label,key,rate])=>cards.append(card(label,m[key],previous[key],key==='absenceRate'||['absenceDays','episodes','affected'].includes(key)?comparison.medicalComparable:comparison.workforceComparable,series.map(r=>r[key]??0),rate)));panel.append(cards);
  const insights=el('div',undefined,'period-reading');
  if(area==='absence'){
   insights.append(el('span',t('insightTitle'),'reading-label'),el('b',percent(m.absenceRate)),el('span',t('insightMedical')),el('span',t('insightAffected')+': '+number(m.affected),'reading-secondary'));
  }else{
   insights.append(el('span',t('insightTitle'),'reading-label'),el('b',number(m.headcount)),el('span',t('insightHeadcount')),el('span',t('insightNet')+': '+signed(m.joiners-m.leavers),'reading-secondary'));
  }panel.append(insights);
  if(!m.exposure)panel.append(el('p',t('empty'),'analytics-empty'));
  const charts=el('div',undefined,'analytics-charts');
  const time=(title,data,kind='line')=>timeChart({title:t(title),labels,series:data,kind,language,dataLabel:t('viewData'),wide:title==='evolution'||title==='medical'});
  const rank=rows=>rankingChart({rows:rows.map(([name,value])=>({name,value})),language,onSelect:selectDepartment,empty:t('empty'),percentage:true});
  if(area==='summary'){
   charts.append(chartCard('evolution','evolutionSub',time('evolution',[{label:t('headcount'),values:series.map(r=>r.headcount)}]),true,el('span',number(m.headcount)+' '+t('people'),'chart-head-value')));
   charts.append(chartCard('movements','movementsSub',time('movements',[{label:t('joiners'),values:series.map(r=>r.joiners)},{label:t('leavers'),values:series.map(r=>r.leavers)}],'bar')));
   charts.append(chartCard('departments','departmentSub',rank(m.departments)));
  }else if(area==='workforce'){
   charts.append(chartCard('departments','departmentSub',rank(m.departments),true));
   const composition=m.composition.map(([key,value])=>[key==='F'?t('women'):key==='M'?t('men'):key==='—'?t('unreported'):key,value]);
   charts.append(chartCard('composition','compositionSub',compositionChart({rows:composition,language,title:t('composition'),totalLabel:t('people'),empty:t('empty')})));
   charts.append(chartCard('centers','centerSub',rankingChart({rows:m.centers.map(([name,value])=>({name,value})),language,empty:t('empty'),percentage:true})));
  }else{
   charts.append(chartCard('medical','medicalSub',time('medical',[{label:t('days'),values:series.map(r=>r.absenceDays)}],'bar'),true));
   const rows=[...departments].sort((a,b)=>b.absenceDays-a.absenceDays).map(r=>({name:r.name,value:r.absenceDays}));
   charts.append(chartCard('absenceRanking','absenceRankingSub',rankingChart({rows,language,onSelect:selectDepartment,empty:t('empty')})));
   const rateRows=departments.filter(r=>r.absenceRate!==null).sort((a,b)=>b.absenceRate-a.absenceRate).map(r=>({name:r.name,value:r.absenceRate*100}));
   charts.append(chartCard('absenceRateRanking','absenceRateRankingSub',rankingChart({rows:rateRows,language,onSelect:selectDepartment,empty:t('empty'),suffix:'%'})));
  }
  panel.append(charts);if(area!=='summary')panel.append(table(departments,area==='absence'));
  const methodology=el('details',undefined,'analytics-methodology');methodology.append(el('summary',t('methodology')),el('p',t('method')),el('p',t('coverage')));main.append(methodology);
  main.append(el('p',t('source'),'analytics-source'));
 }
 async function load(){
  if(loading||loaded)return;loading=true;failed=false;render();
  try{const responses=await Promise.all(['personas','bajas_medicas'].map(name=>fetch('./data/'+name+'.csv')));if(responses.some(r=>!r.ok))throw new Error('Data unavailable');
   [people,episodes]=await Promise.all(responses.map(async r=>parseCSV(await r.text())));if(!people.length)throw new Error('Empty data');loaded=true;
  }catch{failed=true;}finally{loading=false;render();}
 }
 window.addEventListener('resize',()=>{const next=breakpoint();if(next!==size){size=next;if(visible&&loaded)render();}});
 return {show(lang){language=lang;visible=true;render();void load();},hide(){visible=false;render();},translate(lang){language=lang;render();}};
}
