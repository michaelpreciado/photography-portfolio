'use strict';

// Global variables
let isMenuOpen = false;

// Handle sidebar toggle with accessibility enhancements
function toggleSidebar(menuBtn) {
    const sidebar = document.getElementById('main-navigation');
    isMenuOpen = !isMenuOpen;
    
    // Toggle sidebar visibility
    sidebar.classList.toggle('active');
    
    // Update ARIA attributes
    menuBtn.setAttribute('aria-expanded', isMenuOpen);
    
    // Prevent scrolling on body when menu is open (for mobile)
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
}

// Handle clicks outside the sidebar to close it
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('main-navigation');
    const menuBtn = document.querySelector('.menu-btn');
    
    // If sidebar is open and the click is outside the sidebar and menu button
    if (isMenuOpen && !sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
        isMenuOpen = false;
        sidebar.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
});

// Handle resize events for better responsiveness
function handleResize() {
    // Reset menu state on resize to desktop
    if (window.innerWidth > 992 && isMenuOpen) {
        isMenuOpen = false;
        const sidebar = document.getElementById('main-navigation');
        const menuBtn = document.querySelector('.menu-btn');
        
        if (sidebar && menuBtn) {
            sidebar.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
}

// Handle random hero image on homepage
function initializeHeroImage() {
    const randomImage = document.getElementById('randomImage');
    if (!randomImage) return;

    const imageCount = 17;
    const randomIndex = Math.floor(Math.random() * imageCount) + 1;
    
    // Add loading state
    const parent = randomImage.parentElement;
    parent.classList.add('loading');
    
    // Try loading the image with different extensions
    const tryLoadImage = (extensions) => {
        if (extensions.length === 0) {
            console.error('Failed to load image');
            randomImage.src = 'public/fallback-image.jpg'; // Add a fallback image
            parent.classList.remove('loading');
            return;
        }

        const ext = extensions[0];
        // Prepare new image to test loading
        const img = new Image();
        const imgUrl = `public/image${randomIndex}.${ext}`;
        
        img.onload = () => {
            // Image loaded successfully, update the actual image
            randomImage.src = imgUrl;
            randomImage.classList.add('loaded');
            parent.classList.remove('loading');
        };
        
        img.onerror = () => {
            // Try next extension if current one fails
            tryLoadImage(extensions.slice(1));
        };
        
        img.src = imgUrl;
    };

    // Try different extensions in order
    tryLoadImage(['jpg', 'JPG', 'jpeg', 'JPEG']);
}

// Handle all gallery images with IntersectionObserver
function handleGalleryImages() {
    // Handle both portfolio and two-column grid images
    const images = document.querySelectorAll('.portfolio-grid img, .two-column-grid img');
    if (!images.length) return;

    // Use IntersectionObserver for better performance
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger the animations for a more pleasing effect
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, Math.random() * 200);
                
                // Unobserve after animation to save resources
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px 50px 0px' // Load a bit before they come into view
    });

    // Handle each image
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
            // Still observe for animation, even if image failed
            observer.observe(img);
        };
    });
}

// Handle smooth scrolling for anchor links
function handleSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (isMenuOpen) {
                const menuBtn = document.querySelector('.menu-btn');
                if (menuBtn) toggleSidebar(menuBtn);
            }
            
            // Get the target element
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Scroll smoothly to target
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without reload
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

// Register service worker for offline capabilities if needed
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
                console.log('ServiceWorker registration successful');
            }, function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
}

// Handle contact form submission
function handleContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // Simple validation
        if (!name || !email || !subject || !message) {
            formStatus.textContent = 'PLEASE FILL OUT ALL FIELDS';
            formStatus.className = 'form-status error';
            return;
        }
        
        // Show loading state
        formStatus.textContent = 'SENDING...';
        formStatus.className = 'form-status';
        
        // Create mailto link with form data
        const mailtoLink = `mailto:marioopreciadoo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message
        formStatus.textContent = 'MESSAGE SENT! YOUR EMAIL CLIENT SHOULD OPEN SHORTLY.';
        formStatus.className = 'form-status success';
        
        // Reset form after successful submission
        contactForm.reset();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
            formStatus.textContent = '';
            formStatus.className = 'form-status';
        }, 5000);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeHeroImage();
    handleGalleryImages();
    handleSmoothScroll();
    
    // Add resize handler
    window.addEventListener('resize', handleResize);
    
    // Add support for escape key to close menu
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isMenuOpen) {
            const menuBtn = document.querySelector('.menu-btn');
            if (menuBtn) toggleSidebar(menuBtn);
        }
    });
    
    // Uncomment to enable service worker for offline support
    // registerServiceWorker();
    
    // Initialize contact form
    handleContactForm();
});
