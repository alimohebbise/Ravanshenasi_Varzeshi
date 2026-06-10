import os
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from coaches.models import CoachApplication
from posts.models import Post

User = get_user_model()

DEFAULT_POSTS = [
    {
        "title": "تمرکز ذهنی پیش از مسابقه: ۵ تکنیک کاربردی",
        "content": (
            "<p>یکی از مهم‌ترین عوامل موفقیت ورزشکاران در روزهای مسابقه، توانایی "
            "حفظ تمرکز ذهنی و دور ماندن از حواس‌پرتی‌هاست. در این مطلب به بررسی "
            "تکنیک‌هایی می‌پردازیم که می‌توانند به ورزشکاران کمک کنند تا در "
            "لحظات حساس، بهترین عملکرد خود را ارائه دهند.</p>"
            "<h3>۱. تنفس دیافراگمی</h3>"
            "<p>چند دقیقه تمرین تنفس عمیق پیش از مسابقه، ضربان قلب را تنظیم کرده "
            "و ذهن را برای تمرکز آماده می‌کند.</p>"
            "<h3>۲. تجسم ذهنی (Visualization)</h3>"
            "<p>تصور کردن اجرای موفقیت‌آمیز حرکات کلیدی، اعتماد به نفس را افزایش "
            "داده و الگوهای حرکتی را در ذهن تقویت می‌کند.</p>"
            "<h3>۳. تعیین یک نقطه تمرکز (Focal Point)</h3>"
            "<p>انتخاب یک هدف ساده و مشخص برای تمرکز، کمک می‌کند ذهن از افکار "
            "مزاحم دور بماند.</p>"
            "<h3>۴. روتین‌های پیش از اجرا</h3>"
            "<p>یک روتین ثابت و تکرارشونده پیش از هر اجرا، حس کنترل و آمادگی را "
            "در ورزشکار تقویت می‌کند.</p>"
            "<h3>۵. گفتگوی درونی مثبت</h3>"
            "<p>جایگزین کردن افکار منفی با جملات تشویقی کوتاه، یکی از "
            "ساده‌ترین و مؤثرترین راه‌های مدیریت استرس مسابقه است.</p>"
            "<p>تمرین مستمر این تکنیک‌ها در جلسات تمرینی، باعث می‌شود در روز "
            "مسابقه به‌صورت خودکار و طبیعی به کار گرفته شوند.</p>"
        ),
        "status": Post.PUBLISHED,
        "view_count": 142,
    },
    {
        "title": "مدیریت اضطراب رقابتی در ورزشکاران",
        "content": (
            "<p>اضطراب پیش از مسابقه پدیده‌ای کاملاً طبیعی است و حتی می‌تواند "
            "در سطح مناسب، عملکرد را بهبود ببخشد. اما زمانی که اضطراب از حد "
            "بهینه فراتر رود، می‌تواند به افت چشمگیر عملکرد منجر شود.</p>"
            "<h3>نشانه‌های اضطراب رقابتی</h3>"
            "<ul>"
            "<li>تپش قلب و تنفس سریع</li>"
            "<li>تنش عضلانی و لرزش دست‌وپا</li>"
            "<li>افکار منفی مکرر درباره شکست</li>"
            "<li>اختلال در تمرکز و تصمیم‌گیری</li>"
            "</ul>"
            "<h3>راهکارهای مدیریت اضطراب</h3>"
            "<p>ترکیبی از آرام‌سازی پیشرونده عضلانی، تنفس کنترل‌شده و "
            "بازسازی شناختی افکار منفی، از مؤثرترین روش‌های علمی برای کاهش "
            "اضطراب پیش از رقابت هستند.</p>"
            "<blockquote>هدف ما حذف کامل اضطراب نیست؛ بلکه رساندن آن به سطحی "
            "است که به‌جای مانع، به یک محرک انرژی‌بخش تبدیل شود.</blockquote>"
            "<p>کار با یک روانشناس ورزشی می‌تواند به شناسایی الگوهای فردی "
            "اضطراب و طراحی برنامه‌ای اختصاصی برای مدیریت آن کمک شایانی کند.</p>"
        ),
        "status": Post.PUBLISHED,
        "view_count": 98,
    },
    {
        "title": "نقش گفتگوی درونی (Self-Talk) در عملکرد ورزشی",
        "content": (
            "<p>گفتگوی درونی، یعنی صدای ذهنی که در حین تمرین و مسابقه با خودمان "
            "داریم، تأثیر مستقیمی بر اعتماد به نفس، انگیزه و سطح انرژی "
            "ورزشکار دارد.</p>"
            "<h3>دو نوع گفتگوی درونی</h3>"
            "<p><strong>گفتگوی درونی مثبت</strong> به ورزشکار کمک می‌کند روی "
            "نقاط قوت و راه‌حل‌ها تمرکز کند، در حالی که <strong>گفتگوی درونی "
            "منفی</strong> معمولاً روی اشتباهات و ترس از شکست متمرکز است و "
            "می‌تواند عملکرد را به‌شدت کاهش دهد.</p>"
            "<h3>چگونه گفتگوی درونی خود را اصلاح کنیم؟</h3>"
            "<ol>"
            "<li>افکار منفی تکرارشونده خود را شناسایی و یادداشت کنید.</li>"
            "<li>هر فکر منفی را با یک جمله واقع‌بینانه و سازنده جایگزین کنید.</li>"
            "<li>از عبارات کوتاه و دستوری برای لحظات حساس استفاده کنید؛ مثلاً «آرام و متمرکز».</li>"
            "<li>این جملات را در تمرینات روزانه تکرار کنید تا به‌صورت خودکار درآیند.</li>"
            "</ol>"
            "<p>با تمرین مداوم، گفتگوی درونی مثبت به بخشی طبیعی از روال ذهنی "
            "ورزشکار تبدیل می‌شود و در شرایط پرفشار، پشتیبان او خواهد بود.</p>"
        ),
        "status": Post.PUBLISHED,
        "view_count": 76,
    },
    {
        "title": "ایجاد عادت‌های ذهنی برای فصل تمرینی پیش رو",
        "content": (
            "<p>این یادداشت هنوز در حال تکمیل است و به‌زودی منتشر خواهد شد. "
            "در این مطلب درباره ساخت روتین‌های ذهنی روزانه برای شروع فصل "
            "تمرینی جدید صحبت خواهیم کرد.</p>"
        ),
        "status": Post.DRAFT,
        "view_count": 0,
    },
]


class Command(BaseCommand):
    help = "Ensures a default coach account with an approved profile and sample posts exists."

    def handle(self, *args, **options):
        username = os.environ.get("DEFAULT_COACH_USERNAME", "coach")

        if User.objects.filter(username=username).exists():
            self.stdout.write(f"Coach user '{username}' already exists, skipping creation.")
            return

        password = os.environ.get("DEFAULT_COACH_PASSWORD", "coach12345")
        email = os.environ.get("DEFAULT_COACH_EMAIL", "coach@ravanshenasi-varzeshi.local")
        first_name = os.environ.get("DEFAULT_COACH_FIRST_NAME", "سارا")
        last_name = os.environ.get("DEFAULT_COACH_LAST_NAME", "محمدی")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role="coach",
        )

        CoachApplication.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            national_id="0000000000",
            date_of_birth=date(1988, 3, 21),
            bio=(
                "روانشناس ورزشی با بیش از ۸ سال تجربه همکاری با تیم‌های ملی و "
                "باشگاهی در زمینه آماده‌سازی ذهنی، مدیریت استرس و تمرکز پیش از "
                "مسابقه."
            ),
            expertise="روانشناسی ورزشی و آماده‌سازی ذهنی",
            experience_years=8,
            status="approved",
            reviewed_at=timezone.now(),
        )

        for post_data in DEFAULT_POSTS:
            Post.objects.create(coach=user, **post_data)

        self.stdout.write(self.style.SUCCESS(
            f"Created default coach account '{username}' with {len(DEFAULT_POSTS)} sample posts."
        ))
