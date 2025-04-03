document.addEventListener('DOMContentLoaded', () => {
    const backToTopButton = document.getElementById('back-to-top');

    // --- Helper Function: Fisher-Yates (Knuth) Shuffle --- //
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
            [array[i], array[j]] = [array[j], array[i]]; // swap elements
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

    // --- Image Data --- //
    // This object MUST list all the images you want to display from the images/portfolio/ folder.
    const portfolioImages = {
        // You can keep categories if it helps organize, or just put all paths in one array.
        'all': [
            'images/portfolio/P1030270.jpg',
            'images/portfolio/IMG_0748_jpg.jpeg',
            'images/portfolio/IMG_0737_jpg.jpeg',
            'images/portfolio/DSC06390.jpg',
            'images/portfolio/DSC06115.JPG',
            'images/portfolio/DSC06038.JPG',
            'images/portfolio/DSC06009.jpg',
            'images/portfolio/DSC04810.jpeg',
            'images/portfolio/DSC04810 2.jpeg',
            'images/portfolio/DSC04697.jpg',
            'images/portfolio/DSC04388.jpg',
            'images/portfolio/DSC04062.JPG',
            'images/portfolio/DSC03627 2.jpeg',
            'images/portfolio/DSC02668.JPG',
            'images/portfolio/DSC02668.jpeg',
            'images/portfolio/DSC02607 2.jpeg',
            'images/portfolio/DSC02569.jpeg',
            'images/portfolio/DSC02569 2.jpeg',
            'images/portfolio/DSC02507.jpg',
            'images/portfolio/(510) 449-8036.zip - 9.PNG' // Ensure this PNG displays correctly
            // Add ALL image paths from images/portfolio/ here
        ],
        // You could still have other keys like 'live-music', 'street' etc.
        // The script will now combine them all.
        'live-music': [
            // Add live music specific images here if you want to organize
        ],
        'street': [
            // Add street specific images here
        ]
    };

    // --- Randomize Home Image --- //
    function randomizeHomeImage() {
        const homeImageElement = document.querySelector('#home .full-width-image');
        if (!homeImageElement) {
            console.error('Home image element not found.');
            return;
        }
        // Combine all image paths from the portfolioImages object
        let allImagePaths = [];
        for (const category in portfolioImages) {
            if (portfolioImages.hasOwnProperty(category)) {
                allImagePaths = allImagePaths.concat(portfolioImages[category]);
            }
        }
        // Ensure there are images to choose from
        if (allImagePaths.length > 0) {
            const randomIndex = Math.floor(Math.random() * allImagePaths.length);
            homeImageElement.src = allImagePaths[randomIndex];
            homeImageElement.alt = "Home Image"; // Keep or update alt text as needed
        } else {
            console.warn('No portfolio images available to set as home image.');
        }
    }

    // --- Load All Portfolio Images into Single Grid --- //
    function loadAllPortfolioImages(gridSelector) {
        const grid = document.querySelector(gridSelector);
        if (!grid) {
            console.error('Portfolio grid container not found:', gridSelector);
            return;
        }

        // Combine all image paths from the portfolioImages object into one array
        let allImagePaths = [];
        for (const category in portfolioImages) {
            if (portfolioImages.hasOwnProperty(category)) {
                allImagePaths = allImagePaths.concat(portfolioImages[category]);
            }
        }

        if (allImagePaths.length === 0) {
            console.warn('No image paths found in the portfolioImages object in js/script.js. Did you add your filenames?');
            grid.innerHTML = '<p style="text-align: center;">No images found. Please add image paths to js/script.js.</p>';
            return;
        }

        // Shuffle the combined list
        shuffleArray(allImagePaths);

        // Append shuffled images to the grid
        allImagePaths.forEach(imgPath => {
            const img = document.createElement('img');
            img.src = imgPath;
            img.alt = 'Portfolio photo'; // Generic alt text
            img.classList.add('fade-in'); // Add class for scroll animation
            grid.appendChild(img);
        });

        // Re-observe newly added images for fade-in animation
        observeFadeInElements(); // NOW scrollObserver IS DEFINED
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

    // --- Load Images and Set Up Initial Animations --- //

    // Randomize the home image first
    randomizeHomeImage();

    // Call the function to load all images into the single grid
    loadAllPortfolioImages('.all-portfolio-grid');

    // Initial observation pass for static elements and sections (like #about, #contact)
    document.querySelectorAll('section').forEach(el => {
        if (!el.classList.contains('fade-in')) {
             el.classList.add('fade-in');
        }
       if (!el.dataset.observed) {
            scrollObserver.observe(el);
            el.dataset.observed = true;
       }
    });

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
    console.log('Portfolio site initializing.');
    createPeaceSigns(10); // Create fewer: 10 peace signs

    // Note: The initial call to observeFadeInElements() might now be redundant
    // because loadAllPortfolioImages already calls it for the newly added images,
    // and the loop above handles the static sections. You could potentially remove
    // the standalone observeFadeInElements() call if you don't have other elements
    // with the .fade-in class added directly in the HTML outside of sections or the image grid.
    // For simplicity, we'll leave it commented out for now.
    // observeFadeInElements();
});
