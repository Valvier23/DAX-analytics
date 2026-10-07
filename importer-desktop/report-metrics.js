// Same temporal contract as the PBIP measures. Pure JS, also used by snapshots.
const DAY = 86400000;
const day = value => {
  if (!value) return null;
  const n = Date.parse(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(n) ? n / DAY : null;
};
const iso = value => new Date(value * DAY).toISOString().slice(0, 10);
const divide = (a, b) => b ? a / b : null;
const salary = value => String(value ?? '').trim() && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
function calculateMetrics(people, leaves, startDate, endDate) {
  const startDay = day(startDate), endDay = day(endDate);
  if (startDay === null || endDay === null || endDay < startDay) throw new Error('Periodo inválido');
  const days = endDay - startDay + 1;
  const persons = people.map(p => ({ ...p, hire:day(p.FechaAlta), exit:day(p.FechaBajaEmpresa) }));
  const active = (p, d) => p.hire !== null && p.hire <= d && (p.exit === null || p.exit > d);
  const current = persons.filter(p => active(p, endDay));
  const initial = persons.filter(p => active(p, startDay - 1));
  const exposure = persons.reduce((sum, p) => sum + (p.hire === null ? 0 : Math.max(0, Math.min(endDay, p.exit === null ? endDay : p.exit - 1) - Math.max(startDay, p.hire) + 1)), 0);
  const ids = new Map(persons.map(p => [p.PersonaID, p]));
  const intervals = new Map(), episodes = new Set();
  for (const row of leaves) {
    const p = ids.get(row.PersonaID), from = day(row.FechaInicio), to = day(row.FechaFin);
    if (!p || p.hire === null || from === null) continue;
    const a = Math.max(from, startDay, p.hire), b = Math.min(to ?? endDay, endDay, p.exit === null ? endDay : p.exit - 1);
    if (a > b) continue;
    const list = intervals.get(row.PersonaID) || []; list.push([a, b]); intervals.set(row.PersonaID, list);
    episodes.add(row.EpisodioID);
  }
  let absenceDays = 0;
  for (const list of intervals.values()) {
    list.sort((a,b) => a[0]-b[0]); let a = null, b = null;
    for (const [from,to] of list) {
      if (a === null) { a=from; b=to; }
      else if (from <= b+1) b=Math.max(b,to);
      else { absenceDays+=b-a+1; a=from; b=to; }
    }
    if (a !== null) absenceDays+=b-a+1;
  }
  const hires=persons.filter(p => p.hire >= startDay && p.hire <= endDay).length;
  const exits=persons.filter(p => p.exit !== null && p.exit >= startDay && p.exit <= endDay).length;
  const salaries=current.map(p => salary(p.SalarioAnual)).filter(v => v !== null).sort((a,b)=>a-b);
  const mass=salaries.reduce((a,b)=>a+b,0), mid=Math.floor(salaries.length/2);
  return { startDate, endDate, days, start:initial.length, close:current.length, hires, exits, net:hires-exits,
    exposure, average:exposure/days, turnover:divide(exits,exposure/days),
    retention:divide(initial.filter(p=>active(p,endDay)).length,initial.length),
    absenceDays, affected:intervals.size, episodes:episodes.size, absenceRate:divide(absenceDays,exposure),
    salaryCount:salaries.length, salaryCoverage:divide(salaries.length,current.length), salaryMass:salaries.length?mass:null,
    salaryMean:divide(mass,salaries.length), salaryMedian:salaries.length?(salaries.length%2?salaries[mid]:(salaries[mid-1]+salaries[mid])/2):null };
}
function defaultPeriod(people, leaves) {
  const observed=[...people.flatMap(p=>[p.FechaAlta,p.FechaBajaEmpresa]),...leaves.flatMap(p=>[p.FechaInicio,p.FechaFin])].map(day).filter(v=>v!==null);
  const end=observed.length?observed.reduce((a,b)=>Math.max(a,b),-Infinity):day(new Date().toISOString());
  const endDate=iso(end);
  return { startDate:`${endDate.slice(0,4)}-01-01`, endDate };
}
module.exports={ calculateMetrics, defaultPeriod, salary };
