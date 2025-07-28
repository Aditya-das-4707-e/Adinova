let currentSong = new Audio();
let songs = [];
let currentSongIndex = 0;

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

async function getSongs() {
    let a = await fetch("songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push("songs/" + element.href.split("/songs/")[1]);
        }
    }
    return songs
}

const playMusic = (track, updateIndex = true) => {
    currentSong.src = track;
    currentSong.play();
    play.src = "pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURI(track).replace("songs/", "").replace(".mp3", "").replaceAll("_", " ").replaceAll("%20", " ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    
    // Update current song index if needed
    if (updateIndex) {
        currentSongIndex = songs.findIndex(song => song === track);
    }
    
    // Update song list icons
    updateSongListIcons();
}

const playNextSong = () => {
    if (songs.length === 0) return;
    
    currentSongIndex = (currentSongIndex + 1) % songs.length; // Loop back to first song after last
    playMusic(songs[currentSongIndex], false);
}

const playPreviousSong = () => {
    if (songs.length === 0) return;
    
    currentSongIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1; // Loop to last song if at first
    playMusic(songs[currentSongIndex], false);
}

async function main() {

    songs = await getSongs(); // Remove 'let' to use global variable
    currentSong.src = songs[0]; // set the first song as the current song
    currentSong.load(); // load the song
    
    // Set default volume to full (100%)
    currentSong.volume = 1.0;
    document.querySelector(".range input[type='range']").value = 100;
    
    // Display the first song name in the playbar on page load
    if (songs.length > 0) {
        const firstSongName = decodeURI(songs[0]).replace("songs/", "").replace(".mp3", "").replaceAll("_", " ").replaceAll("%20", " ");
        document.querySelector(".songinfo").innerHTML = firstSongName;
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    }

    let songUL = document.querySelector(".songList ul");
    for (const song of songs) {
        const cleanName = song.replace("songs/", "").replace(".mp3", "").replaceAll("_", " ").replaceAll("%20", " ");

        songUL.innerHTML += `<li data-file="${song}">
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

    document.querySelectorAll(".songList li").forEach(songItem => {
        songItem.addEventListener("click", () => {
            const songPath = songItem.dataset.file;
            
            // Check if the clicked song is the same as currently playing
            if (currentSong.src.endsWith(songPath.replace("songs/", "")) && !currentSong.paused) {
                // If same song is playing, pause it
                currentSong.pause();
                play.src = "play.svg";
                updateSongListIcons();
            } else if (currentSong.src.endsWith(songPath.replace("songs/", "")) && currentSong.paused) {
                // If same song is paused, resume it
                currentSong.play();
                play.src = "pause.svg";
                updateSongListIcons();
            } else {
                // If different song, play the new song
                playMusic(songPath);
            }
        });
    });

    // attach an event listener to the play next and previous buttons
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "pause.svg";
            updateSongListIcons();
        } else {
            currentSong.pause();
            play.src = "play.svg";
            updateSongListIcons();
        }
    })

    // Add event listeners for play and pause events to update icons
    currentSong.addEventListener("play", () => {
        updateSongListIcons();
    });

    currentSong.addEventListener("pause", () => {
        updateSongListIcons();
    });

    // time update 
    currentSong.addEventListener("timeupdate", () => {
        // console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = currentSong.currentTime / currentSong.duration * 100 + "%";
    })

    // seekbar click, move and slide
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = currentSong.duration * (percent / 100);
    })

    // Auto-play next song when current song ends
    currentSong.addEventListener("ended", () => {
        playNextSong();
    })

    // Next and Previous button functionality
    document.getElementById("next").addEventListener("click", () => {
        playNextSong();
    })

    document.getElementById("previous").addEventListener("click", () => {
        playPreviousSong();
    })

    // Mobile Toggle Functionality
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger');
        const mobileOverlay = document.getElementById('mobileOverlay');

        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            hamburger.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            
            if (sidebar.classList.contains('active')) {
                mobileOverlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            } else {
                setTimeout(() => {
                    mobileOverlay.style.display = 'none';
                }, 300);
                document.body.style.overflow = '';
            }
        });

        // Close sidebar when clicking overlay
        mobileOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            hamburger.classList.remove('active');
            mobileOverlay.classList.remove('active');
            setTimeout(() => {
                mobileOverlay.style.display = 'none';
            }, 300);
            document.body.style.overflow = '';
        });

        // Close sidebar on window resize if screen becomes larger
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
                mobileOverlay.classList.remove('active');
                mobileOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });

    // Home element click event to prevent page reload
    const homeElement = document.querySelector('.home ul li');
    if (homeElement) {
        homeElement.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event from bubbling up to parent elements
            event.preventDefault();  // Prevent default behavior
            console.log('Home clicked - page reload prevented');
            // Add any home-specific functionality here if needed
        });
    }

    // Logo click event to reload the page
    const logo = document.querySelector('.logo .picture');
    if (logo) {
        logo.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Navbar logo click event to reload the page
    const navbarLogo = document.querySelector('.navbar-logo-image');
    if (navbarLogo) {
        navbarLogo.addEventListener('click', function() {
            window.location.reload();
        });
    }

    //add an event to volume slider
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/100");
        currentSong.volume = parseInt(e.target.value) / 100;
    })

}
main();