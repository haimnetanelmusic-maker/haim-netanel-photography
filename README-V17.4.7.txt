V17.4.7 - Home Mobile Menu Root Fix

- Root cause fixed in index.html: the mobile links container was a <nav>, so generic `header nav` layout rules were accidentally applied to the dropdown itself.
- Home page now uses the same `.links` element type as gallery/inner pages (<div class="links">), so the existing mobile menu CSS behaves consistently.
- No CSS, JavaScript, gallery, Supabase, admin, uploads, or client-selection logic changed.
