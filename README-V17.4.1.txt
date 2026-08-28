V17.4.1 - GitHub Admin Paths Fix

- Admin CSS and JS now use relative paths so /admin/ renders correctly under GitHub Pages project subpaths.
- Admin site link and live preview now point one level up instead of the domain root.
- Netlify Identity / GitHub content editing remains a Netlify-hosted feature. For GitHub Pages testing of V17 client galleries, use admin/client-galleries.html (Supabase Auth).
