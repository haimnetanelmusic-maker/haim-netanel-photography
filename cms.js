(async function(){
  try {
    const res = await fetch('/content/site.json', {cache:'no-store'});
    if(!res.ok) return;
    const c = await res.json();

    const byId = id => document.getElementById(id);
    const setText = (id, val) => { const el=byId(id); if(el && val!=null) el.textContent=val; };

    setText('heroTitleWhite', c.hero?.title_white || c.hero_title_white);
    setText('heroTitleGold', c.hero?.title_gold || c.hero_title_gold);
    setText('heroDescription', c.hero?.description || c.hero_description);
    setText('aboutPreviewTitle', c.about?.title || c.about_title);
    setText('aboutPreviewText', c.about?.text || c.about_text);
    setText('areasText', c.areas);

    const heroImage = c.hero?.image || c.hero_image;
    if(heroImage){
      const photo = document.querySelector('.lux-hero-photo');
      if(photo) photo.style.backgroundImage = `url("${heroImage}")`;
    }

    const phoneDisplay = c.contact?.phone_display || c.phone_display || '052-308-4940';
    const phoneE164 = c.contact?.phone_e164 || c.phone_e164 || '+972523084940';
    const wa = c.contact?.whatsapp || c.whatsapp || '972523084940';
    document.querySelectorAll('[data-phone-display]').forEach(el=>el.textContent=phoneDisplay);
    document.querySelectorAll('a[data-phone-link]').forEach(el=>el.href='tel:'+phoneE164);
    document.querySelectorAll('a[data-wa-link]').forEach(el=>{
      const text = el.dataset.waText ? ('?text='+encodeURIComponent(el.dataset.waText)) : '';
      el.href='https://wa.me/'+wa+text;
    });

    if (Array.isArray(c.services)) {
      document.querySelectorAll('.lux-service-item').forEach((el, i) => {
        const svc = c.services[i]; if (!svc) return;
        const strong = el.querySelector('strong'); const small = el.querySelector('small');
        if (strong && svc.title) strong.textContent = svc.title;
        if (small && svc.subtitle) small.textContent = svc.subtitle;
      });
    }

    const grid = document.getElementById('homeGalleryGrid');
    if(grid && Array.isArray(c.gallery)){
      grid.innerHTML='';
      c.gallery.slice(0,8).forEach(item=>{
        const a=document.createElement('a');
        a.className='thumb'; a.href='gallery.html';
        const img=document.createElement('img');
        img.src=item.image; img.alt=item.alt||item.title||''; img.loading='lazy';
        const span=document.createElement('span'); span.textContent=item.title||'';
        a.append(img,span); grid.appendChild(a);
      });
    }
  } catch(e){ console.warn('CMS content load skipped', e); }
})();
