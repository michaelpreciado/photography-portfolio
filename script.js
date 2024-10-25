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

// Enhanced parallax effect
const parallaxEffect = () => {
    let scrolled = window.pageYOffset;
    
    requestAnimationFrame(() => {
        if (elements.parallaxBg) {
            elements.parallaxBg.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`; // Slower background movement
        }
        
        if (elements.heroImage) {
            elements.heroImage.style.transform = `translate3d(0, ${scrolled * 0.2}px, 0)`; // Subtle hero image movement
        }
        
        if (elements.portfolioGrid) {
            const images = elements.portfolioGrid.querySelectorAll('img');
            images.forEach((img, index) => {
                const speed = 0.1 + (index % 3) * 0.05; // Varying speeds for different images
                img.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
            });
        }
        
        if (elements.aboutContent) {
            elements.aboutContent.style.transform = `translate3d(0, ${scrolled * 0.1}px, 0)`; // Subtle content movement
        }
    });
};

// Optimized scroll listener
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            parallaxEffect();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

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

// Add image list
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

// Function to load random image with smooth transition
const loadRandomImage = () => {
    const randomImage = document.getElementById('randomImage');
    if (randomImage) {
        const randomIndex = Math.floor(Math.random() * imageList.length);
        const img = new Image();
        
        // Start fade out with longer duration
        randomImage.classList.add('fade-out');
        
        img.onload = () => {
            // After new image is loaded, wait for fade out to complete
            setTimeout(() => {
                randomImage.src = img.src;
                // Start fade in with RAF for smooth animation
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        randomImage.classList.remove('fade-out');
                        randomImage.classList.add('loaded');
                    }, 50); // Small delay for smoother transition
                });
            }, 750); // Increased from 500ms for smoother transition
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
    
    // Change image every 10 seconds for smoother experience
    setInterval(loadRandomImage, 10000);
});

// Export for HTML
window.toggleSidebar = toggleSidebar;
