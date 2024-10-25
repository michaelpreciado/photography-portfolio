// Use strict mode for better error catching and performance
'use strict';

// Cache DOM elements
const elements = {
    sidebar: document.querySelector('.sidebar'),
    menuBtn: document.querySelector('.menu-btn'),
    parallaxBg: document.querySelector('.parallax-bg'),
    heroImage: document.querySelector('.hero-image'),
    portfolioGrid: document.querySelector('.portfolio-grid'),
    aboutContent: document.querySelector('.about-content'),
    randomImage: document.getElementById('randomImage')
};

// Smooth scrolling variables
let lastScrollTop = 0;
let ticking = false;
let animationFrame;
let touchStartY = 0;
let touchStartX = 0;
let isScrolling = false;

// Enhanced smooth scroll function with better easing
const smoothScroll = (target, duration = 1000) => {
    const targetPosition = target.getBoundingClientRect().top;
    const startPosition = window.pageYOffset;
    const distance = targetPosition;
    const startTime = performance.now();

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const animation = currentTime => {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        window.scrollTo({
            top: startPosition + distance * easeOutCubic(progress),
            behavior: 'auto'
        });

        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    };

    requestAnimationFrame(animation);
};

// Optimized parallax effect
const parallaxEffect = () => {
    if (!ticking && !isScrolling) {
        animationFrame = requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const delta = scrolled - lastScrollTop;
            
            if (Math.abs(delta) > 2) { // Threshold for movement
                if (elements.parallaxBg) {
                    elements.parallaxBg.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`;
                }
                
                if (elements.portfolioGrid) {
                    const images = elements.portfolioGrid.querySelectorAll('img');
                    images.forEach((img, index) => {
                        const speed = 0.1 + (index % 3) * 0.02;
                        img.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
                    });
                }
                
                lastScrollTop = scrolled;
            }
            
            ticking = false;
        });
        
        ticking = true;
    }
};

// Optimized scroll handler with debounce
const scrollHandler = () => {
    if (!isScrolling) {
        requestAnimationFrame(() => {
            parallaxEffect();
            isScrolling = false;
        });
        isScrolling = true;
    }
};

// Enhanced touch handlers
const touchStartHandler = (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].pageX;
    isScrolling = false;
};

const touchMoveHandler = (e) => {
    if (e.touches.length > 1) return; // Ignore multi-touch

    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].pageX;
    
    // Calculate movement
    const deltaY = touchStartY - touchY;
    const deltaX = touchStartX - touchX;
    
    // Check if scrolling vertically
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        isScrolling = true;
        
        // Smooth the scroll effect
        window.scrollBy({
            top: deltaY * 0.5,
            behavior: 'auto'
        });
    }
    
    touchStartY = touchY;
    touchStartX = touchX;
};

// Add event listeners with options
window.addEventListener('scroll', scrollHandler, { passive: true });
document.addEventListener('touchstart', touchStartHandler, { passive: true });
document.addEventListener('touchmove', touchMoveHandler, { passive: true });
document.addEventListener('touchend', () => {
    isScrolling = false;
}, { passive: true });

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize smooth scrolling for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                smoothScroll(target);
            }
        });
    });

    // Rest of your initialization code...
});

// Smooth image reveal with Intersection Observer
const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: [0, 0.25, 0.5, 0.75, 1] // More thresholds for smoother transitions
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const delay = parseInt(img.dataset.delay) || 0;
            
            // Use RAF for smoother animation
            requestAnimationFrame(() => {
                setTimeout(() => {
                    img.style.transform = 'translateY(0)';
                    img.style.opacity = '1';
                }, delay);
            });
            
            observer.unobserve(img); // Stop observing once animated
        }
    });
}, observerOptions);

// Initialize images with staggered delay
const initializeImages = () => {
    const images = document.querySelectorAll('.portfolio-grid img');
    images.forEach((img, index) => {
        img.style.transform = 'translateY(30px)';
        img.style.opacity = '0';
        img.dataset.delay = index * 100; // Staggered delay
        observer.observe(img);
    });
};

// Smooth sidebar toggle
const toggleSidebar = () => {
    const { sidebar, menuBtn } = elements;
    
    requestAnimationFrame(() => {
        sidebar.classList.toggle('active');
        menuBtn.classList.toggle('active');
        
        const spans = menuBtn.children;
        const isActive = sidebar.classList.contains('active');
        
        spans[0].style.transform = isActive ? 'rotate(45deg) translate(6px, 6px)' : 'none';
        spans[1].style.opacity = isActive ? '0' : '1';
        spans[2].style.transform = isActive ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
    });
};

// Add image list with all available images
const imageList = [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg',
    'image4.JPG',
    'image5.JPG',
    'image6.jpg',
    'image7.jpg',
    'image8.jpg',
    'image9.JPG',
    'image10.jpg',
    'image11.jpeg',
    'image12.jpeg',
    'image13.jpeg',
    'image14.jpeg',
    'image15.jpeg',
    'image16.jpeg',
    'image17.jpeg'
];

// Keep track of the last shown image to avoid repetition
let lastShownImageIndex = -1;

// Function to load random image with smooth transition
const loadRandomImage = () => {
    const randomImage = document.getElementById('randomImage');
    if (randomImage) {
        let randomIndex;
        // Make sure we don't show the same image twice in a row
        do {
            randomIndex = Math.floor(Math.random() * imageList.length);
        } while (randomIndex === lastShownImageIndex);
        
        lastShownImageIndex = randomIndex;
        const img = new Image();
        
        // Start fade out
        randomImage.classList.add('fade-out');
        
        img.onload = () => {
            setTimeout(() => {
                randomImage.src = img.src;
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        randomImage.classList.remove('fade-out');
                        randomImage.classList.add('loaded');
                    }, 50);
                });
            }, 750);
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image: ${imageList[randomIndex]}`);
            if (imageList.length > 1) {
                loadRandomImage();
            }
        };
        
        img.src = imageList[randomIndex];
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeImages();
    
    // Enable smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    document.addEventListener('DOMContentLoaded', function() {
        const img = document.getElementById('randomImage');
        const images = JSON.parse(img.dataset.images);
        const randomIndex = Math.floor(Math.random() * images.length);
        img.src = images[randomIndex];
    });

    // Load first random image
    loadRandomImage();
    
    // Change image every 7 seconds
    setInterval(loadRandomImage, 7000);
});

// Export for HTML
window.toggleSidebar = toggleSidebar;
