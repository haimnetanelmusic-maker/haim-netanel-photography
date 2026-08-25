HN Admin Studio V12 — Launch hardening

Added:
- Security response headers and CSP Report-Only (safe audit mode, not blocking yet)
- noindex/noarchive for /admin
- robots.txt + sitemap.xml
- canonical + Open Graph + Twitter metadata on public pages
- ProfessionalService structured data on homepage
- 404 page
- privacy + terms starter pages
- clean redirects for common extensionless URLs
- cache rules for assets/content

Important before final Google launch:
1. Connect a custom domain, then replace netlify.app URLs in sitemap/canonical/OG/config.
2. Add real approved portfolio photos and real customer reviews only.
3. Connect Google Search Console and submit sitemap.
4. Connect analytics only after choosing the provider; update privacy/CSP accordingly.
5. Keep CSP in Report-Only until all admin/site resources are verified, then enforce it.
6. Future private client galleries must use real backend/storage authorization, not public JSON/GitHub.
