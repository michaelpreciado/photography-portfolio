/**
 * Mario Preciado Photography - Optimized Animations and Effects
 * This file contains all the animation effects for the website, optimized for iOS performance
 */

'use strict';

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if the device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Only initialize what's necessary for current view
    if (document.body.classList.contains('home-page')) {
        setTimeout(() => {
            initializeTextEffects();
            // Delay heavy animations on iOS
            if (isIOS) {
                setTimeout(() => {
                    initializeParticles(isIOS);
                }, 1000);
            } else {
                initializeParticles(isIOS);
            }
        }, 100);
    }
    
    // Delay scroll-based animations
    setTimeout(() => {
        initializeScrollAnimations(isIOS);
        initializeHoverEffects();
        initializePageTransitions();
    }, 300);
    
    // Only initialize custom cursor on non-iOS devices (touch not ideal for custom cursor)
    if (!isIOS) {
        initializeCustomCursor();
    }
});

/**
 * Particle animation for background - optimized for iOS
 * Creates a subtle animated particle effect in the background
 */
function initializeParticles(isIOS) {
    // Reduce number of particles for iOS devices
    const particleCount = isIOS ? 20 : 50;
    
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles-container';
    document.body.appendChild(particleContainer);

    // Create fewer particles on iOS
    for (let i = 0; i < particleCount; i++) {
        createParticle(particleContainer, isIOS);
    }
}

function createParticle(container, isIOS) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random position, size and animation duration - simpler for iOS
    const size = isIOS ? (Math.random() * 3 + 2) : (Math.random() * 5 + 2);
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = isIOS ? (Math.random() * 15 + 10) : (Math.random() * 20 + 10);
    const delay = Math.random() * 5;
    const opacity = isIOS ? (Math.random() * 0.3 + 0.1) : (Math.random() * 0.5 + 0.1);
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.opacity = opacity;
    
    // Add will-change for hardware acceleration (but use sparingly on iOS)
    if (!isIOS) {
        particle.style.willChange = 'transform, opacity';
    }
    
    // Apply transform: translateZ(0) for hardware acceleration
    particle.style.transform = 'translateZ(0)';
    
    container.appendChild(particle);
}

/**
 * Text animation effects - optimized for iOS
 */
function initializeTextEffects() {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Animate the main title with a simpler effect on iOS
    const mainTitle = document.querySelector('.logo-link');
    if (mainTitle) {
        // Use a simpler effect on iOS
        if (isIOS) {
            mainTitle.classList.add('simple-title-effect');
        } else {
            mainTitle.classList.add('glitch-effect');
        }
    }
    
    // Optimize section titles animation
    const sectionTitles = document.querySelectorAll('.section-title');
    
    // On iOS, use simpler animations with fewer DOM elements
    if (isIOS) {
        sectionTitles.forEach(title => {
            title.classList.add('ios-title-animation');
        });
    } else {
        // More complex animation for other devices
        sectionTitles.forEach(title => {
            const text = title.textContent;
            title.textContent = '';
            
            // Create spans for each character
            for (let i = 0; i < text.length; i++) {
                const span = document.createElement('span');
                span.textContent = text[i];
                span.style.animationDelay = `${i * 0.05}s`;
                title.appendChild(span);
            }
            
            title.classList.add('character-animation');
        });
    }
    
    // Handle intro text animations - only on homepage
    const introElements = document.querySelectorAll('.fade-in-animation');
    if (introElements.length > 0) {
        // Simpler animation for iOS
        if (isIOS) {
            introElements.forEach(el => {
                el.classList.add('ios-fade-in');
            });
        } else {
            introElements.forEach(el => {
                // Add staggered reveal for each word
                if (el.classList.contains('intro-text') || el.classList.contains('intro-text-secondary')) {
                    // Force the text to have proper spaces if it doesn't already
                    let originalText = el.textContent.trim();
                    
                    // If the text doesn't have spaces, manually add them
                    if (originalText === "WELCOMETOMYPAGE!") {
                        originalText = "WELCOME TO MY PAGE!";
                    }
                    
                    // Split by spaces (will work whether original had spaces or we just added them)
                    const words = originalText.split(' ');
                    el.textContent = '';
                    
                    words.forEach((word, index) => {
                        const wordSpan = document.createElement('span');
                        wordSpan.textContent = word;
                        wordSpan.style.display = 'inline-block';
                        wordSpan.style.animationDelay = `${0.5 + (index * 0.2)}s`;
                        wordSpan.classList.add('word-animation');
                        el.appendChild(wordSpan);
                        
                        // Add a space after each word except the last one
                        if (index < words.length - 1) {
                            const spaceSpan = document.createElement('span');
                            spaceSpan.innerHTML = '&nbsp;&nbsp;&nbsp;';
                            spaceSpan.style.display = 'inline-block';
                            el.appendChild(spaceSpan);
                        }
                    });
                }
            });
        }
    }
    
    // Add typing effect to specific elements - simplified for iOS
    const typingElements = document.querySelectorAll('.typing-effect');
    typingElements.forEach(el => {
        // Set data-text attribute for reference
        el.setAttribute('data-text', el.textContent);
        
        // Less intensive effect for iOS
        if (isIOS) {
            el.classList.add('ios-typing-effect');
        }
    });
    
    // Add special animation for about page content - optimized
    animateAboutContent();
}

/**
 * Special animation for about page content - optimized
 */
function animateAboutContent() {
    const aboutSummary = document.querySelector('.about-summary');
    if (!aboutSummary) return;
    
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Add staggered animation to each paragraph - simpler for iOS
    const paragraphs = aboutSummary.querySelectorAll('p');
    paragraphs.forEach((paragraph, index) => {
        paragraph.style.opacity = '0';
        
        // Simpler animation for iOS
        if (isIOS) {
            paragraph.style.transform = 'translateY(10px)';
            paragraph.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        } else {
            paragraph.style.transform = 'translateY(20px)';
            paragraph.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        }
        
        paragraph.style.transitionDelay = `${0.3 + (index * 0.2)}s`;
        
        // Use setTimeout to ensure the transition applies after initial state is set
        setTimeout(() => {
            paragraph.style.opacity = '1';
            paragraph.style.transform = 'translateY(0)';
        }, 100);
    });
}

/**
 * Scroll-triggered animations - optimized with IntersectionObserver and throttling
 */
function initializeScrollAnimations(isIOS) {
    // Use a smaller list of elements to observe on iOS
    const selector = isIOS ? '.section-title, .portfolio-grid img' : 
                    '.section-title, .about-content p, .about-content h2, .contact-info, .social-links, .portfolio-grid img';
    
    const elements = document.querySelectorAll(selector);
    
    // Set up IntersectionObserver with appropriate thresholds for iOS
    const threshold = isIOS ? 0.1 : 0.2;
    const rootMargin = isIOS ? '0px 0px 0px 0px' : '0px 0px -50px 0px';
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Use a simpler animation for iOS
                if (isIOS) {
                    entry.target.classList.add('ios-animate-in');
                } else {
                    entry.target.classList.add('animate-in');
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold, rootMargin });
    
    elements.forEach(el => {
        observer.observe(el);
    });
    
    // Optimize parallax effect with throttling and reduced impact on iOS
    let ticking = false;
    let lastScrollY = window.pageYOffset;
    
    window.addEventListener('scroll', () => {
        lastScrollY = window.pageYOffset;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const parallaxElements = document.querySelectorAll('.parallax-element');
                
                parallaxElements.forEach(el => {
                    // Reduce parallax effect on iOS for better performance
                    let speed = isIOS ? (parseFloat(el.dataset.speed) * 0.5 || 0.25) : (el.dataset.speed || 0.5);
                    
                    // Apply transform with hardware acceleration
                    el.style.transform = `translate3d(0, ${lastScrollY * speed}px, 0)`;
                });
                
                ticking = false;
            });
            
            ticking = true;
        }
    }, { passive: true }); // Add passive flag for better performance
}

/**
 * Hover effects for interactive elements - throttled for better performance
 */
function initializeHoverEffects() {
    // Add hover effect to navigation links
    const navLinks = document.querySelectorAll('.horizontal-nav a, .sidebar a');
    
    // Use simpler hover effects for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Process hover animations efficiently
    if (!isIOS) {
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.classList.add('hover-effect');
            });
            
            link.addEventListener('mouseleave', () => {
                link.classList.remove('hover-effect');
            });
        });
        
        // Add hover effect to images
        const images = document.querySelectorAll('.portfolio-grid img, .two-column-grid img');
        
        images.forEach(img => {
            img.addEventListener('mouseenter', () => {
                img.classList.add('hover-zoom');
            });
            
            img.addEventListener('mouseleave', () => {
                img.classList.remove('hover-zoom');
            });
        });
        
        // Add hover effect to social links
        const socialLinks = document.querySelectorAll('.social-links a');
        socialLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'scale(1.2)';
                link.style.transition = 'transform 0.3s ease';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.transform = 'scale(1)';
            });
        });
    }
}

/**
 * Page transition effects - optimized
 */
function initializePageTransitions() {
    // Check if iOS - use simpler transitions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Add transition overlay
    const overlay = document.createElement('div');
    overlay.className = isIOS ? 'simple-page-transition-overlay' : 'page-transition-overlay';
    document.body.appendChild(overlay);
    
    // Handle internal links for page transitions
    const internalLinks = document.querySelectorAll('a[href^="/"]:not([target]), a[href^="./"]:not([target]), a[href^="../"]:not([target]), a[href^="index.html"]:not([target]), a[href^="about.html"]:not([target]), a[href^="portfolio.html"]:not([target])');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Don't intercept if modifier keys are pressed
            if (e.metaKey || e.ctrlKey) return;
            
            const href = link.getAttribute('href');
            
            // Skip hash links on the same page
            if (href.startsWith('#') || (href.includes('#') && window.location.pathname === href.split('#')[0])) {
                return;
            }
            
            e.preventDefault();
            
            // Activate the transition overlay
            overlay.classList.add('active');
            
            // Use a shorter transition duration on iOS
            setTimeout(() => {
                window.location.href = href;
            }, isIOS ? 300 : 500);
        });
    });
}

/**
 * Custom cursor (disable on iOS)
 */
function initializeCustomCursor() {
    // Skip on iOS - not needed for touch devices
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        return;
    }
    
    // Create custom cursor elements
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    
    // Use requestAnimationFrame for smooth cursor movement
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    
    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });
    
    function updateCursor() {
        // Smooth interpolation for cursor movement
        cursorX += (targetX - cursorX) * 0.1;
        cursorY += (targetY - cursorY) * 0.1;
        
        // Update cursor position with hardware acceleration
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        
        // Continue the animation loop
        requestAnimationFrame(updateCursor);
    }
    
    // Start the animation loop
    requestAnimationFrame(updateCursor);
    
    // Handle cursor style changes on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .portfolio-grid img, .two-column-grid img');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
        });
    });
} 