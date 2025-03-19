/**
 * Mario Preciado Photography - Animations and Effects
 * This file contains all the animation effects for the website
 */

'use strict';

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeParticles();
    initializeTextEffects();
    initializeScrollAnimations();
    initializeHoverEffects();
    initializePageTransitions();
    initializeCustomCursor();
});

/**
 * Particle animation for background
 * Creates a subtle animated particle effect in the background
 */
function initializeParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles-container';
    document.body.appendChild(particleContainer);

    // Create particles
    for (let i = 0; i < 50; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random position, size and animation duration
    const size = Math.random() * 5 + 2;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.5 + 0.1;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.opacity = opacity;
    
    container.appendChild(particle);
}

/**
 * Text animation effects
 * Adds animation to headings and text elements
 */
function initializeTextEffects() {
    // Animate the main title with a glitch effect
    const mainTitle = document.querySelector('.logo-link');
    if (mainTitle) {
        mainTitle.classList.add('glitch-effect');
    }
    
    // Split section titles into individual characters for animation
    const sectionTitles = document.querySelectorAll('.section-title');
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
    
    // Handle intro text animations - only on homepage
    const introElements = document.querySelectorAll('.fade-in-animation');
    if (introElements.length > 0) {
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
    
    // Add typing effect to specific elements
    const typingElements = document.querySelectorAll('.typing-effect');
    typingElements.forEach(el => {
        // Set data-text attribute for reference
        el.setAttribute('data-text', el.textContent);
    });
    
    // Add special animation for about page content
    animateAboutContent();
}

/**
 * Special animation for about page content
 */
function animateAboutContent() {
    const aboutSummary = document.querySelector('.about-summary');
    if (!aboutSummary) return;
    
    // Add staggered animation to each paragraph
    const paragraphs = aboutSummary.querySelectorAll('p');
    paragraphs.forEach((paragraph, index) => {
        paragraph.style.opacity = '0';
        paragraph.style.transform = 'translateY(20px)';
        paragraph.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        paragraph.style.transitionDelay = `${0.5 + (index * 0.3)}s`;
        
        // Use setTimeout to ensure the transition applies after initial state is set
        setTimeout(() => {
            paragraph.style.opacity = '1';
            paragraph.style.transform = 'translateY(0)';
        }, 100);
    });
}

/**
 * Scroll-triggered animations
 * Elements animate as they enter the viewport
 */
function initializeScrollAnimations() {
    // Elements to observe for scroll animations
    const elements = document.querySelectorAll('.section-title, .about-content p, .about-content h2, .contact-info, .social-links, .portfolio-grid img');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => {
        observer.observe(el);
    });
    
    // Parallax effect for images
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.5;
            el.style.transform = `translateY(${scrollPosition * speed}px)`;
        });
    });
}

/**
 * Hover effects for interactive elements
 */
function initializeHoverEffects() {
    // Add hover effect to navigation links
    const navLinks = document.querySelectorAll('.horizontal-nav a, .sidebar a');
    
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

/**
 * Page transition effects
 * Smooth transitions between pages
 */
function initializePageTransitions() {
    // Add transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);
    
    // Handle internal links for page transitions
    const internalLinks = document.querySelectorAll('a[href^="/"]:not([target]), a[href^="./"]:not([target]), a[href^="../"]:not([target]), a[href^="index.html"]:not([target]), a[href^="about.html"]:not([target]), a[href^="portfolio.html"]:not([target])');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Skip if modifier keys are pressed
            if (e.metaKey || e.ctrlKey) return;
            
            e.preventDefault();
            const targetUrl = link.href;
            
            // Trigger exit animation
            overlay.classList.add('active');
            
            // Navigate after animation completes
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 500);
        });
    });
    
    // Handle page load animation
    window.addEventListener('load', () => {
        document.body.classList.add('page-loaded');
        
        // Remove overlay after page load
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    });
}

/**
 * Cursor effect
 * Custom cursor effect that follows mouse movement
 */
function initializeCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    
    // Update cursor position on mouse move
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    });
    
    // Add hover effect when over clickable elements
    const clickableElements = document.querySelectorAll('a, button, input[type="submit"], input[type="button"]');
    
    clickableElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
        });
    });
} 