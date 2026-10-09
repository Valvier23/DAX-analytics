const DAY = 86400000;
function day(value) {
  const n = Date.parse(value + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(n) || new Date(n).toISOString().slice(0,10) !== value) throw new Error('Invalid date');
  return n / DAY;
}
const iso = n => new Date(n * DAY).toISOString().slice(0,10);
export function parseCSV(source) {
  const rows = []; let row = [], field = '', quoted = false;
  source = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i+1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(field); field = '';
      if (c !== ',') { if (row.some(v => v !== '')) rows.push(row); row = []; if(c === '\r' && source[i+1] === '\n') i++; }
    } else field += c;
  }
  if (quoted) throw new Error('Invalid CSV');
  if (field || row.length) {row.push(field);rows.push(row);}
  const headers = rows.shift() || [];
  return rows.map(values => Object.fromEntries(headers.map((h,i)=>[h,values[i] || ''])));
}
export function metrics(people, episodes, filters) {
  const start = day(filters.start), end = day(filters.end);
  if (end < start) throw new Error('Invalid period');
  const selected = people.filter(p => (!filters.department || p.Departamento === filters.department) && (!filters.center || p.Centro === filters.center));
  const intervals = new Map(selected.map(p => [p.PersonaID,{p, first:day(p.FechaAlta), last:p.FechaBajaEmpresa ? day(p.FechaBajaEmpresa)-1 : Infinity}]));
  const active = date => [...intervals.values()].filter(p=>p.first<=date && p.last>=date);
  const atClose = active(end);
  let exposure = 0;
  for (const p of intervals.values()) exposure += Math.max(0,Math.min(end,p.last)-Math.max(start,p.first)+1);
  const absent = new Map(); let episodeCount = 0;
  for (const e of episodes) {
    const p = intervals.get(e.PersonaID); if (!p) continue;
    const first = Math.max(start,p.first,day(e.FechaInicio)), last = Math.min(end,p.last,e.FechaFin ? day(e.FechaFin) : end);
    if (last < first) continue;
    episodeCount++;
    if(!absent.has(e.PersonaID)) absent.set(e.PersonaID, new Set());
    for(let d=first; d<=last; d++) absent.get(e.PersonaID).add(d);
  }
  const absenceDays = [...absent.values()].reduce((sum,days)=>sum+days.size,0);
  const group = key => Object.entries(atClose.reduce((out,{p})=>{const k=p[key] || '—';out[k]=(out[k]||0)+1;return out;},{})).sort((a,b)=>b[1]-a[1]);
  return {initial:active(start-1).length, headcount:atClose.length,
    joiners:[...intervals.values()].filter(p=>p.first>=start&&p.first<=end).length,
    leavers:[...intervals.values()].filter(p=>p.last+1>=start&&p.last+1<=end).length,
    exposure,average:exposure/(end-start+1),absenceDays,episodes:episodeCount,affected:absent.size,
    absenceRate:episodes.length && exposure ? absenceDays/exposure : null,
    departments:group('Departamento'),centers:group('Centro')};
}
export function monthlySeries(people, episodes, filters) {
  const start=day(filters.start),end=day(filters.end);if(end<start)throw new Error('Invalid period');
  const cursor=new Date(start*DAY);cursor.setUTCDate(1);const result=[];
  while(cursor.getTime()/DAY<=end){
    const first=cursor.getTime()/DAY;cursor.setUTCMonth(cursor.getUTCMonth()+1);
    result.push({month:iso(first).slice(0,7),...metrics(people,episodes,{...filters,start:iso(Math.max(first,start)),end:iso(Math.min(cursor.getTime()/DAY-1,end))})});
  }
  return result;
}
