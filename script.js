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
        
        if (currentSong.src.endsWith(songPath.replace("songs/", ""))) {
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
    let response = await fetch(`/${normalizedFolder}/`);
    let html = await response.text();
    let div = document.createElement("div");
    div.innerHTML = html;
    let links = div.getElementsByTagName("a");
    let songList = [];
    
    for (let link of links) {
        if (link.href.endsWith(".mp3")) {
            songList.push(link.href.split(`${folder}/`)[1]);
        }
    }
    return songList;
}

const playMusic = (track, updateIndex = true) => {
    currentSong.src = `/${curFolder}/${track}`;
    currentSong.play();
    play.src = "pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
        .replace("songs/", "")
        .replace(".mp3", "")
        .replaceAll("_", " ")
        .replaceAll("%20", " ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    
    if (updateIndex) {
        currentSongIndex = songs.findIndex(song => song === track);
    }
    updateSongListIcons();
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
        currentSong.src = `/${curFolder}/${songs[0]}`;
        currentSong.load();
        currentSong.volume = 1.0;
        document.querySelector(".range input[type='range']").value = 100;
        
        const firstSongName = decodeURI(songs[0])
            .replace("songs/", "")
            .replace(".mp3", "")
            .replaceAll("_", " ")
            .replaceAll("%20", " ");
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
                
                if (currentSong.src.endsWith(songPath.replace("songs/", ""))) {
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
            });
        });
    };

    // Populate initial song list
    populateSongList();

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
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    });

    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
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
                currentSong.src = `/${curFolder}/${songs[0]}`;
                currentSong.load();
                currentSongIndex = 0;
                
                const firstSongName = decodeURI(songs[0])
                    .replace("songs/", "")
                    .replace(".mp3", "")
                    .replaceAll("_", " ")
                    .replaceAll("%20", " ");
                document.querySelector(".songinfo").innerHTML = firstSongName;
                document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
                
                // Reset play button
                play.src = "play.svg";
            }
        });
    });

}

// Start the app
main();