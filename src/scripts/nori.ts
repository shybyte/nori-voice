/// <reference path="type-defs/ramda.d.ts" />
/// <reference path="phonemes" />
/// <reference path="types" />

module nori {
  const PI = Math.PI;
  var phonemes:Phoneme[]; // = Array(NPHONEMES);

  var g = {
    samplerate: 0,
    fcminuspi_sr: 0,
    fc2pi_sr: 0
  };

  const nix = '';

  interface syldef {
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

  const NSYLS = syls.length;

  // filter type 1: 2-pole resonator
  class ResDef {
    // coefficients
    constructor(public a:sF32, public b:sF32, public c:sF32) {
    }

    set(f:sF32, bw:sF32, gain:sF32) {
      var r = Math.exp(g.fcminuspi_sr * bw);
      this.c = -(r * r);
      this.b = r * Math.cos(g.fc2pi_sr * f) * 2.0;
      this.a = gain * (1.0 - this.b - this.c);
    }
  }
  ;

  class Resonator {
    def:ResDef;
    p1:sF32; // delay buffers
    p2:sF32;

    setdef(a_def:ResDef) {
      this.def = a_def;
    }

    tick(inVal:sF32):sF32 {
      var x = this.def.a * inVal + this.def.b * this.p1 + this.def.c * this.p2;
      this.p2 = this.p1;
      this.p1 = x;
      return x;
    }
  }
  ;

  var d_peq1:ResDef;

  var flerp = (a:sF32, b:sF32, x:sF32) => a + x * (b - a);

  var db2lin = (db1:sF32, db2:sF32, x:sF32) => Math.pow(2.0, (flerp(db1, db2, x) - 70) / 6.0);
  var f4 = 3200;
  var f5 = 4000;
  var f6 = 6000;
  var bn = 100;
  var b4 = 200;
  var b5 = 500;
  var b6 = 800;


  class syVRonan {
    rdef:ResDef[] = Array(7); // nas,f1,f2,f3,f4,f5,f6;
    a_voicing:sF32;
    a_aspiration:sF32;
    a_frication:sF32;
    a_bypass:sF32;
  }

  const NOISEGAIN = 0.25;

  class syWRonan extends syVRonan {
    newframe:syVRonan;

    res:Resonator[] = Array(7);  // 0:nas, 1..6: 1..6

    lastin2:sF32;

    // settings
    texts:string[] = Array(64);
    pitch:sF32;
    framerate:sInt;

    // noise
    nseed:sU32;
    nout:sF32;

    // phonem seq
    framecount:sInt;  // frame rate divider
    spos:sInt;        // pos within syl definition (0..3)
    scounter:sInt;    // syl duration divider
    cursyl:sInt;      // current syl
    durfactor:sInt;   // duration modifier
    invdur:sF32;      // 1.0 / current duration
    baseptr:string; // pointer to start of text
    ptr:string;  // pointer to text
    curp1:sInt; // current/last phonemes
    curp2:sInt;

    // sync
    wait4on:sInt;
    wait4off:sInt;

    // post EQ
    hpb1:sF32;
    hpb2:sF32;
    peq1:Resonator;

    SetFrame(p1s:Phoneme, p2s:Phoneme, x:sF32, dest:syVRonan) {
      var p1:Phoneme;
      var p2:Phoneme;

      //@formatter:off
      var p1f=[p1.fnf,p1.f1f,p1.f2f,p1.f3f,f4    ,f5     ,f6];
      var p1b=[bn    ,p1.f1b,p1.f2b,p1.f3b,b4    ,b5     ,b6];
      var p1a=[p1.a_n,p1.a_1,p1.a_2,p1.a_3,p1.a_4,p1.a_56,p1.a_56];
      var p2f=[p2.fnf,p2.f1f,p2.f2f,p2.f3f,f4    ,f5     ,f6];
      var p2b=[bn    ,p2.f1b,p2.f2b,p2.f3b,b4    ,b5     ,b6];
      var p2a=[p2.a_n,p2.a_1,p2.a_2,p2.a_3,p2.a_4,p2.a_56,p2.a_56];
        //@formatter:on

      p1 = p1s;
      p2 = p2s;

      for (var i = 0; i < 7; i++) {
        var resDef:ResDef = dest.rdef[i];
        resDef.set(
          flerp(p1f[i], p2f[i], x) * this.pitch,
          flerp(p1b[i], p2b[i], x),
          db2lin(p1a[i], p2a[i], x));
      }

      dest.a_voicing = db2lin(p1.a_voicing, p2.a_voicing, x);
      dest.a_aspiration = db2lin(p1.a_aspiration, p2.a_aspiration, x);
      dest.a_frication = db2lin(p1.a_frication, p2.a_frication, x);
      dest.a_bypass = db2lin(p1.a_bypass, p2.a_bypass, x);
    }

    noise():sF32 {
      var val:sU32|sF32;

      // random...
      this.nseed = (this.nseed * 196314165) + 907633515;

      // convert to float between 2.0 and 4.0
      val = (this.nseed >> 9) | 0x40000000;

      // slight low pass filter...
      this.nout = (val - 3.0) + 0.75 * this.nout;
      return this.nout * NOISEGAIN;
    }

    reset() {
      for (var i = 0; i < 7; i++) {
        this.res[i].setdef(this.rdef[i]);
      }
      this.peq1.setdef(d_peq1);
      this.SetFrame(phonemes[18], phonemes[18], 0, this); // off
      this.SetFrame(phonemes[18], phonemes[18], 0, this.newframe); // off
      //curp1=curp2=18;
      this.curp1 = 18;
      this.curp2 = 18;
      this.spos = 4;
    }

  }

  function ronanCBSetSR(ptr:syWRonan, sr:sU32) {
    g.samplerate = sr;
    g.fc2pi_sr = 2.0 * PI / sr;
    g.fcminuspi_sr = -g.fc2pi_sr * 0.5;
  }

  function ronanCBInit(wsptr:syWRonan) {
    // convert phoneme table to a usable format
    var rp = rawphonemes.map(sS8 => sS8 < 128 ? sS8 : (sS8 - 256));
    phonemes = R.range(0, NPHONEMES).map(i=> ({
      f1f: rp[i],
      f1b: rp[i * (NPHONEMES + 1)],
      f2f: rp[i * (NPHONEMES + 2)],
      f2b: rp[i * (NPHONEMES + 3)],
      f3f: rp[i * (NPHONEMES + 4)],
      f3b: rp[i * (NPHONEMES + 5)],
      fnf: rp[i * (NPHONEMES + 6)],
      a_voicing: rp[i * (NPHONEMES + 7)],
      a_aspiration: rp[i * (NPHONEMES + 8)],
      a_frication: rp[i * (NPHONEMES + 9)],
      a_bypass: rp[i * (NPHONEMES + 10)],
      a_1: rp[i * (NPHONEMES + 11)],
      a_2: rp[i * (NPHONEMES + 12)],
      a_3: rp[i * (NPHONEMES + 13)],
      a_4: rp[i * (NPHONEMES + 14)],
      a_n: rp[i * (NPHONEMES + 15)],
      a_56: rp[i * (NPHONEMES + 16)],
      duration: rp[i * (NPHONEMES + 17)],
      rank: rp[i * (NPHONEMES + 18)],
    }));

    wsptr.reset();

    wsptr.framerate = 3;
    wsptr.pitch = 1.0;

    if (!wsptr.texts[0]) {
      wsptr.baseptr = wsptr.ptr = nix;
    }
    else {
      wsptr.baseptr = wsptr.ptr = wsptr.texts[0];
    }

    wsptr.lastin2 = 0;

    d_peq1.set(12000, 4000, 2.0);

  }

  //TODO: *wsptr.ptr -> ?, fix all access
  function ronanCBTick(wsptr:syWRonan) {
    if (wsptr.wait4off || wsptr.wait4on) return;

    if (!wsptr.ptr) return;

    if (wsptr.framecount <= 0) {
      wsptr.framecount = wsptr.framerate;
      // let current phoneme expire
      if (wsptr.scounter <= 0) {
        // set to next phoneme
        wsptr.spos++;
        if (wsptr.spos >= 4 || syls[wsptr.cursyl].ptab[wsptr.spos] == -1) {
          // go to next syllable

          if (!wsptr.ptr) // empty text: silence!
          {
            wsptr.durfactor = 1;
            wsptr.framecount = 1;
            wsptr.cursyl = NSYLS - 1;
            wsptr.spos = 0;
            wsptr.ptr = wsptr.baseptr;
          }
          else if (wsptr.ptr == '!') // wait for noteon
          {
            wsptr.framecount = 0;
            wsptr.scounter = 0;
            wsptr.wait4on = 1;
            wsptr.ptr = wsptr.ptr.slice(1);
            return;
          }
          else if (wsptr.ptr == '_') // noteoff
          {
            wsptr.framecount = 0;
            wsptr.scounter = 0;
            wsptr.wait4off = 1;
            wsptr.ptr = wsptr.ptr.slice(1);
            return;
          }

          if (wsptr.ptr && wsptr.ptr != '!' && wsptr.ptr != '_') {
            wsptr.durfactor = 0;
            while (wsptr.ptr >= '0' && wsptr.ptr <= '9') {
              wsptr.durfactor = 10 * wsptr.durfactor + (wsptr.ptr.charCodeAt(0) - '0'.charCodeAt(0));
              wsptr.ptr = wsptr.ptr.slice(1);
            }
            if (!wsptr.durfactor) {
              wsptr.durfactor = 1;
            }

            var fs:sInt;
            var len:sInt = 1;
            var len2:sInt;

            for (fs = 0; fs < NSYLS - 1; fs++) {
              const s:syldef = syls[fs];
              if (wsptr.ptr.indexOf(s.syl) === 0) {
                len = s.syl.length;
                break;
              }
            }
            wsptr.cursyl = fs;
            wsptr.spos = 0;
            wsptr.ptr += len;
          }
        }

        wsptr.curp1 = wsptr.curp2;
        wsptr.curp2 = syls[wsptr.cursyl].ptab[wsptr.spos];
        wsptr.scounter = Math.floor(phonemes[wsptr.curp2].duration * wsptr.durfactor);
        if (!wsptr.scounter) {
          wsptr.scounter = 1;
        }
        wsptr.invdur = 1.0 / (wsptr.scounter * wsptr.framerate);
      }
      wsptr.scounter--;
    }

    wsptr.framecount--;
    var x = (wsptr.scounter * wsptr.framerate + wsptr.framecount) * wsptr.invdur;
    const p1 = phonemes[wsptr.curp1];
    const p2 = phonemes[wsptr.curp2];
    x = Math.pow(x, p1.rank / p2.rank);
    wsptr.SetFrame(p2, (Math.abs(p2.rank - p1.rank) > 8.0) ? p2 : p1, x, wsptr.newframe);

  }

  function ronanCBNoteOn(wsptr:syWRonan) {
    wsptr.wait4on = 0;
  }

  function ronanCBNoteOff(wsptr:syWRonan) {
    wsptr.wait4off = 0;
  }

  function ronanCBSetCtl(wsptr:syWRonan, ctl:sU32, val:sU32) {
    // controller 4, 0-63			: set text #
    // controller 4, 64-127		: set frame rate
    // controller 5					: set pitch
    switch (ctl) {
      case 4:
        if (val < 63) {
          wsptr.reset();

          if (wsptr.texts[val])
            wsptr.ptr = wsptr.baseptr = wsptr.texts[val];
          else
            wsptr.ptr = wsptr.baseptr = nix;
        }
        else
          wsptr.framerate = val - 63;
        break;
      case 5:
        wsptr.pitch = Math.pow(2.0, (val - 64.0) / 128.0);
        break;
    }
  }

  function ronanCBProcess(wsptr:syWRonan, buf:sF32[], len:sU32) {
    // prepare interpolation
    let src1 = wsptr;
    var src2 = wsptr.newframe;
    var mul = 1 / len;
    var delta = (s1:number, s2:number) => (s2 - s1) * mul;
    var deltaframe:syVRonan = {
      rdef: R.zipWith((s1, s2) => new ResDef(delta(s1.a, s2.a), delta(s1.b, s2.b), delta(s1.c, s2.c)), src1.rdef, src2.rdef),
      a_voicing: delta(src1.a_voicing, src2.a_voicing),
      a_aspiration: delta(src1.a_aspiration, src2.a_aspiration),
      a_frication: delta(src1.a_frication, src2.a_frication),
      a_bypass: delta(src1.a_bypass, src2.a_bypass),
    };

    for (var i = 0; i < len; i++) {
      // interpolate all values
      wsptr.rdef.forEach((rd, i) => {
        rd.a += deltaframe.rdef[i].a;
        rd.b += deltaframe.rdef[i].b;
        rd.c += deltaframe.rdef[i].c;
      });
      wsptr.a_voicing += deltaframe.a_voicing;
      wsptr.a_aspiration += deltaframe.a_aspiration;
      wsptr.a_frication += deltaframe.a_frication;
      wsptr.a_bypass += deltaframe.a_bypass;

      var in2 = buf[2 * i];

      // add aspiration noise
      in2 = in2 * wsptr.a_voicing + wsptr.noise() * wsptr.a_aspiration;

      // process complete input signal with f1/nasal filters
      var out = wsptr.res[0].tick(in2) + wsptr.res[1].tick(in2);

      // differentiate input signal, add frication noise
      var lin = in2;
      in2 = (wsptr.noise() * wsptr.a_frication) + in2 - wsptr.lastin2;
      wsptr.lastin2 = lin;

      // process diff/fric input signal with f2..f6 and bypass (phase inverted)
      for (var r = 2; r < 7; r++) {
        out = wsptr.res[r].tick(in2) - out;
      }

      out = in2 * wsptr.a_bypass - out;

      // high pass filter
      wsptr.hpb1 += 0.012 * (out = out - wsptr.hpb1);
      wsptr.hpb2 += 0.012 * (out = out - wsptr.hpb2);

      // EQ
      out = wsptr.peq1.tick(out) - out;

      buf[2 * i] = buf[2 * i + 1] = out;
    }

  }

}