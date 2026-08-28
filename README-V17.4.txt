HN Photography V17.4 – Client Gallery Admin + Mobile Fixes

Main changes:
- Mobile contact-page overflow fix and consistent mobile header.
- Home mobile spacing: lower “צפו בעבודות שלי” CTA and category ribbon slightly.
- Client Galleries admin: search/filter, drag & drop upload, 3-file concurrent upload, automatic lightweight previews, archive/delete, batch signed previews, selected-originals ZIP download.
- Client gallery lightbox uses full-resolution signed URL when available; grid keeps lightweight previews.
- Updated client-gallery-api Edge Function source uses batch signed URLs for speed and returns preview + full image URLs.
- Existing logo and “רגעים אמיתיים. זיכרונות שנשארים.” remain unchanged.

Deployment note:
After copying this package to the repository, redeploy the Supabase Edge Function from supabase/functions/client-gallery-api/index.ts so the live API returns full_url and benefits from batch signed URLs. Keep Verify JWT with legacy secret OFF for client-gallery-api.
