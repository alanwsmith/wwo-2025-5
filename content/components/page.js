const names = {
  bass: { name: "Bass" },
  //   bv: { name: "B.V." },
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
  waveform: `<div>name</div><canvas id="key" />`,
};

class Player {
  constructor() {
    this.audioContext = new AudioContext();
    this.stems = {};
  }

  addStem(key, track) {
    console.log(`Adding stem: ${key}`);
    const payload = {
      track: track,
    };
    payload.source = new AudioBufferSourceNode(this.audioContext, {
      buffer: payload.track,
    });
    payload.gainNode = this.audioContext.createGain();
    payload.source.connect(payload.gainNode).connect(
      this.audioContext.destination,
    );
    this.stems[key] = payload;
  }
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
    document.documentElement.style.setProperty(
      "--page-visibility",
      "visible",
    );
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
    this.player = new Player();
    for (let key of Object.keys(names)) {
      let track = await this.getTrack(key);
      this.player.addStem(key, track);
    }
  }

  async getTrack(key) {
    const url = `/stems/${key}.mp3`;
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error("There was a problem getting the track");
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const track = await this.player.audioContext.decodeAudioData(arrayBuffer);
      return track;
    }
  }

  waveforms(_event, el) {
    for (let [key, details] of Object.entries(names)) {
      const findReplace = {
        key: key,
        name: names[key].name,
      };
      el.appendChild(loadTemplate("waveform", findReplace));
    }
  }
}
