/// <reference path="phonemes" />
/// <reference path="types" />

module nori {
  const PI = Math.PI;
  var phonemes:Phoneme[] = Array(NPHONEMES);

  var g = {
    samplerate: 0,
    fcminuspi_sr: 0,
    fc2pi_sr: 0
  };

  const nix = '';

  interface  syldef {
    syl: string;
    ptab: number[]; // [4]
  }

  const syls:syldef[] = [
    ["sil", [50, -1, -1, -1]],
    ["ng", [38, -1, -1, -1]],
    ["th", [57, -1, -1, -1]],
    ["sh", [55, -1, -1, -1]],
    ["dh", [12, 51, 13, -1]],
    ["zh", [67, 51, 67, -1]],
    ["ch", [9, 10, -1, -1]],
    ["ih", [25, -1, -1, -1]],
    ["eh", [16, -1, -1, -1]],
    ["ae", [1, -1, -1, -1]],
    ["ah", [60, -1, -1, -1]],
    ["oh", [39, -1, -1, -1]],
    ["uh", [42, -1, -1, -1]],
    ["ax", [0, -1, -1, -1]],
    ["iy", [17, -1, -1, -1]],
    ["er", [19, -1, -1, -1]],
    ["aa", [4, -1, -1, -1]],
    ["ao", [5, -1, -1, -1]],
    ["uw", [61, -1, -1, -1]],
    ["ey", [2, 25, -1, -1]],
    ["ay", [28, 25, -1, -1]],
    ["oy", [41, 25, -1, -1]],
    ["aw", [45, 46, -1, -1]],
    ["ow", [40, 46, -1, -1]],
    ["ia", [26, 27, -1, -1]],
    ["ea", [3, 27, -1, -1]],
    ["ua", [43, 27, -1, -1]],
    ["ll", [35, -1, -1, -1]],
    ["wh", [63, -1, -1, -1]],
    ["ix", [0, -1, -1, -1]],
    ["el", [34, -1, -1, -1]],
    ["rx", [53, -1, -1, -1]],
    ["h", [24, -1, -1, -1]],
    ["p", [47, 48, 49, -1]],
    ["t", [56, 58, 59, -1]],
    ["k", [31, 32, 33, -1]],
    ["b", [6, 7, 8, -1]],
    ["d", [11, 14, 15, -1]],
    ["g", [21, 22, 23, -1]],
    ["m", [36, -1, -1, -1]],
    ["n", [37, -1, -1, -1]],
    ["f", [20, -1, -1, -1]],
    ["s", [54, -1, -1, -1]],
    ["v", [62, 51, 62, -1]],
    ["z", [66, 51, 68, -1]],
    ["l", [34, -1, -1, -1]],
    ["r", [52, -1, -1, -1]],
    ["w", [63, -1, -1, -1]],
    ["q", [51, -1, -1, -1]],
    ["y", [65, -1, -1, -1]],
    ["j", [29, 30, 51, 30]],
    [" ", [18, -1, -1, -1]],
  ].map(tupel=> ({
      syl: <string> tupel[0],
      ptab: <number[]> tupel[1]
    }));



}