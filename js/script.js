// Fix for 100vh in iOS mobile Safari
/**
 * Mario Preciado Photography - Main JavaScript
 * Optimized for performance and accessibility
 * Version: 1.0.0
 */

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Set CSS custom property for viewport height (iOS fix)
function setVHVariable() {
    // First, get viewport height and multiply by 1% to get a value for 1vh unit
    const vh = window.innerHeight * 0.01;
    // Then set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Apply safe area insets for notched iOS devices
    const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px';
    const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px';
    
    document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
    document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
}

// Handle resize with improved performance using requestAnimationFrame
function debounce(func, wait = 200) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Set the --vh variable initially
setVHVariable();

// Update the --vh variable on resize with debounce
window.addEventListener('resize', debounce(setVHVariable));

// Update on orientation change for iOS
window.addEventListener('orientationchange', setVHVariable);

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements for better performance
    const backToTopButton = document.getElementById('back-to-top');
    const portfolioDisplay = document.getElementById('portfolio-display'); 
    const categoryButtonsContainer = document.querySelector('.portfolio-categories');
    const slideshowContainer = document.querySelector('.slideshow-container');
    
    // Mobile menu elements
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    const mobileNavOverlay = document.getElementById('mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
    const headerLogoTitle = document.querySelector('.header-logo-title'); // Added this line
    
    // Mobile menu toggle with improved accessibility
    if (mobileMenuToggle && mobileNavOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            
            // Toggle menu state
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
            body.classList.toggle('mobile-menu-active');
            mobileNavOverlay.setAttribute('aria-hidden', isExpanded);
            
            if (!isExpanded) {
                // Opening menu - prevent scrolling
                body.style.overflow = 'hidden';
                if (headerLogoTitle) { // Added this block
                    headerLogoTitle.classList.add('fade-out');
                }
                
                // iOS-specific fixes
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    body.style.position = 'fixed';
                    body.style.width = '100%';
                }
                
                // Focus trap for accessibility
                setTimeout(() => {
                    mobileNavLinks[0].focus();
                }, 100);
                
            } else {
                // Closing menu - restore scrolling
                body.style.overflow = '';
                if (headerLogoTitle) { // Added this block
                    headerLogoTitle.classList.remove('fade-out');
                }
                
                // iOS-specific fixes
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    body.style.position = '';
                    body.style.width = '';
                }
                
                // Return focus to toggle button
                mobileMenuToggle.focus();
            }
        });
        
        // Close mobile menu when escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && body.classList.contains('mobile-menu-active')) {
                mobileMenuToggle.click();
            }
        });
        
        // Close menu when a link is clicked
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                body.classList.remove('mobile-menu-active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileNavOverlay.setAttribute('aria-hidden', 'true');
                body.style.overflow = '';
                if (headerLogoTitle) { // Added this line
                    headerLogoTitle.classList.remove('fade-out');
                }
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    body.style.position = '';
                    body.style.width = '';
                }
            });
        });
    }
    
    // Enhanced header scroll behavior with smart hiding
    const header = document.querySelector('header');
    if (header) {
        let lastScrollTop = 0;
        let scrollTimer = null;
        let isScrolling = false;
        const scrollThreshold = 10; // Minimum scroll amount to trigger hide/show
        
        const handleScroll = () => {
            if (scrollTimer !== null) {
                clearTimeout(scrollTimer);
            }
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = scrollTop - lastScrollTop;
            
            // Apply scrolled class for styling
            if (scrollTop > 20) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
            
            // Smart hide/show header based on scroll direction
            if (!prefersReducedMotion) { // Skip animation if user prefers reduced motion
                // Only apply on pages that aren't the home page (which has fixed positioning)
                if (!document.body.classList.contains('home-page')) {
                    // Scrolling down and past threshold - hide header
                    if (scrollDelta > scrollThreshold && scrollTop > 100) {
                        header.classList.add('header-hidden');
                    } 
                    // Scrolling up - show header
                    else if (scrollDelta < -scrollThreshold) {
                        header.classList.remove('header-hidden');
                    }
                    // At top of page - always show header
                    else if (scrollTop < 10) {
                        header.classList.remove('header-hidden');
                    }
                }
            }
            
            lastScrollTop = scrollTop;
            isScrolling = true;
            
            // Reset scrolling state after scrolling stops
            scrollTimer = setTimeout(() => {
                isScrolling = false;
                // Always show header when user stops scrolling
                if (scrollTop < 300) { // Only auto-show near top of page
                    header.classList.remove('header-hidden');
                }
            }, 150);
        };
        
        // Use passive event listener for better scroll performance
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // --- Modal Elements --- //
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const captionText = document.getElementById('caption');
    const closeModal = document.querySelector('.close-modal');
    // Add refs for nav buttons
    const modalPrevButton = document.querySelector('.modal-prev');
    const modalNextButton = document.querySelector('.modal-next');

    // --- State for Modal Swipe Navigation --- //
    let currentModalImageIndex = -1;
    let activeCategoryImages = []; // Array of {src: '', alt: ''}
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0; // To prevent scroll hijacking
    let isSwiping = false; // Flag to track if swipe is in progress

    // --- Helper Function: Fisher-Yates (Knuth) Shuffle --- //
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Scroll Animations (Defined BEFORE use) --- //
    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% of item needs to be visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animation to save resources
                // observer.unobserve(entry.target);
            } else {
                 // Optional: Remove class if you want animation to repeat on scroll up
                 // entry.target.classList.remove('visible');
            }
        });
    };

    const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

    // Helper function to observe elements (Defined BEFORE use)
    function observeFadeInElements() {
         document.querySelectorAll('.fade-in').forEach(el => {
            // Check if already observed to avoid duplicates if called multiple times
            if (!el.dataset.observed) {
                 scrollObserver.observe(el);
                 el.dataset.observed = true; // Mark as observed
            }
        });
    }

    // --- Image Data (Categorized) --- //
    // ** IMPORTANT: Update these paths and categories to match your actual images **
    const portfolioImages = {
        'live-music': [
            'images/portfolio/live-music/portfolio_001.jpeg',
            'images/portfolio/live-music/portfolio_002.jpeg',
            'images/portfolio/live-music/portfolio_003.jpeg',
            'images/portfolio/live-music/portfolio_004.jpg',
            'images/portfolio/live-music/portfolio_005.jpeg',
            'images/portfolio/live-music/portfolio_006.JPG',
            'images/portfolio/live-music/portfolio_007.JPG',
            'images/portfolio/live-music/portfolio_008.jpg',
            'images/portfolio/live-music/portfolio_009.jpg',
            'images/portfolio/live-music/portfolio_010.jpg',
            'images/portfolio/live-music/portfolio_011.JPG',
            'images/portfolio/live-music/portfolio_012.JPG',
            'images/portfolio/live-music/portfolio_013.jpg',
            'images/portfolio/live-music/portfolio_014.jpeg',
            'images/portfolio/live-music/portfolio_015.jpeg',
            'images/portfolio/live-music/portfolio_016.jpeg',
            'images/portfolio/live-music/portfolio_017.jpg',
        ],
        'visuals': [
            // Combined category for Videography, Glitch Art, and Liquid Lights
            'images/portfolio/Visuals/SF.mp4', // Video file
            // Adding some images from live-music as placeholders for testing
            'images/portfolio/live-music/portfolio_001.jpeg',
            'images/portfolio/live-music/portfolio_005.jpeg',
            'images/portfolio/live-music/portfolio_008.jpg',
        ],
        'art': [
            // Add paths for Art images here later
        ],
        'typography': [
            // Add paths for Typography images here later
        ]
    };

    // --- Update Modal Content --- //
    function updateModalContent(index) {
        if (index >= 0 && index < activeCategoryImages.length) {
            currentModalImageIndex = index;
            const imageData = activeCategoryImages[index];

            // Fade out the current image
            modalImage.style.opacity = '0';

            // Wait for fade out, then change src and fade in
            setTimeout(() => {
                modalImage.src = imageData.src;
                captionText.innerHTML = imageData.alt;
                // Preload next and previous images for smoother transition
                preloadAdjacentImages(index);
                // Fade in the new image
                modalImage.style.opacity = '1';
            }, 300); // Should match the CSS transition duration

            // Show/hide nav buttons based on image count
            if (activeCategoryImages.length > 1) {
                modalPrevButton.style.display = 'block';
                modalNextButton.style.display = 'block';
            } else {
                modalPrevButton.style.display = 'none';
                modalNextButton.style.display = 'none';
            }
        }
    }

    // --- Preload Adjacent Images --- //
    function preloadAdjacentImages(index) {
        const prevIndex = (index - 1 + activeCategoryImages.length) % activeCategoryImages.length;
        const nextIndex = (index + 1) % activeCategoryImages.length;

        if (prevIndex !== index && activeCategoryImages[prevIndex]) {
            const prevImage = new Image();
            prevImage.src = activeCategoryImages[prevIndex].src;
        }
        if (nextIndex !== index && activeCategoryImages[nextIndex]) {
            const nextImage = new Image();
            nextImage.src = activeCategoryImages[nextIndex].src;
        }
    }

    // --- Load Portfolio Images By Category --- //
    // IMPORTANT: This is a complete rewrite of the image loading system to prevent duplicates
    // Global registry contains ALL displayed images, regardless of category
    const GLOBAL_IMAGE_REGISTRY = new Set();
    
    function loadPortfolioImagesByCategory(category, gridElement) {
        console.log(`Loading ${category} images - fixing duplicates issue`);
        
        if (!gridElement) {
            console.error('Target grid element not provided');
            return;
        }
        
        // Always start with a clean slate
        gridElement.innerHTML = '';
        
        // Get images for this category
        const imagePaths = portfolioImages[category] || [];
        if (imagePaths.length === 0) {
            gridElement.innerHTML = `<p style="text-align: center;">No images found for ${category}.</p>`;
            return;
        }
        
        // Temporary set just for this function execution
        const deduplicatedPaths = [];
        const seenInThisRun = new Set();
        
        // Process each image
        imagePaths.forEach(path => {
            // Normalize path for consistent comparison
            const normalizedPath = path.toLowerCase();
            const basename = normalizedPath.split('/').pop();
            
            // Only include each image once, ever
            if (!GLOBAL_IMAGE_REGISTRY.has(basename) && !seenInThisRun.has(basename)) {
                deduplicatedPaths.push(path);
                seenInThisRun.add(basename);
                GLOBAL_IMAGE_REGISTRY.add(basename);
            }
        });
        
        console.log(`${category}: Using ${deduplicatedPaths.length} unique images from ${imagePaths.length} total`);
        
        // If we have no unique images left (all were duplicates), clear global registry and try again
        if (deduplicatedPaths.length === 0 && imagePaths.length > 0) {
            console.log('All images were duplicates - resetting registry and trying again');
            GLOBAL_IMAGE_REGISTRY.clear();
            return loadPortfolioImagesByCategory(category, gridElement); // Recursive call after reset
        }

        // Shuffle unique images for random display
        const shuffledPaths = [...deduplicatedPaths];
        shuffleArray(shuffledPaths);

        // Create and append media (images/videos) with grid items for masonry layout
        const mediaElements = [];
        shuffledPaths.forEach(mediaPath => {
            // Create a grid item wrapper for each media item
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            
            // Check if the file is a video (mp4, webm, etc.)
            const isVideo = /\.(mp4|webm|mov)$/i.test(mediaPath);
            
            if (isVideo) {
                console.log('Loading video:', mediaPath); // Debug log
                
                // Create video element for video files
                const video = document.createElement('video');
                video.src = mediaPath;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.preload = 'auto';
                video.width = 320; // Set default width
                video.height = 240; // Set default height
                video.classList.add('fade-in');
                video.setAttribute('disablePictureInPicture', '');
                video.setAttribute('controlsList', 'nodownload');
                
                // Add error handling
                video.addEventListener('error', function(e) {
                    console.error('Video error:', e);
                    console.error('Video error code:', video.error ? video.error.code : 'unknown');
                });
                
                // Add loaded data event
                video.addEventListener('loadeddata', function() {
                    console.log('Video loaded successfully');
                    if (gridElement.msnry) {
                        gridElement.msnry.layout();
                    }
                });
                
                // Prevent right-click menu
                video.addEventListener('contextmenu', e => e.preventDefault());
                
                // Handle hardware acceleration
                video.style.willChange = 'transform';
                
                // Add video to grid item
                gridItem.appendChild(video);
                mediaElements.push(video);
                
                // Add click event for showing video in modal
                gridItem.addEventListener('click', function() {
                    showModal(mediaPath, `${category.replace('-', ' ')} video`);
                });
                
                // Add the grid item to the grid
                gridElement.appendChild(gridItem);
                
                // Force video to play
                setTimeout(() => {
                    video.play().catch(e => console.error('Video play error:', e));
                }, 100);
                
            } else {
                // Create and configure the image as before
                const img = document.createElement('img');
                img.src = mediaPath;
                img.alt = `${category.replace('-', ' ')} photo`; // Dynamic alt text
                img.classList.add('fade-in'); // Add class for scroll animation
                
                // Add error handling for images that fail to load
                img.onerror = function() {
                    console.error(`Failed to load image: ${mediaPath}`);
                    gridItem.remove(); // Remove the grid item if image fails to load
                    if (gridElement.msnry) {
                        gridElement.msnry.layout(); // Re-layout the grid
                    }
                };
                
                // Create a preloader to prevent reflow during masonry initialization
                const imgLoader = new Image();
                imgLoader.onload = function() {
                    // Once image is loaded, set proper dimensions
                    // For varied layouts, we can randomly adjust sizes for some images
                    if (Math.random() > 0.7) { // 30% of images will get special treatment
                        if (imgLoader.width > imgLoader.height) {
                            // Landscape image - can span 2 columns occasionally
                            if (Math.random() > 0.5) {
                                gridItem.style.width = 'calc(66.666% - 10px)'; // Two column width with gap
                            }
                        } else if (imgLoader.height > imgLoader.width * 1.5) {
                            // Very tall portrait image - might need special handling
                            img.style.maxHeight = '500px'; // Limit very tall images
                        }
                    }
                };
                imgLoader.src = mediaPath;
                
                // Add the image to the grid item
                gridItem.appendChild(img);
                mediaElements.push(img);
                
                // Add the grid item to the grid
                gridElement.appendChild(gridItem);
            }
        });

        // Initialize Masonry layout once all media items are added
        const msnry = new Masonry(gridElement, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-item',
            percentPosition: true,
            gutter: 4, // Reduced space between items from 10px to 4px
            horizontalOrder: false, // For a more varied layout
            transitionDuration: '0.3s' // Slightly faster transitions
        });

        // Use imagesLoaded to recalculate layout after all images have loaded
        imagesLoaded(gridElement).on('progress', function() {
            // Layout Masonry after each image loads
            msnry.layout();
        });
        
        // For videos, ensure layout is refreshed once they're loaded
        const videos = gridElement.querySelectorAll('video');
        videos.forEach(video => {
            video.addEventListener('loadeddata', function() {
                msnry.layout();
            });
        });

        // Observe newly added images for fade-in animation
        observeFadeInElements();

        // Store masonry instance for future reference
        gridElement.msnry = msnry;
        
        // Mark grid as loaded
        gridElement.dataset.loaded = true;
    }

    // --- Portfolio Category Switching Logic --- //
    if (categoryButtonsContainer && portfolioDisplay) {
        const buttons = categoryButtonsContainer.querySelectorAll('.category-button');
        const grids = portfolioDisplay.querySelectorAll('.image-grid');
        const portfolioSection = document.getElementById('portfolio'); // Get the parent section
        
        // Preload all categories when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Preloading all portfolio categories');
            // Load visuals category specifically to ensure video loads
            const visualsGrid = portfolioDisplay.querySelector('.visuals-grid');
            if (visualsGrid && !visualsGrid.dataset.loaded) {
                console.log('Preloading visuals category');
                loadPortfolioImagesByCategory('visuals', visualsGrid);
            }
        });

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                const targetGrid = portfolioDisplay.querySelector(`.${category}-grid`);

                if (!targetGrid) {
                    console.error(`Grid for category '${category}' not found.`);
                    return;
                }

                // --- Theme Switching --- //
                if (portfolioSection) {
                    // Remove previous theme classes
                    const themePrefix = 'theme-';
                    const classesToRemove = [];
                    for (const className of portfolioSection.classList) {
                        if (className.startsWith(themePrefix)) {
                            classesToRemove.push(className);
                        }
                    }
                    portfolioSection.classList.remove(...classesToRemove);

                    // Add new theme class
                    portfolioSection.classList.add(`theme-${category}`);
                }
                // --- End Theme Switching --- //

                // Update active button
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active grid
                grids.forEach(grid => grid.classList.remove('active'));
                targetGrid.classList.add('active');

                // Load images if not already loaded
                if (!targetGrid.dataset.loaded) {
                    loadPortfolioImagesByCategory(category, targetGrid);
                }
            });
        });

        // --- Initial Portfolio Load --- //
        const initialActiveButton = categoryButtonsContainer.querySelector('.category-button.active');
        if (initialActiveButton && portfolioSection) { // Also check for portfolioSection
            const initialCategory = initialActiveButton.dataset.category;
            const initialGrid = portfolioDisplay.querySelector(`.${initialCategory}-grid`);
            if (initialGrid) {
                 initialGrid.classList.add('active'); // Ensure initial grid is visible
                 // Apply initial theme class
                 portfolioSection.classList.add(`theme-${initialCategory}`);
                 loadPortfolioImagesByCategory(initialCategory, initialGrid);
            } else {
                console.error("Initial portfolio grid not found for active button.");
            }
        } else {
             console.warn("No active category button found on initial load.");
        }

    } else {
        // Only run portfolio logic if relevant elements exist (i.e., on portfolio.html)
        // console.log("Not on the portfolio page or necessary elements missing.");
    }

    // --- Back to Top Button Logic --- //
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Show button after scrolling 300px
            backToTopButton.style.display = 'block';
            backToTopButton.style.opacity = '1';
        } else {
            backToTopButton.style.opacity = '0';
            // Use setTimeout to hide only after fade out transition completes
            setTimeout(() => {
                if (window.pageYOffset <= 300) { // Re-check condition
                     backToTopButton.style.display = 'none';
                }
            }, 300); // Match CSS transition duration
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Smooth Scrolling for Nav Links --- //
    document.querySelectorAll('header nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Calculate position considering the fixed header
                const headerOffset = document.querySelector('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Initial observation for non-portfolio elements (if any) ---
    // Observe static fade-in elements present on page load (like sections in about/contact)
    observeFadeInElements(); 

    // --- Create Floating Peace Signs --- //
    function createPeaceSigns(count) {
        const background = document.getElementById('peace-background');
        if (!background) return;

        for (let i = 0; i < count; i++) {
            const sign = document.createElement('div');
            sign.classList.add('peace-sign');
            sign.textContent = '☮'; // Peace sign character

            // Randomize properties for variety
            const randomLeft = Math.random() * 100; // % position from left
            const randomDuration = Math.random() * 20 + 20; // Slower: 20-40 seconds duration
            const randomDelay = Math.random() * 25; // More spread out: 0-25 seconds delay
            const randomSize = Math.random() * 1.5 + 1; // 1rem - 2.5rem size

            sign.style.left = `${randomLeft}vw`;
            sign.style.animationDuration = `${randomDuration}s`;
            sign.style.animationDelay = `${randomDelay}s`;
            sign.style.fontSize = `${randomSize}rem`;

            background.appendChild(sign);
        }
    }

    // --- Initialize --- //
    console.log('Site script initializing.');
    createPeaceSigns(10); // Create fewer: 10 peace signs

    // --- Modal Event Listeners --- //
    if (modal && modalImage && closeModal && portfolioDisplay) {
        // Open modal when an image inside portfolio display is clicked
        portfolioDisplay.addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG') {
                // Populate activeCategoryImages based on the currently visible grid
                const activeGrid = portfolioDisplay.querySelector('.image-grid.active');
                if (activeGrid) {
                    activeCategoryImages = Array.from(activeGrid.querySelectorAll('img')).map((img, index) => {
                        // Find the index of the clicked image
                        if (img.src === event.target.src) {
                            currentModalImageIndex = index;
                        }
                        return { src: img.src, alt: img.alt };
                    });

                    if (currentModalImageIndex !== -1) {
                        modal.classList.add('visible'); // Use class to trigger CSS transition
                        updateModalContent(currentModalImageIndex); // Use the new function
                    } else {
                         console.error("Clicked image not found in active category array.");
                    }
                } else {
                    console.error("Could not determine active image grid.");
                }
            }
        });

        // Close modal when the close button is clicked
        closeModal.addEventListener('click', () => {
            modal.classList.remove('visible');
            modalPrevButton.style.display = 'none'; // Hide buttons
            modalNextButton.style.display = 'none'; // Hide buttons
            activeCategoryImages = []; // Clear the array when modal closes
            currentModalImageIndex = -1;
        });

        // Close modal when clicking outside the image content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) { // Only close if the click is on the modal background itself
                modal.classList.remove('visible');
                modalPrevButton.style.display = 'none'; // Hide buttons
                modalNextButton.style.display = 'none'; // Hide buttons
                activeCategoryImages = []; // Clear the array when modal closes
                currentModalImageIndex = -1;
            }
        });

        // --- Click Listeners for Modal Navigation Buttons --- //
        if (modalPrevButton && modalNextButton) {
            modalPrevButton.addEventListener('click', () => {
                if (currentModalImageIndex === -1 || activeCategoryImages.length <= 1) return;
                const prevIndex = (currentModalImageIndex - 1 + activeCategoryImages.length) % activeCategoryImages.length;
                updateModalContent(prevIndex);
            });

            modalNextButton.addEventListener('click', () => {
                if (currentModalImageIndex === -1 || activeCategoryImages.length <= 1) return;
                const nextIndex = (currentModalImageIndex + 1) % activeCategoryImages.length;
                updateModalContent(nextIndex);
            });
        }

        // --- Touch Swipe Listeners for Modal Image --- //
        modalImage.addEventListener('touchstart', (event) => {
            // event.preventDefault(); // Prevent default only if necessary, might interfere with zoom
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY; // Record start Y
            touchEndX = touchStartX; // Reset endX
            isSwiping = false; // Reset swipe flag
        }, { passive: true }); // Use passive: true initially if not preventing default scroll immediately

        modalImage.addEventListener('touchmove', (event) => {
            touchEndX = event.touches[0].clientX;
            const touchEndY = event.touches[0].clientY;
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);

            // Determine if it's primarily a horizontal swipe and prevent scroll
            if (deltaX > deltaY + 10 && !isSwiping) { // Threshold to confirm horizontal swipe intention
                isSwiping = true;
                // event.preventDefault(); // Uncomment if needed, but may block pinch-zoom. Test on device.
            }
             // If actively swiping horizontally, prevent vertical scroll
            if (isSwiping) {
                // event.preventDefault(); // Might be needed here too. Test required.
            }

        }, { passive: false }); // Use passive: false ONLY if you call preventDefault


        modalImage.addEventListener('touchend', () => {
            if (currentModalImageIndex === -1 || activeCategoryImages.length <= 1) {
                return; // No swipe needed if only one image or index is invalid
            }

            const swipeThreshold = 50; // Minimum pixels to register as a swipe
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) > swipeThreshold && isSwiping) { // Check isSwiping flag
                if (deltaX < 0) {
                    // Swiped Left (Next Image)
                    const nextIndex = (currentModalImageIndex + 1) % activeCategoryImages.length;
                    updateModalContent(nextIndex);
                } else {
                    // Swiped Right (Previous Image)
                    const prevIndex = (currentModalImageIndex - 1 + activeCategoryImages.length) % activeCategoryImages.length;
                    updateModalContent(prevIndex);
                }
            }
             // Reset variables after swipe attempt
            touchStartX = 0;
            touchEndX = 0;
            touchStartY = 0;
            isSwiping = false;
        });
    }

    // --- Slideshow Logic (Homepage) --- //
    if (slideshowContainer) {
        console.log('Initializing slideshow');
        const images = slideshowContainer.querySelectorAll('.slideshow-image');
        let currentImageIndex = 0; // Start with the first image
        let slideInterval = 7000; // Time each image is displayed (increased to 7 seconds)
        let slideTimer; // Variable to store the interval timer
        let isTransitioning = false; // Flag to prevent transition issues
        
        console.log('Found ' + images.length + ' slideshow images');

        // Function to show a specific image
        function showImage(index) {
            if (isTransitioning) return; // Prevent rapid transitions
            isTransitioning = true;
            
            // Remove active class from all images
            images.forEach(img => img.classList.remove('active'));
            
            // Add active class to the target image
            images[index].classList.add('active');
            console.log('Showing image index:', index);
            
            // Reset transition lock after transition completes
            setTimeout(() => {
                isTransitioning = false;
            }, 1500); // Match this to your CSS transition time
        }

        // Function to show the next image
        function showNextImage() {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            showImage(currentImageIndex);
        }

        // Function to show the previous image
        function showPrevImage() {
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            showImage(currentImageIndex);
        }

        // No navigation buttons - slideshow runs automatically

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                clearInterval(slideTimer);
                showPrevImage();
                slideTimer = setInterval(showNextImage, slideInterval);
            } else if (e.key === 'ArrowRight') {
                clearInterval(slideTimer);
                showNextImage();
                slideTimer = setInterval(showNextImage, slideInterval);
            }
        });

        // Initialize the slideshow
        if (images.length > 0) {
            console.log('Initializing slideshow with ' + images.length + ' images');
            
            // Show the first image immediately without any delay
            showImage(currentImageIndex);
            console.log('First image set to active: ' + images[currentImageIndex].src);
            
            // Only start slideshow if reduced motion is not preferred
            if (!prefersReducedMotion) {
                slideTimer = setInterval(showNextImage, slideInterval);
            } else {
                // For users who prefer reduced motion, show static image
                console.log('Reduced motion preference detected - static image mode');
            }
        } else {
            console.log('No slideshow images found');
        }
    }
    
    // Listen for changes in reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        const shouldReduceMotion = e.matches;
        if (shouldReduceMotion && slideTimer) {
            clearInterval(slideTimer);
            slideTimer = null;
        } else if (!shouldReduceMotion && !slideTimer && slideshowContainer) {
            slideTimer = setInterval(showNextImage, slideInterval);
        }
    });
});
