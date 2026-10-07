const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const metricsPath = path.resolve(__dirname, '../importer-desktop/report-metrics.js');
test('motor de métricas disponible para informe e insights', () => assert.ok(fs.existsSync(metricsPath)));
if (fs.existsSync(metricsPath)) {
  const { calculateMetrics, defaultPeriod } = require(metricsPath);
  const people = [
    { PersonaID:'A', FechaAlta:'2024-01-01', FechaBajaEmpresa:'2025-01-03', Departamento:'Uno', SalarioAnual:'30000' },
    { PersonaID:'B', FechaAlta:'2025-01-02', Departamento:'Uno', SalarioAnual:'' },
    { PersonaID:'C', FechaAlta:'2024-01-01', Departamento:'Dos', SalarioAnual:'60000' }
  ];
  const leaves = [
    { EpisodioID:'1', PersonaID:'A', FechaInicio:'2024-12-31', FechaFin:'2025-01-05' },
    { EpisodioID:'2', PersonaID:'A', FechaInicio:'2025-01-02', FechaFin:'2025-01-03' },
    { EpisodioID:'3', PersonaID:'B', FechaInicio:'2025-01-01', FechaFin:'' }
  ];
  test('altas y bajas en fronteras reconcilian balance y exposición', () => {
    const m = calculateMetrics(people, leaves, '2025-01-01', '2025-01-03');
    assert.equal(m.start, 2); assert.equal(m.close, 2); assert.equal(m.hires, 1); assert.equal(m.exits, 1);
    assert.equal(m.exposure, 7); assert.equal(m.average, 7/3); assert.equal(m.turnover, 3/7);
    assert.equal(m.start + m.hires - m.exits, m.close);
  });
  test('episodios solapados no duplican días y se recortan al empleo', () => {
    const m = calculateMetrics(people, leaves, '2025-01-01', '2025-01-03');
    assert.equal(m.absenceDays, 4); assert.equal(m.affected, 2); assert.equal(m.episodes, 3);
    assert.equal(m.absenceRate, 4/7);
    const dept = calculateMetrics(people.filter(p => p.Departamento === 'Dos'), leaves, '2025-01-01', '2025-01-03');
    assert.equal(dept.absenceDays, 0); assert.equal(dept.exposure, 3);
  });
  test('salario vacío no es cero y salidas no forman parte de población al cierre', () => {
    const m = calculateMetrics(people, leaves, '2025-01-01', '2025-01-03');
    assert.equal(m.salaryMean, 60000); assert.equal(m.salaryMedian, 60000); assert.equal(m.salaryCoverage, 0.5);
    assert.equal(m.salaryMass, 60000);
  });
  test('sin población las tasas y salarios quedan sin dato', () => {
    const m = calculateMetrics([], [], '2025-01-01', '2025-01-31');
    assert.equal(m.turnover, null); assert.equal(m.absenceRate, null); assert.equal(m.salaryMean, null);
  });
  test('rechaza periodo invertido', () => assert.throws(() => calculateMetrics([], [], '2025-02-01', '2025-01-01')));
  test('ventana predeterminada soporta 100000 personas',()=>assert.deepEqual(defaultPeriod(Array.from({length:100000},()=>({FechaAlta:'2025-01-01',FechaBajaEmpresa:'2026-03-25'})),[]),{startDate:'2026-01-01',endDate:'2026-03-25'}));
}
