const btn=document.querySelector('.menu-btn');
const links=document.querySelector('.links');
if(btn&&links){btn.setAttribute('aria-expanded', links.classList.contains('open') ? 'true' : 'false');btn.addEventListener('click',()=>{const isOpen=links.classList.toggle('open');btn.setAttribute('aria-expanded',isOpen?'true':'false');});}
const leadForm=document.getElementById('leadForm');
if(leadForm){
  const status=document.getElementById('formStatus');
  const submit=document.getElementById('leadSubmit');
  leadForm.addEventListener('submit',async function(e){
    e.preventDefault();
    if(!leadForm.checkValidity()){
      leadForm.reportValidity();
      return;
    }
    const honey=document.getElementById('website');
    if(honey&&honey.value) return;
    const payload={
      name:document.getElementById('name').value.trim(),
      event:document.getElementById('event').value.trim(),
      date:document.getElementById('date').value.trim()||'לא צוין',
      phone:document.getElementById('phone').value.trim(),
      message:document.getElementById('message').value.trim()||'ללא הודעה נוספת',
      _subject:'פנייה חדשה מהאתר - Haim Netanel Photography',
      _template:'table'
    };
    submit.disabled=true;
    submit.textContent='שולח...';
    status.className='form-status';
    status.textContent='שולח את הפנייה...';
    try{
      const res=await fetch('https://formsubmit.co/ajax/haimnetanelhatzalam@gmail.com',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      if(!res.ok) throw new Error('submit failed');
      await res.json();
      leadForm.reset();
      status.className='form-status success';
      status.innerHTML='<strong>הפנייה נשלחה בהצלחה ✓</strong><span>קיבלתי את הפרטים ואחזור אליכם בהקדם.</span>';
    }catch(err){
      status.className='form-status error';
      status.innerHTML='<strong>השליחה לא הצליחה כרגע.</strong><span>אפשר לנסות שוב בעוד רגע או להתקשר אליי.</span>';
    }finally{
      submit.disabled=false;
      submit.textContent='שליחת פנייה';
    }
  });
}

// V14.3: cinematic hero rotation with a slower, softer cadence.
const heroSlides=[...document.querySelectorAll('.v142-hero .hero-slide')];
if(heroSlides.length>1&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  let heroIndex=heroSlides.findIndex(el=>el.classList.contains('active'));
  if(heroIndex<0) heroIndex=0;
  window.setInterval(()=>{
    heroSlides[heroIndex].classList.remove('active');
    heroIndex=(heroIndex+1)%heroSlides.length;
    heroSlides[heroIndex].classList.add('active');
  },6500);
}
