/**
 * Mario Preciado Photography - Hippie Symbols Background
 * Creates floating 3D hippie symbols in the background of all pages
 */

'use strict';

// Initialize the hippie symbols when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeHippieSymbols();
    
    // Add resize event listener
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
            initializeHippieSymbols();
        }, 300);
    });
});

/**
 * Initialize the hippie symbols background
 */
function initializeHippieSymbols() {
    // Create container for the hippie symbols
    const symbolsContainer = document.createElement('div');
    symbolsContainer.className = 'hippie-symbols-container';
    document.body.appendChild(symbolsContainer);
    
    // Hippie symbols to use (peace sign, yin yang, flower, etc.)
    const hippieSymbols = [
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
    
    // Create multiple hippie symbols - increased from Math.min(20, Math.floor(window.innerWidth / 80))
    const symbolCount = Math.min(35, Math.floor(window.innerWidth / 60));
    
    for (let i = 0; i < symbolCount; i++) {
        createHippieSymbol(symbolsContainer, hippieSymbols);
    }
    
    // Add parallax effect to symbols on mouse move
    document.addEventListener('mousemove', (e) => {
        const symbols = document.querySelectorAll('.hippie-symbol');
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;
        
        symbols.forEach(symbol => {
            const depth = parseFloat(symbol.getAttribute('data-depth'));
            const moveX = mouseX * depth * 40;
            const moveY = mouseY * depth * 40;
            const rotateX = mouseY * depth * 20;
            const rotateY = -mouseX * depth * 20;
            const rotate = mouseX * mouseY * depth * 100;
            
            symbol.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotate(${rotate}deg)`;
        });
    });
    
    // Add scroll effect
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const symbols = document.querySelectorAll('.hippie-symbol');
        
        symbols.forEach(symbol => {
            const depth = parseFloat(symbol.getAttribute('data-depth'));
            const moveY = scrollY * depth * 0.1;
            
            // Get current transform and update only the Y translation
            const currentTransform = symbol.style.transform;
            if (currentTransform) {
                const updatedTransform = currentTransform.replace(
                    /translateY\([^)]*\)/,
                    `translateY(${moveY}px)`
                );
                symbol.style.transform = updatedTransform;
            }
        });
    });
}

/**
 * Create a single hippie symbol element
 */
function createHippieSymbol(container, symbolsArray) {
    const symbol = document.createElement('div');
    symbol.className = 'hippie-symbol';
    
    // Random symbol from the array
    const randomSymbol = symbolsArray[Math.floor(Math.random() * symbolsArray.length)];
    symbol.textContent = randomSymbol;
    
    // Random position, size, and animation properties
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const size = Math.random() * 60 + 40; // 40-100px
    const duration = Math.random() * 20 + 30; // 30-50s
    const delay = Math.random() * 10;
    const depth = Math.random() * 0.8 + 0.2; // 0.2-1.0 for parallax effect
    const opacity = depth * 0.5; // More distant symbols are more transparent
    const hue = Math.floor(Math.random() * 360); // Random hue for color
    
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
    
    // Set data attribute for parallax effect
    symbol.setAttribute('data-depth', depth.toFixed(2));
    
    // Add to container
    container.appendChild(symbol);
} 