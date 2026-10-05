# Task Manager | سامانه مدیریت تسک

[فارسی](#راهنمای-فارسی) · [English](#english-guide)

سامانه‌ای فارسی و واکنش‌گرا برای مدیریت تسک، تیم، زمان‌بندی، گردش‌کار و اعلان‌های سازمانی.

A Persian-first, responsive platform for organizational task, team, schedule, workflow, and notification management.

---

## راهنمای فارسی

### معرفی

Task Manager یک برنامه تحت وب برای مدیریت کارهای تیمی و سازمانی است. برنامه با Next.js، TypeScript، Prisma و PostgreSQL ساخته شده و رابط کاربری، API، worker اعلان و ربات بله را در یک مخزن نگه می‌دارد.

قابلیت‌های اصلی:

- احراز هویت امن با رمز عبور hash‌شده، session قابل ابطال و الزام تغییر رمز اولیه
- کنترل دسترسی مبتنی بر نقش و permission برای مدیر کل، مدیر، سرپرست و کارشناس
- ساخت، تخصیص، پیگیری، تکمیل، حذف نرم و بازیابی تسک
- زمان‌بندی تسک، الگوهای تکرارشونده، ارجاع نامه و تأیید/رد ارجاع
- گردش‌کار وابسته بین تسک‌ها و نمایش Kanban، فهرست و گزارش‌ها
- ورود گروهی داده از Excel
- اعلان‌های مبتنی بر outbox با retry محدود، ثبت نتیجه و جلوگیری از ارسال تکراری
- اتصال امن حساب بله با کد یک‌بارمصرف و webhook اعتبارسنجی‌شده
- مشاهده تسک‌ها و ساخت تسک تأییدمحور از طریق ربات بله
- دستیار هوشمند بله برای گفت‌وگو و تبدیل متن طبیعی به پیش‌نویس تسک
- پشتیبانی از تاریخ جلالی در رابط و منطق زمانی متمرکز بر `Asia/Tehran`

> دستیار هوشمند فقط پیش‌نویس می‌سازد. انتخاب مسئول، بازبینی و تأیید نهایی توسط کاربر دارای مجوز `task:create` الزامی است و خروجی AI مستقیماً تسک ایجاد نمی‌کند.

### پشته فنی

| بخش | فناوری |
| --- | --- |
| رابط و API | Next.js 16 (App Router)، React 19، TypeScript |
| رابط کاربری | Tailwind CSS، shadcn/ui، TanStack Query/Table |
| اعتبارسنجی | Zod |
| پایگاه داده | PostgreSQL، Prisma 6 و Prisma Migrate |
| تست | Vitest |
| اجرای production | Next.js standalone، PM2، Caddy |
| پردازش پس‌زمینه | worker اعلان و worker فرمان‌های بله |

### معماری اجرا

سه process در [`ecosystem.config.cjs`](ecosystem.config.cjs) تعریف شده‌اند:

- `taskmanager`: وب‌اپ و API روی پورت پیش‌فرض `8502`
- `taskmanager-notification-worker`: پردازش outbox و retry اعلان‌ها
- `taskmanager-bale-command-worker`: دریافت و پردازش فرمان‌های بله در حالت worker

عملیات اصلی تسک به ارسال پیام وابسته نیست. رویداد اعلان در دیتابیس ثبت می‌شود و worker آن را جداگانه تحویل می‌دهد؛ بنابراین خرابی سرویس پیام‌رسان باعث rollback عملیات تسک نمی‌شود.

### پیش‌نیازها

- Node.js 22
- npm و lockfile موجود در مخزن
- PostgreSQL
- PM2 و Caddy فقط برای استقرار production

### راه‌اندازی توسعه

```bash
git clone git@github.com:smnshzh/taskmanager.git
cd taskmanager
npm ci
cp .env.example .env
```

مقادیر ضروری `.env` را تنظیم کنید و سپس:

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

برنامه به‌طور پیش‌فرض در نشانی زیر در دسترس است:

```text
http://localhost:8502
```

برای ایجاد داده اولیه در محیط توسعه، پس از بررسی محتوای seed اجرا کنید:

```bash
npm run db:seed
```

### متغیرهای محیطی

فایل [`.env.example`](.env.example) مرجع نام متغیرها است. فایل `.env`، tokenها، secretها و اطلاعات production را commit نکنید.

| متغیر | کاربرد | وضعیت |
| --- | --- | --- |
| `DATABASE_URL` | رشته اتصال PostgreSQL | ضروری |
| `SESSION_SECRET` | secret تصادفی و قوی برای session | ضروری |
| `SESSION_COOKIE_NAME` | نام cookie نشست | اختیاری |
| `APP_BASE_URL` | نشانی عمومی برنامه برای لینک اعلان‌ها | ضروری در production |
| `APP_TIMEZONE` | منطقه زمانی کسب‌وکار؛ مقدار استاندارد `Asia/Tehran` | توصیه‌شده |
| `PORT` | پورت وب؛ پیش‌فرض `8502` | اختیاری |
| `BALE_BOT_TOKEN` | توکن ربات بله | ضروری برای بله |
| `BALE_WEBHOOK_SECRET` | secret اعتبارسنجی webhook بله | ضروری برای webhook |
| `BALE_WEBHOOK_URL` | نشانی HTTPS عمومی webhook | ضروری برای webhook |
| `ACCOUNT_LINK_SECRET` | secret مستقل برای hash کد اتصال حساب | ضروری برای اتصال حساب |
| `ASSISTANT_API_URL` | endpoint امن HTTPS سرویس دستیار | اختیاری |
| `NOTIFICATION_*` | تنظیم batch، polling و retry worker اعلان | اختیاری |

برای secretها از مقادیر تصادفی قوی و سامانه مدیریت secret محیط استقرار استفاده کنید. مقدار واقعی هیچ secret نباید در issue، log، README یا commit قرار گیرد.

### دستورات کیفیت و تست

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

اجرای یک‌جای همه بررسی‌ها:

```bash
npm run verify
```

### پایگاه داده و migration

در توسعه:

```bash
npm run db:migrate
```

در production فقط migrationهای commit‌شده را اجرا کنید:

```bash
npm run db:migrate:deploy
```

از `prisma db push` به‌عنوان جایگزین migration در production استفاده نکنید. پیش از migration، backup و مسیر rollback را بررسی کنید.

### استقرار production

فرمان رسمی استقرار:

```bash
bash scripts/deploy.sh
```

این اسکریپت به‌ترتیب dependencyهای lock‌شده را نصب می‌کند، Prisma Client را می‌سازد، lint/typecheck/test/build را اجرا می‌کند، assetهای standalone را آماده می‌کند، migrationها را اعمال می‌کند، processهای PM2 را reload می‌کند و `/api/health` را می‌سنجد. اگر استقرار پس از build شکست بخورد، build قبلی بازیابی می‌شود.

بررسی دستی سلامت:

```bash
bash scripts/health-check.sh
curl --fail http://127.0.0.1:8502/api/health
pm2 list
```

فایل‌های عملیاتی مهم:

- [`scripts/build-production.sh`](scripts/build-production.sh)
- [`scripts/migrate-production.sh`](scripts/migrate-production.sh)
- [`scripts/deploy.sh`](scripts/deploy.sh)
- [`scripts/health-check.sh`](scripts/health-check.sh)
- [`ecosystem.config.cjs`](ecosystem.config.cjs)

### ربات بله و دستیار هوشمند

پس از اتصال حساب، کاربر می‌تواند از فرمان‌هایی مانند `/menu`، `/mytasks`، `/today`، `/overdue` و `/ask متن` استفاده کند. ساخت تسک از متن طبیعی فقط یک پیش‌نویس شامل عنوان، مهلت و اولویت تولید می‌کند؛ مسئول و تأیید نهایی همچنان در wizard انتخاب می‌شوند.

سرویس دستیار باید فقط روی HTTPS در دسترس باشد و پاسخ زیر را برگرداند:

```json
{
  "ok": true,
  "reply": "پاسخ دستیار"
}
```

متن خصوصی عادی می‌تواند به دستیار ارسال شود؛ در گروه فقط `/ask` به‌صورت صریح ارسال می‌شود. محتوای پیام در audit ذخیره نمی‌شود و فقط طول پیام، نتیجه و کد خطا ثبت می‌گردد. رمز عبور، secret یا داده شخصی حساس را برای سرویس خارجی ارسال نکنید.

راهنمای کامل راه‌اندازی: [`docs/bale-bot.md`](docs/bale-bot.md)

### امنیت

- مجوزها در سرور کنترل می‌شوند و مخفی‌بودن دکمه در frontend معیار دسترسی نیست.
- رمز عبور خام و token خام session در دیتابیس ذخیره نمی‌شود.
- تلاش‌های ناموفق ورود rate-limit و audit می‌شوند.
- کد اتصال پیام‌رسان یک‌بارمصرف، زمان‌دار و hash‌شده است.
- webhook بدون secret معتبر پذیرفته نمی‌شود.
- token ربات، رمز دیتابیس، session secret و فایل `.env` نباید وارد Git شوند.
- قبل از انتشار عمومی، Caddy/TLS، cookie امن، محدودیت شبکه و سیاست backup را متناسب با محیط بررسی کنید.

### مستندات

- [راهنمای ربات بله](docs/bale-bot.md)
- [تصمیم معماری outbox اعلان](docs/adr/0001-notification-outbox.md)
- [راهنمای معماری feature تسک](src/features/tasks/README.md)

### مشارکت

1. branch کوتاه و متمرکز بسازید.
2. تغییر را همراه تست و migration لازم پیاده‌سازی کنید.
3. `npm run verify` را اجرا کنید.
4. تغییر رفتار، اثر امنیتی و مسیر rollback را در Pull Request توضیح دهید.

این مخزن در حال حاضر فایل مجوز مستقلی ندارد؛ پیش از توزیع یا استفاده تجاری، وضعیت مجوز را با مالک مخزن هماهنگ کنید.

---

## English guide

### Overview

Task Manager is a web application for organizational and team work management. It uses Next.js, TypeScript, Prisma, and PostgreSQL, with the UI, APIs, notification worker, and Bale bot maintained in one repository.

Core capabilities:

- Secure authentication with hashed passwords, revocable sessions, and forced initial password changes
- Role- and permission-based access for super administrators, managers, supervisors, and specialists
- Task creation, assignment, tracking, completion, soft deletion, and restoration
- Task schedules, recurring templates, letter referrals, and referral approval/rejection
- Task dependency workflows plus Kanban, list, and reporting views
- Excel bulk import
- Database-backed notification outbox with finite retries, delivery logs, and deduplication
- Secure Bale account linking through one-time codes and a validated webhook
- Task summaries and confirmation-gated task creation through the Bale bot
- Bale AI assistant chat and natural-language-to-task-draft conversion
- Jalali presentation support with business-time calculations centered on `Asia/Tehran`

> The AI assistant creates drafts only. A user with `task:create` permission must choose an assignee, review the draft, and confirm it. AI output never creates a task directly.

### Technology stack

| Area | Technology |
| --- | --- |
| UI and API | Next.js 16 (App Router), React 19, TypeScript |
| UI libraries | Tailwind CSS, shadcn/ui, TanStack Query/Table |
| Validation | Zod |
| Database | PostgreSQL, Prisma 6, Prisma Migrate |
| Testing | Vitest |
| Production runtime | Next.js standalone, PM2, Caddy |
| Background processing | Notification worker and Bale command worker |

### Runtime architecture

[`ecosystem.config.cjs`](ecosystem.config.cjs) defines three processes:

- `taskmanager`: web application and API on port `8502` by default
- `taskmanager-notification-worker`: outbox delivery and notification retries
- `taskmanager-bale-command-worker`: Bale command processing in worker mode

Task transactions do not wait for messaging providers. Notification events are persisted and delivered separately, so provider failures do not roll back task operations.

### Requirements

- Node.js 22
- npm with the committed lockfile
- PostgreSQL
- PM2 and Caddy for the documented production deployment

### Local development

```bash
git clone git@github.com:smnshzh/taskmanager.git
cd taskmanager
npm ci
cp .env.example .env
```

Set the required `.env` values, then run:

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

The default local URL is:

```text
http://localhost:8502
```

After reviewing the seed contents, optional development data can be created with:

```bash
npm run db:seed
```

### Environment variables

[`.env.example`](.env.example) is the source of truth for variable names. Never commit `.env`, provider tokens, secrets, or production credentials.

| Variable | Purpose | Requirement |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Strong random session secret | Required |
| `SESSION_COOKIE_NAME` | Session cookie name | Optional |
| `APP_BASE_URL` | Public application URL used in notifications | Required in production |
| `APP_TIMEZONE` | Business timezone; use `Asia/Tehran` | Recommended |
| `PORT` | Web port; defaults to `8502` | Optional |
| `BALE_BOT_TOKEN` | Bale bot token | Required for Bale |
| `BALE_WEBHOOK_SECRET` | Bale webhook validation secret | Required for webhook mode |
| `BALE_WEBHOOK_URL` | Public HTTPS webhook URL | Required for webhook mode |
| `ACCOUNT_LINK_SECRET` | Independent secret used to hash account-link codes | Required for account linking |
| `ASSISTANT_API_URL` | Secure HTTPS assistant endpoint | Optional |
| `NOTIFICATION_*` | Notification polling, batch, and retry settings | Optional |

Generate strong random secrets and store them in the deployment platform's secret manager. Real secrets must never appear in issues, logs, documentation, or commits.

### Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run the complete verification pipeline with:

```bash
npm run verify
```

### Database migrations

For development:

```bash
npm run db:migrate
```

In production, apply committed migrations only:

```bash
npm run db:migrate:deploy
```

Do not use `prisma db push` as a production migration strategy. Review backups, lock impact, and rollback options before every production migration.

### Production deployment

The supported deployment command is:

```bash
bash scripts/deploy.sh
```

The script installs locked dependencies, generates Prisma Client, runs lint/typecheck/tests/build, prepares standalone assets, deploys migrations, reloads all PM2 processes, and checks `/api/health`. If a post-build deployment step fails, it restores the previous build.

Manual health checks:

```bash
bash scripts/health-check.sh
curl --fail http://127.0.0.1:8502/api/health
pm2 list
```

Important operational files:

- [`scripts/build-production.sh`](scripts/build-production.sh)
- [`scripts/migrate-production.sh`](scripts/migrate-production.sh)
- [`scripts/deploy.sh`](scripts/deploy.sh)
- [`scripts/health-check.sh`](scripts/health-check.sh)
- [`ecosystem.config.cjs`](ecosystem.config.cjs)

### Bale bot and AI assistant

After linking an account, members can use commands such as `/menu`, `/mytasks`, `/today`, `/overdue`, and `/ask message`. Natural-language task creation produces only a title/deadline/priority draft; the assignee and final confirmation remain part of the review wizard.

The assistant service must be available over HTTPS and return this contract:

```json
{
  "ok": true,
  "reply": "Assistant response"
}
```

Ordinary private-chat text may be forwarded to the assistant; group chats require an explicit `/ask`. Audit records store message length, outcome, and error code—not message contents. Never send passwords, secrets, or sensitive personal data to the external assistant.

See [`docs/bale-bot.md`](docs/bale-bot.md) for the complete setup flow.

### Security notes

- Authorization is enforced server-side; hidden UI controls are not a security boundary.
- Raw passwords and raw session tokens are not stored in the database.
- Failed login attempts are rate-limited and audited.
- Messaging link codes are single-use, expiring, and stored as hashes.
- Webhooks reject requests without a valid secret.
- Bot tokens, database passwords, session secrets, and `.env` files must stay out of Git.
- Before public exposure, review Caddy/TLS, secure-cookie behavior, network restrictions, and backup policy for the target environment.

### Documentation

- [Bale bot guide](docs/bale-bot.md)
- [Notification outbox architecture decision](docs/adr/0001-notification-outbox.md)
- [Tasks feature architecture](src/features/tasks/README.md)

### Contributing

1. Create a small, focused branch.
2. Implement the change with relevant tests and migrations.
3. Run `npm run verify`.
4. Describe behavior changes, security impact, and rollback steps in the pull request.

This repository currently has no standalone license file. Confirm licensing with the repository owner before redistribution or commercial use.

---

Maintained by [smnshzh](https://github.com/smnshzh).
