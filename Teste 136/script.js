document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const momentsSection = document.getElementById('moments');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const photoFrames = document.querySelectorAll('.photo-frame');
    const heroSection = document.querySelector('.hero');
    
    let mouseX = 0;
    let mouseY = 0;
    let isScrolling = false;
    let scrollTimeout;

    startBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        momentsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const updateScrollIndicator = () => {
        if (!scrollIndicator) return;
        
        const scrollProgress = window.scrollY / 300;
        const opacity = Math.max(0, Math.min(1, 1 - scrollProgress));
        const scale = 0.8 + (0.2 * opacity);
        
        scrollIndicator.style.opacity = opacity;
        scrollIndicator.style.transform = `translateX(-50%) scale(${scale})`;
    };

    window.addEventListener('scroll', updateScrollIndicator, { passive: true });

    heroSection?.addEventListener('mousemove', (e) => {
        // Efeitos de mouse removidos para performance
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animate')) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    ['message', 'closing'].forEach(cls => {
        document.querySelectorAll(`.${cls}`).forEach(el => observer.observe(el));
    });

    const updateFadeEffect = () => {
        const viewportHeight = window.innerHeight;

        photoFrames.forEach((frame, index) => {
            const rect = frame.getBoundingClientRect();
            const frameCenter = rect.top + rect.height / 2;
            const distFromCenter = frameCenter - (viewportHeight / 2);

            const parallaxY = Math.round(distFromCenter * 0.02);
            frame.style.setProperty('--parallax', `${parallaxY}px`);

            let opacity = 1;

            if (rect.top > viewportHeight) {
                const distanceFromTop = rect.top - viewportHeight;
                const fadeInRange = viewportHeight * 0.4;
                opacity = Math.max(0.1, 1 - (distanceFromTop / fadeInRange));
            }
            else if (rect.bottom < 0) {
                const distanceFromBottom = -rect.bottom;
                const fadeOutRange = viewportHeight * 0.3;
                opacity = Math.max(0.1, (distanceFromBottom / fadeOutRange));
            }
            else if (rect.top < viewportHeight && rect.bottom > 0) {
                const visibleRatio = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
                const totalHeight = rect.height;
                const visibilityRatio = visibleRatio / totalHeight;
                opacity = Math.max(0.3, visibilityRatio);
            }

            frame.style.setProperty('--fade-opacity', opacity);
        });
    };

    let rafId = null;
    let lastScrollTop = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollVelocity = 0;

    const onScroll = () => {
        const now = performance.now();
        const deltaY = window.scrollY - lastScrollTop;
        const deltaT = Math.max(now - lastScrollTime, 1);
        scrollVelocity = Math.abs(deltaY / deltaT) * 1000; // px/sec
        lastScrollTop = window.scrollY;
        lastScrollTime = now;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateFadeEffect);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    updateFadeEffect();
    updateScrollIndicator();

    setTimeout(() => {
        updateFadeEffect();
    }, 100);

    document.addEventListener('mousemove', (e) => {

    });

    document.addEventListener('mouseleave', () => {
    });

    const animatedItems = [];
    const maxActive = 6;
    let activeCount = 0;

    const animateQueue = [];
    const runQueue = () => {
        while (activeCount < maxActive && animateQueue.length > 0) {
            const job = animateQueue.shift();
            activeCount += 1;
            job(() => { activeCount -= 1; runQueue(); });
        }
    };

    const observeReveal = (selector, options = {}) => {
        const elements = document.querySelectorAll(selector);
        if (!elements.length) return;

        elements.forEach((el, index) => {
            el.classList.add('reveal');
            if (options.asImage) el.classList.add('reveal-img');
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target;
                const delay = (target.dataset.revealIndex ? Number(target.dataset.revealIndex) : 0) * 80;

                if (entry.isIntersecting) {
                    if (!target.classList.contains('reveal-visible')) {
                        if (target.classList.contains('reveal-img')) {
                            const adaptiveFactor = Math.max(0.6, Math.min(1.2, 1.2 - (scrollVelocity / 2500)));
                            target.style.transitionDuration = `${0.8 * adaptiveFactor}s`;
                        }
                        animateQueue.push((done) => {
                            setTimeout(() => {
                                target.classList.add('reveal-visible');
                                if (target.matches('#message')) {
                                    target.querySelector('.message-content')?.classList.add('reveal-visible');
                                }
                                setTimeout(done, 750);
                            }, delay);
                        });
                        runQueue();
                    }
                } else {
                    target.classList.remove('reveal-visible');
                    if (target.matches('#message')) {
                        target.querySelector('.message-content')?.classList.remove('reveal-visible');
                    }
                }
            });
        }, {
            rootMargin: '0px 0px -15% 0px',
            threshold: 0.1
        });

        elements.forEach((el, i) => {
            el.dataset.revealIndex = i;
            observer.observe(el);
        });
    };

    observeReveal('.hero-title, .hero-subtitle');
    observeReveal('.photo-frame', { asImage: true });
    observeReveal('.moment-text');
    observeReveal('#message');
    observeReveal('#closing');

    document.querySelectorAll('.photo-frame').forEach(frame => {
        frame.style.opacity = '1';
    });

    document.querySelectorAll('.moment-img').forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
    });

    document.body.addEventListener('touchstart', (event) => {
        const target = event.target.closest('button, .start-btn');
        if (!target) return;

        target.style.transform = 'scale(0.97)';
        target.style.transition = 'transform 120ms cubic-bezier(0.22, 1, 0.36, 1)';

        const restore = () => {
            target.style.transform = 'scale(1)';
            target.removeEventListener('touchend', restore);
            target.removeEventListener('touchcancel', restore);
        };

        target.addEventListener('touchend', restore);
        target.addEventListener('touchcancel', restore);
    }, { passive: true });

    const momentItems = document.querySelectorAll('.moment');
    const momentsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const moment = entry.target;
            const photo = moment.querySelector('.photo-frame');
            const text = moment.querySelector('.moment-text');

            if (photo) {
                photo.classList.add('reveal', 'reveal-img');
                photo.style.opacity = '0.95';
                setTimeout(() => photo.classList.add('reveal-visible'), 30);
            }

            if (text) {
                text.classList.add('reveal');
                setTimeout(() => text.classList.add('reveal-visible'), 220);
            }

            moment.classList.add('section-focus');
            setTimeout(() => moment.classList.add('active'), 220);

            momentsObserver.unobserve(moment);
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });

    momentItems.forEach(moment => momentsObserver.observe(moment));

    const closing = document.querySelector('.closing');
    if (closing) {
        const closeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    closing.classList.add('active');
                } else {
                    closing.classList.remove('active');
                }
            });
        }, { threshold: 0.28 });
        closing.classList.add('section-focus');
        closeObserver.observe(closing);
    }

});
