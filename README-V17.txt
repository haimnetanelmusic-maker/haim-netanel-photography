HN Photography — V17 Client Galleries (Beta)

מה נוסף:
- admin/client-galleries.html — מערכת גלריות לקוחות עם Supabase Auth
- יצירת אירוע וקישור לקוח פרטי בעל token אקראי
- העלאת Originals + יצירת Preview מוקטן בדפדפן
- רישום אוטומטי לטבלת photos
- client-gallery.html — גלריה פרטית לבחירת תמונות
- שמירת בחירה והגשה סופית
- מנהל רואה כמה תמונות נבחרו ויכול להוריד אותן
- supabase/sql/V17-client-galleries.sql — migration להרשאות Storage + preview_path
- supabase/functions/client-gallery-api/index.ts — Edge Function עבור הלקוח

חשוב לפני שימוש אמיתי:
1. להריץ את supabase/sql/V17-client-galleries.sql ב-SQL Editor.
2. לפרוס Edge Function בשם client-gallery-api מהקוד המצורף.
3. להיכנס ל-/admin/client-galleries.html ולהדביק פעם אחת Publishable/anon key בלבד.
   לעולם לא להדביק Service Role באתר או בדפדפן.
4. לבדוק עם אירוע בדיקה לפני העלאת תמונות לקוחות.

המערכת הקיימת של ניהול תוכן האתר נשמרה כדי לא לשבור את Git Gateway/Netlify Identity.
V17 מוסיף מודול Supabase נפרד ומאובטח לגלריות לקוחות. לאחר שהמודול יציב ניתן לאחד את שתי הכניסות.

הערת הורדות:
כפתור "הורדת הנבחרות" בגרסת Beta יוזם הורדות של הקבצים הנבחרים בזה אחר זה. ZIP שרת אמיתי לכמויות גדולות יתווסף בשלב הבא כדי להימנע מעומס זיכרון בדפדפן.
