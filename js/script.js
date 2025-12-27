class TrueAudioApp {
    constructor() {
        this.worker = new Worker('js/analysis-worker.js'); // Lokasi file worker
        this.resultsGrid = document.getElementById('results-grid');
        this.fileInput = document.getElementById('file-input');
        this.dropZone = document.getElementById('drop-zone');
        this.init();
    }

    init() {
        this.dropZone.onclick = () => this.fileInput.click();
        this.fileInput.onchange = (e) => this.processFiles(e.target.files);
        
        // Listener dari Worker
        this.worker.onmessage = (e) => this.updateUI(e.data);
    }

    async processFiles(files) {
        for (const file of files) {
            const fileId = 'id-' + Date.now() + Math.random();
            this.createCard(fileId, file.name);

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            
            // Decode audio
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);

            // Kirim ke Worker menggunakan Transferables (Sangat Cepat)
            this.worker.postMessage({
                fileId,
                channelData: channelData,
                sampleRate: audioBuffer.sampleRate,
                fftSize: 2048
            }, [channelData.buffer]);
        }
    }

    createCard(id, name) {
        const temp = document.getElementById('card-template');
        const clone = temp.content.cloneNode(true);
        const card = clone.querySelector('.result-card');
        card.id = id;
        card.querySelector('.file-name').innerText = name;
        this.resultsGrid.prepend(clone);
    }

    updateUI(data) {
        const card = document.getElementById(data.fileId);
        if (!card) return;

        card.querySelector('.cutoff-text').innerText = (data.cutoff / 1000).toFixed(1) + ' kHz';
        const label = card.querySelector('.quality-label');
        label.innerText = data.quality;
        label.style.color = data.quality === 'Lossless' ? '#10b981' : '#f43f5e';

        const canvas = card.querySelector('.spec-canvas');
        this.drawSpectrogram(canvas, data.spectrogram);
    }

    drawSpectrogram(canvas, data) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width / data.length;
        const h = canvas.height / data[0].length;

        data.forEach((frame, i) => {
            frame.forEach((val, j) => {
                ctx.fillStyle = `rgb(${val}, ${val/4}, ${128-val/2})`;
                ctx.fillRect(i * w, canvas.height - (j * h), w, h);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new TrueAudioApp());
