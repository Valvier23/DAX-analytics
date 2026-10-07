(() => {
 const header=document.querySelector('nav');
 const measure=()=>document.documentElement.style.setProperty('--header-offset',`${header.getBoundingClientRect().height+20}px`);
 new ResizeObserver(measure).observe(header);measure();
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const id=link.getAttribute('href').slice(1),target=id?document.getElementById(id):document.querySelector('main');
  if(!target)return;
  event.preventDefault();
  const temporary=!target.hasAttribute('tabindex');
  if(temporary){target.setAttribute('tabindex','-1');target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}
  target.focus({preventScroll:true});
  if(id)target.scrollIntoView({block:'start'});else window.scrollTo({top:0});
 });
})();
