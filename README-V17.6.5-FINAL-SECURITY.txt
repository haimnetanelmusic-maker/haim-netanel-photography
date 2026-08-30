HN V17.6.5 FINAL SECURITY PATCH

This patch is based on the uploaded project and the security audit.

Overwrite these files in the project root, preserving folders.
After verifying the changed-file list in GitHub Desktop, delete these two legacy files manually:
  admin/legacy.html
  admin/config.yml

DO NOT commit until the changed-file list is reviewed.

Supabase Edge Functions included here must also be copied/deployed in the Supabase dashboard after the GitHub patch is verified:
  supabase/functions/site-admin-api/index.ts
  supabase/functions/client-gallery-api/index.ts

Security changes:
- production domain replaces old Netlify canonical/OG/security.txt URLs
- client gallery blocked in robots.txt
- obsolete Netlify Identity hash redirect removed
- FormSubmit gallery notification CAPTCHA enabled
- Supabase browser imports pinned to 2.112.4
- stored-content escaping / safer hero DOM construction in cms.js
- generic password-recovery errors (details stay in console)
- noopener added to admin external-site link
- Edge Function origins restricted to explicit allowlists
- site-admin upload restricted to image extensions/MIME and magic-byte verification

This patch intentionally does NOT modify database rows or Storage contents.
