// Use strict mode for better error catching and performance
'use strict';

// Cache DOM elements and normalize image paths
const elements = {
    sidebar: document.querySelector('.sidebar'),
    menuBtn: document.querySelector('.menu-btn'),
    parallaxBg: document.querySelector('.parallax-bg'),
    heroImage: document.querySelector('.hero-image'),
    portfolioGrid: document.querySelector('.portfolio-grid'),
    aboutContent: document.querySelector('.about-content'),
    randomImage: document.getElementById('randomImage')
};

// Normalize image paths and extensions
const imageList = Array.from({length: 20}, (_, i) => `image${i + 1}.jpg`);

// Optimized debounce function
const debounce = (func, wait = 20) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

// Optimized toggle sidebar with animation frame
const toggleSidebar = () => {
    const { sidebar, menuBtn } = elements;
    const isActive = sidebar.classList.toggle('active');
    menuBtn.classList.toggle('active');
    
    requestAnimationFrame(() => {
        const spans = menuBtn.children;
        spans[0].style.transform = isActive ? 'rotate(45deg) translate(6px, 6px)' : 'none';
        spans[1].style.opacity = isActive ? '0' : '1';
        spans[2].style.transform = isActive ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
    });
};

// Optimized parallax effect with throttling
let ticking = false;
let lastScrollY = window.scrollY;

const updateParallax = () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrolled = window.scrollY;
            const { parallaxBg, heroImage, portfolioGrid, aboutContent } = elements;
            
            if (scrolled !== lastScrollY) {
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
                lastScrollY = scrolled;
            }
            ticking = false;
        });
        ticking = true;
    }
};

// Load random image with error handling
const loadRandomImage = () => {
    if (elements.randomImage) {
        const randomIndex = Math.floor(Math.random() * imageList.length);
        const img = new Image();
        
        img.onload = () => {
            elements.randomImage.src = img.src;
            elements.randomImage.classList.add('loaded');
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image: ${imageList[randomIndex]}`);
            // Try another random image if this one fails
            if (imageList.length > 1) {
                loadRandomImage();
            }
        };
        
        img.src = imageList[randomIndex];
    }
};

// Initialize on load with performance optimizations
const init = () => {
    // Optimize image loading
    if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.decoding = 'async';
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        import('https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js')
            .catch(err => console.warn('Lazy loading fallback failed:', err));
    }

    // Add scroll listener with passive flag for better performance
    window.addEventListener('scroll', updateParallax, { passive: true });
    
    // Load random image if on home page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadRandomImage();
    }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);

// Export for use in HTML
window.toggleSidebar = toggleSidebar;
