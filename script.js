const btn=document.querySelector('.menu-btn');
const links=document.querySelector('.links');
if(btn&&links){btn.setAttribute('aria-expanded', links.classList.contains('open') ? 'true' : 'false');btn.addEventListener('click',()=>{const isOpen=links.classList.toggle('open');btn.setAttribute('aria-expanded',isOpen?'true':'false');});}
const leadForm=document.getElementById('leadForm');
if(leadForm){leadForm.addEventListener('submit',function(e){e.preventDefault();const name=document.getElementById('name').value.trim();const event=document.getElementById('event').value.trim();const date=document.getElementById('date').value.trim();const phone=document.getElementById('phone').value.trim();const msg=document.getElementById('message').value.trim();const text=`שלום חיים, שמי ${name}. אני מעוניין/ת בצילום ${event}${date?` בתאריך ${date}`:''}.${phone?`\nטלפון לחזרה: ${phone}`:''}${msg?`\n${msg}`:''}`;window.open('https://wa.me/972523084940?text='+encodeURIComponent(text),'_blank');});}
