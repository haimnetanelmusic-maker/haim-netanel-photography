HN Photography V16 — Signature / Photo-First Rebuild

מטרת הגרסה:
- חזרה לעיצוב שבו הצילום הוא המרכז, לא קופסאות שחורות.
- RTL עברי מלא ומראה שמתאים לשמחות משפחתיות, דתיות וחרדיות בישראל.
- Hero קולנועי עם תמונות אמיתיות: טבעת (ללא פנים), כתובה וחופה.
- קטגוריות: ברית/ה, בר/ת מצווה + עלייה לתורה, אירוסין/חינה, חתונה.
- אזור אודות בהיר בסגנון editorial כדי לשבור את הכהות.
- טופס פנייה למייל נשמר ועבר hardening בסיסי (honeypot, validation, cooldown).
- Security hardening: CSP, anti-framing, nosniff, referrer policy, permissions policy, HSTS ב-Netlify.
- Admin נשמר עם noindex/no-store ו-CSP ייעודי ל-Netlify Identity.
- אין סודות/API keys בקוד.

הערת אבטחה חשובה:
אין אתר שאפשר להבטיח שלא יופל לעולם. ב-GitHub Pages לא ניתן לשלוט בכל HTTP security headers או rate limiting.
לפרודקשן מומלץ: דומיין פרטי + Netlify/Cloudflare, HTTPS, Netlify Identity במצב Invite only, 2FA בחשבון GitHub ובמייל, ו-Cloudflare WAF/Rate Limiting לפי צורך.

Preview: branch v14-preview / GitHub Pages.
Production: main / Netlify לאחר חזרת מכסת deploys.
