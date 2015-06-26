/// <reference path="utils" />

module nori.demo {
  'use strict';

  var attack=0.05;
  var release=0.05;
  var portamento=0.05;
  var activeNotes : any[] = [];	// the stack of actively-pressed keys

  var context = new AudioContext();
  var oscillator = context.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(110, 0);
  var envelope = context.createGain();
  oscillator.connect(envelope);
  envelope.connect(context.destination);
  envelope.gain.value = 0.2;
  oscillator.start(0);

  console.log('Test');

  setTimeout(() => {
    envelope.gain.value = 0;  // Mute the sound
  }, 1000);
}



