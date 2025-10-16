const names = {
  bass: { name: "Bass" },
  bv1: { name: "BV1" },
  bv2: { name: "BV2" },
  clyde: { name: "Clyde" },
  drums: { name: "Drums" },
  gracie: { name: "Gracie" },
  guitar: { name: "Guitar" },
  horns: { name: "Horns" },
  keys: { name: "Keys" },
  wurli: { name: "Wurli" },
};

const waveform = `
<div class="waveform-wrapper">
  <label><span class="labelName">name</span>
  <input type="range" min="0" max="1" data-receive="reset"
      data-key="dataKey" data-send="fade" value="1" step="0.01" />
  </label>
  <canvas width="440" height="30" data-receive="visualize" data-key="dataKey"></canvas>
</div>`;

window.Remixer = class {
  bittyInit() {
    this.isPlaying = false;
    this.audioContext = new AudioContext();
    this.stems = {};
    this.api.setProp("--load-hider", "visible");
  }

  async init(_event, _el) {
    for (let key of Object.keys(names)) {
      let track = await this.getTrack(key);
      await this.addStem(key, track);
    }
    this.api.forward(null, "showButton");
  }

  addStem(key, track) {
    console.log(`Adding stem: ${key}`);
    this.stems[key] = {};
    this.stems[key].track = track;
    this.api.forward({ target: { dataset: { key: key } } }, "visualize");
  }

  draw(normalizedData, canvas, time) {
    const padding = 0;
    const ctx = canvas.getContext("2d");
    const width = canvas.offsetWidth / normalizedData.length;
    ctx.clearRect(0, 0, 440, 30);

    if (this.isPlaying) {
      const hardCodedSongLength = 186;
      const pct = time / hardCodedSongLength;
      const x2 = 440 * pct;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#a11";
      ctx.beginPath();
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, 20);
      ctx.stroke();
    }

    for (let i = 0; i < normalizedData.length; i++) {
      const x = width * i;
      let height = normalizedData[i] * canvas.offsetHeight - padding;
      if (height < 0) {
        height = 0;
      } else if (height > canvas.offsetHeight / 2) {
        height = height > canvas.offsetHeight / 2;
      }
      drawLineSegment(ctx, x, height, width, (i + 1) % 2);
    }
  }

  fade(event, _el) {
    const gain = parseFloat(event.target.value);
    const key = event.target.dataset.key;
    this.stems[key].gainNode.gain.value = gain;
    console.log(event.target.value);
  }

  async getTrack(key) {
    const url = `/stems/do/${key}.mp3`;
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error("There was a problem getting the track");
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const track = await this.audioContext.decodeAudioData(arrayBuffer);
      return track;
    }
  }

  playStop(_event, el) {
    if (this.isPlaying) {
      el.innerHTML = "Play";
      this.isPlaying = false;
      for (let key of Object.keys(names)) {
        this.stems[key].source.stop();
      }
      this.api.forward(null, "reset");
    } else {
      el.innerHTML = "Stop";
      this.api.forward(null, "reset");
      this.isPlaying = true;
      this.audioContext = new AudioContext();
      for (let key of Object.keys(names)) {
        this.stems[key].source = new AudioBufferSourceNode(this.audioContext, {
          buffer: this.stems[key].track,
        });
        this.stems[key].gainNode = this.audioContext.createGain();
        this.stems[key].source.connect(this.stems[key].gainNode).connect(
          this.audioContext.destination,
        );
        this.stems[key].source.start();
      }
      this.trackPlayhead();
    }
  }

  reset(_event, el) {
    el.value = 100;
  }

  showButton(_event, el) {
    el.innerHTML = "Play";
    el.dataset.send = "playStop";
  }

  trackPlayhead() {
    for (let key of Object.keys(names)) {
      this.api.forward({ target: { dataset: { key: key } } }, "visualize");
    }
    let _ = requestAnimationFrame(() => {
      if (this.isPlaying) {
        this.trackPlayhead();
      }
    });
  }

  visualize(event, el) {
    if (event.target.dataset.key === el.dataset.key) {
      const filteredData = filterData(this.stems[el.dataset.key].track);
      const normalizedData = normalizeData(filteredData);
      this.draw(normalizedData, el, this.audioContext.currentTime);
    }
  }

  waveforms(_event, el) {
    for (let [key, _] of Object.entries(names)) {
      const subs = [
        ["dataKey", key],
        ["name", names[key].name]
      ];
      el.appendChild(this.api.useTemplate(waveform, subs));
    }
  }
}

function filterData(audioBuffer) {
  const rawData = audioBuffer.getChannelData(0);
  const samples = 500;
  const blockSize = Math.floor(rawData.length / samples);
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]);
    }
    filteredData.push(sum / blockSize);
  }
  return filteredData;
}

function normalizeData(filteredData) {
  const multiplier = Math.pow(Math.max(...filteredData), -1);
  return filteredData.map((n) => n * multiplier);
}

function drawLineSegment(ctx, x, y, width, isEven) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#ddd";
  ctx.beginPath();
  y = isEven ? y : -y;
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y);
  ctx.lineTo(x + width, 0);
  ctx.stroke();
}
