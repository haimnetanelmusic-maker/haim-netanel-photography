V17.5.0 - Cloudflare Pages redirect-loop fix

Replace the root _redirects file with this version.
Reason: the old rules redirected extensionless URLs (for example /services) back to /services.html, while Cloudflare Pages canonicalizes HTML routes, creating ERR_TOO_MANY_REDIRECTS.

After copying:
1. Commit both files to v14-preview.
2. Push origin.
3. Wait for Cloudflare Pages deployment to finish.
4. Test the main navigation again.
