// Performance optimized JavaScript
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.querySelector('.menu-btn');
const parallaxBg = document.querySelector('.parallax-bg');
const heroImage = document.querySelector('.hero-image');
const portfolioGrid = document.querySelector('.portfolio-grid');
const aboutContent = document.querySelector('.about-content');

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized toggle sidebar function
function toggleSidebar() {
    sidebar.classList.toggle('active');
    menuBtn.classList.toggle('active');
    
    const isActive = menuBtn.classList.contains('active');
    const spans = menuBtn.children;
    
    requestAnimationFrame(() => {
        spans[0].style.transform = isActive ? 'rotate(45deg) translate(6px, 6px)' : 'none';
        spans[1].style.opacity = isActive ? '0' : '1';
        spans[2].style.transform = isActive ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
    });
}

// Optimized parallax effect using requestAnimationFrame
let ticking = false;
let lastScrollY = window.pageYOffset;

function updateParallax() {
    const scrolled = window.pageYOffset;
    
    if (parallaxBg) {
        parallaxBg.style.transform = `translate3d(0, ${scrolled * 0.5}px, 0)`;
    }
    
    if (heroImage && scrolled !== lastScrollY) {
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
}

// Optimized scroll listener
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
    }
}, { passive: true });

// Optimize image loading
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
    });
});

// Remove smooth scroll for better performance
const links = document.querySelectorAll('a[href^="#"]');
links.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView();
        }
    });
});
