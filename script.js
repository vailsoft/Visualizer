const audioPlayer = document.getElementById('audioPlayer');
const ledContainer = document.getElementById('ledContainer');
const fileInput = document.getElementById('fileInput');
const musicListElement = document.getElementById('musicList');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const volumeSlider = document.getElementById('volumeSlider');
const toggleButton = document.getElementById('toggleButton');

const musicList = [];
let currentMusicIndex = -1;

const numBars = 29;
const ledBars = [];
for (let i = 0; i < numBars; i++) {
    const ledWrapper = document.createElement('div');
    ledWrapper.classList.add('led-bar-wrapper');
    const led = document.createElement('div');
    led.classList.add('led-bar');
    ledWrapper.appendChild(led);
    ledContainer.appendChild(ledWrapper);
    ledBars.push(led);
}

fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        musicList.push({
            name: file.name, url
        });
    }
    updateMusicList();

    if (musicList.length > 0 && currentMusicIndex === -1) {
        playMusic(0);
    }
});

function updateMusicList() {
    const currentlyPlayingIndex = currentMusicIndex;
    musicListElement.innerHTML = '';
    musicList.forEach((music, index) => {
        const li = document.createElement('li');
        li.textContent = music.name;
        li.classList.toggle('playing', index === currentMusicIndex);
        li.addEventListener('click', () => playMusic(index));
        li.setAttribute('draggable', true);
        musicListElement.appendChild(li);
    });

    currentMusicIndex = currentlyPlayingIndex;
    makeDraggable();
}

function playMusic(index) {
    if (index >= 0 && index < musicList.length) {
        currentMusicIndex = index;
        audioPlayer.src = musicList[index].url;
        audioPlayer.play();
        updateMusicList();
    }
}

prevButton.addEventListener('click', () => {
    if (currentMusicIndex > 0) {
        playMusic(currentMusicIndex - 1);
    }
});

nextButton.addEventListener('click', () => {
    if (currentMusicIndex < musicList.length - 1) {
        playMusic(currentMusicIndex + 1);
    }
});

volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
});

audioPlayer.addEventListener('ended', () => {
    if (currentMusicIndex < musicList.length - 1) {
        playMusic(currentMusicIndex + 1);
    }
});

audioPlayer.addEventListener('play', () => {
    const context = new AudioContext();
    const src = context.createMediaElementSource(audioPlayer);
    const analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const containerHeight = ledContainer.offsetHeight;
    const maxLedHeight = containerHeight;

    function animate() {
        requestAnimationFrame(animate);

        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < numBars; i++) {
            const value = dataArray[i] * 1;
            const height = Math.min(value, maxLedHeight);

            ledBars[i].style.height = `${Math.max(height, 1)}px`;
            ledBars[i].style.backgroundColor = `rgb(${Math.min(255, height)}, ${Math.min(255, 255 - height)}, 0)`;
        }
    }

    animate();
});

function makeDraggable() {
    const listItems = musicListElement.querySelectorAll('li');
    listItems.forEach((li, index) => {
        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => {
                li.style.opacity = '0.5';
            }, 0);
        });

        li.addEventListener('dragend', () => {
            li.style.opacity = '1';
        });
        li.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const targetIndex = index;

            // Guarda o índice da música atual
            const currentPlayingIndex = currentMusicIndex;

            // Troca as músicas na lista
            const draggedMusic = musicList[draggedIndex];
            musicList[draggedIndex] = musicList[targetIndex];
            musicList[targetIndex] = draggedMusic;

            // Se a música que está tocando foi movida, atualiza o currentMusicIndex
            if (currentPlayingIndex === draggedIndex) {
                currentMusicIndex = targetIndex;
            } else if (currentPlayingIndex === targetIndex) {
                currentMusicIndex = draggedIndex;
            }

            // Atualiza apenas a interface, sem iniciar a reprodução
            updateMusicList();
        });
    });
}

// Modifica a função que alterna a visibilidade da lista
toggleButton.addEventListener('click', () => {
    musicListElement.classList.toggle('hidden');
    
    // Verifica se está em um dispositivo móvel (largura menor que 768px)
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        toggleButton.textContent = musicListElement.classList.contains('hidden') ? '↑' : '↓';
    } else {
        toggleButton.textContent = musicListElement.classList.contains('hidden') ? '‹' : '›';
    }
});

// Adiciona listener para mudança de tamanho da tela
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    const isHidden = musicListElement.classList.contains('hidden');
    
    if (isMobile) {
        toggleButton.textContent = isHidden ? '↑' : '↓';
    } else {
        toggleButton.textContent = isHidden ? '‹' : '›';
    }
});

// Inicializa o volume do audio player em 50%
audioPlayer.volume = 0.5; 