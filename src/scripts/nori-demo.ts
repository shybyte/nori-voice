/// <reference path="utils" />
/// <reference path="nori" />


module nori.demo {
  'use strict';

  var nora = new syWRonan();

  nora.texts[0] = "!AY l4AHv yUW nAOr3AH_";
  ronanCBInit(nora);
  ronanCBSetSR(nora, 44100);
  ronanCBSetCtl(nora, 4, 70);
  ronanCBSetCtl(nora, 5, 100);

  //R.times(counter => {
  //  ronanCBTick(nora);
  //  if (counter === 1) {
  //    ronanCBNoteOn(nora);
  //  }
  //}, 3);



  var attack = 0.05;
  var release = 0.05;
  var portamento = 0.05;
  var activeNotes:any[] = [];	// the stack of actively-pressed keys

  var audioContext = new AudioContext();
  var oscillator = audioContext.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(175, 0);
  //var envelope = audioContext.createGain();
  //oscillator.connect(envelope);
  //envelope.connect(audioContext.destination);
  //envelope.gain.value = 0.2;
  //oscillator.start(0);


  var gain = audioContext.createScriptProcessor(1024, 1, 1);
  gain.onaudioprocess = (function () {
    var amplitude = 0.25;
    var decay = Math.exp(-1.0 / (0.5 * audioContext.sampleRate));
    //console.log(decay);
    var counter = 0;

    return function (event:AudioProcessingEvent) {
      if (counter<1000) {
        //ronanCBTick(nora);
        if (counter === 1) {
          ronanCBNoteOn(nora);
        }
        counter++;
      }
      var inp = event.inputBuffer.getChannelData(0);
      var out = event.outputBuffer.getChannelData(0);
      ronanCBProcess(nora, inp, out);
      for (var i = 0, N = out.length; i < N; ++i, amplitude *= decay) {
        if (i%128 === 0) {
          ronanCBTick(nora);
        }
        //out[i] = amplitude * inp[i];
        out[i] =  out[i]/2;
      }
    };
  }());


  setTimeout(() => {
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 5);
    setTimeout(() => {
      gain.disconnect();
    }, 5000);
  }, 1000);


}



