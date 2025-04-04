document.addEventListener('DOMContentLoaded', () => {
    const backToTopButton = document.getElementById('back-to-top');
    const portfolioDisplay = document.getElementById('portfolio-display'); // Get the portfolio display area
    const categoryButtonsContainer = document.querySelector('.portfolio-categories'); // Get category buttons container

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
            'images/portfolio/P1030270.jpg',
            'images/portfolio/IMG_0748_jpg.jpeg',
            'images/portfolio/IMG_0737_jpg.jpeg',
            'images/portfolio/DSC06390.jpg',
            'images/portfolio/DSC06115.JPG',
            'images/portfolio/DSC06038.JPG',
            'images/portfolio/DSC06009.jpg',
            'images/portfolio/DSC04810.jpeg',
            // 'images/portfolio/DSC04810 2.jpeg', // Removed potential duplicate
            'images/portfolio/DSC04697.jpg',
            'images/portfolio/DSC04388.jpg',
            'images/portfolio/DSC04062.JPG',
            'images/portfolio/DSC03627 2.jpeg',
            // 'images/portfolio/DSC02668.JPG', // Removed duplicate
            'images/portfolio/DSC02668.jpeg',
            'images/portfolio/DSC02607 2.jpeg',
            'images/portfolio/DSC02569.jpeg',
            // 'images/portfolio/DSC02569 2.jpeg', // Removed duplicate
            'images/portfolio/DSC02507.jpg',
            // '(510) 449-8036.zip - 9.PNG' // Removed, moved to header
        ],
        'video-postcards': [
            // Add paths for Video Postcards images here later
        ],
        'glitch-art': [
            // Add paths for Glitch Art images here later
        ],
        'liquid-lights': [
            // Add paths for Liquid Lights images here later
        ]
    };

    // --- Load Portfolio Images By Category --- //
    function loadPortfolioImagesByCategory(category, gridElement) {
        if (!gridElement) {
            console.error('Target grid element not provided for category:', category);
            return;
        }

        const imagePaths = portfolioImages[category];

        if (!imagePaths || imagePaths.length === 0) {
            console.warn(`No image paths found for category: ${category}. Update js/script.js.`);
            gridElement.innerHTML = `<p style="text-align: center;">No images found for ${category}.</p>`;
            return;
        }

        // Clear existing content (like 'Loading...')
        gridElement.innerHTML = ''; 

        // Shuffle the category's images
        const shuffledPaths = [...imagePaths]; // Clone before shuffling
        shuffleArray(shuffledPaths);

        // Create and append images
        const imageElements = [];
        shuffledPaths.forEach(imgPath => {
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = `${category.replace('-', ' ')} photo`; // Dynamic alt text
            img.classList.add('fade-in'); // Add class for scroll animation
            gridElement.appendChild(img);
            imageElements.push(img);
        });

        // Observe newly added images for fade-in animation
        observeFadeInElements(); // NOW scrollObserver IS DEFINED

        // Mark grid as loaded
        gridElement.dataset.loaded = true;
    }

    // --- Portfolio Category Switching Logic --- //
    if (categoryButtonsContainer && portfolioDisplay) {
        const buttons = categoryButtonsContainer.querySelectorAll('.category-button');
        const grids = portfolioDisplay.querySelectorAll('.image-grid');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                const targetGrid = portfolioDisplay.querySelector(`.${category}-grid`);

                if (!targetGrid) {
                    console.error(`Grid for category '${category}' not found.`);
                    return;
                }

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
        if (initialActiveButton) {
            const initialCategory = initialActiveButton.dataset.category;
            const initialGrid = portfolioDisplay.querySelector(`.${initialCategory}-grid`);
            if (initialGrid) {
                 initialGrid.classList.add('active'); // Ensure initial grid is visible
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

    // Note: The initial call to observeFadeInElements() might now be redundant
    // because loadPortfolioImagesByCategory already calls it for the newly added images,
    // and the loop above handles the static sections. You could potentially remove
    // the standalone observeFadeInElements() call if you don't have other elements
    // with the .fade-in class added directly in the HTML outside of sections or the image grid.
    // For simplicity, we'll leave it commented out for now.
    // observeFadeInElements();
});
