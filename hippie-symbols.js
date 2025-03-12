/**
 * Mario Preciado Photography - Hippie Symbols Background
 * Creates floating hippie symbols in the background - optimized for iOS performance
 */

'use strict';

// Initialize the hippie symbols when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Add a slight delay before initializing for better initial page load performance
    setTimeout(() => {
        initializeHippieSymbols(isIOS);
    }, isIOS ? 1000 : 300);
    
    // Add debounced resize event listener
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce resize event to prevent excessive reinitialization
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Remove old symbols container
            const oldContainer = document.querySelector('.hippie-symbols-container');
            if (oldContainer) {
                oldContainer.remove();
            }
            
            // Initialize new symbols with proper count for current screen size
            initializeHippieSymbols(isIOS);
        }, 300);
    });
});

/**
 * Initialize the hippie symbols background
 * @param {boolean} isIOS - Whether the device is running iOS
 */
function initializeHippieSymbols(isIOS) {
    // Create container for the hippie symbols
    const symbolsContainer = document.createElement('div');
    symbolsContainer.className = 'hippie-symbols-container';
    document.body.appendChild(symbolsContainer);
    
    // Hippie symbols to use (peace sign, yin yang, flower, etc.)
    // Reduced set for iOS
    const hippieSymbols = isIOS ? 
        ['☮', '☯', '✿', '☀', '♡', '✌', '⚛', '♫', '☽', '★'] : 
        [
            '☮', // Peace sign
            '☯', // Yin yang
            '✿', // Flower
            '☀', // Sun
            '♡', // Heart
            '✌', // Victory/peace hand
            '⚛', // Atom
            '♫', // Music note
            '☽', // Moon
            '★', // Star
            '✺', // Sparkle
            '❀', // Flower
            '☄', // Comet
            '♬', // Music notes
            '☁', // Cloud
            '♥', // Heart
            '☼', // Sun with rays
            '✡', // Star of David
            '☪', // Star and crescent
            '♾', // Infinity
            '✨', // Sparkles
            '⚘', // Flower
            '❂', // Circled open center star
            '✵', // Eight-pointed star
            '✹', // Six-pointed black star
            '⚝', // Outlined white star
            '✧', // White four-pointed star
            '⚘', // Flower
            '✤', // Heavy four balloon-spoked asterisk
            '♻', // Recycling symbol
            '✽', // Heavy teardrop-spoked pinwheel asterisk
            '✷', // Six-pointed asterisk
            '☘', // Shamrock
            '⚕', // Staff of aesculapius
            '❁', // Flower
            '❅', // Snowflake
        ];
    
    // Create fewer symbols on iOS devices
    const symbolCount = isIOS ? 
        Math.min(10, Math.floor(window.innerWidth / 100)) : 
        Math.min(25, Math.floor(window.innerWidth / 60));
    
    for (let i = 0; i < symbolCount; i++) {
        createHippieSymbol(symbolsContainer, hippieSymbols, isIOS);
    }
    
    // Skip parallax effect on iOS for better performance
    if (!isIOS) {
        // Add parallax effect to symbols on mouse move - add passive flag for better performance
        document.addEventListener('mousemove', (e) => {
            const symbols = document.querySelectorAll('.hippie-symbol');
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;
            
            // Use requestAnimationFrame for smoother performance
            requestAnimationFrame(() => {
                symbols.forEach(symbol => {
                    const depth = parseFloat(symbol.getAttribute('data-depth'));
                    const moveX = mouseX * depth * 40;
                    const moveY = mouseY * depth * 40;
                    
                    // Simplified transform with fewer calculations
                    symbol.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
                });
            });
        }, { passive: true });
        
        // Add throttled scroll effect
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            lastScrollY = window.scrollY;
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const symbols = document.querySelectorAll('.hippie-symbol');
                    
                    symbols.forEach(symbol => {
                        const depth = parseFloat(symbol.getAttribute('data-depth'));
                        const moveY = lastScrollY * depth * 0.1;
                        
                        // Update only Y transform for better performance
                        symbol.style.transform = `translate3d(0, ${moveY}px, 0)`;
                    });
                    
                    ticking = false;
                });
                
                ticking = true;
            }
        }, { passive: true });
    }
}

/**
 * Create a single hippie symbol element
 * @param {HTMLElement} container - The container to append the symbol to
 * @param {Array} symbolsArray - Array of symbols to choose from
 * @param {boolean} isIOS - Whether the device is running iOS
 */
function createHippieSymbol(container, symbolsArray, isIOS) {
    const symbol = document.createElement('div');
    symbol.className = 'hippie-symbol';
    
    // Random symbol from the array
    const randomSymbol = symbolsArray[Math.floor(Math.random() * symbolsArray.length)];
    symbol.textContent = randomSymbol;
    
    // Random position, size, and animation properties - simplified for iOS
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    // Smaller size range for iOS
    const size = isIOS ? 
        (Math.random() * 40 + 30) : // 30-70px for iOS
        (Math.random() * 60 + 40);  // 40-100px for others
        
    // Longer animation duration for iOS (slower = less CPU)
    const duration = isIOS ? 
        (Math.random() * 15 + 35) : // 35-50s for iOS 
        (Math.random() * 20 + 30);  // 30-50s for others
        
    const delay = Math.random() * 10;
    // Less parallax effect on iOS
    const depth = isIOS ? 
        (Math.random() * 0.4 + 0.1) : // 0.1-0.5 for iOS
        (Math.random() * 0.8 + 0.2);  // 0.2-1.0 for others
        
    // More transparent on iOS for less visual noise
    const opacity = isIOS ? (depth * 0.4) : (depth * 0.5);
    const hue = Math.floor(Math.random() * 360); // Random hue for color
    
    // iOS doesn't get unique animations - use a single shared animation
    if (isIOS) {
        // Apply styles directly without custom keyframes
        symbol.style.left = `${posX}%`;
        symbol.style.top = `${posY}%`;
        symbol.style.fontSize = `${size}px`;
        symbol.style.opacity = opacity;
        symbol.style.color = `hsla(${hue}, 100%, 70%, ${opacity})`;
        symbol.style.textShadow = `0 0 ${size/8}px hsla(${hue}, 100%, 70%, 0.7)`; // Less glow
        
        // Use shared animations - much better for performance
        symbol.style.animationName = 'float-simple, simple-pulse';
        symbol.style.animationDuration = `${duration}s, 6s`;
        symbol.style.animationTimingFunction = 'ease-in-out, ease-in-out';
        symbol.style.animationIterationCount = 'infinite, infinite';
        symbol.style.animationDirection = 'alternate, alternate';
        symbol.style.animationDelay = `${delay}s, 0s`;
    } else {
        // Create a unique animation name for this symbol
        const animationName = `float-3d-${Math.floor(Math.random() * 1000)}`;
        
        // Create a unique keyframe animation for this symbol - made more random
        const keyframes = `
            @keyframes ${animationName} {
                0% {
                    transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
                }
                25% {
                    transform: translate3d(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px, ${Math.random() * 150}px) 
                               rotateX(${Math.random() * 30}deg) rotateY(${Math.random() * 30}deg) rotateZ(${Math.random() * 15}deg);
                }
                50% {
                    transform: translate3d(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px, ${Math.random() * 150}px) 
                               rotateX(${Math.random() * 30}deg) rotateY(${Math.random() * 30}deg) rotateZ(${Math.random() * 15}deg);
                }
                75% {
                    transform: translate3d(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px, ${Math.random() * 150}px) 
                               rotateX(${Math.random() * 30}deg) rotateY(${Math.random() * 30}deg) rotateZ(${Math.random() * 15}deg);
                }
                100% {
                    transform: translate3d(${Math.random() * 60 - 30}px, ${Math.random() * 60 - 30}px, ${Math.random() * 150}px) 
                               rotateX(${Math.random() * 30}deg) rotateY(${Math.random() * 30}deg) rotateZ(${Math.random() * 15}deg);
                }
            }
        `;
        
        // Add the keyframes to the document
        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
        
        // Apply styles
        symbol.style.left = `${posX}%`;
        symbol.style.top = `${posY}%`;
        symbol.style.fontSize = `${size}px`;
        symbol.style.animationName = `${animationName}, pulse-glow`;
        symbol.style.animationDuration = `${duration}s, 4s`;
        symbol.style.animationTimingFunction = 'ease-in-out, ease-in-out';
        symbol.style.animationIterationCount = 'infinite, infinite';
        symbol.style.animationDirection = 'alternate, alternate';
        symbol.style.animationDelay = `${delay}s, 0s`;
        symbol.style.opacity = opacity;
        symbol.style.color = `hsla(${hue}, 100%, 70%, ${opacity})`;
        symbol.style.textShadow = `0 0 ${size/5}px hsla(${hue}, 100%, 70%, 0.8)`;
        
        // Add 3D effect with CSS variables for better performance
        symbol.style.setProperty('--depth', depth);
        symbol.style.setProperty('--z-index', Math.floor(depth * 10));
        symbol.style.zIndex = Math.floor(depth * 10) - 10;
    }
    
    // Set data attribute for parallax effect
    symbol.setAttribute('data-depth', depth.toFixed(2));
    
    // Add to container
    container.appendChild(symbol);
}

// Add shared keyframes for iOS to the document
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    const sharedKeyframes = `
        @keyframes float-simple {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(0, 10px, 0); }
        }
        
        @keyframes simple-pulse {
            0% { opacity: 0.5; }
            100% { opacity: 0.8; }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = sharedKeyframes;
    document.head.appendChild(styleSheet);
} 