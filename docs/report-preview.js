(function(root,factory){const preview=factory();if(typeof module==='object'&&module.exports)module.exports=preview;else root.AxzifyPreview=preview;})(globalThis,()=>{
 const data={start:400,plantilla:[430,510,475,620,710,820],movimientos:[45,95,10,160,105,125],leavers:[15,15,45,15,15,15],ausencias:[6,14,8,22,11,17],departments:[320,240,160,100]};
 function chart(key,months){
  const values=data[key],max=key==='plantilla'?1000:key==='movimientos'?200:30;
  const x=i=>54+i*88,y=v=>192-v/max*156;
  const grid=[0,max/2,max].map(v=>`<line x1="34" y1="${y(v)}" x2="524" y2="${y(v)}" stroke="currentColor" opacity=".13"/><text x="26" y="${y(v)+4}" text-anchor="end" class="axis-label">${v}</text>`).join('');
  let marks;
  if(key==='plantilla'){
   const points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
   marks=`<polygon points="54,192 ${points} 494,192" fill="var(--report-accent)" opacity=".16"/><polyline points="${points}" fill="none" stroke="var(--report-accent)" stroke-width="4" stroke-linejoin="round"/>`+values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="var(--report-accent)"/><text x="${x(i)}" y="${y(v)-13}" text-anchor="middle" class="value-label">${v}</text>`).join('');
  }else marks=values.map((v,i)=>`<rect x="${x(i)-18}" y="${y(v)}" width="${key==='movimientos'?20:36}" height="${192-y(v)}" rx="4" fill="var(--report-accent)"/><text x="${x(i)-(key==='movimientos'?8:0)}" y="${y(v)-8}" text-anchor="middle" class="value-label">${v}</text>`+(key==='movimientos'?`<rect x="${x(i)+5}" y="${y(data.leavers[i])}" width="20" height="${192-y(data.leavers[i])}" rx="4" fill="#e7a389"/>`:'' )).join('');
  return `<svg viewBox="0 0 548 225" aria-hidden="true">${grid}${marks}${months.map((m,i)=>`<text x="${x(i)}" y="217" text-anchor="middle" class="axis-label">${m}</text>`).join('')}</svg>`;
 }
 return {data,chart};
});
