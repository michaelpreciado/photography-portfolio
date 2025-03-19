/**
 * Mario Preciado Photography - Peace Symbols Background
 * Creates floating peace symbols in the background - optimized for mobile performance
 */

'use strict';

// Initialize the peace symbols when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Add a slight delay before initializing for better initial page load performance
    setTimeout(() => {
        initializePeaceSymbols(isMobile);
    }, isMobile ? 1000 : 300);
    
    // Add debounced resize event listener
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce resize event to prevent excessive reinitialization
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Remove old symbols container
            const oldContainer = document.querySelector('.peace-symbols-container');
            if (oldContainer) {
                oldContainer.remove();
            }
            
            // Initialize new symbols with proper count for current screen size
            initializePeaceSymbols(isMobile);
        }, 200);
    });
});

/**
 * Initialize peace symbols in the background
 * @param {boolean} isMobile - Whether the device is a mobile device
 */
function initializePeaceSymbols(isMobile) {
    // Create container for peace symbols
    const container = document.createElement('div');
    container.className = 'peace-symbols-container';
    document.body.appendChild(container);
    
    // Determine number of symbols based on screen size and device
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenArea = width * height;
    
    // Fewer symbols on mobile for better performance
    let symbolCount = isMobile ? Math.floor(screenArea / 60000) : Math.floor(screenArea / 40000);
    
    // Limit the maximum number of symbols
    symbolCount = Math.min(symbolCount, isMobile ? 8 : 15);
    
    // Create peace symbols
    for (let i = 0; i < symbolCount; i++) {
        createPeaceSymbol(container);
    }
}

/**
 * Create a single peace symbol element
 * @param {HTMLElement} container - The container to append the symbol to
 */
function createPeaceSymbol(container) {
    // Create peace symbol element
    const symbol = document.createElement('div');
    symbol.className = 'peace-symbol';
    
    // Set random position
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    symbol.style.left = `${x}%`;
    symbol.style.top = `${y}%`;
    
    // Set random size (smaller on mobile)
    const size = Math.floor(Math.random() * 16) + 32; // 32-48px
    symbol.style.width = `${size}px`;
    symbol.style.height = `${size}px`;
    
    // Set random animation delay
    const delay = Math.random() * 10;
    symbol.style.setProperty('--delay', delay);
    
    // Set random brightness
    const brightness = Math.random() * 0.3 + 0.7; // 0.7-1.0
    symbol.style.setProperty('--brightness', brightness);
    
    // Set random animation duration
    const duration = Math.random() * 10 + 15; // 15-25s
    symbol.style.setProperty('--duration', `${duration}s`);
    
    // Add to container
    container.appendChild(symbol);
    
    // Use 8-bit pixel art for peace symbols
    applyPixelArtStyle(symbol);
}

/**
 * Apply 8-bit pixel art style to an element
 * @param {HTMLElement} element - The element to apply the style to
 */
function applyPixelArtStyle(element) {
    // Choose between two main colors: teal or yellow/gold (with teal being more common)
    const mainColors = [
        '#5bcfc8', // teal
        '#5bcfc8', // teal (duplicated to increase probability)
        '#d4af37'  // gold
    ];
    
    const mainColor = mainColors[Math.floor(Math.random() * mainColors.length)];
    const outlineColor = mainColor === '#5bcfc8' ? '#7de8e3' : '#ffd700'; // Lighter version for outline
    
    // Create truly pixelated 8-bit peace symbol SVG that matches the image
    const pixelPeaceSymbol = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%">
            <!-- Pixelated circle outline -->
            <path fill="${outlineColor}" d="M6,0 h4 v1 h2 v1 h1 v2 h1 v4 h-1 v2 h-1 v2 h-2 v1 h-4 v-1 h-2 v-2 h-1 v-2 h-1 v-4 h1 v-2 h1 v-1 h2 z" />
            
            <!-- Main circle fill -->
            <path fill="${mainColor}" d="M6,1 h4 v1 h1 v1 h1 v1 h1 v4 h-1 v1 h-1 v1 h-1 v1 h-4 v-1 h-1 v-1 h-1 v-1 h-1 v-4 h1 v-1 h1 v-1 h1 z" />
            
            <!-- Dark inner circle for contrast -->
            <path fill="#000000" d="M7,2 h2 v1 h1 v1 h1 v1 h1 v2 h-1 v2 h-1 v1 h-1 v1 h-2 v-1 h-1 v-1 h-1 v-2 h-1 v-2 h1 v-1 h1 v-1 h1 z" />
            
            <!-- Peace sign vertical line -->
            <path fill="${outlineColor}" d="M7,4 h2 v6 h-2 z" />
            
            <!-- Peace sign diagonal lines -->
            <path fill="${outlineColor}" d="M8,7 l-2,-2 l1,-1 l1,1 l1,-1 l1,1 z" />
        </svg>
    `;
    
    // Set the SVG as content
    element.innerHTML = pixelPeaceSymbol;
    
    // Apply pixelated rendering
    element.style.imageRendering = 'pixelated';
    
    // Add a subtle glow effect based on the main color
    const colorRGB = mainColor === '#5bcfc8' 
        ? '91, 207, 200'  // RGB for teal
        : '212, 175, 55'; // RGB for gold
    
    element.style.filter = `drop-shadow(0 0 3px rgba(${colorRGB}, 0.7))`;
} 