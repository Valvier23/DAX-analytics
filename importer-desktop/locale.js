(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AppLocale=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const en={
  'Importador de Excel':'Excel importer','100 % local':'100% local',
  'Idioma de la app':'App language','Idioma del informe':'Report language',
  'El idioma de la app cambia esta interfaz. El del informe se aplica a los informes nuevos.':'App language changes this interface. Report language applies to newly generated reports.',
  'Arrastra aquí tu archivo Excel':'Drop your Excel file here',
  'También puedes seleccionarlo manualmente. No se sube ningún dato a internet.':'You can also choose a file. No data is uploaded to the internet.',
  'Seleccionar Excel':'Choose Excel','Formatos admitidos: .xlsx y .xls':'Supported formats: .xlsx and .xls',
  'Archivo seleccionado':'Selected file','Cambiar archivo':'Change file','Perfil de mapeo':'Mapping profile',
  'Selecciona un perfil':'Choose a profile','Guardar mapeo':'Save mapping','Estilo de Power BI':'Power BI style',
  'El informe genera tonos claros, oscuros y complementarios a partir de estos dos colores.':'The report creates light, dark and complementary shades from these two colours.',
  'Color principal':'Primary colour','Color secundario':'Secondary colour','Personas':'Employees',
  'Plantilla, altas, bajas y segmentación':'Headcount, joiners, leavers and breakdowns','Hoja de Excel':'Excel worksheet',
  'Bajas médicas':'Medical leave','Episodios de absentismo (opcional)':'Absence episodes (optional)',
  'Los campos con * son obligatorios':'Fields marked * are required',
  'Se generarán los CSV y se abrirá Power BI automáticamente.':'CSV files will be generated and Power BI will open automatically.',
  'Generar informe Plus':'Generate Plus report','Generar informe Demo →':'Generate Demo report →',
  'Selecciona un archivo .xlsx o .xls.':'Choose an .xlsx or .xls file.','Leyendo hojas y cabeceras…':'Reading worksheets and headers…',
  'Excel analizado. Revisa el mapeo antes de continuar.':'Excel analysed. Check the mapping before continuing.',
  '{name}: {rows} filas, {columns} columnas':'{name}: {rows} rows, {columns} columns',
  '{name} ({rows} filas)':'{name} ({rows} rows)',
  'No importar bajas médicas':'Do not import medical leave','No se generará el archivo de bajas médicas.':'No medical leave file will be generated.',
  '— Sin mapear —':'— Not mapped —','Nombre del perfil de mapeo:':'Mapping profile name:',
  'Perfil guardado.':'Profile saved.','Perfil aplicado. Revisa las columnas antes de generar.':'Profile applied. Check the columns before generating.',
  'Generando archivos…':'Generating files…','Power BI se está abriendo.':'Power BI is opening.',
  '{count} fila(s) rechazada(s): consulta filas_rechazadas.csv.':'{count} rejected row(s): see filas_rechazadas.csv.',
  'Páginas añadidas: {pages}.':'Pages added: {pages}.',
  'Listo: {people} personas y {leaves} bajas guardadas en {path}.':'Done: {people} employees and {leaves} leave episodes saved in {path}.',
  'Selecciona el Excel de People Analytics':'Choose a People Analytics Excel file','Archivos Excel':'Excel files',
  'El nombre del perfil no es válido.':'The profile name is invalid.','No se encuentra el archivo seleccionado.':'The selected file could not be found.',
  'No se encontró el proyecto Power BI incluido en el importador.':'The Power BI template bundled with the importer could not be found.',
  'Falta mapear en Personas: {fields}.':'Missing employee mappings: {fields}.',
  'Falta mapear en Bajas médicas: {fields}.':'Missing medical leave mappings: {fields}.',
  'No se pudo crear el proyecto PBIP: {error}':'Could not create the PBIP project: {error}',
  'La carpeta del proyecto debe estar vacía para conservar informes existentes.':'The project folder must be empty to preserve existing reports.',
  'No se encuentra la plantilla Power BI.':'The Power BI template could not be found.',
  'Campo adicional inválido':'Invalid additional field','Página adicional inválida':'Invalid additional page',
  'No se pudo completar la operación.':'The operation could not be completed.',
  'PersonaID':'Employee ID','FechaAlta':'Employment start date','FechaBajaEmpresa':'Employment end date',
  'Departamento':'Department','PuestoTrabajo':'Job title','Centro':'Location','Sexo':'Sex',
  'FechaNacimiento':'Date of birth','SalarioAnual':'Annual salary','EpisodioID':'Episode ID',
  'FechaInicio':'Leave start date','FechaFin':'Leave end date','TipoBaja':'Leave type',
  'Estructura organizativa':'Organisational structure','Talento y desempeño':'Talent and performance',
  'Clima y compromiso':'Workplace climate and engagement','Desarrollo y formación':'Learning and development',
  'Compensación avanzada':'Advanced compensation'
 };
 const language=value=>value==='es'?'es':'en';
 function t(key,lang='en',values={}){return (language(lang)==='en'?(en[key]??key):key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??'{'+name+'}'));}
 function error(message,lang='en'){
  const raw=String(message||'No se pudo completar la operación.').replace(/^Error invoking remote method '[^']+': (?:Error: )?/,'');
  return t(raw,lang);
 }
 return {language,t,error,en};
});
