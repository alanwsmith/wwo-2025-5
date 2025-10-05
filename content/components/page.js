const names = {
  bass: { name: "Bass" },
  bv: { name: "B.V." },
  gracie: { name: "Gracie" },
  guitar: { name: "Guitar" },
  keys: { name: "Keys" },
  piano: { name: "Piano" },
  plucks: { name: "Plucks" },
  pads: { name: "Pads" },
  solo: { name: "Solo" },
  swells: { name: "Swells" },
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
  init() {
    this.audioContext = new AudioContext();
  }
}

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
  faders(_event, el) {
    for (let [key, details] of Object.entries(names)) {
      const findReplace = {
        key: key,
        name: names[key].name,
      };
      el.appendChild(loadTemplate("fader", findReplace));
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
