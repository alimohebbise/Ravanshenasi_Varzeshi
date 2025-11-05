// اسکرول نرم به بخش‌ها
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// پیام فرم تماس
document.querySelector("form").addEventListener("submit", e => {
    e.preventDefault();
    alert("پیام شما با موفقیت ارسال شد 💜");
    e.target.reset();
});
