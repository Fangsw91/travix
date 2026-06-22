# تعليمات تشغيل Travix — اقرأ هذا أولاً

## ⚠️ السبب الحقيقي لمشكلة "البيانات بتضيع"

كل مرة تحذف مجلد المشروع وتفك zip جديد فوقه، **ملف قاعدة البيانات (`database.sqlite`) يضيع** لأنه ملف محلي بجهازك فقط — لا يوجد بالـ zip ولا بـ GitHub (وهذا مقصود ومتعمد، لأنه يحتوي بياناتك الحقيقية).

## ✅ الحل النهائي: استخدم Git بدل الـ zip

### المرة الأولى فقط (Setup):

```bash
cd C:\laragon\www
git clone https://github.com/Fangsw91/travix.git
cd travix\travix-api
setup.bat
```

هذا السكريبت يعمل تلقائياً:
- `composer install`
- يصنع `.env` (لو غير موجود)
- يصنع `database.sqlite` (لو غير موجود)
- يشغّل `migrate`
- يربط `storage:link`

### بعد ذلك — أي تحديث جديد:

```bash
cd C:\laragon\www\travix\travix-api
update.bat
```

هذا السكريبت:
- يسحب آخر تعديلات الكود من GitHub (`git pull`)
- يحدّث الـ composer packages
- يشغّل migrations جديدة **فقط** (يضيف جداول/أعمدة جديدة، **لا يمسح بياناتك أبداً**)
- **لا يلمس** `.env` أو `database.sqlite` نهائياً

## 🚫 ممنوع من الآن:
- حذف مجلد `travix` بالكامل
- فك أي zip جديد فوق المجلد القديم
- تشغيل `php artisan migrate:fresh` (هذا **يمسح كل البيانات** فعلياً — استخدم `migrate` بس)

## ✅ القاعدة الذهبية:
**مرة واحدة فقط Clone، بعدها دايماً Pull.**
