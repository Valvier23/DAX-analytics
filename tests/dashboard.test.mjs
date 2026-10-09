import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV, metrics, monthlySeries} from '../docs/dashboard-core.mjs';

const people = [
 {PersonaID:'a',FechaAlta:'2024-01-01',FechaBajaEmpresa:'',Departamento:'Ventas',Centro:'Madrid'},
 {PersonaID:'b',FechaAlta:'2025-01-02',FechaBajaEmpresa:'2025-01-04',Departamento:'Ventas',Centro:'Madrid'},
 {PersonaID:'c',FechaAlta:'2024-01-01',FechaBajaEmpresa:'',Departamento:'Legal',Centro:'Barcelona'},
];
const episodes = [
 {EpisodioID:'1',PersonaID:'a',FechaInicio:'2024-12-30',FechaFin:'2025-01-03'},
 {EpisodioID:'2',PersonaID:'a',FechaInicio:'2025-01-02',FechaFin:''},
 {EpisodioID:'3',PersonaID:'b',FechaInicio:'2025-01-03',FechaFin:'2025-01-07'},
 {EpisodioID:'4',PersonaID:'unknown',FechaInicio:'2025-01-01',FechaFin:''},
];
test('CSV handles BOM, quoted commas and escaped quotes',()=>{
 assert.deepEqual(parseCSV('\uFEFFA,B\r\n"one,two","say ""hi"""\r\n'),[{A:'one,two',B:'say "hi"'}]);
});
test('employment boundaries reconcile movements and daily exposure',()=>{
 const m=metrics(people,episodes,{start:'2025-01-01',end:'2025-01-05'});
 assert.equal(m.initial,2);assert.equal(m.headcount,2);assert.equal(m.joiners,1);assert.equal(m.leavers,1);assert.equal(m.exposure,12);assert.equal(m.average,2.4);
 assert.equal(m.initial+m.joiners-m.leavers,m.headcount);
});
test('absence days deduplicate overlap and stop at departure; filters affect all metrics',()=>{
 const m=metrics(people,episodes,{start:'2025-01-01',end:'2025-01-05',department:'Ventas',center:'Madrid'});
 assert.equal(m.absenceDays,6);assert.equal(m.episodes,3);assert.equal(m.affected,2);assert.equal(m.exposure,7);assert.equal(m.absenceRate,6/7);
 assert.equal(metrics(people,[],{start:'2025-01-01',end:'2025-01-05'}).absenceRate,null);
 assert.equal(metrics(people,episodes,{start:'2025-01-01',end:'2025-01-05',department:'Missing'}).headcount,0);
});
test('invalid periods fail and monthly series respects partial months',()=>{
 assert.throws(()=>metrics(people,episodes,{start:'2025-02-30',end:'2025-03-01'}));
 assert.throws(()=>metrics(people,episodes,{start:'2025-02-01',end:'2025-01-01'}));
 const rows=monthlySeries(people,episodes,{start:'2025-01-03',end:'2025-02-02'});
 assert.equal(rows.length,2);assert.equal(rows[0].joiners,0);assert.equal(rows[0].leavers,1);assert.equal(rows[0].month,'2025-01');
});
