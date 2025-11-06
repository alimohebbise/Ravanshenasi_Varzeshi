// اسکرول نرم
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// پیام فرم
const contactForm = document.querySelector("form");
if (contactForm) {
    contactForm.addEventListener("submit", e => {
        e.preventDefault();
        alert("پیام شما با موفقیت ارسال شد 💜");
        e.target.reset();
    });
}
