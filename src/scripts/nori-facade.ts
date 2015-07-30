/// <reference path="utils" />
/// <reference path="nori" />


module nori.facade {
  'use strict';

  export function startNoriVoice(audioContext: AudioContext = new AudioContext(), effects:AudioNode[] = []) {
    var nora = new syWRonan();

    nora.texts[0] = "";
    ronanCBInit(nora);
    ronanCBSetSR(nora, 44100);
    ronanCBSetCtl(nora, 4, 70);
    ronanCBSetCtl(nora, 5, 100);

    var oscillator = audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(175, 0);

    var noriVoiceAudioProcessor = audioContext.createScriptProcessor(1024, 1, 1);

    noriVoiceAudioProcessor.onaudioprocess = (function () {
      var amplitude = 0.25;
      var decay = Math.exp(-1.0 / (0.5 * audioContext.sampleRate));
      //console.log(decay);
      var counter = 0;

      return function (event:AudioProcessingEvent) {
        if (counter < 1000) {
          if (counter === 1) {
            ronanCBNoteOn(nora);
          }
          counter++;
        }
        var inp = event.inputBuffer.getChannelData(0);
        var out = event.outputBuffer.getChannelData(0);
        ronanCBProcess(nora, inp, out);
        for (var i = 0, N = out.length; i < N; ++i, amplitude *= decay) {
          if (i % 128 === 0) {
            ronanCBTick(nora);
          }
          //out[i] = amplitude * inp[i];
          out[i] = out[i] / 2;
        }
      };
    }());


    oscillator.start(audioContext.currentTime);

    var audioNodeChain:AudioNode[] = [oscillator, <AudioNode>noriVoiceAudioProcessor]
      .concat(effects)
      .concat([audioContext.destination]);

    audioNodeChain.forEach((audioNode, i) => {
      if (i < audioNodeChain.length - 1) {
        var nextNode = audioNodeChain[i + 1];

        // workaround for old tuna version?
        if ((<any>nextNode)['input']) {
          nextNode = (<any>nextNode)['input'];
        }

        audioNode.connect(nextNode);
      }
    });

    return {
      sing: (phonemes:string, freq:number) => {
        nora.texts[0] = phonemes;
        oscillator.frequency.setValueAtTime(freq, 0);
        ronanCBSetCtl(nora, 4, 0);
      }
    }
  }

}