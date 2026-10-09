import {parseCSV, metrics, monthlySeries} from './dashboard-core.mjs';

const copy = {
 es:{title:'Tu equipo, en perspectiva.',sample:'Datos de ejemplo · Kit Plus',intro:'Explora la plantilla, los movimientos y la ausencia médica con los datos sintéticos del kit.',summary:'Resumen',workforce:'Plantilla',absence:'Absentismo',year:'Año',department:'Departamento',center:'Centro',all:'Todos',headcount:'Plantilla al cierre',joiners:'Altas del período',leavers:'Bajas del período',average:'Plantilla media diaria',days:'Días de baja médica',episodes:'Episodios',affected:'Personas afectadas',rate:'Tasa de ausencia registrada',evolution:'Evolución mensual de plantilla',medical:'Días médicos por mes',departments:'Plantilla por departamento',centers:'Plantilla por centro',month:'Mes',empty:'No hay registros para esta selección.',loading:'Cargando datos de ejemplo…',failed:'No se han podido cargar los datos. Vuelve a intentarlo.',retry:'Reintentar',method:'Plantilla al último día del período. Baja de empresa = primer día fuera. Días médicos naturales únicos por persona, limitados al empleo y período; tasa = días médicos / días de exposición. Departamento y centro son la instantánea del CSV.',period:'Período',source:'Fuente: personas.csv y bajas_medicas.csv · Datos sintéticos, no datos de tu cuenta.',unknown:'Sin dato'},
 en:{title:'Your team, in perspective.',sample:'Sample data · Plus Kit',intro:'Explore workforce, movements and medical absence using the kit’s synthetic data.',summary:'Overview',workforce:'Workforce',absence:'Absence',year:'Year',department:'Department',center:'Location',all:'All',headcount:'Closing headcount',joiners:'Period joiners',leavers:'Period leavers',average:'Daily average headcount',days:'Medical absence days',episodes:'Episodes',affected:'People affected',rate:'Recorded absence rate',evolution:'Monthly headcount',medical:'Medical days by month',departments:'Headcount by department',centers:'Headcount by location',month:'Month',empty:'No records for this selection.',loading:'Loading sample data…',failed:'Sample data could not be loaded. Please try again.',retry:'Retry',method:'Headcount at the last day of the period. Departure = first day out of employment. Unique calendar medical days per person, clipped to employment and period; rate = medical days / exposure days. Department and location reflect the CSV snapshot.',period:'Period',source:'Source: personas.csv and bajas_medicas.csv · Synthetic data, not your account data.',unknown:'No data'},
};
const el = (tag, text, className) => {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
export function createDashboard(root) {
 let people=[],episodes=[],language='es',visible=false,loaded=false,loading=false,failed=false,area='summary';
 let year='',department='',center='';
 const t=key=>copy[language][key];
 const number=n=>n===null?t('unknown'):new Intl.NumberFormat(language,{maximumFractionDigits:1}).format(n);
 function select(key,values,value,change) {
  const label=el('label',t(key)), input=el('select');input.setAttribute('aria-label',t(key));input.dataset.filter=key;
  for(const [v,name] of values){const option=el('option',name);option.value=v;option.selected=v===value;input.append(option);}
  input.addEventListener('change',()=>{change(input.value);render();});label.append(input);return label;
 }
 function chart(title,rows) {
  const section=el('section',undefined,'analytics-chart');section.append(el('h3',t(title)));
  if(!rows.length){section.append(el('p',t('empty')));return section;}
  const max=Math.max(1,...rows.map(r=>r[1]));
  const list=el('ul');
  for(const [name,value] of rows){const row=el('li');const bar=el('progress');bar.max=max;bar.value=value;bar.setAttribute('aria-label',name+': '+number(value));row.append(el('span',name),bar,el('strong',number(value)));list.append(row);}
  section.append(list);return section;
 }
 function render() {
  root.hidden=!visible;root.replaceChildren();if(!visible)return;
  const heading=el('div',undefined,'analytics-heading');heading.append(el('span',t('sample'),'analytics-badge'),el('h2',t('title')),el('p',t('intro')));root.append(heading);
  if(!loaded){const status=el('p',t(failed?'failed':'loading'));status.setAttribute('role','status');root.append(status);if(failed){const retry=el('button',t('retry'),'pill');retry.type='button';retry.addEventListener('click',load);root.append(retry);}return;}
  const years=[...new Set([...people.map(p=>p.FechaAlta),...people.map(p=>p.FechaBajaEmpresa),...episodes.map(e=>e.FechaInicio),...episodes.map(e=>e.FechaFin)].filter(Boolean).map(d=>d.slice(0,4)))].sort().reverse();
  // Prefer a period represented in both medical and workforce demo data.
  if(!year)year=episodes.map(e=>e.FechaInicio.slice(0,4)).sort().at(-1) || years[0];
  const filters=el('div',undefined,'analytics-filters');
  const options=key=>[['',t('all')],...[...new Set(people.map(p=>p[key]).filter(Boolean))].sort().map(v=>[v,v])];
  filters.append(select('year',years.map(y=>[y,y]),year,v=>year=v),select('department',options('Departamento'),department,v=>department=v),select('center',options('Centro'),center,v=>center=v));root.append(filters);
  const tabs=el('div',undefined,'analytics-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',t('title'));
  for(const key of ['summary','workforce','absence']){const button=el('button',t(key));button.type='button';button.id='analytics-tab-'+key;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(area===key));button.setAttribute('aria-controls','analytics-panel');button.tabIndex=area===key?0:-1;button.addEventListener('click',()=>{area=key;render();root.querySelector('#analytics-tab-'+key).focus();});button.addEventListener('keydown',event=>{const keys=['summary','workforce','absence'];let index=keys.indexOf(area);if(event.key==='ArrowRight')index=(index+1)%3;else if(event.key==='ArrowLeft')index=(index+2)%3;else if(event.key==='Home')index=0;else if(event.key==='End')index=2;else return;event.preventDefault();area=keys[index];render();root.querySelector('#analytics-tab-'+area).focus();});tabs.append(button);}root.append(tabs);
  const selected={start:year+'-01-01',end:year+'-12-31',department,center};
  const m=metrics(people,episodes,selected),series=monthlySeries(people,episodes,selected);
  const panel=el('div');panel.id='analytics-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','analytics-tab-'+area);
  panel.append(el('p',t('period')+': '+selected.start+' → '+selected.end,'analytics-period'));
  const cards=el('div',undefined,'analytics-kpis');
  const fields=area==='absence'?[['days',m.absenceDays],['episodes',m.episodes],['affected',m.affected],['rate',m.absenceRate===null?null:m.absenceRate*100]]:[['headcount',m.headcount],['joiners',m.joiners],['leavers',m.leavers],['average',m.average]];
  for(const [key,value] of fields){const card=el('article');card.append(el('span',t(key)),el('strong',number(value)+(key==='rate'&&value!==null?'%':'')));cards.append(card);}panel.append(cards);
  if(!m.exposure)panel.append(el('p',t('empty')));
  const charts=el('div',undefined,'analytics-charts');
  const months=series.map(r=>[new Intl.DateTimeFormat(language,{month:'short',timeZone:'UTC'}).format(new Date(r.month+'-01T00:00:00Z')),area==='absence'?r.absenceDays:r.headcount]);
  if(area==='workforce')charts.append(chart('departments',m.departments),chart('centers',m.centers));
  else charts.append(chart(area==='absence'?'medical':'evolution',months),chart('departments',m.departments));
  panel.append(charts);root.append(panel,el('p',t('method'),'analytics-note'),el('p',t('source'),'analytics-note'));
 }
 async function load() {
  if(loading||loaded)return;loading=true;failed=false;render();
  try {
   const responses=await Promise.all(['personas','bajas_medicas'].map(name=>fetch('./data/'+name+'.csv')));
   if(responses.some(r=>!r.ok))throw new Error('data unavailable');
   [people,episodes]=await Promise.all(responses.map(async r=>parseCSV(await r.text())));
   if(!people.length)throw new Error('empty data');loaded=true;
  } catch {failed=true;}finally{loading=false;render();}
 }
 return {show(lang){language=lang;visible=true;render();void load();},hide(){visible=false;render();},translate(lang){language=lang;render();}};
}
