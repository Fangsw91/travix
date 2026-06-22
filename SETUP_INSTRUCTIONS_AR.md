# تعليمات تشغيل Travix — قاعدة بيانات MySQL حقيقية

## ✅ الوضع الجديد

المشروع الآن يستخدم **MySQL** (نفس قاعدة البيانات اللي يستخدمها Laragon افتراضياً)، **مش SQLite**. هذا يعني:

- كل المستخدمين والبيانات تظهر مباشرة في **phpMyAdmin** تحت database اسمها `travix`
- البيانات **لا تضيع أبداً** حتى لو حذفت مجلد المشروع كامل وأعدت تنزيله، لأن MySQL منفصل بالكامل عن ملفات الكود

## 🚀 التشغيل من الصفر (مرة واحدة فقط)

```bash
cd C:\laragon\www
git clone https://github.com/Fangsw91/travix.git
cd travix\travix-api
setup.bat
```

هذا السكريبت تلقائياً:
1. ينشئ `.env`
2. ينشئ database اسمها `travix` داخل MySQL
3. يثبّت composer packages
4. يشغّل migrations (ينشئ كل الجداول)
5. يربط storage (لصور التوثيق والاستلام)

**تأكد Laragon شغّال (Apache + MySQL) قبل ما تشغّل `setup.bat`.**

## 🔁 أي تحديث جديد بعد اليوم

```bash
cd C:\laragon\www\travix\travix-api
update.bat
```

يسحب آخر كود من GitHub + يشغّل migrations جديدة فقط (يضيف، لا يحذف بياناتك).

## 👀 شوف بياناتك

افتح phpMyAdmin من Laragon → database **`travix`** → جدول **`users`** → بتشوف كل من سجّل بالموقع لحظياً.

## 🚫 ممنوع
- `php artisan migrate:fresh` — هذا يمسح كل الجداول والبيانات
- حذف database `travix` من phpMyAdmin يدوياً بدون قصد

## 👤 إنشاء حساب أدمن
```bash
php artisan admin:create admin@travix.com travix Admin
```
