// Function to update the selected song in the UI
const updateSelectedSong = () => {
    document.querySelectorAll(".songList li").forEach(songItem => {
        const songPath = songItem.dataset.file;
        const encodedSongPath = encodeURIComponent(songPath);

        if (currentSong.src.includes(encodedSongPath) && !currentSong.paused) {
            // Only apply styling if this is the current song AND it's playing
            songItem.classList.add("playing");
        } else {
            // Remove styling if it's not the current song OR if it's paused
            songItem.classList.remove("playing");
        }
    });
};

let currentSong = new Audio();
let songs = [];
let currentSongIndex = 0;
let curFolder;

// Function to update song list icons based on current playing state
const updateSongListIcons = () => {
    document.querySelectorAll(".songList li").forEach(songItem => {
        const songPath = songItem.dataset.file;
        const playIcon = songItem.querySelector(".playnow img");
        const playText = songItem.querySelector(".playnow span");
        
        // Check if this is the current song by comparing the encoded filename
        const encodedSongPath = encodeURIComponent(songPath);
        if (currentSong.src.includes(encodedSongPath)) {
            // This is the current song
            if (!currentSong.paused) {
                // Song is playing - show pause icon
                playIcon.src = "pause.svg";
                playText.textContent = "Pause";
            } else {
                // Song is paused - show play icon
                playIcon.src = "play.svg";
                playText.textContent = "Play Now";
            }
        } else {
            // This is not the current song - show play icon
            playIcon.src = "play.svg";
            playText.textContent = "Play Now";
        }
    });
};

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    curFolder = folder;
    const normalizedFolder = folder.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
    
    try {
        // Extract just the folder name from the path (e.g., "songs/Aditya (Me)" -> "Aditya (Me)")
        const folderName = normalizedFolder.split('/').pop();
        console.log('Getting songs for folder:', folderName);
        
        // Fetch the songs manifest
        let response = await fetch('/songs.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let songsData = await response.json();
        let songList = songsData[folderName] || [];
        
        console.log('Found songs:', songList);
        return songList;
    } catch (error) {
        console.error('Error fetching songs from', folder, ':', error);
        return [];
    }
}

const playMusic = (track, updateIndex = true) => {
    // Encode the path properly for the audio source
    const encodedPath = curFolder.split('/').map(part => encodeURIComponent(part)).join('/');
    const encodedTrack = encodeURIComponent(track);
    currentSong.src = `/${encodedPath}/${encodedTrack}`;
    
    // Ensure volume is always high when playing any song
    currentSong.volume = 1.0;
    document.querySelector(".range input[type='range']").value = 100;
    
    currentSong.play();
    play.src = "pause.svg";
    document.querySelector(".songinfo").innerHTML = track
        .replace(".mp3", "")
        .replaceAll("_", " ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    
    if (updateIndex) {
        currentSongIndex = songs.findIndex(song => song === track);
    }
    updateSongListIcons();
    updateSelectedSong();
};

const playNextSong = () => {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playMusic(songs[currentSongIndex], false);
};

const playPreviousSong = () => {
    if (songs.length === 0) return;
    currentSongIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    playMusic(songs[currentSongIndex], false);
};

async function main() {
    // Get the first card's folder to load as default
    const firstCard = document.querySelector('.card');
    const defaultFolder = firstCard ? firstCard.dataset.folder : 'mysongs';
    
    //get all songs from the first playlist by default
    songs = await getSongs(`songs/${defaultFolder}`); // Load songs from first card
    
    if (songs.length > 0) {
        // Encode the path properly for the audio source
        const encodedPath = curFolder.split('/').map(part => encodeURIComponent(part)).join('/');
        const encodedTrack = encodeURIComponent(songs[0]);
        currentSong.src = `/${encodedPath}/${encodedTrack}`;
        currentSong.load();
        currentSong.volume = 1.0; // Set volume to maximum (100%)
        document.querySelector(".range input[type='range']").value = 100;
        currentSongIndex = 0; // Set the current song index
        
        // Ensure high volume works on mobile devices
        currentSong.addEventListener('loadedmetadata', () => {
            currentSong.volume = 1.0;
        });
        
        const firstSongName = songs[0]
            .replace(".mp3", "")
            .replaceAll("_", " ");
        document.querySelector(".songinfo").innerHTML = firstSongName;
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    }

    // Function to populate song list
    const populateSongList = () => {
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = ""; // Clear existing list
        
        for (const song of songs) {
            const cleanName = song.replace("songs/", "")
                .replace(".mp3", "")
                .replaceAll("_", " ")
                .replaceAll("%20", " ");

            songUL.innerHTML += `
                <li data-file="${song}">
                    <img class="invert" src="music.svg" alt="">
                    <div class="info">
                        <div>${cleanName}</div>
                        <div>Adinova (Feel the beat)</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="">
                    </div>
                </li>`;
        }

        // Re-attach song click handlers after updating the list
        attachSongClickHandlers();
    };

    // Function to attach song click handlers
    const attachSongClickHandlers = () => {
        document.querySelectorAll(".songList li").forEach(songItem => {
            songItem.addEventListener("click", () => {
                const songPath = songItem.dataset.file;
                
                // Check if this is the current song by comparing the encoded filename
                const encodedSongPath = encodeURIComponent(songPath);
                if (currentSong.src.includes(encodedSongPath)) {
                    if (!currentSong.paused) {
                        currentSong.pause();
                        play.src = "play.svg";
                    } else {
                        currentSong.play();
                        play.src = "pause.svg";
                    }
                } else {
                    playMusic(songPath);
                }
                updateSongListIcons();
                updateSelectedSong();
            });
        });
    };

    // Populate initial song list
    populateSongList();
    
    // Update styling for the initial song if it exists
    if (songs.length > 0) {
        updateSongListIcons();
        updateSelectedSong();
    }

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
        updateSongListIcons();
        updateSelectedSong();
    });

    // Time updates
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = 
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = 
            (currentSong.currentTime / currentSong.duration * 100) + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = currentSong.duration * (percent / 100);
    });

    // Song ended
    currentSong.addEventListener("ended", playNextSong);

    // Next/Previous buttons
    document.getElementById("next").addEventListener("click", playNextSong);
    document.getElementById("previous").addEventListener("click", playPreviousSong);

    // Volume control
    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        hamburger.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        hamburger.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Logo reload
    document.querySelectorAll('.logo, .navbar-logo-image').forEach(logo => {
        logo.addEventListener('click', () => location.reload());
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.textContent = 'Dark';
    } else {
        themeToggle.textContent = 'Light';
    }
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        
        if (body.classList.contains('light-theme')) {
            themeToggle.textContent = 'Dark';
            localStorage.setItem('theme', 'light');
        } else {
            themeToggle.textContent = 'Light';
            localStorage.setItem('theme', 'dark');
        }
    });

    //load the library when a card is clicked
    Array.from(document.querySelectorAll('.card')).forEach(e => {
        e.addEventListener('click', async (event) => {
            console.log('Card clicked:', event.currentTarget.dataset.folder);
            
            // Load songs from the selected folder
            songs = await getSongs(`songs/${event.currentTarget.dataset.folder}`);
            console.log('Loaded songs:', songs);
            
            // Update the song list display
            populateSongList();
            
            // If there are songs, set up the first one
            if (songs.length > 0) {
                // Encode the path properly for the audio source
                const encodedPath = curFolder.split('/').map(part => encodeURIComponent(part)).join('/');
                const encodedTrack = encodeURIComponent(songs[0]);
                currentSong.src = `/${encodedPath}/${encodedTrack}`;
                currentSong.load();
                currentSongIndex = 0;
                playMusic(songs[0], false);
                play.src = "pause.svg";
                
                
                // Set volume to high for new playlist (mobile and desktop)
                currentSong.volume = 1.0;
                document.querySelector(".range input[type='range']").value = 100;
                
                // Ensure high volume works on mobile devices
                currentSong.addEventListener('loadedmetadata', () => {
                    currentSong.volume = 1.0;
                });
                
                const firstSongName = songs[0]
                    .replace(".mp3", "")
                    .replaceAll("_", " ");
                document.querySelector(".songinfo").innerHTML = firstSongName;
                document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
            }
        });
    });

}

// Start the site
main();