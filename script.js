// Store liked clips locally
let likedClips = new Set();
let allClipsData = [];

// Reduced batch size for better performance on mobile
let clipBatchSize = window.innerWidth <= 768 ? 10 : 15;
let currentClipIndex = 0;
let observer;
let videoIntersectionObserver;

// Performance optimization flags
const isMobile = window.innerWidth <= 768;
const supportsWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;

function showSection(section) {
    // Hide all sections
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('home-recommended').classList.add('hidden');
    document.getElementById('all-clips-section').classList.add('hidden');
    document.getElementById('about-section').classList.add('hidden');

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section and set active nav
    if (section === 'home') {
        document.getElementById('home-section').classList.remove('hidden');
        document.getElementById('home-recommended').classList.remove('hidden');
        document.querySelector('[onclick="showSection(\'home\')"]').classList.add('active');
    } else if (section === 'all-clips') {
        document.getElementById('all-clips-section').classList.remove('hidden');
        document.querySelector('[onclick="showSection(\'all-clips\')"]').classList.add('active');
        loadAllClips();
    } else if (section === 'about') {
        document.getElementById('about-section').classList.remove('hidden');
        document.querySelector('[onclick="showSection(\'about\')"]').classList.add('active');
    }
}

function showVideoInModal(url, type) {
    if (!url) return;

    const modal = document.getElementById("videoModal");

    if (type === "twitch") {
        const clipId = url.split("/").pop();
        modal.innerHTML = `
            <div class="video-modal-content">
            <span class="video-close" onclick="closeVideoModal()">×</span>
            <div class="loading-spinner">Loading...</div>
            <iframe
                class="modal-iframe"
                src="https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}"
                frameborder="0"
                allowfullscreen
                scrolling="no"
                onload="hideLoadingSpinner()"
            ></iframe>
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="video-modal-content">
            <span class="video-close" onclick="closeVideoModal()">×</span>
            <div class="loading-spinner">Loading...</div>
            <video class="modal-video" controls preload="metadata" onloadeddata="hideLoadingSpinner()">
                <source src="${url}" type="video/mp4">
                Your browser does not support video.
            </video>
            </div>
        `;
    }

    modal.style.display = "flex";

    // Auto-play only on desktop and user interaction
    const video = modal.querySelector('video');
    if (video && !isMobile) {
        video.addEventListener('loadeddata', () => {
            video.play().catch(() => {
                // Autoplay failed, which is fine
            });
        });
    }

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeVideoModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeVideoModal();
        }
    });
}

function hideLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

function closeVideoModal() {
    const modal = document.getElementById("videoModal");
    const video = modal.querySelector('video');
    if (video) {
        video.pause();
        video.src = ''; // Force unload
    }
    modal.style.display = "none";
    modal.innerHTML = "";
}

function toggleFeatured() {
    const video = document.getElementById('featuredVideoElement');
    const iframe = document.getElementById('featuredIframe');

    if (window.featuredClip?.platform === 'twitch') {
        showVideoInModal(window.featuredClip.url, window.featuredClip.platform);
    } else {
        if (video.paused) {
            video.play().catch(() => {
                // Play failed, show in modal instead
                showVideoInModal(window.featuredClip.url, window.featuredClip.platform);
            });
        } else {
            video.pause();
        }
    }
}

function toggleLike(clipId, element) {
    event.stopPropagation();
    const likeCount = element.querySelector('.like-count');
    const heartIcon = element.querySelector('.heart-icon');
    let currentLikes = parseInt(likeCount.textContent);

    if (likedClips.has(clipId)) {
        likedClips.delete(clipId);
        element.classList.remove('liked');
        heartIcon.textContent = '🤍';
        likeCount.textContent = currentLikes - 1;
    } else {
        likedClips.add(clipId);
        element.classList.add('liked');
        heartIcon.textContent = '❤️';
        likeCount.textContent = currentLikes + 1;
    }
}

function createVideoThumbnail(clip) {
    if (clip.platform === "twitch") {
        return `
        <iframe
            class="clip-thumbnail lazy-iframe"
            data-src="https://clips.twitch.tv/embed?clip=${clip.url.split("/").pop()}&parent=${window.location.hostname}"
            frameborder="0"
            allowfullscreen
            scrolling="no"
            style="width:100%; height:180px; border-radius:12px; background:#000;"
            loading="lazy"
        ></iframe>`;
    } else {
        return `
        <div class="video-thumbnail-container">
            <video 
                class="clip-thumbnail lazy-video" 
                muted 
                preload="none"
                data-src="${clip.url}"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23666'%3EClick to play%3C/text%3E%3C/svg%3E"
            >
            </video>
            <div class="play-overlay">▶</div>
        </div>`;
    }
}

function generateClipCard(clip) {
    const clipId = clip.id || clip.url;
    const isLiked = likedClips.has(clipId);
    const displayLikes = isLiked ? parseInt(clip.likes) + 1 : clip.likes;

    return `
    <div class="clip-card" onclick="showVideoInModal('${clip.url}', '${clip.platform}')">
        ${createVideoThumbnail(clip)}
        <div class="clip-info">
            <div class="clip-title">${clip.title}</div>
            <div class="clip-meta">
                <span class="platform-badge ${clip.platform}">${clip.platform.toUpperCase()}</span>
            </div>
            <div class="clip-stats">
                <span class="stat">👀 ${clip.views}</span>
                <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${clipId}', this)">
                    <span class="heart-icon">${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${displayLikes}</span>
                </button>
            </div>
        </div>
    </div>
    `;
}

function setupLazyLoading() {
    // Lazy load videos and iframes
    videoIntersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.dataset.src) {
                const element = entry.target;
                
                if (element.classList.contains('lazy-video')) {
                    element.src = element.dataset.src;
                    element.load();
                    delete element.dataset.src;
                    element.classList.remove('lazy-video');
                } else if (element.classList.contains('lazy-iframe')) {
                    element.src = element.dataset.src;
                    delete element.dataset.src;
                    element.classList.remove('lazy-iframe');
                }
                
                videoIntersectionObserver.unobserve(element);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });
}

function loadNextClipBatch() {
    const grid = document.getElementById("allClipsGrid");
    const fragment = document.createDocumentFragment();
    const nextBatch = allClipsData.slice(currentClipIndex, currentClipIndex + clipBatchSize);

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = '<div class="spinner"></div> Loading more clips...';
    grid.appendChild(loadingDiv);

    // Simulate small delay to prevent overwhelming on slow connections
    setTimeout(() => {
        for (const clip of nextBatch) {
            const temp = document.createElement("div");
            temp.innerHTML = generateClipCard(clip);
            const clipCard = temp.firstElementChild;
            
            // Setup lazy loading for this clip
            const lazyElements = clipCard.querySelectorAll('.lazy-video, .lazy-iframe');
            lazyElements.forEach(element => {
                videoIntersectionObserver.observe(element);
            });
            
            fragment.appendChild(clipCard);
        }

        grid.removeChild(loadingDiv);
        grid.appendChild(fragment);
        currentClipIndex += clipBatchSize;

        if (currentClipIndex >= allClipsData.length && observer) {
            observer.disconnect();
        }
    }, isMobile ? 100 : 50);
}

function loadAllClips() {
    const grid = document.getElementById("allClipsGrid");
    grid.innerHTML = "";

    if (allClipsData.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #aaa;">No clips available</p>';
        return;
    }

    currentClipIndex = 0;
    setupLazyLoading();
    loadNextClipBatch();

    const sentinel = document.createElement("div");
    sentinel.id = "scrollSentinel";
    sentinel.style.height = "20px";
    grid.appendChild(sentinel);

    observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && currentClipIndex < allClipsData.length) {
            loadNextClipBatch();
        }
    }, { rootMargin: '200px' });

    observer.observe(sentinel);
}

// Function to filter clips with valid IDs
function filterValidClips(clips) {
    return clips.filter(clip => {
        // Check if clip has an ID and it's not empty (after trimming whitespace)
        return clip.id && clip.id.toString().trim() !== '';
    });
}

async function loadClips() {
    try {
        const res = await fetch("./clips.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        
        // Filter out clips with empty or missing IDs
        const validClips = filterValidClips(data || []);
        allClipsData = validClips;
        
        const grid = document.getElementById("recommendedGrid");
        grid.innerHTML = "";

        if (!validClips || validClips.length === 0) {
            document.getElementById("featuredTitle").innerText = "No clips available";
            document.getElementById("featuredMeta").innerHTML = '<span>Add some clips with valid IDs to clips.json to get started</span>';
            return;
        }

        const sorted = validClips;
        const featured = sorted[0];
        window.featuredClip = featured;

        if (featured) {
            const featuredVideo = document.getElementById('featuredVideoElement');
            const featuredIframe = document.getElementById('featuredIframe');

            if (featured.platform === 'twitch') {
                const clipId = featured.url.split("/").pop();
                featuredIframe.src = `https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}`;
                featuredIframe.style.display = 'block';
                featuredVideo.style.display = 'none';
            } else {
                // Only preload metadata on desktop
                featuredVideo.preload = isMobile ? 'none' : 'metadata';
                document.getElementById("featuredSrc").src = featured.url;
                featuredVideo.load();
                featuredVideo.style.display = 'block';
                featuredIframe.style.display = 'none';
            }

            document.getElementById("featuredTitle").innerText = featured.title;
            // Override views and likes for featured clip - always show 982 views and 102 likes
            document.getElementById("featuredMeta").innerHTML = `
                <span class="platform-badge ${featured.platform}">${featured.platform.toUpperCase()}</span>
                <span>👀 982 views</span>
                <span>❤️ 102 likes</span>
            `;
        }

        // Setup lazy loading
        setupLazyLoading();

        // Load recommended clips with lazy loading
        const recommended = sorted.slice(1, isMobile ? 6 : 12); // Fewer on mobile initially
        for (const clip of recommended) {
            const temp = document.createElement("div");
            temp.innerHTML = generateClipCard(clip);
            const clipCard = temp.firstElementChild;
            
            // Setup lazy loading for this clip
            const lazyElements = clipCard.querySelectorAll('.lazy-video, .lazy-iframe');
            lazyElements.forEach(element => {
                videoIntersectionObserver.observe(element);
            });
            
            grid.appendChild(clipCard);
        }
    } catch (error) {
        console.error('Error loading clips:', error);
        document.getElementById("featuredTitle").innerText = "Error loading clips";
        document.getElementById("featuredMeta").innerHTML = '<span>Please check your internet connection and try reloading.</span>';
    }
}

// Optimize for mobile performance
if (isMobile) {
    // Reduce quality on mobile
    document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = `
            .clip-thumbnail, .featured-thumbnail { 
                filter: contrast(0.9) brightness(0.95);
            }
        `;
        document.head.appendChild(style);
    });
}

// Load clips when page loads
window.onload = async () => {
    await loadClips();
};

// Handle connection changes
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (observer) observer.disconnect();
    if (videoIntersectionObserver) videoIntersectionObserver.disconnect();
});
