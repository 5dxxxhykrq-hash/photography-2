(() => {
  const images = window.PORTFOLIO_IMAGES || [];
  const byId = Object.fromEntries(images.map(x => [x.id, x]));

  function makeImg(item, eager=false){
    const img=document.createElement('img');
    img.src=item.src;
    img.alt=item.alt || item.title;
    img.loading=eager?'eager':'lazy';
    img.decoding='async';
    img.style.objectPosition=item.pos || '50% 50%';
    return img;
  }

  document.querySelectorAll('[data-image-id]').forEach(el=>{
    const item=byId[el.dataset.imageId];
    if(!item) return;
    const slot=el.querySelector('.image-slot') || el;
    slot.appendChild(makeImg(item,true));
  });

  function card(item,index){
    const fig=document.createElement('figure');
    fig.className='work-card reveal';
    fig.tabIndex=0;
    fig.dataset.index=index;
    const wrap=document.createElement('div');
    wrap.className='img-wrap';
    wrap.appendChild(makeImg(item));
    const cap=document.createElement('figcaption');
    cap.innerHTML=`<span>${String(index+1).padStart(2,'0')} — ${item.title}</span><span class="series">${item.series}</span><span class="year">${item.year}</span>`;
    fig.append(wrap,cap);
    fig.addEventListener('click',()=>openLightbox(index));
    fig.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLightbox(index)}});
    return fig;
  }

  const art=images.filter(x=>x.category==='art');
  const life=images.filter(x=>x.category==='life');
  const ordered=[...art,...life];
  const artGrid=document.getElementById('art-grid');
  const lifeGrid=document.getElementById('life-grid');
  art.forEach(item=>artGrid.appendChild(card(item,ordered.indexOf(item))));
  life.forEach(item=>lifeGrid.appendChild(card(item,ordered.indexOf(item))));

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target)}});
  },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  const lb=document.getElementById('lightbox');
  const lbImg=lb.querySelector('img');
  const lbTitle=lb.querySelector('.lb-title');
  const lbMeta=lb.querySelector('.lb-meta');
  let current=0;
  function renderLightbox(){
    const item=ordered[current];
    lbImg.src=item.src; lbImg.alt=item.alt||item.title;
    lbTitle.textContent=item.title;
    lbMeta.textContent=`${item.series} / ${item.year}`;
  }
  function openLightbox(index){
    current=index; renderLightbox();
    lb.classList.add('open');lb.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeLightbox(){
    lb.classList.remove('open');lb.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  function step(dir){current=(current+dir+ordered.length)%ordered.length;renderLightbox()}
  lb.querySelector('.lightbox-close').addEventListener('click',closeLightbox);
  lb.querySelector('.prev').addEventListener('click',()=>step(-1));
  lb.querySelector('.next').addEventListener('click',()=>step(1));
  lb.addEventListener('click',e=>{if(e.target===lb) closeLightbox()});
  window.addEventListener('keydown',e=>{
    if(!lb.classList.contains('open')) return;
    if(e.key==='Escape')closeLightbox();
    if(e.key==='ArrowLeft')step(-1);
    if(e.key==='ArrowRight')step(1);
  });

  let touchX=null;
  lb.addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});
  lb.addEventListener('touchend',e=>{
    if(touchX===null)return;
    const dx=e.changedTouches[0].clientX-touchX;
    if(Math.abs(dx)>45)step(dx>0?-1:1);
    touchX=null;
  },{passive:true});

  // subtle hero drift without hijacking scroll
  const heroImage=document.querySelector('.hero-image img');
  if(heroImage && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    window.addEventListener('scroll',()=>{
      const y=Math.min(window.scrollY,window.innerHeight);
      heroImage.style.transform=`translateY(${y*.035}px) scale(1.025)`;
    },{passive:true});
  }
})();
