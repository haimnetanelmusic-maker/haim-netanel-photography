(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const loginScreen=$('#loginScreen'), app=$('#app'), toast=$('#toast');
  let user=null, content=null, fileSha=null, currentUploadTarget=null;
  const gateway='/ .netlify/git/github'.replace(' ','');
  const contentPath='content/site.json';
  const defaultServices=[
    {title:'צילום אירועים',subtitle:'ברמה גבוהה'},
    {title:'חתונות',subtitle:'תיעוד רגעים מרגשים'},
    {title:'בר/בת מצווה',subtitle:'שמחה בכל פריים'},
    {title:'בריתות',subtitle:'תיעוד באהבה'}
  ];

  function showToast(msg,error=false){toast.textContent=msg;toast.className='toast show'+(error?' error':'');setTimeout(()=>toast.className='toast',3200)}
  function setLoading(v){app.classList.toggle('loading',v)}
  async function authHeaders(){ if(!user) throw new Error('לא מחובר'); const token=await user.jwt(); return {Authorization:`Bearer ${token}`,'Content-Type':'application/json'} }
  function b64ToUtf8(str){ const bin=atob(str.replace(/\n/g,'')); const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes)}
  function utf8ToB64(str){ const bytes=new TextEncoder().encode(str); let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin)}
  async function loadContent(){
    setLoading(true);
    try{
      const headers=await authHeaders();
      const r=await fetch(`${gateway}/contents/${contentPath}?ref=main`,{headers});
      if(!r.ok) throw new Error(`טעינת התוכן נכשלה (${r.status})`);
      const j=await r.json(); fileSha=j.sha; content=JSON.parse(b64ToUtf8(j.content));
      content.services = Array.isArray(content.services)&&content.services.length?content.services:defaultServices.map(x=>({...x}));
      fillForms();
    }catch(e){showToast(e.message,true);console.error(e)} finally{setLoading(false)}
  }
  function fillForms(){
    $('#heroWhite').value=content.hero?.title_white||''; $('#heroGold').value=content.hero?.title_gold||''; $('#heroDescription').value=content.hero?.description||''; $('#heroImage').value=content.hero?.image||''; $('#heroPreview').src=content.hero?.image||'';
    $('#aboutTitle').value=content.about?.title||''; $('#aboutText').value=content.about?.text||'';
    $('#phoneDisplay').value=content.contact?.phone_display||''; $('#phoneE164').value=content.contact?.phone_e164||''; $('#whatsapp').value=content.contact?.whatsapp||'';
    $('#areasText').value=content.areas||''; $('#statGallery').textContent=(content.gallery||[]).length;
    renderGallery(); renderServices();
  }
  function collectForms(){
    content.hero={title_white:$('#heroWhite').value.trim(),title_gold:$('#heroGold').value.trim(),description:$('#heroDescription').value.trim(),image:$('#heroImage').value.trim()};
    content.about={title:$('#aboutTitle').value.trim(),text:$('#aboutText').value.trim()};
    content.contact={phone_display:$('#phoneDisplay').value.trim(),phone_e164:$('#phoneE164').value.trim(),whatsapp:$('#whatsapp').value.trim()};
    content.areas=$('#areasText').value.trim();
    content.services=$$('.service-row').map(row=>({title:row.querySelector('[data-s-title]').value.trim(),subtitle:row.querySelector('[data-s-sub]').value.trim()}));
    content.gallery=$$('.gallery-item').map(item=>({title:item.querySelector('[data-g-title]').value.trim(),image:item.querySelector('[data-g-image]').value.trim(),alt:item.querySelector('[data-g-alt]').value.trim()}));
  }
  async function saveAll(){
    collectForms(); setLoading(true);
    try{
      const headers=await authHeaders(); const body={message:'Update website content from HN Admin',content:utf8ToB64(JSON.stringify(content,null,2)),branch:'main',sha:fileSha};
      const r=await fetch(`${gateway}/contents/${contentPath}`,{method:'PUT',headers,body:JSON.stringify(body)}); if(!r.ok){const t=await r.text();throw new Error(`שמירה נכשלה (${r.status}) ${t.slice(0,120)}`)}
      const j=await r.json(); fileSha=j.content?.sha||fileSha; showToast('השינויים נשמרו. Netlify מעדכן את האתר אוטומטית ✓');
    }catch(e){showToast(e.message,true);console.error(e)} finally{setLoading(false)}
  }
  function renderGallery(){
    const list=$('#galleryList'); list.innerHTML=''; (content.gallery||[]).forEach((g,i)=>{
      const el=document.createElement('div');el.className='gallery-item';el.innerHTML=`<img src="${g.image||''}" alt=""><div class="gallery-item-body"><input data-g-title value="${esc(g.title||'')}" placeholder="כותרת"><input data-g-alt value="${esc(g.alt||'')}" placeholder="טקסט חלופי"><input data-g-image value="${esc(g.image||'')}" placeholder="/assets/..."><div class="gallery-actions"><button class="mini-btn" data-gallery-upload="${i}">החלפת תמונה</button><button class="mini-btn mini-danger" data-remove-gallery="${i}">מחיקה</button></div></div>`; list.appendChild(el);
    });
    $$('[data-remove-gallery]').forEach(b=>b.onclick=()=>{content.gallery.splice(+b.dataset.removeGallery,1);renderGallery()});
    $$('[data-gallery-upload]').forEach(b=>b.onclick=()=>{currentUploadTarget={type:'gallery',index:+b.dataset.galleryUpload};$('#hiddenFile').click()});
  }
  function renderServices(){
    const p=$('#servicesPanel');p.innerHTML='<div class="form-grid">'+content.services.map((s,i)=>`<div class="panel service-row" style="margin:0;padding:16px"><h3 style="margin-top:0;color:#d6ad55">שירות ${i+1}</h3><div class="field"><label>שם השירות</label><input data-s-title value="${esc(s.title)}"></div><br><div class="field"><label>שורת משנה</label><input data-s-sub value="${esc(s.subtitle)}"></div></div>`).join('')+'</div>';
  }
  function esc(v){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
  async function uploadFile(file){
    if(!file) return; setLoading(true);
    try{
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''); const name=`${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`; const path=`assets/uploads/${name}`;
      const arr=new Uint8Array(await file.arrayBuffer()); let bin=''; arr.forEach(b=>bin+=String.fromCharCode(b)); const b64=btoa(bin); const headers=await authHeaders();
      const r=await fetch(`${gateway}/contents/${path}`,{method:'PUT',headers,body:JSON.stringify({message:`Upload image ${name}`,content:b64,branch:'main'})}); if(!r.ok) throw new Error(`העלאת תמונה נכשלה (${r.status})`);
      const publicPath='/'+path;
      if(currentUploadTarget?.type==='hero'){ $('#heroImage').value=publicPath;$('#heroPreview').src=publicPath; }
      if(currentUploadTarget?.type==='gallery'){ content.gallery[currentUploadTarget.index].image=publicPath;renderGallery(); }
      showToast('התמונה הועלתה ל‑GitHub ✓');
    }catch(e){showToast(e.message,true);console.error(e)}finally{setLoading(false);currentUploadTarget=null;$('#hiddenFile').value=''}
  }
  function openSection(name){$$('.section').forEach(s=>s.classList.toggle('active',s.id===`section-${name}`));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.section===name));const labels={dashboard:'לוח בקרה',home:'דף הבית',gallery:'גלריה ותמונות',about:'אודות',services:'שירותים',areas:'אזורי שירות',contact:'יצירת קשר',future:'אזור לקוחות'};$('#pageTitle').textContent=labels[name]||'מרכז ניהול';$('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'})}
  function start(u){user=u;loginScreen.style.display='none';app.classList.add('ready');$('#userEmail').textContent=u.email||'';loadContent()}

  $('#loginBtn').onclick=()=>window.netlifyIdentity?.open('login'); $('#logoutBtn').onclick=()=>window.netlifyIdentity?.logout();
  $('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
  $$('.nav-btn').forEach(b=>b.onclick=()=>openSection(b.dataset.section)); $$('[data-open]').forEach(c=>c.onclick=()=>openSection(c.dataset.open));
  $$('.save-btn').forEach(b=>b.onclick=saveAll); $$('.reload-btn').forEach(b=>b.onclick=loadContent);
  $('#addGallery').onclick=()=>{content.gallery=content.gallery||[];content.gallery.push({title:'קטגוריה חדשה',image:'/assets/hero.jpg',alt:''});renderGallery()};
  $('#heroImage').oninput=e=>$('#heroPreview').src=e.target.value;
  $$('[data-upload-target]').forEach(b=>b.onclick=()=>{currentUploadTarget={type:'hero'};$('#hiddenFile').click()}); $('#hiddenFile').onchange=e=>uploadFile(e.target.files[0]);

  if(window.netlifyIdentity){window.netlifyIdentity.on('init',u=>u&&start(u));window.netlifyIdentity.on('login',u=>{window.netlifyIdentity.close();start(u)});window.netlifyIdentity.on('logout',()=>location.reload());window.netlifyIdentity.init();}
})();
