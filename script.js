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
    
    // Use newer IntersectionObserver with optimized settings for iOS
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // For iOS optimization - preload high res image and display low-res first
                if (img.dataset.src) {
                    // First load low resolution placeholder if available
                    if (img.dataset.placeholder) {
                        img.src = img.dataset.placeholder;
                    }
                    
                    // Create a new image to preload the high-res version
                    const highResImg = new Image();
                    
                    highResImg.onload = () => {
                        // Once high-res is loaded, replace the src and add visible class
                        img.src = img.dataset.src;
                        
                        // If a srcset is defined, set it after src for optimal loading
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                        }
                        
                        // Add sizes attribute for responsive loading if available
                        if (img.dataset.sizes) {
                            img.sizes = img.dataset.sizes;
                        }
                        
                        img.classList.add('visible');
                    };
                    
                    highResImg.onerror = () => {
                        // Fallback in case of error
                        console.warn('Failed to load high-res image:', img.dataset.src);
                        img.src = img.dataset.src; // Still try direct loading
                        img.classList.add('visible');
                        img.classList.add('image-error');
                    };
                    
                    // Start loading high res image
                    highResImg.src = img.dataset.src;
                }
                
                // Stop observing after loading
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px 0px', // Load images 200px before they enter viewport
        threshold: 0.01, // Trigger when just 1% of the image is visible
        // Better tracks images during fast scrolling on iOS
    });
    
    // Observe all images
    images.forEach(img => {
        imageObserver.observe(img);
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
