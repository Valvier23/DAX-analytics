import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KitDownloadButton } from "@/components/kit-download-button";

const measures = [
  ["Plantilla al cierre", "Stock correcto en cualquier fecha"], ["Plantilla media", "Promedio diario, no media de meses"],
  ["Altas y bajas", "Movimientos dentro del periodo"], ["Rotación", "Bajas sobre plantilla media"],
  ["Personas con baja médica", "Solapamiento real de episodios"], ["Días de baja", "Días imputados dentro del filtro"],
];

export default function Home() {
  return <main>
    <nav className="nav shell"><a className="brand" href="#top"><span>PA</span> DAX Kit</a><a className="nav-link" href="#medidas">Contenido</a></nav>
    <section id="top" className="hero shell">
      <div className="eyebrow"><span /> People Analytics · Power BI</div>
      <h1>Las métricas de RR. HH.<br/><em>bien calculadas.</em></h1>
      <p className="lead">Un kit de medidas DAX para resolver plantilla, rotación y absentismo sin duplicar personas ni romper los filtros temporales.</p>
      <div className="actions"><KitDownloadButton/><a className="text-link" href="#pro">Ver la versión Pro <ArrowRight /></a></div>
      <div className="trust"><span><Check/> Power BI de 2 páginas incluido</span><span><Check/> Importador Excel con menú</span><span><ShieldCheck/> Procesamiento local</span></div>
    </section>
    <section className="problem-band"><div className="shell problem-grid"><p className="section-label">EL PROBLEMA</p><div><h2>Un DISTINCTCOUNT no basta.</h2><p>Una persona puede estar activa al inicio, causar baja durante el mes o tener un episodio médico que cruza varios periodos. El contexto temporal cambia el cálculo.</p></div><div className="formula-card"><code>FechaInicio ≤ FinPeriodo<br/>AND<br/>(FechaFin ≥ InicioPeriodo<br/>OR FechaFin = BLANK)</code><small>Patrón de solapamiento temporal incluido</small></div></div></section>
    <section id="medidas" className="measures shell"><div className="section-heading"><p className="section-label">KIT GRATUITO</p><h2>Diez medidas. Tres problemas resueltos.</h2></div><div className="measure-list">{measures.map(([title, desc], i) => <article key={title}><span>{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{desc}</p></article>)}</div><div className="included"><h3>También incluye</h3><ul><li><Check/> Proyecto Power BI de 2 páginas</li><li><Check/> Aplicación de escritorio sin navegador</li><li><Check/> Selector y drag & drop de Excel</li><li><Check/> Fechas y puestos normalizados</li><li><Check/> Mapeo manual de cabeceras</li></ul></div></section>
    <section id="pro" className="pro-section"><div className="shell pro-grid"><div><p className="section-label light">PRÓXIMA VERSIÓN</p><h2>People Analytics<br/>DAX Kit Pro</h2><p>La versión completa se construirá si la demanda lo justifica. Incluirá 30+ medidas, rolling 12 meses, coste del absentismo, tramos, comparativas y un PBIX demostrativo.</p></div><div className="price-card"><span>PRECIO DE VALIDACIÓN</span><strong>19 €</strong><p>Pago único · actualizaciones iniciales incluidas</p><Button asChild variant="secondary" size="lg"><a href="mailto:xavier24val@gmail.com?subject=Interés%20en%20People%20Analytics%20DAX%20Kit%20Pro&body=Me%20interesa%20la%20versión%20Pro.%20Mi%20principal%20problema%20es%3A%20">Registrar interés <ArrowRight/></a></Button><small>No se cobra todavía. Este botón valida intención.</small></div></div></section>
    <footer className="shell"><span>People Analytics DAX Kit</span><p>Producto independiente. No afiliado a Microsoft.</p></footer>
  </main>;
}
