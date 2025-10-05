const names = {
  bass: { name: "Bass" },
  bv: { name: "B.V." },
  //   gracie: { name: "Gracie" },
  //   guitar: { name: "Guitar" },
  //   keys: { name: "Keys" },
  //   piano: { name: "Piano" },
  //   plucks: { name: "Plucks" },
  //   pads: { name: "Pads" },
  //   solo: { name: "Solo" },
  //   swells: { name: "Swells" },
};

const templates = {
  fader: `
    <div><label>name 
      <input type="range" min="0" max="100" 
        data-param="key" data-send="fade" value="100" />
      </label>
    </div>`,
  waveform:
    `<div>name</div><div data-receive="visualize" data-key="dataKey"></div>`,
};

class Player {
  constructor() {
    this.audioContext = new AudioContext();
    this.stems = {};
  }
}

function visualiseWaveform(track, canvas) {
}

function draw(normalizedData, canvas) {
  const padding = 0;
  const ctx = canvas.getContext("2d");
  ctx.translate(0, canvas.offsetHeight / 2 + padding);
  const width = canvas.offsetWidth / normalizedData.length;
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

// class Stem {
//   constructor(track) {
//     this.track = track;
//       this.source = new AudioBufferSourceNode(this.audioContext, {
//         buffer: stem.track,
//       })
//   }
// }

function loadTemplate(name, findReplace) {
  const template = document.createElement("template");
  let content = templates[name];
  for (let [k, v] of Object.entries(findReplace)) {
    content = content.replaceAll(k, v);
  }
  template.innerHTML = content;
  return template.content.cloneNode(true);
}

export default class {
  bittyInit() {
    this.audioContext = new AudioContext();
    this.stems = {};
    document.documentElement.style.setProperty(
      "--page-visibility",
      "visible",
    );
  }

  async addStem(key, track) {
    console.log(`Adding stem: ${key}`);
    const payload = {
      track: track,
    };
    payload.source = await new AudioBufferSourceNode(this.audioContext, {
      buffer: payload.track,
    });
    payload.gainNode = await this.audioContext.createGain();
    await payload.source.connect(payload.gainNode).connect(
      this.audioContext.destination,
    );
    this.stems[key] = payload;
  }

  faders(_event, el) {
    for (let [key, details] of Object.entries(names)) {
      const findReplace = {
        key: key,
        name: names[key].name,
      };
      el.appendChild(loadTemplate("fader", findReplace));
    }
  }

  async init(_event, _el) {
    for (let key of Object.keys(names)) {
      console.log("h1");
      let track = await this.getTrack(key);
      await this.addStem(key, track);
      console.log("h2");
      this.api.forward({ target: { dataset: { key: key } } }, "visualize");
    }
  }

  async getTrack(key) {
    const url = `/stems/${key}.mp3`;
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error("There was a problem getting the track");
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const track = await this.audioContext.decodeAudioData(arrayBuffer);
      return track;
    }
  }

  visualize(event, el) {
    if (event.target.dataset.key === el.dataset.key) {
      el.innerHTML = "visualize";
    }
  }

  waveforms(_event, el) {
    for (let [key, details] of Object.entries(names)) {
      const findReplace = {
        dataKey: key,
        name: names[key].name,
      };
      el.appendChild(loadTemplate("waveform", findReplace));
    }
  }
}
