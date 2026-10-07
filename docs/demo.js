(() => {
 const values=window.AxzifyPreview.data;
 let active='plantilla';
 function render(key){
  active=key;const language=document.documentElement.lang==='en'?'en':'es',copy=window.AxzifyCopy[language],area=copy.areas[key],numbers=values[key];
  document.getElementById('demo-title').textContent=area.title;
  document.getElementById('chart-title').textContent=area.chart;
  document.getElementById('demo-kpis').innerHTML=area.kpis.map(k=>'<div><small>'+k[0]+'</small><b>'+k[1]+'</b><i>'+k[2]+'</i></div>').join('');
  const chart=document.getElementById('demo-chart');
  chart.innerHTML=window.AxzifyPreview.chart(key,copy.shortMonths);
  chart.setAttribute('aria-label',area.chart+': '+numbers.map((v,i)=>copy.months[i]+' '+v+(key==='movimientos'?' / '+values.leavers[i]:'')).join(', '));
  document.getElementById('demo-legend').hidden=key!=='movimientos';
  const hero=document.getElementById('hero-chart');hero.innerHTML=window.AxzifyPreview.chart('plantilla',copy.shortMonths);
  hero.setAttribute('aria-label',copy.previewChart+': '+values.plantilla.map((v,i)=>copy.months[i]+' '+v).join(', '));
  document.getElementById('demo-panel').setAttribute('aria-labelledby','tab-'+key);
  document.querySelectorAll('[data-area]').forEach(b=>{const selected=b.dataset.area===key;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 }
 document.querySelectorAll('[data-area]').forEach((button,i,all)=>{
  button.id='tab-'+button.dataset.area;button.setAttribute('aria-controls','demo-panel');
  button.addEventListener('click',()=>render(button.dataset.area));
  button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(i+1)%all.length;if(event.key==='ArrowLeft')target=(i-1+all.length)%all.length;if(event.key==='Home')target=0;if(event.key==='End')target=all.length-1;if(target!==undefined){event.preventDefault();all[target].focus();render(all[target].dataset.area);}});
 });
 window.AxzifyDemo={refresh:()=>render(active)};render(active);
})();
