HN Photography V17.6.0 — Unified Admin + Cloudflare/Supabase

מה השתנה:
- /admin/ משתמש ב-Supabase Authentication במקום Netlify Identity.
- דשבורד מאוחד עם ניהול האתר + גלריות לקוחות + אירוע חדש + בחירות שהוגשו + פתיחת האתר.
- שמירת תוכן/העלאת תמונות לאתר עוברת דרך Edge Function מאובטחת בשם site-admin-api.
- GitHub token נשמר רק ב-Supabase Secret, לעולם לא בדפדפן.
- Branch לפרסום: v14-preview. Cloudflare Pages ממשיך Deploy אוטומטי אחרי כל Commit מהניהול.
- Canonical/robots/sitemap עודכנו ל-haimnetanelphoto.co.il.
- _headers עודכן ל-Cloudflare Pages.
- נוספה הקשחת RLS לטבלאות הגלריות.

הגדרה חד-פעמית אחרי העלאת הקבצים:
1. Supabase SQL Editor: הרץ supabase/sql/V17.6-admin-hardening.sql
2. Supabase Edge Functions: Deploy לפונקציה supabase/functions/site-admin-api/index.ts
3. הוסף Secrets לפונקציה/פרויקט:
   GITHUB_TOKEN = Fine-grained GitHub token עם Contents: Read and write רק ל-repository הזה
   GITHUB_OWNER = haimnetanelmusic-maker
   GITHUB_REPO = haim-netanel-photography
   GITHUB_BRANCH = v14-preview
   ADMIN_ALLOWED_ORIGINS = https://haimnetanelphoto.co.il,https://www.haimnetanelphoto.co.il,https://haim-netanel-photography.pages.dev
4. בכניסה הראשונה ל-/admin/ הדבק Publishable/anon key של Supabase פעם אחת (נשמר מקומית בדפדפן).
5. התחבר עם אותו משתמש Supabase Admin שכבר עובד בגלריות הלקוחות.

חשוב: אין לשים GITHUB_TOKEN, service_role או secret key בקובצי האתר.
