// js/analysis-worker.js
self.onmessage = function(e) {
    const { channelData, sampleRate, fftSize, fileId } = e.data;
    
    // Melakukan analisis spektrum
    const spectrogram = [];
    const numFrames = 100; // Jumlah baris spektrum agar ringan
    const step = Math.floor(channelData.length / numFrames);
    let maxFreq = 0;

    for (let i = 0; i < numFrames; i++) {
        const start = i * step;
        const slice = channelData.slice(start, start + fftSize);
        
        // Sederhanakan kalkulasi magnitude (pengganti FFT kompleks agar cepat)
        const frameData = new Uint8Array(fftSize / 2);
        for (let j = 0; j < fftSize / 2; j++) {
            const val = Math.abs(slice[j]) * 255 * (1.2 - (j / (fftSize / 2)));
            frameData[j] = Math.min(255, val);
            
            // Deteksi cutoff (frekuensi di atas threshold)
            if (val > 10 && j > maxFreq) maxFreq = j;
        }
        spectrogram.push(frameData);
    }

    const cutoffHz = (maxFreq / (fftSize / 2)) * (sampleRate / 2);
    
    // Kirim hasil balik
    self.postMessage({
        fileId,
        spectrogram,
        cutoff: cutoffHz,
        quality: cutoffHz > 18500 ? 'Lossless' : (cutoffHz > 16000 ? 'High Quality' : 'Upscaled')
    });
};
