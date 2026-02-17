// @ts-check
// Fix for 100vh in iOS mobile Safari
/**
 * Mario Preciado Photography - Main JavaScript
 * Optimized for performance and accessibility
 * Version: 1.0.0
 */

const APP_DEBUG = window.location.search.includes('debug=true');
const logger = {
    info(message, meta) {
        if (!APP_DEBUG) return;
        console.info('[site]', message, meta || '');
    },
    warn(message, meta) {
        console.warn('[site]', message, meta || '');
    },
    error(message, meta) {
        console.error('[site]', message, meta || '');
    }
};

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Optimized image manifest support
const OPTIMIZED_MANIFEST_URL = 'images/optimized/manifest.json';
let optimizedManifestPromise = null;
let optimizedManifestData = null;
const optimizedImageCache = new Map();

function loadOptimizedManifest() {
    if (!optimizedManifestPromise) {
        optimizedManifestPromise = fetch(OPTIMIZED_MANIFEST_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load manifest: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                optimizedManifestData = data;
                return data;
            })
            .catch(error => {
                logger.warn('Unable to load optimized manifest, falling back to original assets.', error);
                optimizedManifestData = null;
                return null;
            });
    }
    return optimizedManifestPromise;
}

function resolveOptimizedPath(entry, format, size) {
    if (!entry?.formats?.[format]?.[size]) return null;
    return `images/optimized/${entry.formats[format][size]}`;
}

function buildSrcSet(formatData, allowedSizes = ['320', '640', '960', '1280']) {
    if (!formatData) return null;
    const parts = allowedSizes
        .filter(size => formatData[size])
        .map(size => `images/optimized/${formatData[size]} ${size}w`);
    return parts.length ? parts.join(', ') : null;
}

async function getOptimizedImageAsset(originalPath) {
    if (!originalPath) return null;

    if (optimizedImageCache.has(originalPath)) {
        return optimizedImageCache.get(originalPath);
    }

    if (!optimizedManifestData) {
        await loadOptimizedManifest();
    }

    if (!optimizedManifestData) {
        optimizedImageCache.set(originalPath, null);
        return null;
    }

    const manifestEntry = optimizedManifestData.images.find(item => item.original === originalPath);

    if (!manifestEntry) {
        optimizedImageCache.set(originalPath, null);
        return null;
    }

    const bestFullSize = resolveOptimizedPath(manifestEntry, 'jpeg', '2048')
        || resolveOptimizedPath(manifestEntry, 'jpeg', '1600')
        || resolveOptimizedPath(manifestEntry, 'webp', '2048')
        || resolveOptimizedPath(manifestEntry, 'webp', '1600')
        || originalPath;

    const displaySource = resolveOptimizedPath(manifestEntry, 'webp', '640')
        || resolveOptimizedPath(manifestEntry, 'jpeg', '640')
        || resolveOptimizedPath(manifestEntry, 'webp', '320')
        || resolveOptimizedPath(manifestEntry, 'jpeg', '320')
        || originalPath;

    const thumbnailSource = resolveOptimizedPath(manifestEntry, 'webp', '320')
        || resolveOptimizedPath(manifestEntry, 'jpeg', '320')
        || displaySource;

    const imageData = {
        original: originalPath,
        placeholder: manifestEntry.lqip || '',
        full: bestFullSize,
        display: displaySource,
        thumbnail: thumbnailSource,
        sources: []
    };

    const avifSrcSet = buildSrcSet(manifestEntry.formats.avif);
    if (avifSrcSet) {
        imageData.sources.push({ type: 'image/avif', srcset: avifSrcSet });
    }

    const webpSrcSet = buildSrcSet(manifestEntry.formats.webp);
    if (webpSrcSet) {
        imageData.sources.push({ type: 'image/webp', srcset: webpSrcSet });
    }

    imageData.fallbackSrcSet = buildSrcSet(manifestEntry.formats.jpeg);

    optimizedImageCache.set(originalPath, imageData);
    return imageData;
}

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

// Advanced lazy loading with LQIP support for 120fps performance
class LazyImageLoader {
    constructor() {
        this.imageManifest = null;
        this.observer = null;
        this.init();
    }

    async init() {
        try {
            // Load image manifest for LQIP data
            const response = await fetch('images/optimized/manifest.json');
            this.imageManifest = await response.json();

            // Set up IntersectionObserver for lazy loading
            this.setupIntersectionObserver();

            // Process existing images
            this.processImages();
        } catch (error) {
            logger.warn('Failed to load image manifest, falling back to basic lazy loading:', error);
            this.setupBasicLazyLoading();
        }
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px', // Start loading 50px before entering viewport
            threshold: 0.01 // Trigger when 1% is visible
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    }

    processImages() {
        // Process all lazy images
        const lazyImages = document.querySelectorAll('img[loading="lazy"], picture');
        lazyImages.forEach(element => {
            if (element.tagName === 'PICTURE') {
                const img = element.querySelector('img');
                if (img && img.loading === 'lazy') {
                    this.setupLQIP(element, img);
                    this.observer.observe(element);
                }
            } else if (element.loading === 'lazy') {
                this.setupLQIP(null, element);
                this.observer.observe(element);
            }
        });
    }

    setupLQIP(picture, img) {
        // Find LQIP data from manifest
        const src = img.src || img.dataset.src;
        if (!src || !this.imageManifest) return;

        // Do not add LQIP placeholders for fullscreen slideshow images
        if (img.classList && img.classList.contains('slideshow-image')) {
            return;
        }

        // Extract filename from src
        const filename = src.split('/').pop().split('-')[0];
        const imageData = this.imageManifest.images.find(item =>
            item.original.includes(filename)
        );

        if (imageData && imageData.lqip) {
            // Create LQIP placeholder
            const placeholder = new Image();
            placeholder.src = imageData.lqip;
            placeholder.className = 'lqip-placeholder';
            placeholder.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: blur(8px);
                transition: opacity 0.3s ease;
                /* Keep placeholder behind real image to avoid covering it */
                z-index: -2;
            `;

            // Add placeholder to container
            const container = picture || img.parentElement;
            if (container) {
                container.style.position = 'relative';
                container.insertBefore(placeholder, picture || img);

                // Store reference for cleanup
                img.dataset.placeholder = 'true';
            }
        }
    }

    loadImage(element) {
        const img = element.tagName === 'PICTURE' ? element.querySelector('img') : element;

        if (!img) return;

        // Create a new image to preload
        const imageLoader = new Image();

        imageLoader.onload = () => {
            // Image loaded successfully
            this.revealImage(element, img);
        };

        imageLoader.onerror = () => {
            // Fallback on error
            logger.warn('Failed to load image', { src: img.src });
            this.revealImage(element, img);
        };

        // Start loading the full image
        if (img.dataset.src) {
            imageLoader.src = img.dataset.src;
            img.src = img.dataset.src;
        } else {
            imageLoader.src = img.src;
        }

        // Load srcset if available
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
        }
    }

    revealImage(container, img) {
        // Add loaded class for CSS animations
        img.classList.add('lazy-loaded');

        // Remove LQIP placeholder with fade out
        const placeholder = container.querySelector('.lqip-placeholder');
        if (placeholder) {
            placeholder.style.opacity = '0';
            setTimeout(() => {
                if (placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
            }, 300);
        }

        // Trigger any additional animations
        if (typeof window.triggerImageLoadAnimation === 'function') {
            window.triggerImageLoadAnimation(img);
        }
    }

    setupBasicLazyLoading() {
        // Fallback lazy loading without LQIP
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target.tagName === 'PICTURE'
                        ? entry.target.querySelector('img')
                        : entry.target;

                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }

                    img.classList.add('lazy-loaded');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        const lazyImages = document.querySelectorAll('img[loading="lazy"], picture');
        lazyImages.forEach(img => observer.observe(img));
        this.observer = observer; // Keep reference
    }

    // Allow observing new elements dynamically
    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        }
    }
}

// Initialize and expose globally
const lazyLoader = new LazyImageLoader();
window.lazyImageLoader = lazyLoader;

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
        let isScrolling = false;
        const scrollThreshold = 10; // Minimum scroll amount to trigger hide/show

        const updateHeaderState = () => {
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
            isScrolling = false;
        };

        const onScroll = () => {
            if (!isScrolling) {
                requestAnimationFrame(updateHeaderState);
                isScrolling = true;
            }
        };

        // Use passive event listener for better scroll performance
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // --- Modal Elements --- //
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const captionText = document.getElementById('caption');
    const closeModal = document.querySelector('.close-modal');
    // Add refs for nav buttons
    const modalPrevButton = document.querySelector('.modal-prev');
    const modalNextButton = document.querySelector('.modal-next');
    let modalVideo = document.getElementById('modalVideo');

    // --- State for Modal Swipe Navigation --- //
    let currentModalImageIndex = -1;
    let activeCategoryMedia = []; // Array of media objects for the active category
    let modalContentRequestId = 0;
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
            'images/portfolio/live-music/portfolio_004.jpg',
            'images/portfolio/live-music/portfolio_005.jpeg',
            'images/portfolio/live-music/portfolio_007.JPG',
            'images/portfolio/live-music/portfolio_008.jpg', // Moved from Art
            'images/portfolio/live-music/portfolio_009.jpg',
            'images/portfolio/live-music/portfolio_010.jpg', // Moved from Typography
            'images/portfolio/live-music/portfolio_011.JPG',
            'images/portfolio/live-music/portfolio_012.JPG',
            'images/portfolio/live-music/portfolio_013.jpg', // Moved from Art
            'images/portfolio/live-music/portfolio_015.jpeg', // Moved from Typography
            'images/portfolio/live-music/portfolio_016.jpeg',
            'images/portfolio/live-music/portfolio_017.jpg',
        ],
        'visuals': [
            // Only keep videos that are under GitHub's 100 MB limit and exist in the repo
            'images/portfolio/Visuals/01.mp4',
            'images/portfolio/Visuals/02.mp4',
            'images/portfolio/Visuals/03.mp4',
            'images/portfolio/Visuals/04.mp4',
            'images/portfolio/Visuals/05.mp4',
            'images/portfolio/Visuals/13.mp4',
            'images/portfolio/Visuals/14.mp4',
            'images/portfolio/Visuals/15.mp4',
            'images/portfolio/Visuals/16.mp4',
            'images/portfolio/Visuals/17.mp4',
            'images/portfolio/Visuals/18.mp4',
            'images/portfolio/Visuals/19.mp4',
            'images/portfolio/Visuals/20.mp4',
            'images/portfolio/Visuals/21.mp4',
            'images/portfolio/Visuals/22.mp4',
            'images/portfolio/Visuals/23.mp4',
        ]
    };
    const VALID_CATEGORIES = new Set(Object.keys(portfolioImages));

    function isValidCategory(category) {
        return typeof category === 'string'
            && VALID_CATEGORIES.has(category)
            && /^[a-z0-9-]+$/.test(category);
    }

    // --- Modal Helpers --- //
    function ensureModalVideoElement() {
        if (!modal) return null;
        if (!modalVideo) {
            modalVideo = document.createElement('video');
            modalVideo.id = 'modalVideo';
            modalVideo.className = 'modal-content';
            modalVideo.controls = true;
            modalVideo.playsInline = true;
            modalVideo.style.display = 'none';
            modalVideo.setAttribute('preload', 'auto');
            modal.insertBefore(modalVideo, captionText);
        }
        return modalVideo;
    }

    function toggleModalNavigation(shouldShow) {
        if (!modalPrevButton || !modalNextButton) return;
        const displayValue = shouldShow ? 'block' : 'none';
        modalPrevButton.style.display = displayValue;
        modalNextButton.style.display = displayValue;
    }

    // --- Update Modal Content --- //
    function updateModalContent(index) {
        if (index < 0 || index >= activeCategoryMedia.length) {
            return;
        }

        currentModalImageIndex = index;
        modalContentRequestId += 1;
        const requestId = modalContentRequestId;

        const mediaData = activeCategoryMedia[index] || {};
        toggleModalNavigation(activeCategoryMedia.length > 1);
        if (captionText) {
            captionText.textContent = mediaData.alt || '';
        }

        preloadAdjacentMedia(index);

        const videoEl = ensureModalVideoElement();

        if (mediaData.type === 'video') {
            if (modalImage) {
                modalImage.style.opacity = '0';
                modalImage.style.display = 'none';
                modalImage.style.backgroundImage = '';
            }
            if (videoEl) {
                const requiresNewSource = videoEl.src !== mediaData.src;
                if (requiresNewSource) {
                    videoEl.pause();
                    videoEl.src = mediaData.src;
                    videoEl.load();
                }
                videoEl.loop = true;
                videoEl.muted = false;
                videoEl.controls = true;
                videoEl.style.display = 'block';
                videoEl.play().catch(() => { /* Autoplay restrictions are fine */ });
            }
            return;
        }

        if (videoEl) {
            videoEl.pause();
            videoEl.removeAttribute('src');
            videoEl.load();
            videoEl.style.display = 'none';
        }

        if (!modalImage) {
            return;
        }

        modalImage.style.display = 'block';
        modalImage.alt = mediaData.alt || '';

        if (mediaData.placeholder) {
            modalImage.style.backgroundImage = `url(${mediaData.placeholder})`;
            modalImage.style.backgroundSize = 'cover';
            modalImage.style.backgroundPosition = 'center';
        } else {
            modalImage.style.backgroundImage = '';
        }

        const previewSrc = mediaData.preview || mediaData.display || mediaData.src || mediaData.full;
        const fullSrc = mediaData.full || mediaData.src || previewSrc;

        if (previewSrc) {
            modalImage.src = previewSrc;
        }

        modalImage.style.opacity = '0';
        requestAnimationFrame(() => {
            if (requestId === modalContentRequestId) {
                modalImage.style.opacity = '1';
            }
        });

        if (!fullSrc || fullSrc === previewSrc) {
            return;
        }

        const loader = new Image();
        loader.onload = () => {
            if (requestId !== modalContentRequestId) return;
            modalImage.src = fullSrc;
        };
        loader.src = fullSrc;
    }

    // --- Preload Adjacent Media --- //
    function preloadAdjacentMedia(index) {
        if (!activeCategoryMedia.length) return;
        const total = activeCategoryMedia.length;
        const neighbours = [
            (index - 1 + total) % total,
            (index + 1) % total
        ];

        neighbours.forEach(neighbourIndex => {
            if (neighbourIndex === index) return;
            const neighbour = activeCategoryMedia[neighbourIndex];
            if (!neighbour || neighbour.type !== 'image') return;
            if (neighbour.preloaded || !neighbour.full) return;

            const preloader = new Image();
            preloader.src = neighbour.full;
            neighbour.preloaded = true;
        });
    }

    // --- Load Portfolio Images By Category --- //
    // IMPORTANT: This is a complete rewrite of the image loading system to prevent duplicates
    // Global registry contains ALL displayed images, regardless of category
    const GLOBAL_IMAGE_REGISTRY = new Set();

    async function loadPortfolioImagesByCategory(category, gridElement) {
        if (!gridElement) {
            logger.error('Target grid element not provided');
            return;
        }
        if (!isValidCategory(category)) {
            logger.warn('Ignoring invalid category request', { category });
            return;
        }

        gridElement.classList.add('loading');
        gridElement.replaceChildren();
        gridElement.dataset.category = category;

        const mediaPaths = portfolioImages[category] || [];
        if (mediaPaths.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.style.textAlign = 'center';
            emptyState.textContent = `No media found for ${category}.`;
            gridElement.appendChild(emptyState);
            gridElement.dataset.loaded = true;
            gridElement.classList.remove('loading');
            return;
        }

        const deduplicatedPaths = [];
        const seenInThisRun = new Set();

        mediaPaths.forEach(path => {
            const normalizedPath = path.toLowerCase();
            const basename = normalizedPath.split('/').pop();

            if (!GLOBAL_IMAGE_REGISTRY.has(basename) && !seenInThisRun.has(basename)) {
                deduplicatedPaths.push(path);
                seenInThisRun.add(basename);
                GLOBAL_IMAGE_REGISTRY.add(basename);
            }
        });

        if (deduplicatedPaths.length === 0 && mediaPaths.length > 0) {
            GLOBAL_IMAGE_REGISTRY.clear();
            gridElement.classList.remove('loading');
            return loadPortfolioImagesByCategory(category, gridElement);
        }

        const shuffledPaths = [...deduplicatedPaths];
        shuffleArray(shuffledPaths);

        await loadOptimizedManifest();

        for (const mediaPath of shuffledPaths) {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item fade-in';

            const isVideo = /\.(mp4|webm|mov)$/i.test(mediaPath);

            if (isVideo) {
                const video = document.createElement('video');
                video.dataset.src = mediaPath;
                video.dataset.full = mediaPath;
                video.dataset.mediaType = 'video';
                video.dataset.caption = `${category.replace('-', ' ')} video`;
                video.dataset.loaded = 'false';
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.preload = 'none';
                video.setAttribute('disablePictureInPicture', '');
                video.setAttribute('controlsList', 'nodownload');
                video.tabIndex = 0;
                video.style.backgroundColor = '#000';

                const source = document.createElement('source');
                source.type = 'video/mp4';
                source.dataset.src = mediaPath;
                video.appendChild(source);

                video.addEventListener('error', (event) => {
                    logger.error('Video error', event);
                });

                gridItem.appendChild(video);
                gridElement.appendChild(gridItem);

                initVideoObserver();
                videoObserver.observe(video);
                continue;
            }

            const optimizedData = await getOptimizedImageAsset(mediaPath);
            const picture = document.createElement('picture');
            picture.classList.add('portfolio-picture');

            if (optimizedData?.sources) {
                optimizedData.sources.forEach(sourceData => {
                    const sourceEl = document.createElement('source');
                    sourceEl.type = sourceData.type;
                    sourceEl.srcset = sourceData.srcset;
                    picture.appendChild(sourceEl);
                });
            }

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.fetchPriority = 'low';
            img.alt = `${category.replace('-', ' ')} photo`;
            img.dataset.mediaType = 'image';

            // Set dataset.src for LazyImageLoader to pick up the high-quality version
            img.dataset.src = optimizedData?.display || optimizedData?.full || mediaPath;
            img.dataset.srcset = optimizedData?.fallbackSrcSet || '';

            img.dataset.full = optimizedData?.full || mediaPath;
            img.dataset.preview = optimizedData?.display || optimizedData?.thumbnail || mediaPath;
            img.dataset.original = mediaPath;

            if (optimizedData?.placeholder) {
                img.dataset.placeholder = optimizedData.placeholder;
                img.style.backgroundImage = `url(${optimizedData.placeholder})`;
                img.style.backgroundSize = 'cover';
                img.style.backgroundPosition = 'center';
                img.classList.add('with-lqip');
            }

            img.sizes = '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw';
            // Start with thumbnail or placeholder to prevent layout shift
            img.src = optimizedData?.thumbnail || optimizedData?.placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

            img.addEventListener('error', () => {
                logger.error('Failed to load image', { mediaPath });
                gridItem.remove();
            });

            picture.appendChild(img);
            gridItem.appendChild(picture);
            gridElement.appendChild(gridItem);

            // Register with LazyImageLoader if available
            if (window.lazyImageLoader) {
                window.lazyImageLoader.observe(img);
            }
        }

        gridElement.classList.remove('loading');
        gridElement.classList.add('loaded');
        gridElement.dataset.loaded = true;

        observeFadeInElements();
    }

    // --- Portfolio Category Switching Logic --- //
    if (categoryButtonsContainer && portfolioDisplay) {
        const buttons = categoryButtonsContainer.querySelectorAll('.category-button');
        const grids = portfolioDisplay.querySelectorAll('.image-grid');
        const portfolioSection = document.getElementById('portfolio'); // Get the parent section

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                if (!isValidCategory(category)) {
                    logger.warn('Ignoring click for invalid category', { category });
                    return;
                }
                const targetGrid = portfolioDisplay.querySelector(`.${category}-grid`);

                if (!targetGrid) {
                    logger.error('Target grid not found for category', { category });
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

                // Ensure body scrolling is enabled
                body.style.overflow = 'auto';

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
            if (!isValidCategory(initialCategory)) {
                logger.warn('Skipping initial invalid category', { initialCategory });
            } else {
                const initialGrid = portfolioDisplay.querySelector(`.${initialCategory}-grid`);
                if (initialGrid) {
                    initialGrid.classList.add('active'); // Ensure initial grid is visible
                    // Apply initial theme class
                    portfolioSection.classList.add(`theme-${initialCategory}`);
                    loadPortfolioImagesByCategory(initialCategory, initialGrid);
                } else {
                    logger.error('Initial portfolio grid not found.');
                }
            }
        } else {
            logger.warn('No active category button found on initial load.');
        }

    } else {
        // Only run portfolio logic if relevant elements exist (i.e., on portfolio.html)
        // console.log("Not on the portfolio page or necessary elements missing.");
    }

    // --- Back to Top Button Logic --- //
    if (backToTopButton) {
        let isBackToTopScrolling = false;

        const updateBackToTop = () => {
            if (window.pageYOffset > 300) { // Show button after scrolling 300px
                backToTopButton.style.display = 'block';
                // Use a small timeout to allow display:block to apply before opacity transition
                requestAnimationFrame(() => {
                    backToTopButton.style.opacity = '1';
                });
            } else {
                backToTopButton.style.opacity = '0';
                // Use setTimeout to hide only after fade out transition completes
                setTimeout(() => {
                    if (window.pageYOffset <= 300) { // Re-check condition
                        backToTopButton.style.display = 'none';
                    }
                }, 300); // Match CSS transition duration
            }
            isBackToTopScrolling = false;
        };

        window.addEventListener('scroll', () => {
            if (!isBackToTopScrolling) {
                requestAnimationFrame(updateBackToTop);
                isBackToTopScrolling = true;
            }
        }, { passive: true });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function getContactFormUtils() {
        const utils = window.ContactFormUtils;
        if (!utils) return null;
        if (typeof utils.validateContactPayload !== 'function') return null;
        if (typeof utils.encodeContactPayload !== 'function') return null;
        if (typeof utils.getStatusMessage !== 'function') return null;
        if (typeof utils.getValidationMessage !== 'function') return null;
        return utils;
    }

    function ensureContactFeedbackElement(form) {
        let feedback = form.querySelector('.form-feedback');
        if (!feedback) {
            feedback = document.createElement('p');
            feedback.className = 'form-feedback';
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            feedback.setAttribute('aria-atomic', 'true');
            form.appendChild(feedback);
        }
        return feedback;
    }

    function setContactFeedback(feedbackElement, message, state) {
        if (!feedbackElement) return;
        feedbackElement.textContent = message;
        feedbackElement.dataset.state = state;
    }

    function setSubmitButtonState(submitButton, isSubmitting) {
        if (!submitButton) return;
        if (!submitButton.dataset.defaultText) {
            submitButton.dataset.defaultText = submitButton.textContent || 'Send Message';
        }
        submitButton.disabled = isSubmitting;
        submitButton.setAttribute('aria-busy', String(isSubmitting));
        submitButton.textContent = isSubmitting
            ? 'Sending...'
            : submitButton.dataset.defaultText;
    }

    function findFieldElement(form, fieldName) {
        const field = form.elements.namedItem(fieldName);
        if (typeof RadioNodeList !== 'undefined' && field instanceof RadioNodeList) {
            return field[0];
        }
        return field;
    }

    function setupContactFormSubmission() {
        const contactForm = document.querySelector('form[name="contact"]');
        if (!contactForm) return;

        const contactUtils = getContactFormUtils();
        if (!contactUtils) {
            logger.warn('Contact form utilities are missing; falling back to default form submission.');
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const feedbackElement = ensureContactFeedbackElement(contactForm);
        let submissionInFlight = false;

        contactForm.addEventListener('input', (event) => {
            const input = event.target;
            if (input && typeof input.setCustomValidity === 'function') {
                input.setCustomValidity('');
            }
        });

        contactForm.addEventListener('submit', async (event) => {
            if (!window.fetch || typeof FormData === 'undefined' || typeof URLSearchParams === 'undefined') {
                return;
            }

            event.preventDefault();

            if (submissionInFlight) {
                setContactFeedback(feedbackElement, contactUtils.getStatusMessage('duplicate'), 'info');
                return;
            }

            const formData = new FormData(contactForm);
            const validation = contactUtils.validateContactPayload({
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message'),
                botField: formData.get('bot-field')
            });

            const nameField = findFieldElement(contactForm, 'name');
            const emailField = findFieldElement(contactForm, 'email');
            const messageField = findFieldElement(contactForm, 'message');
            [nameField, emailField, messageField].forEach((field) => {
                if (field && typeof field.setCustomValidity === 'function') {
                    field.setCustomValidity('');
                }
            });

            if (nameField && 'value' in nameField) {
                nameField.value = validation.sanitized.name;
            }
            if (emailField && 'value' in emailField) {
                emailField.value = validation.sanitized.email;
            }
            if (messageField && 'value' in messageField) {
                messageField.value = validation.sanitized.message;
            }

            if (validation.isBot) {
                contactForm.reset();
                setContactFeedback(feedbackElement, contactUtils.getStatusMessage('success'), 'success');
                return;
            }

            if (!validation.isValid) {
                const fieldOrder = ['name', 'email', 'message'];
                let firstInvalidField = null;
                let firstMessage = contactUtils.getStatusMessage('server');

                fieldOrder.forEach((fieldName) => {
                    const errorCode = validation.errors[fieldName];
                    if (!errorCode) return;
                    const fieldElement = findFieldElement(contactForm, fieldName);
                    const message = contactUtils.getValidationMessage(errorCode);

                    if (!firstInvalidField && fieldElement) {
                        firstInvalidField = fieldElement;
                        firstMessage = message;
                    }
                    if (fieldElement && typeof fieldElement.setCustomValidity === 'function') {
                        fieldElement.setCustomValidity(message);
                    }
                });

                setContactFeedback(feedbackElement, firstMessage, 'error');
                if (firstInvalidField && typeof firstInvalidField.reportValidity === 'function') {
                    firstInvalidField.reportValidity();
                }
                if (firstInvalidField && typeof firstInvalidField.focus === 'function') {
                    firstInvalidField.focus();
                }
                return;
            }

            submissionInFlight = true;
            setSubmitButtonState(submitButton, true);
            setContactFeedback(feedbackElement, contactUtils.getStatusMessage('sending'), 'info');

            const abortController = typeof AbortController === 'function' ? new AbortController() : null;
            const timeoutId = abortController
                ? window.setTimeout(() => abortController.abort(), 12000)
                : null;

            try {
                const action = contactForm.getAttribute('action') || window.location.pathname || '/';
                const response = await fetch(action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'text/html'
                    },
                    body: contactUtils.encodeContactPayload(validation.sanitized),
                    signal: abortController ? abortController.signal : undefined
                });

                if (!response.ok) {
                    throw new Error(`Form submission failed with status ${response.status}`);
                }

                contactForm.reset();
                setContactFeedback(feedbackElement, contactUtils.getStatusMessage('success'), 'success');
            } catch (error) {
                logger.error('Contact form submission failed', error);
                const isAbortError = error && typeof error === 'object' && error.name === 'AbortError';
                const messageCode = isAbortError ? 'timeout' : 'network';
                setContactFeedback(feedbackElement, contactUtils.getStatusMessage(messageCode), 'error');
            } finally {
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
                submissionInFlight = false;
                setSubmitButtonState(submitButton, false);
            }
        });
    }

    setupContactFormSubmission();

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
            sign.style.willChange = 'transform'; // Optimize for GPU

            background.appendChild(sign);
        }
    }

    // --- Initialize --- //
    logger.info('Site script initializing');
    createPeaceSigns(10); // Create fewer: 10 peace signs

    // --- Modal Event Listeners --- //
    if (modal && modalImage && closeModal && portfolioDisplay) {
        // Open modal when an image or video inside portfolio display is clicked
        portfolioDisplay.addEventListener('click', (event) => {
            const mediaTarget = event.target.closest('img, video');
            if (!mediaTarget) {
                return;
            }

            const activeGrid = portfolioDisplay.querySelector('.image-grid.active');
            if (!activeGrid) {
                logger.error('Could not determine active image grid.');
                return;
            }

            const mediaElements = Array.from(activeGrid.querySelectorAll('img, video'));
            const clickedIndex = mediaElements.indexOf(mediaTarget);
            if (clickedIndex === -1) {
                logger.error('Clicked media not found in active category array.');
                return;
            }

            activeCategoryMedia = mediaElements.map(element => {
                if (element.tagName === 'IMG') {
                    const altText = element.alt || '';
                    const placeholder = element.dataset.placeholder || '';
                    const previewSrc = element.dataset.preview || element.currentSrc || element.src;
                    const fullSrc = element.dataset.full || element.currentSrc || element.src;
                    return {
                        type: 'image',
                        element,
                        alt: altText,
                        placeholder,
                        preview: previewSrc,
                        display: element.currentSrc || previewSrc,
                        full: fullSrc
                    };
                }

                const caption = element.dataset.caption
                    || element.getAttribute('aria-label')
                    || element.getAttribute('title')
                    || `${activeGrid.dataset.category || 'portfolio'} video`;
                const sourceEl = element.querySelector('source');
                const videoSrc = element.dataset.full
                    || element.dataset.src
                    || (sourceEl ? sourceEl.currentSrc || sourceEl.src || sourceEl.dataset.src : '')
                    || element.currentSrc
                    || element.src;

                return {
                    type: 'video',
                    element,
                    alt: caption,
                    src: videoSrc
                };
            });

            currentModalImageIndex = clickedIndex;
            modal.classList.add('visible');
            document.body.style.overflow = 'hidden';
            updateModalContent(clickedIndex);
        });

        function resetModalState() {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
            toggleModalNavigation(false);
            activeCategoryMedia = [];
            currentModalImageIndex = -1;
            if (modalVideo) {
                modalVideo.pause();
                modalVideo.removeAttribute('src');
                modalVideo.load();
                modalVideo.style.display = 'none';
            }
            if (modalImage) {
                modalImage.style.display = 'block';
                modalImage.style.opacity = '1';
                modalImage.style.backgroundImage = '';
            }
        }

        // Close modal when the close button is clicked
        closeModal.addEventListener('click', resetModalState);

        // Close modal when clicking outside the image/content area
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                resetModalState();
            }
        });

        // --- Click Listeners for Modal Navigation Buttons --- //
        if (modalPrevButton && modalNextButton) {
            modalPrevButton.addEventListener('click', () => {
                if (currentModalImageIndex === -1 || activeCategoryMedia.length <= 1) return;
                const prevIndex = (currentModalImageIndex - 1 + activeCategoryMedia.length) % activeCategoryMedia.length;
                updateModalContent(prevIndex);
            });

            modalNextButton.addEventListener('click', () => {
                if (currentModalImageIndex === -1 || activeCategoryMedia.length <= 1) return;
                const nextIndex = (currentModalImageIndex + 1) % activeCategoryMedia.length;
                updateModalContent(nextIndex);
            });
        }

        document.addEventListener('keydown', (event) => {
            if (!modal.classList.contains('visible')) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                resetModalState();
            } else if (event.key === 'ArrowRight' && activeCategoryMedia.length > 1) {
                event.preventDefault();
                const nextIndex = (currentModalImageIndex + 1) % activeCategoryMedia.length;
                updateModalContent(nextIndex);
            } else if (event.key === 'ArrowLeft' && activeCategoryMedia.length > 1) {
                event.preventDefault();
                const prevIndex = (currentModalImageIndex - 1 + activeCategoryMedia.length) % activeCategoryMedia.length;
                updateModalContent(prevIndex);
            }
        });

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
            if (currentModalImageIndex === -1 || activeCategoryMedia.length <= 1) {
                return; // No swipe needed if only one image or index is invalid
            }

            const swipeThreshold = 50; // Minimum pixels to register as a swipe
            const deltaX = touchEndX - touchStartX;

            if (Math.abs(deltaX) > swipeThreshold && isSwiping) { // Check isSwiping flag
                if (deltaX < 0) {
                    // Swiped Left (Next Image)
                    const nextIndex = (currentModalImageIndex + 1) % activeCategoryMedia.length;
                    updateModalContent(nextIndex);
                } else {
                    // Swiped Right (Previous Image)
                    const prevIndex = (currentModalImageIndex - 1 + activeCategoryMedia.length) % activeCategoryMedia.length;
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
    let slideTimer = null;
    if (slideshowContainer) {
        logger.info('Initializing slideshow');
        const images = slideshowContainer.querySelectorAll('.slideshow-image');
        let currentImageIndex = 0; // Start with the first image
        const slideInterval = 7000; // Time each image is displayed (increased to 7 seconds)
        let isTransitioning = false; // Flag to prevent transition issues

        logger.info('Found slideshow images', { count: images.length });

        // Function to show a specific image
        function showImage(index) {
            if (isTransitioning) return; // Prevent rapid transitions
            isTransitioning = true;

            // Remove active class from all images
            images.forEach(img => img.classList.remove('active'));

            // Add active class to the target image
            images[index].classList.add('active');
            logger.info('Showing slideshow image', { index });

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
            logger.info('Initializing slideshow image set', { count: images.length });

            // Show the first image immediately without any delay
            showImage(currentImageIndex);
            logger.info('Initial slideshow image ready', { src: images[currentImageIndex].src });

            // Only start slideshow if reduced motion is not preferred
            if (!prefersReducedMotion) {
                slideTimer = setInterval(showNextImage, slideInterval);
            } else {
                // For users who prefer reduced motion, show static image
                logger.info('Reduced motion enabled; slideshow auto-advance disabled');
            }
        } else {
            logger.warn('No slideshow images found');
        }

        // Listen for changes in reduced motion preference
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            const shouldReduceMotion = e.matches;
            if (shouldReduceMotion && slideTimer) {
                clearInterval(slideTimer);
                slideTimer = null;
            } else if (!shouldReduceMotion && !slideTimer) {
                slideTimer = setInterval(showNextImage, slideInterval);
            }
        });
    }
});

// --- Global video IntersectionObserver --- //
let videoObserver;
function initVideoObserver() {
    if (videoObserver) return; // Already created
    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const vid = entry.target;
            if (entry.intersectionRatio > 0.1 && vid.dataset.loaded !== 'true') {
                const sourceEl = vid.querySelector('source');
                if (sourceEl && sourceEl.dataset.src) {
                    sourceEl.src = sourceEl.dataset.src;
                    delete sourceEl.dataset.src;
                }
                if (vid.dataset.src) {
                    vid.src = vid.dataset.src;
                    delete vid.dataset.src;
                }
                vid.load();
                vid.dataset.loaded = 'true';
            }

            if (entry.intersectionRatio > 0.6) {
                if (vid.paused) {
                    vid.play().catch(() => {/* Ignore autoplay restrictions */ });
                }
            } else if (entry.intersectionRatio < 0.2) {
                if (!vid.paused) {
                    vid.pause();
                }
            }
        });
    }, {
        threshold: [0, 0.1, 0.6, 1]
    });
}
