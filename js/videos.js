const videoPromo = document.querySelector(".video-promo video");

if (videoPromo && "IntersectionObserver" in window) {
    new IntersectionObserver(entradas => {
        entradas.forEach(e => e.isIntersecting ? videoPromo.play().catch(() => {}) : videoPromo.pause());
    }, { threshold: 0.25 }).observe(videoPromo);
}