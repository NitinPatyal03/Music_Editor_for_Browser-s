
let audioContext;
let sourceNode;
let gainNode, bassNode, midNode, trebleNode;
let stereoSplitter, stereoMerger, delayL, delayR, convolver;
let currentMedia;

function createImpulseResponse(context, duration = 2, decay = 2) {
  const rate = context.sampleRate;
  const length = rate * duration;
  const impulse = context.createBuffer(2, length, rate);
  for (let i = 0; i < 2; i++) {
    const channel = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      channel[j] = (Math.random()*2-1)*Math.pow(1-j/length, decay);
    }
  }
  return impulse;
}

function setupAudio(mediaElement) {
  if (!mediaElement || mediaElement === currentMedia) return;
  currentMedia = mediaElement;

  if (!audioContext) audioContext = new AudioContext();

  sourceNode = audioContext.createMediaElementSource(mediaElement);
  gainNode = audioContext.createGain();

  bassNode = audioContext.createBiquadFilter();
  bassNode.type = "lowshelf"; bassNode.frequency.value = 200;

  midNode = audioContext.createBiquadFilter();
  midNode.type = "peaking"; midNode.frequency.value = 1000; midNode.Q.value = 1;

  trebleNode = audioContext.createBiquadFilter();
  trebleNode.type = "highshelf"; trebleNode.frequency.value = 3000;

  stereoSplitter = audioContext.createChannelSplitter(2);
  stereoMerger = audioContext.createChannelMerger(2);
  delayL = audioContext.createDelay();
  delayR = audioContext.createDelay();

  convolver = audioContext.createConvolver();
  convolver.buffer = createImpulseResponse(audioContext);

  sourceNode.connect(bassNode).connect(midNode).connect(trebleNode).connect(stereoSplitter);
  stereoSplitter.connect(delayL,0); stereoSplitter.connect(delayR,1);
  delayL.connect(stereoMerger,0,0); delayR.connect(stereoMerger,0,1);
  stereoMerger.connect(gainNode).connect(audioContext.destination);

  loadSavedSettings();
}

function loadSavedSettings(){
  chrome.storage.local.get("eqSettings", data => { if(data.eqSettings) applySettings(data.eqSettings); });
}

function applySettings(s){
  if(!gainNode) return;
  gainNode.gain.value = s.volume;
  bassNode.gain.value = s.bass;
  midNode.gain.value = s.mid;
  trebleNode.gain.value = s.treble;
  delayL.delayTime.value = s.surround*0.03;
  delayR.delayTime.value = s.surround*0.05;

  stereoMerger.disconnect();
  if(s.enable3d){
    stereoMerger.connect(convolver).connect(gainNode);
  } else {
    stereoMerger.connect(gainNode);
  }

  const presets = { flat:[0,0,0], rock:[8,3,6], pop:[6,2,4], classical:[2,4,6], bassboost:[12,0,-2] };
  if(presets[s.preset]){
    const [b,m,t]=presets[s.preset];
    bassNode.gain.value=b; midNode.gain.value=m; trebleNode.gain.value=t;
  }
}

chrome.runtime.onMessage.addListener(applySettings);

const observer = new MutationObserver(() => {
  const media = document.querySelector("audio, video");
  if (media) setupAudio(media);
});
observer.observe(document.body, { childList:true, subtree:true });
setupAudio(document.querySelector("audio, video"));
