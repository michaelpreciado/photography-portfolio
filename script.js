'use strict';

// Global variables
let isMenuOpen = false;
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Handle sidebar toggle with accessibility enhancements
function toggleSidebar(menuBtn) {
    const sidebar = document.getElementById('main-navigation');
    isMenuOpen = !isMenuOpen;
    
    // Toggle sidebar visibility with hardware acceleration
    sidebar.classList.toggle('active');
    
    // Update ARIA attributes
    menuBtn.setAttribute('aria-expanded', isMenuOpen);
    
    // Prevent scrolling on body when menu is open (for mobile)
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
}

// Handle clicks outside the sidebar to close it - with passive event for better performance
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
}, { passive: true });

// Handle resize events for better responsiveness - with throttling for better performance
let resizeTimer;
function handleResize() {
    // Clear the timer on new resize event
    clearTimeout(resizeTimer);
    
    // Set new timer with 100ms delay
    resizeTimer = setTimeout(() => {
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
    }, 100);
}

// Handle random hero image on homepage with optimized loading strategy
function initializeHeroImage() {
    const randomImage = document.getElementById('randomImage');
    if (!randomImage) return;

    const imageCount = 17;
    const randomIndex = Math.floor(Math.random() * imageCount) + 1;
    
    // Add loading state
    const parent = randomImage.parentElement;
    parent.classList.add('loading');
    
    // Optimized image loading with preload
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
        
        // Set loading attribute to auto for native lazy loading
        if ('loading' in HTMLImageElement.prototype) {
            img.loading = 'eager'; // Load hero image eagerly
        }
        
        img.onload = () => {
            // Image loaded successfully, update the actual image
            randomImage.src = imgUrl;
            randomImage.classList.add('loaded');
            parent.classList.remove('loading');
            
            // Add GPU acceleration to the image
            randomImage.style.transform = 'translateZ(0)';
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

// Handle all gallery images with IntersectionObserver and optimized loading
function handleGalleryImages() {
    // Handle both portfolio and two-column grid images
    const images = document.querySelectorAll('.portfolio-grid img, .two-column-grid img');
    if (!images.length) return;

    // Use IntersectionObserver for better performance
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger the animations for a more pleasing effect
                // Use shorter delays on iOS for better perceived performance
                const delay = isIOS ? Math.random() * 100 : Math.random() * 200;
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                    
                    // Add hardware acceleration for smoother transitions
                    entry.target.style.transform = 'translate3d(0, 0, 0)';
                }, delay);
                
                // Unobserve after animation to save resources
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: isIOS ? 0.01 : 0.1, // Lower threshold for iOS for earlier loading
        rootMargin: '0px 0px 100px 0px' // Load earlier before they come into view
    });

    // Handle each image
    images.forEach(img => {
        // Check if native lazy loading is supported
        if ('loading' in HTMLImageElement.prototype) {
            // Use native lazy loading
            img.loading = 'lazy';
            
            // Add fetchpriority for modern browsers
            if ('fetchPriority' in HTMLImageElement.prototype) {
                img.fetchPriority = 'low';
            }
        }
        
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
        
        // Start loading if already in viewport
        if (img.complete) {
            img.onload();
        }
    });
}

// Handle smooth scrolling for anchor links - with throttling
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
                // Use requestAnimationFrame for smoother scrolling
                requestAnimationFrame(() => {
                    // Get the element's position
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const startPosition = window.pageYOffset;
                    const distance = targetPosition - startPosition;
                    
                    // Use a simpler scroll on iOS for better performance
                    if (isIOS) {
                        // Simpler scroll behavior for iOS
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    } else {
                        // Scroll smoothly to target with custom animation for other browsers
                        targetElement.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                    
                    // Update URL without reload
                    history.pushState(null, null, `#${targetId}`);
                });
            }
        });
    });
}

// Register service worker for offline capabilities if needed
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Wait until after initial load to register service worker
        window.addEventListener('load', function() {
            // Delay service worker registration to not compete with initial page load
            setTimeout(() => {
                navigator.serviceWorker.register('service-worker.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
            }, isIOS ? 3000 : 1000); // Longer delay on iOS
        });
    }
}

// Handle contact form submission with optimizations
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
        
        // Delay for better UX on iOS
        setTimeout(() => {
            // Create mailto link with form data
            const mailtoLink = `mailto:marioopreciadoo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            formStatus.textContent = 'MESSAGE SENT! YOUR EMAIL CLIENT SHOULD OPEN SHORTLY.';
            formStatus.className = 'form-status success';
            
            // Reset form after successful submission
            contactForm.reset();
            
            // Clear success message after shorter time on iOS
            setTimeout(() => {
                formStatus.textContent = '';
                formStatus.className = 'form-status';
            }, isIOS ? 3000 : 5000);
        }, isIOS ? 300 : 0); // Small delay for iOS
    });
}

// Handle scroll performance with throttling
function initializeScrollHandler() {
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                // Handle any scroll-dependent operations here
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true }); // Add passive flag for better performance
}

// Optimize image loading with dynamic priority
function optimizeImageLoading() {
    // Check if relevant APIs are supported
    if (!('IntersectionObserver' in window)) return;
    
    // Handle all images
    const allImages = document.querySelectorAll('img');
    
    // Create observer to load important images immediately
    const nearViewportObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // Set high priority for images near viewport
                if ('fetchPriority' in img) {
                    img.fetchPriority = 'high';
                }
                
                // Make sure image loads if it hasn't already
                if (!img.complete) {
                    img.loading = 'eager';
                }
                
                // Stop observing this image
                nearViewportObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '0px 0px 200px 0px', // Images within 200px of viewport
        threshold: 0.01
    });
    
    // Observe all images for optimized loading
    allImages.forEach(img => {
        // Don't change loading attribute if already set
        if (!img.hasAttribute('loading')) {
            img.loading = 'lazy';
        }
        
        // Set default fetchPriority
        if ('fetchPriority' in img) {
            img.fetchPriority = 'auto';
        }
        
        // Observe with IntersectionObserver
        nearViewportObserver.observe(img);
    });
}

// Detect slow connections and optimize accordingly
function handleSlowConnections() {
    // Check if Network Information API is supported
    if ('connection' in navigator) {
        const connection = navigator.connection;
        
        // If it's a slow connection
        if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // Apply optimizations for slow connections
            document.body.classList.add('slow-connection');
            
            // Don't load hippie symbols on slow connections
            const symbolsContainer = document.querySelector('.hippie-symbols-container');
            if (symbolsContainer) {
                symbolsContainer.style.display = 'none';
            }
            
            // Reduce image quality
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                // Add low quality indicator to image URL if possible
                if (!img.src.includes('fallback') && !img.src.includes('low-quality')) {
                    const src = img.src;
                    img.src = src.replace(/(\.\w+)$/, '-low-quality$1');
                }
            });
        }
    }
}

// Initialize on page load with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    // Initialize only necessary features based on page
    if (document.body.classList.contains('home-page')) {
        initializeHeroImage();
    }
    
    // Initialize essential features immediately
    handleSmoothScroll();
    handleResize();
    
    // Add resize handler with passive flag
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Add support for escape key to close menu
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isMenuOpen) {
            const menuBtn = document.querySelector('.menu-btn');
            if (menuBtn) toggleSidebar(menuBtn);
        }
    });
    
    // Initialize contact form if it exists
    if (document.getElementById('contactForm')) {
        handleContactForm();
    }
    
    // Check for slow connections
    handleSlowConnections();
    
    // Set up scroll handler
    initializeScrollHandler();
    
    // Delay non-essential features for better initial load performance
    setTimeout(() => {
        // Initialize gallery images after a slight delay
        handleGalleryImages();
        
        // Optimize image loading
        optimizeImageLoading();
        
        // Initialize service worker registration
        if (!isIOS) {
            // Service worker can sometimes cause issues on iOS, so delay even further
            registerServiceWorker();
        } else {
            setTimeout(registerServiceWorker, 2000);
        }
    }, isIOS ? 500 : 200); // Longer delay on iOS
});

// Add page loaded class when everything is done
window.addEventListener('load', () => {
    document.body.classList.add('page-loaded');
    
    // Remove loading spinners and states
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.classList.remove('loading');
    });
});
