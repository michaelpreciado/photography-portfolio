'use strict';

// Handle sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Handle random hero image on homepage
function initializeHeroImage() {
    const randomImage = document.getElementById('randomImage');
    if (!randomImage) return;

    const imageCount = 17;
    const randomIndex = Math.floor(Math.random() * imageCount) + 1;
    
    // Try loading the image with different extensions
    const tryLoadImage = (extensions) => {
        if (extensions.length === 0) {
            console.error('Failed to load image');
            randomImage.src = 'public/fallback-image.jpg'; // Add a fallback image
            return;
        }

        const ext = extensions[0];
        randomImage.src = `public/image${randomIndex}.${ext}`;
        
        randomImage.onerror = () => {
            // Try next extension if current one fails
            tryLoadImage(extensions.slice(1));
        };

        randomImage.onload = () => {
            randomImage.classList.add('loaded');
        };
    };

    // Try different extensions in order
    tryLoadImage(['jpg', 'JPG', 'jpeg']);
}

// Handle portfolio image animations
function handlePortfolioImages() {
    const images = document.querySelectorAll('.portfolio-grid img');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    images.forEach(img => {
        // Add loading class while image is loading
        img.classList.add('loading');
        
        // Handle successful load
        img.onload = () => {
            img.classList.remove('loading');
            observer.observe(img);
        };

        // Handle failed load
        img.onerror = () => {
            console.error(`Failed to load image: ${img.src}`);
            img.classList.remove('loading');
            img.classList.add('image-error');
            img.alt = 'Image failed to load';
        };
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeHeroImage();
    handlePortfolioImages();
});
