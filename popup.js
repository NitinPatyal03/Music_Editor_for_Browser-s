
const controls = ["volume","bass","mid","treble","surround","preset","enable3d"];

chrome.storage.local.get("eqSettings", data => {
  if (!data.eqSettings) return;
  Object.entries(data.eqSettings).forEach(([k,v]) => {
    const el = document.getElementById(k);
    if (el.type === "checkbox") el.checked = v;
    else el.value = v;
  });
});

controls.forEach(id => {
  document.getElementById(id).addEventListener("input", update);
  document.getElementById(id).addEventListener("change", update);
});

function update() {
  const settings = {
    volume: parseFloat(volume.value),
    bass: parseFloat(bass.value),
    mid: parseFloat(mid.value),
    treble: parseFloat(treble.value),
    surround: parseFloat(surround.value),
    preset: preset.value,
    enable3d: enable3d.checked
  };

  chrome.storage.local.set({ eqSettings: settings });

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, settings);
  });
}
