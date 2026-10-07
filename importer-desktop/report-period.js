const fs=require('node:fs'),path=require('node:path');
function periodFilter(startDate,endDate){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||startDate>endDate)throw Error('Periodo inválido');
 return {filter:{Version:2,From:[{Name:'c',Entity:'Calendario',Type:0}],Where:[{Condition:{Between:{Expression:{Column:{Expression:{SourceRef:{Source:'c'}},Property:'Fecha'}},LowerBound:{Literal:{Value:`datetime'${startDate}T00:00:00'`}},UpperBound:{Literal:{Value:`datetime'${endDate}T00:00:00'`}}}}}]}};
}
function applyReportPeriod(projectDir,startDate,endDate){
 const root=path.join(projectDir,'People Analytics DAX Kit.Report','definition','pages');
 const pages=JSON.parse(fs.readFileSync(path.join(root,'pages.json'),'utf8'));
 for(const page of pages.pageOrder){const file=path.join(root,page,'visuals','filterPeriodo','visual.json');if(!fs.existsSync(file))continue;const doc=JSON.parse(fs.readFileSync(file,'utf8'));doc.visual.objects.general=[{properties:{filter:periodFilter(startDate,endDate)}}];Object.assign(doc.visual.objects.data[0].properties,periodDisplay(startDate,endDate));fs.writeFileSync(file,JSON.stringify(doc,null,2));}
}
function periodDisplay(startDate,endDate){periodFilter(startDate,endDate);return {startDate:{expr:{Literal:{Value:`datetime'${startDate}T00:00:00'`}}},endDate:{expr:{Literal:{Value:`datetime'${endDate}T00:00:00'`}}}};}
module.exports={periodFilter,periodDisplay,applyReportPeriod};
