const $ = (s) => document.querySelector(s);
const token = new URLSearchParams(location.search).get('token');
const api = 'https://tjnjlximolahbbalpxgq.supabase.co/functions/v1/client-gallery-api';

let photos = [];
let selected = new Set();
let event = null;
let selection = null;
let filter = 'all';
let lightboxIndex = -1;
let zoom = 1;
let touchStartX = null;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[m]));

async function call(action, extra = {}) {
  const response = await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...extra })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || 'Request failed');
  return json;
}

async function boot() {
  if (!token) return fail('חסר קישור גישה.');
  try {
    const data = await call('get_gallery');
    event = data.event;
    photos = data.photos || [];
    selection = data.selection || { status: 'in_progress', selected_photo_ids: [] };
    selected = new Set(selection.selected_photo_ids || []);
    $('#cgTitle').textContent = event.title || 'הגלריה הפרטית שלי';
    $('#cgMeta').textContent = [
      event.event_type,
      event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('he-IL') : ''
    ].filter(Boolean).join(' · ');
    if (selection.notes) $('#cgNotes').value = selection.notes;
    $('#cgLoading').hidden = true;
    $('#cgApp').hidden = false;
    render();
  } catch (error) { fail(error.message); }
}

function fail(message) {
  $('#cgLoading').hidden = true;
  $('#cgError').hidden = false;
  $('#cgErrorText').textContent = message;
}

function currentVisiblePhotos() {
  return filter === 'selected' ? photos.filter((photo) => selected.has(photo.id)) : photos;
}

function render() {
  const max = event?.max_selections;
  const submitted = selection?.status === 'submitted';
  $('#cgSelected').textContent = selected.size;
  $('#cgLimit').textContent = max ? `מתוך ${max} אפשריות` : 'תמונות נבחרו';
  $('#cgStatus').textContent = submitted ? 'הבחירה נשלחה לצלם ✓' : 'לחצו על תמונה לצפייה גדולה ולבחירה';
  $('#cgSubmitBtn').disabled = submitted;
  $('#cgSubmitBtn').textContent = submitted ? 'הבחירה נשלחה' : 'אישור ושליחת הבחירה';

  const visible = currentVisiblePhotos();
  $('#cgGrid').innerHTML = visible.map((photo) => {
    const isSelected = selected.has(photo.id);
    return `<button class="cg-photo ${isSelected ? 'selected' : ''}" data-id="${esc(photo.id)}" type="button" aria-label="פתיחת ${esc(photo.filename || 'תמונה')} בתצוגה גדולה">
      <img src="${esc(photo.image_url)}" alt="${esc(photo.filename || 'תמונה מהאירוע')}" loading="lazy" decoding="async">
      <span class="cg-check" role="button" aria-label="${isSelected ? 'ביטול בחירה' : 'בחירת תמונה'}">${isSelected ? '✓' : '♡'}</span>
    </button>`;
  }).join('');

  document.querySelectorAll('.cg-photo').forEach((button) => {
    button.addEventListener('click', (evt) => {
      const id = button.dataset.id;
      if (evt.target.closest('.cg-check')) {
        evt.stopPropagation();
        toggle(id);
      } else {
        openLightbox(id);
      }
    });
  });
  syncLightboxSelection();
}

async function toggle(id) {
  if (selection?.status === 'submitted') return;
  const wasSelected = selected.has(id);
  const wantsSelect = !wasSelected;
  if (wantsSelect && event.max_selections && selected.size >= event.max_selections) {
    $('#cgSubmitMsg').textContent = `אפשר לבחור עד ${event.max_selections} תמונות.`;
    return;
  }
  if (wantsSelect) selected.add(id); else selected.delete(id);
  $('#cgSubmitMsg').textContent = 'שומר…';
  render();
  try {
    await call('save_selection', { photo_ids: [...selected] });
    selection = { ...(selection || {}), status: 'in_progress', selected_photo_ids: [...selected] };
    $('#cgSubmitMsg').textContent = 'הבחירה נשמרה ✓';
  } catch (error) {
    if (wasSelected) selected.add(id); else selected.delete(id);
    render();
    $('#cgSubmitMsg').textContent = 'שמירת הבחירה נכשלה. נסו שוב.';
  }
}

function openLightbox(id) {
  lightboxIndex = photos.findIndex((p) => p.id === id);
  if (lightboxIndex < 0) return;
  zoom = 1;
  updateLightbox();
  $('#cgLightbox').hidden = false;
  $('#cgLightbox').setAttribute('aria-hidden', 'false');
  document.body.classList.add('cg-no-scroll');
  $('#cgLbClose').focus();
  preloadAdjacent();
}

function closeLightbox() {
  $('#cgLightbox').hidden = true;
  $('#cgLightbox').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cg-no-scroll');
  zoom = 1;
}

function updateLightbox() {
  const p = photos[lightboxIndex];
  if (!p) return;
  const img = $('#cgLbImage');
  img.src = p.image_url;
  img.alt = p.filename || 'תמונה מהאירוע';
  $('#cgLbFilename').textContent = p.filename || '';
  $('#cgLbCount').textContent = `${lightboxIndex + 1} / ${photos.length}`;
  applyZoom();
  syncLightboxSelection();
}

function syncLightboxSelection() {
  if (lightboxIndex < 0 || !photos[lightboxIndex]) return;
  const isSelected = selected.has(photos[lightboxIndex].id);
  const btn = $('#cgLbSelect');
  btn.classList.toggle('selected', isSelected);
  btn.textContent = isSelected ? '✓ התמונה נבחרה' : '♡ בחירת התמונה';
  btn.disabled = selection?.status === 'submitted';
}

function stepLightbox(delta) {
  if (!photos.length) return;
  lightboxIndex = (lightboxIndex + delta + photos.length) % photos.length;
  zoom = 1;
  updateLightbox();
  $('#cgLbStage').scrollTo({ top: 0, left: 0 });
  preloadAdjacent();
}

function setZoom(next) {
  zoom = Math.min(4, Math.max(1, Math.round(next * 100) / 100));
  applyZoom();
}

function applyZoom() {
  const lb = $('#cgLightbox');
  const img = $('#cgLbImage');
  lb.classList.toggle('is-zoomed', zoom > 1);
  if (zoom === 1) {
    img.style.width = '';
    img.style.maxWidth = '100%';
  } else {
    img.style.maxWidth = 'none';
    img.style.width = `${zoom * 100}%`;
  }
  $('#cgLbZoomLabel').textContent = `${Math.round(zoom * 100)}%`;
}

function preloadAdjacent() {
  if (photos.length < 2) return;
  [-1, 1].forEach((delta) => {
    const idx = (lightboxIndex + delta + photos.length) % photos.length;
    const image = new Image();
    image.src = photos[idx].image_url;
  });
}

$('#cgLbClose').addEventListener('click', closeLightbox);
$('#cgLbPrev').addEventListener('click', () => stepLightbox(-1));
$('#cgLbNext').addEventListener('click', () => stepLightbox(1));
$('#cgLbZoomIn').addEventListener('click', () => setZoom(zoom + .5));
$('#cgLbZoomOut').addEventListener('click', () => setZoom(zoom - .5));
$('#cgLbZoom').addEventListener('click', () => setZoom(zoom >= 2 ? 1 : 2));
$('#cgLbImage').addEventListener('dblclick', () => setZoom(zoom >= 2 ? 1 : 2));
$('#cgLbSelect').addEventListener('click', async () => {
  const p = photos[lightboxIndex];
  if (p) await toggle(p.id);
  syncLightboxSelection();
});
$('#cgLightbox').addEventListener('click', (evt) => {
  if (evt.target === $('#cgLightbox')) closeLightbox();
});
$('#cgLbStage').addEventListener('touchstart', (evt) => { touchStartX = evt.changedTouches[0]?.clientX ?? null; }, { passive: true });
$('#cgLbStage').addEventListener('touchend', (evt) => {
  if (touchStartX == null || zoom > 1) return;
  const dx = (evt.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
  touchStartX = null;
  if (Math.abs(dx) > 55) stepLightbox(dx > 0 ? -1 : 1);
}, { passive: true });

document.addEventListener('keydown', (evt) => {
  if ($('#cgLightbox').hidden) return;
  if (evt.key === 'Escape') closeLightbox();
  else if (evt.key === 'ArrowRight') stepLightbox(-1);
  else if (evt.key === 'ArrowLeft') stepLightbox(1);
  else if (evt.key === '+' || evt.key === '=') setZoom(zoom + .5);
  else if (evt.key === '-') setZoom(zoom - .5);
});

document.querySelectorAll('.cg-filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.cg-filter').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    render();
  });
});

$('#cgSubmitBtn').addEventListener('click', async () => {
  if (!selected.size) { $('#cgSubmitMsg').textContent = 'בחרו לפחות תמונה אחת.'; return; }
  if (!confirm(`לשלוח לצלם את הבחירה של ${selected.size} תמונות?`)) return;
  $('#cgSubmitBtn').disabled = true;
  $('#cgSubmitBtn').textContent = 'שולח…';
  try {
    const result = await call('submit_selection', { notes: $('#cgNotes').value.trim() });
    selection = { ...(selection || {}), status: 'submitted', submitted_at: result.submitted_at || new Date().toISOString(), selected_photo_ids: [...selected] };
    try {
      const adminUrl = new URL('admin/client-galleries.html', location.href);
      adminUrl.searchParams.set('event', event.id);
      await fetch('https://formsubmit.co/ajax/haimnetanelhatzalam@gmail.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          'אירוע': event.title,
          'מספר תמונות שנבחרו': selected.size,
          'שם הלקוח': $('#cgName').value.trim() || event.client_name || 'לא צוין',
          'אימייל לקוח': $('#cgEmail').value.trim() || 'לא צוין',
          'הערה': $('#cgNotes').value.trim() || 'ללא הערה',
          'קישור לניהול הבחירה': adminUrl.href,
          _subject: `בחירת תמונות חדשה - ${event.title}`, _template: 'table', _captcha: 'false'
        })
      });
    } catch (_) {}
    $('#cgSubmitMsg').textContent = 'תודה! הבחירה התקבלה בהצלחה ✓';
    render();
  } catch (error) {
    $('#cgSubmitBtn').disabled = false;
    $('#cgSubmitBtn').textContent = 'אישור ושליחת הבחירה';
    $('#cgSubmitMsg').textContent = error.message === 'Selection has already been submitted' ? 'הבחירה כבר נשלחה לצלם.' : 'השליחה נכשלה. נסו שוב.';
  }
});

boot();
