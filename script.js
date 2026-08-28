(function(){
'use strict';
const btn=document.querySelector('.menu-btn');const links=document.querySelector('.links');
if(btn&&links){
  const closeMenu=()=>{links.classList.remove('open');document.body.classList.remove('mobile-nav-open');btn.setAttribute('aria-expanded','false')};
  const openMenu=()=>{links.classList.add('open');document.body.classList.add('mobile-nav-open');btn.setAttribute('aria-expanded','true')};
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();links.classList.contains('open')?closeMenu():openMenu()});
  links.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
  document.addEventListener('click',e=>{if(links.classList.contains('open')&&!links.contains(e.target)&&!btn.contains(e.target))closeMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  addEventListener('resize',()=>{if(innerWidth>980)closeMenu()},{passive:true});
}
// Netlify Identity deep links: keep auth tokens inside the CMS path.
const hash=location.hash||'';if(/^#(?:invite_token|confirmation_token|recovery_token|access_token|error)=/i.test(hash)&&!location.pathname.includes('/admin')){location.replace('admin/'+hash);return;}
// Hero rotation
const slides=[...document.querySelectorAll('.hero-slide')];if(slides.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){let i=Math.max(0,slides.findIndex(x=>x.classList.contains('active')));setInterval(()=>{slides[i].classList.remove('active');i=(i+1)%slides.length;slides[i].classList.add('active')},7000)}
// Lead form: validation + honeypot + short client cooldown. Server-side anti-abuse remains with FormSubmit/hosting provider.
const leadForm=document.getElementById('leadForm');if(leadForm){const status=document.getElementById('formStatus'),submit=document.getElementById('leadSubmit');leadForm.addEventListener('submit',async e=>{e.preventDefault();if(!leadForm.checkValidity()){leadForm.reportValidity();return}const honey=document.getElementById('website');if(honey&&honey.value)return;const last=Number(sessionStorage.getItem('hn-last-submit')||0);if(Date.now()-last<45000){status.className='form-status error';status.textContent='כבר נשלחה פנייה לפני רגע. אפשר להמתין מעט ולנסות שוב.';return}const phone=(document.getElementById('phone')?.value||'').replace(/\s|-/g,'');if(!/^0?5\d{8}$/.test(phone)){status.className='form-status error';status.textContent='נא להזין מספר טלפון ישראלי תקין.';return}const payload={'שם מלא':document.getElementById('name').value.trim(),'סוג אירוע':document.getElementById('event').value.trim(),'תאריך האירוע':document.getElementById('date').value.trim()||'לא צוין','טלפון':document.getElementById('phone').value.trim(),'הודעה':document.getElementById('message').value.trim()||'ללא הודעה נוספת',_subject:'פנייה חדשה מהאתר - Haim Netanel Photography',_template:'table',_captcha:'true'};submit.disabled=true;submit.textContent='שולח...';status.className='form-status';status.textContent='שולח את הפנייה...';try{const res=await fetch('https://formsubmit.co/ajax/haimnetanelhatzalam@gmail.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});if(!res.ok)throw new Error('submit failed');await res.json();sessionStorage.setItem('hn-last-submit',String(Date.now()));leadForm.reset();status.className='form-status success';status.innerHTML='<strong>תודה, הפנייה התקבלה בהצלחה.</strong><span>אחזור אליכם בהקדם לבדיקת זמינות והמשך תיאום.</span>'}catch(err){status.className='form-status error';status.innerHTML='<strong>השליחה לא הצליחה כרגע.</strong><span>אפשר לנסות שוב בעוד רגע או להתקשר אליי.</span>'}finally{submit.disabled=false;submit.textContent='שליחת פנייה'}})}
})();

// Gallery category experience + lightbox
(()=>{
  const catBtns=[...document.querySelectorAll('[data-gallery-cat]')];
  const shots=[...document.querySelectorAll('.portfolio-shot')];
  const subWrap=document.getElementById('gallerySubfilters');
  if(!catBtns.length||!shots.length||!subWrap)return;
  const title=document.getElementById('galleryTitle'),eyebrow=document.getElementById('galleryEyebrow'),empty=document.getElementById('galleryEmpty');
  const config={
    weddings:{title:'חתונות',eyebrow:'WEDDINGS',subs:[['all','הכול'],['chuppah','חופה'],['ketubah','כתובה'],['ring','טבעת'],['atmosphere','אווירה']]},
    bar:{title:'בר מצווה',eyebrow:'BAR MITZVAH',subs:[['all','הכול'],['torah','עלייה לתורה'],['family','משפחה'],['event','האירוע']]},
    brit:{title:'ברית / בריתה',eyebrow:'BRIT · BABY CELEBRATION',subs:[['all','הכול'],['ceremony','הטקס'],['family','משפחה'],['atmosphere','אווירה']]},
    engagement:{title:'חינה / אירוסין',eyebrow:'HENNA · ENGAGEMENT',subs:[['all','הכול'],['ceremony','טקס'],['decor','עיצוב'],['atmosphere','שמחה']]}
  };
  let current='weddings',sub='all';
  const renderSubs=()=>{subWrap.innerHTML=config[current].subs.map(([k,l],i)=>`<button type="button" data-sub="${k}" class="${i===0?'active':''}">${l}</button>`).join('');sub='all';};
  const apply=()=>{let visible=0;shots.forEach(s=>{const cats=(s.dataset.cat||'').split(/\s+/),subs=(s.dataset.sub||'').split(/\s+/);const show=cats.includes(current)&&(sub==='all'||subs.includes(sub));s.hidden=!show;if(show)visible++;});empty.hidden=visible>0;};
  catBtns.forEach(b=>b.addEventListener('click',()=>{current=b.dataset.galleryCat;catBtns.forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-selected',String(on));});title.textContent=config[current].title;eyebrow.textContent=config[current].eyebrow;renderSubs();apply();document.querySelector('.gallery-toolbar')?.scrollIntoView({behavior:'smooth',block:'start'});}));
  subWrap.addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(!b)return;sub=b.dataset.sub;[...subWrap.querySelectorAll('[data-sub]')].forEach(x=>x.classList.toggle('active',x===b));apply();});
  apply();
  const box=document.getElementById('galleryLightbox'),img=document.getElementById('lightboxImage'),cap=document.getElementById('lightboxCaption');if(!box)return;
  let activeList=[],idx=0;
  const openShot=s=>{activeList=shots.filter(x=>!x.hidden);idx=Math.max(0,activeList.indexOf(s));show();box.hidden=false;box.setAttribute('aria-hidden','false');document.body.classList.add('lightbox-open');};
  const show=()=>{const s=activeList[idx];if(!s)return;img.src=s.dataset.full||s.querySelector('img')?.src||'';img.alt=s.querySelector('img')?.alt||'';cap.textContent=s.querySelector('span')?.textContent||'';};
  shots.forEach(s=>s.addEventListener('click',()=>openShot(s)));
  box.querySelector('.lightbox-close')?.addEventListener('click',close);box.addEventListener('click',e=>{if(e.target===box)close();});
  box.querySelector('.prev')?.addEventListener('click',()=>{idx=(idx-1+activeList.length)%activeList.length;show();});box.querySelector('.next')?.addEventListener('click',()=>{idx=(idx+1)%activeList.length;show();});
  document.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowRight'){idx=(idx-1+activeList.length)%activeList.length;show();}if(e.key==='ArrowLeft'){idx=(idx+1)%activeList.length;show();}});
  function close(){box.hidden=true;box.setAttribute('aria-hidden','true');document.body.classList.remove('lightbox-open');img.src='';}
})();
