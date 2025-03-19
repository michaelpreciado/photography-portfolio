/**
 * Mario Preciado Photography - 8-Bit Animations and Effects
 * Mobile-optimized 8-bit style animations
 */

'use strict';

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Initialize with a slight delay for better performance
    setTimeout(() => {
        initializePixelEffects(isMobile);
    }, isMobile ? 800 : 200);
});

/**
 * Initialize all pixel effects
 * @param {boolean} isMobile - Whether the device is a mobile device
 */
function initializePixelEffects(isMobile) {
    // Apply pixel text effect to headings and titles
    applyPixelTextEffect();
    
    // Initialize pixel hover effects
    initializePixelHoverEffects();
    
    // Initialize pixel scroll animations
    initializePixelScrollAnimations(isMobile);
    
    // Initialize pixel button effects
    initializePixelButtonEffects();
    
    // Initialize 8-bit image effects
    initialize8BitImageEffects();
}

/**
 * Apply pixel text effect to headings and titles
 */
function applyPixelTextEffect() {
    // Select all section titles and headings
    const titles = document.querySelectorAll('.section-title, h1, h2, h3');
    
    titles.forEach(title => {
        // Add pixel-text class
        title.classList.add('pixel-text');
        
        // Skip if already processed
        if (title.dataset.pixelized === 'true') return;
        
        // Mark as processed
        title.dataset.pixelized = 'true';
        
        // Get the original text
        const originalText = title.textContent;
        title.textContent = '';
        
        // Create a wrapper for the animation
        const wrapper = document.createElement('span');
        wrapper.className = 'pixel-text-wrapper';
        title.appendChild(wrapper);
        
        // Add each character with a delay
        [...originalText].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.animationDelay = `${index * 0.05}s`;
            span.className = 'pixel-char';
            wrapper.appendChild(span);
        });
    });
}

/**
 * Initialize pixel hover effects
 */
function initializePixelHoverEffects() {
    // Add pixel hover effect to navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.add('pixel-hover');
    });
    
    // Add pixel hover effect to images
    const images = document.querySelectorAll('.portfolio-grid img, .two-column-grid img');
    images.forEach(img => {
        img.classList.add('pixel-hover');
        
        // Add pixelated border
        img.classList.add('pixel-border');
    });
}

/**
 * Initialize pixel scroll animations
 * @param {boolean} isMobile - Whether the device is a mobile device
 */
function initializePixelScrollAnimations(isMobile) {
    // Get all elements that should animate on scroll
    const animElements = document.querySelectorAll('.portfolio-grid img, .two-column-grid img, .section-title');
    
    // Skip if no elements to animate
    if (animElements.length === 0) return;
    
    // Create intersection observer with appropriate threshold
    const threshold = isMobile ? 0.1 : 0.2;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add pixel animation class
                entry.target.classList.add('pixel-anim-in');
                
                // Stop observing after animation
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: threshold,
        rootMargin: '0px 0px -10% 0px'
    });
    
    // Observe each element
    animElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * Initialize pixel button effects
 */
function initializePixelButtonEffects() {
    // Convert buttons to pixel style
    const buttons = document.querySelectorAll('button, .submit-btn');
    
    buttons.forEach(button => {
        // Skip if already processed
        if (button.dataset.pixelized === 'true') return;
        
        // Mark as processed
        button.dataset.pixelized = 'true';
        
        // Add pixel button class
        button.classList.add('pixel-button');
        
        // Add click sound effect
        button.addEventListener('click', playPixelSound);
    });
}

/**
 * Play 8-bit sound effect
 */
function playPixelSound() {
    // Create audio context on first click (to comply with autoplay policies)
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Skip if audio context is not available or is suspended
    if (!window.audioContext || window.audioContext.state === 'suspended') return;
    
    // Create oscillator
    const oscillator = window.audioContext.createOscillator();
    const gainNode = window.audioContext.createGain();
    
    // Set up oscillator
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, window.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, window.audioContext.currentTime + 0.1);
    
    // Set up gain (volume)
    gainNode.gain.setValueAtTime(0.1, window.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.1);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(window.audioContext.destination);
    
    // Play sound
    oscillator.start();
    oscillator.stop(window.audioContext.currentTime + 0.1);
}

/**
 * Initialize 8-bit image effects
 */
function initialize8BitImageEffects() {
    // Get all images
    const images = document.querySelectorAll('img:not([data-no-pixel])');
    
    images.forEach(img => {
        // Skip if already processed
        if (img.dataset.pixelized === 'true') return;
        
        // Mark as processed
        img.dataset.pixelized = 'true';
        
        // Add pixelated rendering
        img.style.imageRendering = 'pixelated';
        
        // Create canvas for pixel effect when image loads
        img.addEventListener('load', function() {
            applyPixelEffect(this);
        });
        
        // If already loaded, apply effect now
        if (img.complete) {
            applyPixelEffect(img);
        }
    });
}

/**
 * Apply pixel effect to an image using canvas
 * @param {HTMLImageElement} img - The image to apply the effect to
 */
function applyPixelEffect(img) {
    // Skip for small images or images with no-pixel attribute
    if (img.width < 50 || img.dataset.noPixel === 'true') return;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const pixelSize = 4; // Size of each "pixel" in the effect
    const width = Math.floor(img.width / pixelSize);
    const height = Math.floor(img.height / pixelSize);
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw image at reduced size (for pixelation)
    ctx.drawImage(img, 0, 0, width, height);
    
    // Draw back to original size with nearest-neighbor interpolation
    ctx.imageSmoothingEnabled = false;
    
    // Create a new canvas for the final image
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = img.width;
    finalCanvas.height = img.height;
    
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = false;
    
    // Draw pixelated image
    finalCtx.drawImage(canvas, 0, 0, width, height, 0, 0, img.width, img.height);
    
    // Replace image source with canvas data
    const dataURL = finalCanvas.toDataURL('image/png');
    
    // Create a new image to replace the original
    const newImg = new Image();
    newImg.src = dataURL;
    newImg.alt = img.alt;
    newImg.className = img.className;
    newImg.style = img.style;
    newImg.dataset.pixelized = 'true';
    newImg.dataset.noPixel = 'true'; // Prevent re-processing
    
    // Replace the original image
    if (img.parentNode) {
        img.parentNode.replaceChild(newImg, img);
    }
} 