// Use strict mode for better error catching and performance
'use strict';

// Cache DOM elements
const elements = {
    sidebar: document.querySelector('.sidebar'),
    menuBtn: document.querySelector('.menu-btn'),
    parallaxBg: document.querySelector('.parallax-bg'),
    heroImage: document.querySelector('.hero-image'),
    portfolioGrid: document.querySelector('.portfolio-grid'),
    aboutContent: document.querySelector('.about-content')
};

// Optimized debounce function
const debounce = (func, wait = 20) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

// Optimized toggle sidebar
const toggleSidebar = () => {
    const { sidebar, menuBtn } = elements;
    const isActive = sidebar.classList.toggle('active');
    menuBtn.classList.toggle('active');
    
    // Use transform instead of opacity for better performance
    const spans = menuBtn.children;
    requestAnimationFrame(() => {
        spans[0].style.transform = isActive ? 'rotate(45deg) translate(6px, 6px)' : 'none';
        spans[1].style.opacity = isActive ? '0' : '1';
        spans[2].style.transform = isActive ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
    });
};

// Optimized parallax effect
let ticking = false;
let lastScrollY = window.scrollY;

const updateParallax = () => {
    const scrolled = window.scrollY;
    const { parallaxBg, heroImage, portfolioGrid, aboutContent } = elements;
    
    if (scrolled !== lastScrollY) {
        requestAnimationFrame(() => {
            if (parallaxBg) {
                parallaxBg.style.transform = `translate3d(0, ${scrolled * 0.5}px, 0)`;
            }
            if (heroImage) {
                heroImage.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`;
            }
            if (portfolioGrid) {
                portfolioGrid.style.transform = `translate3d(0, ${scrolled * 0.1}px, 0)`;
            }
            if (aboutContent) {
                aboutContent.style.transform = `translate3d(0, ${scrolled * 0.1}px, 0)`;
            }
            ticking = false;
            lastScrollY = scrolled;
        });
    }
};

// Optimized scroll listener with passive flag
window.addEventListener('scroll', () => {
    if (!ticking) {
        ticking = true;
        updateParallax();
    }
}, { passive: true });

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Optimize image loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
            img.decoding = 'async';
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        import('https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js');
    }
});

// Export for use in HTML
window.toggleSidebar = toggleSidebar;
