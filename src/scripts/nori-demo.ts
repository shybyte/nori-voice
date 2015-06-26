/// <reference path="utils" />


module nori.demo {
  'use strict';

  var attack = 0.05;
  var release = 0.05;
  var portamento = 0.05;
  var activeNotes:any[] = [];	// the stack of actively-pressed keys

  var audioContext = new AudioContext();
  var oscillator = audioContext.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(110, 0);
  //var envelope = audioContext.createGain();
  //oscillator.connect(envelope);
  //envelope.connect(audioContext.destination);
  //envelope.gain.value = 0.2;
  //oscillator.start(0);


  var gain = audioContext.createScriptProcessor(1024, 1, 1);
  gain.onaudioprocess = (function () {
    var amplitude = 0.25;
    var decay = Math.exp(-1.0 / (0.5 * audioContext.sampleRate));
    console.log(decay);
    return function (event:AudioProcessingEvent) {
      var inp = event.inputBuffer.getChannelData(0);
      var out = event.outputBuffer.getChannelData(0);
      for (var i = 0, N = out.length; i < N; ++i, amplitude *= decay) {
        out[i] = amplitude * inp[i];
      }
    };
  }());


  console.log('Test');

  setTimeout(() => {
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.0);
  }, 1000);


}



