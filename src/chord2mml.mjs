// src/chord2mml_chord2ast.mjs
function getOffsetIonian(degree) {
  return getOffsetsByScale("ionian")[getDegreeIndex(degree)];
}
function getOffsetsByScale(scale) {
  switch (scale) {
    case "ionian":
      return [0, 2, 4, 5, 7, 9, 11];
    case "dorian":
      return [0, 2, 3, 5, 7, 9, 10];
    case "phrygian":
      return [0, 1, 3, 5, 7, 8, 10];
    case "lydian":
      return [0, 2, 4, 6, 7, 9, 11];
    case "mixolydian":
      return [0, 2, 4, 5, 7, 9, 10];
    case "aeolian":
      return [0, 2, 3, 5, 7, 8, 10];
    case "locrian":
      return [0, 1, 3, 5, 6, 8, 10];
    default:
      throw new Error(`ERROR : getOffsetsByScale`);
  }
}
function getDegreeIndex(degree) {
  switch (degree) {
    case "I":
      return 0;
    case "II":
      return 1;
    case "III":
      return 2;
    case "IV":
      return 3;
    case "V":
      return 4;
    case "VI":
      return 5;
    case "VII":
      return 6;
    //
    case "1":
      return 0;
    case "2":
      return 1;
    case "3":
      return 2;
    case "4":
      return 3;
    case "5":
      return 4;
    case "6":
      return 5;
    case "7":
      return 6;
    default:
      throw new Error(`ERROR : getDegreeIndex`);
  }
}
function getRootCdefgabOffset(root, sharp, flat) {
  let offset;
  switch (root) {
    case "C":
      offset = 0;
      break;
    case "D":
      offset = 2;
      break;
    case "E":
      offset = 4;
      break;
    case "F":
      offset = 5;
      break;
    case "G":
      offset = 7;
      break;
    case "A":
      offset = 9;
      break;
    case "B":
      offset = 11;
      break;
    default:
      throw new Error(`ERROR : getRootCdefgabOffset`);
  }
  offset += sharp.length - flat.length;
  return offset;
}
var peg$SyntaxError = class extends SyntaxError {
  constructor(message, expected, found, location) {
    super(message);
    this.expected = expected;
    this.found = found;
    this.location = location;
    this.name = "SyntaxError";
  }
  format(sources) {
    let str = "Error: " + this.message;
    if (this.location) {
      let src = null;
      const st = sources.find((s2) => s2.source === this.location.source);
      if (st) {
        src = st.text.split(/\r\n|\n|\r/g);
      }
      const s = this.location.start;
      const offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
      const loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
      if (src) {
        const e = this.location.end;
        const filler = "".padEnd(offset_s.line.toString().length, " ");
        const line = src[s.line - 1];
        const last = s.line === e.line ? e.column : line.length + 1;
        const hatLen = last - s.column || 1;
        str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + "".padEnd(s.column - 1, " ") + "".padEnd(hatLen, "^");
      } else {
        str += "\n at " + loc;
      }
    }
    return str;
  }
  static buildMessage(expected, found) {
    function hex(ch) {
      return ch.codePointAt(0).toString(16).toUpperCase();
    }
    const nonPrintable = Object.prototype.hasOwnProperty.call(RegExp.prototype, "unicode") ? new RegExp("[\\p{C}\\p{Mn}\\p{Mc}]", "gu") : null;
    function unicodeEscape(s) {
      if (nonPrintable) {
        return s.replace(nonPrintable, (ch) => "\\u{" + hex(ch) + "}");
      }
      return s;
    }
    function literalEscape(s) {
      return unicodeEscape(s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (ch) => "\\x0" + hex(ch)).replace(/[\x10-\x1F\x7F-\x9F]/g, (ch) => "\\x" + hex(ch)));
    }
    function classEscape(s) {
      return unicodeEscape(s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (ch) => "\\x0" + hex(ch)).replace(/[\x10-\x1F\x7F-\x9F]/g, (ch) => "\\x" + hex(ch)));
    }
    const DESCRIBE_EXPECTATION_FNS = {
      literal(expectation) {
        return '"' + literalEscape(expectation.text) + '"';
      },
      class(expectation) {
        const escapedParts = expectation.parts.map(
          (part) => Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part)
        );
        return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]" + (expectation.unicode ? "u" : "");
      },
      any() {
        return "any character";
      },
      end() {
        return "end of input";
      },
      other(expectation) {
        return expectation.description;
      }
    };
    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected2) {
      const descriptions = expected2.map(describeExpectation);
      descriptions.sort();
      if (descriptions.length > 0) {
        let j = 1;
        for (let i = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }
      switch (descriptions.length) {
        case 1:
          return descriptions[0];
        case 2:
          return descriptions[0] + " or " + descriptions[1];
        default:
          return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
      }
    }
    function describeFound(found2) {
      return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  }
};
function peg$parse(input, options) {
  options = options !== void 0 ? options : {};
  const peg$FAILED = {};
  const peg$source = options.grammarSource;
  const peg$startRuleFunctions = {
    CHORDS: peg$parseCHORDS
  };
  let peg$startRuleFunction = peg$parseCHORDS;
  const peg$c0 = "/";
  const peg$c1 = "on";
  const peg$c2 = "over";
  const peg$c3 = "chord over bass note";
  const peg$c4 = "slash chord inversion";
  const peg$c5 = "upper structure triad";
  const peg$c6 = "upper structure";
  const peg$c7 = "ust";
  const peg$c8 = "us";
  const peg$c9 = "polychord";
  const peg$c10 = "poly";
  const peg$c11 = "/*";
  const peg$c12 = "*/";
  const peg$c13 = "*";
  const peg$c14 = "/*/*";
  const peg$c15 = "*/*/";
  const peg$c16 = "root inv";
  const peg$c17 = "1st inv";
  const peg$c18 = "2nd inv";
  const peg$c19 = "3rd inv";
  const peg$c20 = "close harmony";
  const peg$c21 = "close";
  const peg$c22 = "drop2";
  const peg$c23 = "drop-2";
  const peg$c24 = "open triad";
  const peg$c25 = "drop4";
  const peg$c26 = "drop-4";
  const peg$c27 = "drop2and4";
  const peg$c28 = "drop-2-and-4";
  const peg$c29 = "no bass";
  const peg$c30 = "bass is root";
  const peg$c31 = "bass plays root";
  const peg$c32 = "bass play root";
  const peg$c33 = "bpm";
  const peg$c34 = "tempo";
  const peg$c35 = "|";
  const peg$c36 = "/ ";
  const peg$c37 = "key";
  const peg$c38 = "minor";
  const peg$c39 = "m";
  const peg$c40 = "ionian";
  const peg$c41 = "dorian";
  const peg$c42 = "phrygian";
  const peg$c43 = "lydian";
  const peg$c44 = "mixolydian";
  const peg$c45 = "aeolian";
  const peg$c46 = "locrian";
  const peg$c47 = "octave";
  const peg$c48 = "up";
  const peg$c49 = "down";
  const peg$c50 = "VII";
  const peg$c51 = "III";
  const peg$c52 = "VI";
  const peg$c53 = "IV";
  const peg$c54 = "II";
  const peg$c55 = "maj";
  const peg$c56 = "M";
  const peg$c57 = "maj7";
  const peg$c58 = "M7";
  const peg$c59 = "\u25B3";
  const peg$c60 = "(";
  const peg$c61 = "9";
  const peg$c62 = ")";
  const peg$c63 = "min";
  const peg$c64 = "min7";
  const peg$c65 = "m7";
  const peg$c66 = "-7";
  const peg$c67 = "6";
  const peg$c68 = "7";
  const peg$c69 = "11";
  const peg$c70 = "13";
  const peg$c71 = "sus2";
  const peg$c72 = "sus4";
  const peg$c73 = "7sus2";
  const peg$c74 = "7sus4";
  const peg$c75 = "dim";
  const peg$c76 = "aug";
  const peg$c77 = "4.";
  const peg$c78 = "(b5)";
  const peg$c79 = "(-5)";
  const peg$c80 = "(+5)";
  const peg$c81 = "(#5)";
  const peg$c82 = "omit";
  const peg$c83 = "o";
  const peg$c84 = "add";
  const peg$c85 = "^";
  const peg$c86 = "'";
  const peg$c87 = ",";
  const peg$c88 = " - ";
  const peg$c89 = "piano";
  const peg$c90 = "1";
  const peg$c91 = "acoustic grand piano";
  const peg$c92 = "grand piano";
  const peg$c93 = "Pf";
  const peg$c94 = "2";
  const peg$c95 = "bright acoustic piano";
  const peg$c96 = "3";
  const peg$c97 = "electric grand piano";
  const peg$c98 = "honky-tonk";
  const peg$c99 = "honky-tonk piano";
  const peg$c100 = "e.piano";
  const peg$c101 = "electric piano 1";
  const peg$c102 = "rhodes";
  const peg$c103 = "wurlitzer";
  const peg$c104 = "electric piano 2";
  const peg$c105 = "fm piano";
  const peg$c106 = "harpsichord";
  const peg$c107 = "clav.";
  const peg$c108 = "clavinet";
  const peg$c109 = "celesta";
  const peg$c110 = "glockenspl";
  const peg$c111 = "glockenspiel";
  const peg$c112 = "music box";
  const peg$c113 = "vibraphone";
  const peg$c114 = "marimba";
  const peg$c115 = "xylophone";
  const peg$c116 = "tubularbell";
  const peg$c117 = "tubular bells";
  const peg$c118 = "santur";
  const peg$c119 = "dulcimer";
  const peg$c120 = "organ";
  const peg$c121 = "drawbar organ";
  const peg$c122 = "percussive organ";
  const peg$c123 = "rock organ";
  const peg$c124 = "church org";
  const peg$c125 = "church organ";
  const peg$c126 = "reed organ";
  const peg$c127 = "accordion";
  const peg$c128 = "harmonica";
  const peg$c129 = "bandoneon";
  const peg$c130 = "nylon gt.";
  const peg$c131 = "acoustic guitar (nylon)";
  const peg$c132 = "steel gt.";
  const peg$c133 = "acoustic guitar (steel)";
  const peg$c134 = "jazz gt.";
  const peg$c135 = "electric guitar (jazz)";
  const peg$c136 = "clean gt.";
  const peg$c137 = "electric guitar (clean)";
  const peg$c138 = "muted gt.";
  const peg$c139 = "electric guitar (muted)";
  const peg$c140 = "overdrive";
  const peg$c141 = "gt";
  const peg$c142 = "electric guitar (overdrive)";
  const peg$c143 = "dist.";
  const peg$c144 = "distortion";
  const peg$c145 = "gt.";
  const peg$c146 = "electric guitar (distortion)";
  const peg$c147 = "gt.harmonix";
  const peg$c148 = "gt.harmonics";
  const peg$c149 = "electric guitar (harmonics)";
  const peg$c150 = "acoustic bass";
  const peg$c151 = "electric bass (finger)";
  const peg$c152 = "electric bass (picked)";
  const peg$c153 = "electric bass (fretless)";
  const peg$c154 = "slap bass 1";
  const peg$c155 = "slap bass 2";
  const peg$c156 = "synth bass 1";
  const peg$c157 = "synth bass 2";
  const peg$c158 = "violin";
  const peg$c159 = "viola";
  const peg$c160 = "cello";
  const peg$c161 = "contrabass";
  const peg$c162 = "tremolo strings";
  const peg$c163 = "pizzicato strings";
  const peg$c164 = "orchestral harp";
  const peg$c165 = "timpani";
  const peg$c166 = "strings";
  const peg$c167 = "ensemble";
  const peg$c168 = "str.";
  const peg$c169 = "synth strings 1";
  const peg$c170 = "synth strings 2";
  const peg$c171 = "voice aahs";
  const peg$c172 = "choir aahs";
  const peg$c173 = "choir";
  const peg$c174 = "chor.";
  const peg$c175 = "voice oohs";
  const peg$c176 = "synth voice";
  const peg$c177 = "orchestra hit";
  const peg$c178 = "trumpet";
  const peg$c179 = "trombone";
  const peg$c180 = "tuba";
  const peg$c181 = "muted trumpet";
  const peg$c182 = "french horn";
  const peg$c183 = "brass section";
  const peg$c184 = "synth brass 1";
  const peg$c185 = "synth brass 2";
  const peg$c186 = "soprano sax";
  const peg$c187 = "alto sax";
  const peg$c188 = "tenor sax";
  const peg$c189 = "baritone sax";
  const peg$c190 = "oboe";
  const peg$c191 = "english horn";
  const peg$c192 = "bassoon";
  const peg$c193 = "clarinet";
  const peg$c194 = "piccolo";
  const peg$c195 = "flute";
  const peg$c196 = "recorder";
  const peg$c197 = "pan flute";
  const peg$c198 = "blown bottle";
  const peg$c199 = "shakuhachi";
  const peg$c200 = "whistle";
  const peg$c201 = "ocarina";
  const peg$c202 = "lead";
  const peg$c203 = "square";
  const peg$c204 = "sawtooth";
  const peg$c205 = "calliope";
  const peg$c206 = "4";
  const peg$c207 = "chiff";
  const peg$c208 = "5";
  const peg$c209 = "charang";
  const peg$c210 = "voice";
  const peg$c211 = "fifths";
  const peg$c212 = "8";
  const peg$c213 = "bass and lead";
  const peg$c214 = "pad";
  const peg$c215 = "new age";
  const peg$c216 = "warm";
  const peg$c217 = "polysynth";
  const peg$c218 = "bowed glass";
  const peg$c219 = "metallic";
  const peg$c220 = "halo";
  const peg$c221 = "sweep";
  const peg$c222 = "fx";
  const peg$c223 = "rain";
  const peg$c224 = "soundtrack";
  const peg$c225 = "crystal";
  const peg$c226 = "atmosphere";
  const peg$c227 = "brightness";
  const peg$c228 = "goblins";
  const peg$c229 = "echoes";
  const peg$c230 = "sci-fi";
  const peg$c231 = "sitar";
  const peg$c232 = "banjo";
  const peg$c233 = "shamisen";
  const peg$c234 = "koto";
  const peg$c235 = "kalimba";
  const peg$c236 = "bag pipe";
  const peg$c237 = "fiddle";
  const peg$c238 = "shanai";
  const peg$c239 = "tinkle bell";
  const peg$c240 = "agogo";
  const peg$c241 = "steel drums";
  const peg$c242 = "woodblock";
  const peg$c243 = "taiko";
  const peg$c244 = "melodic tom";
  const peg$c245 = "synth drum";
  const peg$c246 = "reverse cymbal";
  const peg$c247 = "guitar fret noise";
  const peg$c248 = "breath noise";
  const peg$c249 = "seashore";
  const peg$c250 = "bird tweet";
  const peg$c251 = "telephone ring";
  const peg$c252 = "helicopter";
  const peg$c253 = "applause";
  const peg$c254 = "gunshot";
  const peg$r0 = /^[,.]/;
  const peg$r1 = /^[^*\/]/;
  const peg$r2 = /^[^\/]/;
  const peg$r3 = /^[0-9]/;
  const peg$r4 = /^[ =:]/;
  const peg$r5 = /^[A-G]/;
  const peg$r6 = /^[ \-]/;
  const peg$r7 = /^[1-7IV]/;
  const peg$r8 = /^[#\uFF03\u266F]/;
  const peg$r9 = /^[b\u266D]/;
  const peg$r10 = /^[M\u25B3]/;
  const peg$r11 = /^[\-m]/;
  const peg$r12 = /^[2-9]/;
  const peg$r13 = /^[135]/;
  const peg$r14 = /^[0-3]/;
  const peg$r15 = /^[ \t\n\r]/;
  const peg$r16 = /^[\u2192\u30FB]/;
  const peg$r17 = /^[1-3]/;
  const peg$r18 = /^[Fl]/;
  const peg$e0 = peg$literalExpectation("/", false);
  const peg$e1 = peg$literalExpectation("on", false);
  const peg$e2 = peg$literalExpectation("over", false);
  const peg$e3 = peg$literalExpectation("chord over bass note", true);
  const peg$e4 = peg$classExpectation([",", "."], false, false, false);
  const peg$e5 = peg$literalExpectation("slash chord inversion", true);
  const peg$e6 = peg$literalExpectation("upper structure triad", true);
  const peg$e7 = peg$literalExpectation("upper structure", true);
  const peg$e8 = peg$literalExpectation("UST", true);
  const peg$e9 = peg$literalExpectation("US", true);
  const peg$e10 = peg$literalExpectation("polychord", true);
  const peg$e11 = peg$literalExpectation("poly", true);
  const peg$e12 = peg$literalExpectation("/*", false);
  const peg$e13 = peg$classExpectation(["*", "/"], true, false, false);
  const peg$e14 = peg$literalExpectation("*/", false);
  const peg$e15 = peg$literalExpectation("*", false);
  const peg$e16 = peg$classExpectation(["/"], true, false, false);
  const peg$e17 = peg$literalExpectation("/*/*", false);
  const peg$e18 = peg$literalExpectation("*/*/", false);
  const peg$e19 = peg$literalExpectation("root inv", true);
  const peg$e20 = peg$literalExpectation("1st inv", true);
  const peg$e21 = peg$literalExpectation("2nd inv", true);
  const peg$e22 = peg$literalExpectation("3rd inv", true);
  const peg$e23 = peg$literalExpectation("close harmony", true);
  const peg$e24 = peg$literalExpectation("close", true);
  const peg$e25 = peg$literalExpectation("drop2", true);
  const peg$e26 = peg$literalExpectation("drop-2", true);
  const peg$e27 = peg$literalExpectation("open triad", true);
  const peg$e28 = peg$literalExpectation("drop4", true);
  const peg$e29 = peg$literalExpectation("drop-4", true);
  const peg$e30 = peg$literalExpectation("drop2and4", true);
  const peg$e31 = peg$literalExpectation("drop-2-and-4", true);
  const peg$e32 = peg$literalExpectation("no bass", true);
  const peg$e33 = peg$literalExpectation("bass is root", true);
  const peg$e34 = peg$literalExpectation("bass plays root", true);
  const peg$e35 = peg$literalExpectation("bass play root", true);
  const peg$e36 = peg$literalExpectation("BPM", true);
  const peg$e37 = peg$literalExpectation("TEMPO", true);
  const peg$e38 = peg$classExpectation([["0", "9"]], false, false, false);
  const peg$e39 = peg$literalExpectation("|", false);
  const peg$e40 = peg$literalExpectation("/ ", false);
  const peg$e41 = peg$literalExpectation("key", true);
  const peg$e42 = peg$classExpectation([" ", "=", ":"], false, false, false);
  const peg$e43 = peg$classExpectation([["A", "G"]], false, false, false);
  const peg$e44 = peg$literalExpectation("minor", true);
  const peg$e45 = peg$literalExpectation("m", false);
  const peg$e46 = peg$literalExpectation("ionian", true);
  const peg$e47 = peg$literalExpectation("dorian", true);
  const peg$e48 = peg$literalExpectation("phrygian", true);
  const peg$e49 = peg$literalExpectation("lydian", true);
  const peg$e50 = peg$literalExpectation("mixolydian", true);
  const peg$e51 = peg$literalExpectation("aeolian", true);
  const peg$e52 = peg$literalExpectation("locrian", true);
  const peg$e53 = peg$literalExpectation("octave", true);
  const peg$e54 = peg$classExpectation([" ", "-"], false, false, false);
  const peg$e55 = peg$literalExpectation("up", true);
  const peg$e56 = peg$literalExpectation("down", true);
  const peg$e57 = peg$literalExpectation("VII", false);
  const peg$e58 = peg$literalExpectation("III", false);
  const peg$e59 = peg$literalExpectation("VI", false);
  const peg$e60 = peg$literalExpectation("IV", false);
  const peg$e61 = peg$literalExpectation("II", false);
  const peg$e62 = peg$classExpectation([["1", "7"], "I", "V"], false, false, false);
  const peg$e63 = peg$classExpectation(["#", "\uFF03", "\u266F"], false, false, false);
  const peg$e64 = peg$classExpectation(["b", "\u266D"], false, false, false);
  const peg$e65 = peg$literalExpectation("maj", true);
  const peg$e66 = peg$literalExpectation("M", false);
  const peg$e67 = peg$literalExpectation("maj7", true);
  const peg$e68 = peg$literalExpectation("M7", false);
  const peg$e69 = peg$literalExpectation("\u25B3", false);
  const peg$e70 = peg$classExpectation(["M", "\u25B3"], false, false, false);
  const peg$e71 = peg$literalExpectation("(", false);
  const peg$e72 = peg$literalExpectation("9", false);
  const peg$e73 = peg$literalExpectation(")", false);
  const peg$e74 = peg$literalExpectation("min", true);
  const peg$e75 = peg$classExpectation(["-", "m"], false, false, false);
  const peg$e76 = peg$literalExpectation("min7", true);
  const peg$e77 = peg$literalExpectation("m7", false);
  const peg$e78 = peg$literalExpectation("-7", false);
  const peg$e79 = peg$literalExpectation("6", false);
  const peg$e80 = peg$literalExpectation("7", false);
  const peg$e81 = peg$literalExpectation("11", false);
  const peg$e82 = peg$literalExpectation("13", false);
  const peg$e83 = peg$literalExpectation("sus2", false);
  const peg$e84 = peg$literalExpectation("sus4", false);
  const peg$e85 = peg$literalExpectation("7sus2", false);
  const peg$e86 = peg$literalExpectation("7sus4", false);
  const peg$e87 = peg$literalExpectation("dim", false);
  const peg$e88 = peg$literalExpectation("aug", false);
  const peg$e89 = peg$literalExpectation("4.", false);
  const peg$e90 = peg$classExpectation([["2", "9"]], false, false, false);
  const peg$e91 = peg$literalExpectation("(b5)", false);
  const peg$e92 = peg$literalExpectation("(-5)", false);
  const peg$e93 = peg$literalExpectation("(+5)", false);
  const peg$e94 = peg$literalExpectation("(#5)", false);
  const peg$e95 = peg$literalExpectation("omit", false);
  const peg$e96 = peg$literalExpectation("o", false);
  const peg$e97 = peg$classExpectation(["1", "3", "5"], false, false, false);
  const peg$e98 = peg$literalExpectation("add", false);
  const peg$e99 = peg$literalExpectation("^", false);
  const peg$e100 = peg$classExpectation([["0", "3"]], false, false, false);
  const peg$e101 = peg$literalExpectation("'", false);
  const peg$e102 = peg$literalExpectation(",", false);
  const peg$e103 = peg$classExpectation([" ", "	", "\n", "\r"], false, false, false);
  const peg$e104 = peg$literalExpectation(" - ", false);
  const peg$e105 = peg$classExpectation(["\u2192", "\u30FB"], false, false, false);
  const peg$e106 = peg$anyExpectation();
  const peg$e107 = peg$literalExpectation("Piano", true);
  const peg$e108 = peg$literalExpectation("1", false);
  const peg$e109 = peg$literalExpectation("Acoustic Grand Piano", true);
  const peg$e110 = peg$literalExpectation("Grand Piano", true);
  const peg$e111 = peg$literalExpectation("Pf", false);
  const peg$e112 = peg$literalExpectation("2", false);
  const peg$e113 = peg$literalExpectation("Bright Acoustic Piano", true);
  const peg$e114 = peg$literalExpectation("3", false);
  const peg$e115 = peg$literalExpectation("Electric Grand Piano", true);
  const peg$e116 = peg$literalExpectation("Honky-tonk", true);
  const peg$e117 = peg$literalExpectation("Honky-tonk Piano", true);
  const peg$e118 = peg$literalExpectation("E.Piano", true);
  const peg$e119 = peg$literalExpectation("Electric Piano 1", true);
  const peg$e120 = peg$literalExpectation("Rhodes", true);
  const peg$e121 = peg$literalExpectation("Wurlitzer", true);
  const peg$e122 = peg$literalExpectation("Electric Piano 2", true);
  const peg$e123 = peg$literalExpectation("FM piano", true);
  const peg$e124 = peg$literalExpectation("Harpsichord", true);
  const peg$e125 = peg$literalExpectation("Clav.", true);
  const peg$e126 = peg$literalExpectation("Clavinet", true);
  const peg$e127 = peg$literalExpectation("Celesta", true);
  const peg$e128 = peg$literalExpectation("Glockenspl", true);
  const peg$e129 = peg$literalExpectation("Glockenspiel", true);
  const peg$e130 = peg$literalExpectation("Music Box", true);
  const peg$e131 = peg$literalExpectation("Vibraphone", true);
  const peg$e132 = peg$literalExpectation("Marimba", true);
  const peg$e133 = peg$literalExpectation("Xylophone", true);
  const peg$e134 = peg$literalExpectation("Tubularbell", true);
  const peg$e135 = peg$literalExpectation("Tubular Bells", true);
  const peg$e136 = peg$literalExpectation("Santur", true);
  const peg$e137 = peg$literalExpectation("Dulcimer", true);
  const peg$e138 = peg$literalExpectation("Organ", true);
  const peg$e139 = peg$literalExpectation("Drawbar Organ", true);
  const peg$e140 = peg$literalExpectation("Percussive Organ", true);
  const peg$e141 = peg$literalExpectation("Rock Organ", true);
  const peg$e142 = peg$literalExpectation("Church Org", true);
  const peg$e143 = peg$classExpectation([["1", "3"]], false, false, false);
  const peg$e144 = peg$literalExpectation("Church Organ", true);
  const peg$e145 = peg$literalExpectation("Reed Organ", true);
  const peg$e146 = peg$literalExpectation("Accordion", true);
  const peg$e147 = peg$classExpectation(["F", "l"], false, false, false);
  const peg$e148 = peg$literalExpectation("Harmonica", true);
  const peg$e149 = peg$literalExpectation("Bandoneon", true);
  const peg$e150 = peg$literalExpectation("Nylon Gt.", true);
  const peg$e151 = peg$literalExpectation("Acoustic Guitar (nylon)", true);
  const peg$e152 = peg$literalExpectation("Steel Gt.", true);
  const peg$e153 = peg$literalExpectation("Acoustic Guitar (steel)", true);
  const peg$e154 = peg$literalExpectation("Jazz Gt.", true);
  const peg$e155 = peg$literalExpectation("Electric Guitar (jazz)", true);
  const peg$e156 = peg$literalExpectation("Clean Gt.", true);
  const peg$e157 = peg$literalExpectation("Electric Guitar (clean)", true);
  const peg$e158 = peg$literalExpectation("Muted Gt.", true);
  const peg$e159 = peg$literalExpectation("Electric Guitar (muted)", true);
  const peg$e160 = peg$literalExpectation("Overdrive", true);
  const peg$e161 = peg$literalExpectation("Gt", true);
  const peg$e162 = peg$literalExpectation("Electric Guitar (overdrive)", true);
  const peg$e163 = peg$literalExpectation("Dist.", true);
  const peg$e164 = peg$literalExpectation("Distortion", true);
  const peg$e165 = peg$literalExpectation("Gt.", true);
  const peg$e166 = peg$literalExpectation("Electric Guitar (distortion)", true);
  const peg$e167 = peg$literalExpectation("Gt.Harmonix", true);
  const peg$e168 = peg$literalExpectation("Gt.Harmonics", true);
  const peg$e169 = peg$literalExpectation("Electric Guitar (harmonics)", true);
  const peg$e170 = peg$literalExpectation("Acoustic Bass", true);
  const peg$e171 = peg$literalExpectation("Electric Bass (finger)", true);
  const peg$e172 = peg$literalExpectation("Electric Bass (picked)", true);
  const peg$e173 = peg$literalExpectation("Electric Bass (fretless)", true);
  const peg$e174 = peg$literalExpectation("Slap Bass 1", true);
  const peg$e175 = peg$literalExpectation("Slap Bass 2", true);
  const peg$e176 = peg$literalExpectation("Synth Bass 1", true);
  const peg$e177 = peg$literalExpectation("Synth Bass 2", true);
  const peg$e178 = peg$literalExpectation("Violin", true);
  const peg$e179 = peg$literalExpectation("Viola", true);
  const peg$e180 = peg$literalExpectation("Cello", true);
  const peg$e181 = peg$literalExpectation("Contrabass", true);
  const peg$e182 = peg$literalExpectation("Tremolo Strings", true);
  const peg$e183 = peg$literalExpectation("Pizzicato Strings", true);
  const peg$e184 = peg$literalExpectation("Orchestral Harp", true);
  const peg$e185 = peg$literalExpectation("Timpani", true);
  const peg$e186 = peg$literalExpectation("Strings", true);
  const peg$e187 = peg$literalExpectation("Ensemble", true);
  const peg$e188 = peg$literalExpectation("Str.", true);
  const peg$e189 = peg$literalExpectation("Synth Strings 1", true);
  const peg$e190 = peg$literalExpectation("Synth Strings 2", true);
  const peg$e191 = peg$literalExpectation("Voice Aahs", true);
  const peg$e192 = peg$literalExpectation("Choir Aahs", true);
  const peg$e193 = peg$literalExpectation("Choir", true);
  const peg$e194 = peg$literalExpectation("Chor.", true);
  const peg$e195 = peg$literalExpectation("Voice Oohs", true);
  const peg$e196 = peg$literalExpectation("Synth Voice", true);
  const peg$e197 = peg$literalExpectation("Orchestra Hit", true);
  const peg$e198 = peg$literalExpectation("Trumpet", true);
  const peg$e199 = peg$literalExpectation("Trombone", true);
  const peg$e200 = peg$literalExpectation("Tuba", true);
  const peg$e201 = peg$literalExpectation("Muted Trumpet", true);
  const peg$e202 = peg$literalExpectation("French Horn", true);
  const peg$e203 = peg$literalExpectation("Brass Section", true);
  const peg$e204 = peg$literalExpectation("Synth Brass 1", true);
  const peg$e205 = peg$literalExpectation("Synth Brass 2", true);
  const peg$e206 = peg$literalExpectation("Soprano Sax", true);
  const peg$e207 = peg$literalExpectation("Alto Sax", true);
  const peg$e208 = peg$literalExpectation("Tenor Sax", true);
  const peg$e209 = peg$literalExpectation("Baritone Sax", true);
  const peg$e210 = peg$literalExpectation("Oboe", true);
  const peg$e211 = peg$literalExpectation("English Horn", true);
  const peg$e212 = peg$literalExpectation("Bassoon", true);
  const peg$e213 = peg$literalExpectation("Clarinet", true);
  const peg$e214 = peg$literalExpectation("Piccolo", true);
  const peg$e215 = peg$literalExpectation("Flute", true);
  const peg$e216 = peg$literalExpectation("Recorder", true);
  const peg$e217 = peg$literalExpectation("Pan Flute", true);
  const peg$e218 = peg$literalExpectation("Blown bottle", true);
  const peg$e219 = peg$literalExpectation("Shakuhachi", true);
  const peg$e220 = peg$literalExpectation("Whistle", true);
  const peg$e221 = peg$literalExpectation("Ocarina", true);
  const peg$e222 = peg$literalExpectation("Lead", true);
  const peg$e223 = peg$literalExpectation("Square", true);
  const peg$e224 = peg$literalExpectation("Sawtooth", true);
  const peg$e225 = peg$literalExpectation("Calliope", true);
  const peg$e226 = peg$literalExpectation("4", false);
  const peg$e227 = peg$literalExpectation("Chiff", true);
  const peg$e228 = peg$literalExpectation("5", false);
  const peg$e229 = peg$literalExpectation("Charang", true);
  const peg$e230 = peg$literalExpectation("Voice", true);
  const peg$e231 = peg$literalExpectation("Fifths", true);
  const peg$e232 = peg$literalExpectation("8", false);
  const peg$e233 = peg$literalExpectation("Bass and lead", true);
  const peg$e234 = peg$literalExpectation("Pad", true);
  const peg$e235 = peg$literalExpectation("New age", true);
  const peg$e236 = peg$literalExpectation("Warm", true);
  const peg$e237 = peg$literalExpectation("Polysynth", true);
  const peg$e238 = peg$literalExpectation("Bowed glass", true);
  const peg$e239 = peg$literalExpectation("Metallic", true);
  const peg$e240 = peg$literalExpectation("Halo", true);
  const peg$e241 = peg$literalExpectation("Sweep", true);
  const peg$e242 = peg$literalExpectation("FX", true);
  const peg$e243 = peg$literalExpectation("Rain", true);
  const peg$e244 = peg$literalExpectation("Soundtrack", true);
  const peg$e245 = peg$literalExpectation("Crystal", true);
  const peg$e246 = peg$literalExpectation("Atmosphere", true);
  const peg$e247 = peg$literalExpectation("Brightness", true);
  const peg$e248 = peg$literalExpectation("Goblins", true);
  const peg$e249 = peg$literalExpectation("Echoes", true);
  const peg$e250 = peg$literalExpectation("Sci-fi", true);
  const peg$e251 = peg$literalExpectation("Sitar", true);
  const peg$e252 = peg$literalExpectation("Banjo", true);
  const peg$e253 = peg$literalExpectation("Shamisen", true);
  const peg$e254 = peg$literalExpectation("Koto", true);
  const peg$e255 = peg$literalExpectation("Kalimba", true);
  const peg$e256 = peg$literalExpectation("Bag pipe", true);
  const peg$e257 = peg$literalExpectation("Fiddle", true);
  const peg$e258 = peg$literalExpectation("Shanai", true);
  const peg$e259 = peg$literalExpectation("Tinkle Bell", true);
  const peg$e260 = peg$literalExpectation("Agogo", true);
  const peg$e261 = peg$literalExpectation("Steel Drums", true);
  const peg$e262 = peg$literalExpectation("Woodblock", true);
  const peg$e263 = peg$literalExpectation("Taiko", true);
  const peg$e264 = peg$literalExpectation("Melodic Tom", true);
  const peg$e265 = peg$literalExpectation("Synth Drum", true);
  const peg$e266 = peg$literalExpectation("Reverse Cymbal", true);
  const peg$e267 = peg$literalExpectation("Guitar Fret Noise", true);
  const peg$e268 = peg$literalExpectation("Breath Noise", true);
  const peg$e269 = peg$literalExpectation("Seashore", true);
  const peg$e270 = peg$literalExpectation("Bird Tweet", true);
  const peg$e271 = peg$literalExpectation("Telephone Ring", true);
  const peg$e272 = peg$literalExpectation("Helicopter", true);
  const peg$e273 = peg$literalExpectation("Applause", true);
  const peg$e274 = peg$literalExpectation("Gunshot", true);
  function peg$f0(event) {
    return event;
  }
  function peg$f1(root, quality, inversion, octaveOffset) {
    return { event: "chord", root, quality, inversion, octaveOffset };
  }
  function peg$f2(upperRoot, upperQuality, upperInversion, upperOctaveOffset, lowerRoot, lowerQuality, lowerInversion, lowerOctaveOffset) {
    lowerRoot ??= upperRoot;
    lowerQuality ??= upperQuality;
    return { event: "slash chord", upperRoot, upperQuality, upperInversion, upperOctaveOffset, lowerRoot, lowerQuality, lowerInversion, lowerOctaveOffset };
  }
  function peg$f3(upperRoot, upperQuality, upperInversion, upperOctaveOffset, lowerRoot, lowerQuality, lowerInversion, lowerOctaveOffset) {
    lowerRoot ??= upperRoot;
    lowerQuality ??= upperQuality;
    return { event: "chord over bass note", upperRoot, upperQuality, upperInversion, upperOctaveOffset, lowerRoot, lowerQuality, lowerInversion, lowerOctaveOffset };
  }
  function peg$f4() {
    return { event: "change slash chord mode to chord over bass note" };
  }
  function peg$f5() {
    return { event: "change slash chord mode to inversion" };
  }
  function peg$f6() {
    return { event: "change slash chord mode to polychord" };
  }
  function peg$f7(mml) {
    return { event: "inline mml", mml: mml.join("") };
  }
  function peg$f8() {
    return text();
  }
  function peg$f9(abc) {
    return { event: "inline mml", mml: "/*" + abc.join("") + "*/" };
  }
  function peg$f10() {
    return { event: "change inversion mode to root inv" };
  }
  function peg$f11() {
    return { event: "change inversion mode to 1st inv" };
  }
  function peg$f12() {
    return { event: "change inversion mode to 2nd inv" };
  }
  function peg$f13() {
    return { event: "change inversion mode to 3rd inv" };
  }
  function peg$f14() {
    return { event: "change open harmony mode to close" };
  }
  function peg$f15() {
    return { event: "change open harmony mode to drop2" };
  }
  function peg$f16() {
    return { event: "change open harmony mode to drop4" };
  }
  function peg$f17() {
    return { event: "change open harmony mode to drop2and4" };
  }
  function peg$f18() {
    return { event: "change bass play mode to no bass" };
  }
  function peg$f19() {
    return { event: "change bass play mode to root" };
  }
  function peg$f20(bpm) {
    return { event: "inline mml", mml: "t" + bpm.join("") };
  }
  function peg$f21() {
    return { event: "bar" };
  }
  function peg$f22() {
    return { event: "bar slash" };
  }
  function peg$f23(k) {
    return k;
  }
  function peg$f24(root, sharp, flat, m) {
    gKey = getRootCdefgabOffset(root, sharp, flat);
    return { event: "key", root, sharpLength: sharp.length, flatLength: flat.length, offset: gKey };
  }
  function peg$f25(s) {
    gScale = s.toLowerCase();
    return { event: "scale", offsets: getOffsetsByScale(gScale) };
  }
  function peg$f26() {
    return { event: "octave up" };
  }
  function peg$f27() {
    return { event: "octave up upper" };
  }
  function peg$f28() {
    return { event: "octave up lower" };
  }
  function peg$f29() {
    return { event: "octave down" };
  }
  function peg$f30() {
    return { event: "octave down upper" };
  }
  function peg$f31() {
    return { event: "octave down lower" };
  }
  function peg$f32(root, sharp, flat) {
    return getRootCdefgabOffset(root, sharp, flat);
  }
  function peg$f33(sharp, flat, degree) {
    let offset2 = getOffsetIonian(degree);
    offset2 += sharp.length - flat.length + gKey;
    return offset2;
  }
  function peg$f34() {
    return "#";
  }
  function peg$f35() {
    return "b";
  }
  function peg$f36(quality) {
    return quality.join("");
  }
  function peg$f37() {
    return "maj";
  }
  function peg$f38() {
    return "maj";
  }
  function peg$f39() {
    return "maj7";
  }
  function peg$f40() {
    return "maj7,add9";
  }
  function peg$f41() {
    return "min";
  }
  function peg$f42() {
    return "min";
  }
  function peg$f43() {
    return "min7";
  }
  function peg$f44() {
    return "6";
  }
  function peg$f45() {
    return "7";
  }
  function peg$f46() {
    return "9";
  }
  function peg$f47() {
    return "11";
  }
  function peg$f48() {
    return "13";
  }
  function peg$f49() {
    return "sus2";
  }
  function peg$f50() {
    return "sus4";
  }
  function peg$f51() {
    return "7sus2";
  }
  function peg$f52() {
    return "7sus4";
  }
  function peg$f53() {
    return "dim triad";
  }
  function peg$f54() {
    return "aug";
  }
  function peg$f55(n) {
    return text();
  }
  function peg$f56() {
    return ",flatted fifth";
  }
  function peg$f57() {
    return ",augmented fifth";
  }
  function peg$f58(n) {
    return ",omit" + n;
  }
  function peg$f59(n) {
    return ",add" + n.join("");
  }
  function peg$f60() {
    switch (text()) {
      case "":
        return null;
      // inversion modeのままとする用
      case "^0":
        return "root inv";
      // inversion modeで1st～3rdが指定されていたときに、それを打ち消してroot invにする用
      case "^1":
        return "1st inv";
      case "^2":
        return "2nd inv";
      case "^3":
        return "3rd inv";
      default:
        throw new Error(`ERROR : INVERSION`);
    }
  }
  function peg$f61(up, down) {
    return up.length - down.length;
  }
  function peg$f62() {
    return { event: "inline mml", mml: "@000" };
  }
  function peg$f63() {
    return { event: "inline mml", mml: "@001" };
  }
  function peg$f64() {
    return { event: "inline mml", mml: "@002" };
  }
  function peg$f65() {
    return { event: "inline mml", mml: "@003" };
  }
  function peg$f66() {
    return { event: "inline mml", mml: "@004" };
  }
  function peg$f67() {
    return { event: "inline mml", mml: "@005" };
  }
  function peg$f68() {
    return { event: "inline mml", mml: "@006" };
  }
  function peg$f69() {
    return { event: "inline mml", mml: "@007" };
  }
  function peg$f70() {
    return { event: "inline mml", mml: "@008" };
  }
  function peg$f71() {
    return { event: "inline mml", mml: "@009" };
  }
  function peg$f72() {
    return { event: "inline mml", mml: "@010" };
  }
  function peg$f73() {
    return { event: "inline mml", mml: "@011" };
  }
  function peg$f74() {
    return { event: "inline mml", mml: "@012" };
  }
  function peg$f75() {
    return { event: "inline mml", mml: "@013" };
  }
  function peg$f76() {
    return { event: "inline mml", mml: "@014" };
  }
  function peg$f77() {
    return { event: "inline mml", mml: "@015" };
  }
  function peg$f78() {
    return { event: "inline mml", mml: "@016" };
  }
  function peg$f79() {
    return { event: "inline mml", mml: "@017" };
  }
  function peg$f80() {
    return { event: "inline mml", mml: "@018" };
  }
  function peg$f81() {
    return { event: "inline mml", mml: "@019" };
  }
  function peg$f82() {
    return { event: "inline mml", mml: "@020" };
  }
  function peg$f83() {
    return { event: "inline mml", mml: "@021" };
  }
  function peg$f84() {
    return { event: "inline mml", mml: "@022" };
  }
  function peg$f85() {
    return { event: "inline mml", mml: "@023" };
  }
  function peg$f86() {
    return { event: "inline mml", mml: "@024" };
  }
  function peg$f87() {
    return { event: "inline mml", mml: "@025" };
  }
  function peg$f88() {
    return { event: "inline mml", mml: "@026" };
  }
  function peg$f89() {
    return { event: "inline mml", mml: "@027" };
  }
  function peg$f90() {
    return { event: "inline mml", mml: "@028" };
  }
  function peg$f91() {
    return { event: "inline mml", mml: "@029" };
  }
  function peg$f92() {
    return { event: "inline mml", mml: "@030" };
  }
  function peg$f93() {
    return { event: "inline mml", mml: "@031" };
  }
  function peg$f94() {
    return { event: "inline mml", mml: "@032" };
  }
  function peg$f95() {
    return { event: "inline mml", mml: "@033" };
  }
  function peg$f96() {
    return { event: "inline mml", mml: "@034" };
  }
  function peg$f97() {
    return { event: "inline mml", mml: "@035" };
  }
  function peg$f98() {
    return { event: "inline mml", mml: "@036" };
  }
  function peg$f99() {
    return { event: "inline mml", mml: "@037" };
  }
  function peg$f100() {
    return { event: "inline mml", mml: "@038" };
  }
  function peg$f101() {
    return { event: "inline mml", mml: "@039" };
  }
  function peg$f102() {
    return { event: "inline mml", mml: "@040" };
  }
  function peg$f103() {
    return { event: "inline mml", mml: "@041" };
  }
  function peg$f104() {
    return { event: "inline mml", mml: "@042" };
  }
  function peg$f105() {
    return { event: "inline mml", mml: "@043" };
  }
  function peg$f106() {
    return { event: "inline mml", mml: "@044" };
  }
  function peg$f107() {
    return { event: "inline mml", mml: "@045" };
  }
  function peg$f108() {
    return { event: "inline mml", mml: "@046" };
  }
  function peg$f109() {
    return { event: "inline mml", mml: "@047" };
  }
  function peg$f110() {
    return { event: "inline mml", mml: "@48" };
  }
  function peg$f111() {
    return { event: "inline mml", mml: "@49" };
  }
  function peg$f112() {
    return { event: "inline mml", mml: "@050" };
  }
  function peg$f113() {
    return { event: "inline mml", mml: "@051" };
  }
  function peg$f114() {
    return { event: "inline mml", mml: "@52" };
  }
  function peg$f115() {
    return { event: "inline mml", mml: "@053" };
  }
  function peg$f116() {
    return { event: "inline mml", mml: "@054" };
  }
  function peg$f117() {
    return { event: "inline mml", mml: "@055" };
  }
  function peg$f118() {
    return { event: "inline mml", mml: "@056" };
  }
  function peg$f119() {
    return { event: "inline mml", mml: "@057" };
  }
  function peg$f120() {
    return { event: "inline mml", mml: "@058" };
  }
  function peg$f121() {
    return { event: "inline mml", mml: "@059" };
  }
  function peg$f122() {
    return { event: "inline mml", mml: "@060" };
  }
  function peg$f123() {
    return { event: "inline mml", mml: "@061" };
  }
  function peg$f124() {
    return { event: "inline mml", mml: "@062" };
  }
  function peg$f125() {
    return { event: "inline mml", mml: "@063" };
  }
  function peg$f126() {
    return { event: "inline mml", mml: "@064" };
  }
  function peg$f127() {
    return { event: "inline mml", mml: "@065" };
  }
  function peg$f128() {
    return { event: "inline mml", mml: "@066" };
  }
  function peg$f129() {
    return { event: "inline mml", mml: "@067" };
  }
  function peg$f130() {
    return { event: "inline mml", mml: "@068" };
  }
  function peg$f131() {
    return { event: "inline mml", mml: "@069" };
  }
  function peg$f132() {
    return { event: "inline mml", mml: "@070" };
  }
  function peg$f133() {
    return { event: "inline mml", mml: "@071" };
  }
  function peg$f134() {
    return { event: "inline mml", mml: "@072" };
  }
  function peg$f135() {
    return { event: "inline mml", mml: "@073" };
  }
  function peg$f136() {
    return { event: "inline mml", mml: "@074" };
  }
  function peg$f137() {
    return { event: "inline mml", mml: "@075" };
  }
  function peg$f138() {
    return { event: "inline mml", mml: "@076" };
  }
  function peg$f139() {
    return { event: "inline mml", mml: "@077" };
  }
  function peg$f140() {
    return { event: "inline mml", mml: "@078" };
  }
  function peg$f141() {
    return { event: "inline mml", mml: "@079" };
  }
  function peg$f142() {
    return { event: "inline mml", mml: "@080" };
  }
  function peg$f143() {
    return { event: "inline mml", mml: "@081" };
  }
  function peg$f144() {
    return { event: "inline mml", mml: "@082" };
  }
  function peg$f145() {
    return { event: "inline mml", mml: "@083" };
  }
  function peg$f146() {
    return { event: "inline mml", mml: "@084" };
  }
  function peg$f147() {
    return { event: "inline mml", mml: "@085" };
  }
  function peg$f148() {
    return { event: "inline mml", mml: "@086" };
  }
  function peg$f149() {
    return { event: "inline mml", mml: "@087" };
  }
  function peg$f150() {
    return { event: "inline mml", mml: "@088" };
  }
  function peg$f151() {
    return { event: "inline mml", mml: "@089" };
  }
  function peg$f152() {
    return { event: "inline mml", mml: "@090" };
  }
  function peg$f153() {
    return { event: "inline mml", mml: "@091" };
  }
  function peg$f154() {
    return { event: "inline mml", mml: "@092" };
  }
  function peg$f155() {
    return { event: "inline mml", mml: "@093" };
  }
  function peg$f156() {
    return { event: "inline mml", mml: "@094" };
  }
  function peg$f157() {
    return { event: "inline mml", mml: "@095" };
  }
  function peg$f158() {
    return { event: "inline mml", mml: "@096" };
  }
  function peg$f159() {
    return { event: "inline mml", mml: "@097" };
  }
  function peg$f160() {
    return { event: "inline mml", mml: "@098" };
  }
  function peg$f161() {
    return { event: "inline mml", mml: "@099" };
  }
  function peg$f162() {
    return { event: "inline mml", mml: "@100" };
  }
  function peg$f163() {
    return { event: "inline mml", mml: "@101" };
  }
  function peg$f164() {
    return { event: "inline mml", mml: "@102" };
  }
  function peg$f165() {
    return { event: "inline mml", mml: "@103" };
  }
  function peg$f166() {
    return { event: "inline mml", mml: "@104" };
  }
  function peg$f167() {
    return { event: "inline mml", mml: "@105" };
  }
  function peg$f168() {
    return { event: "inline mml", mml: "@106" };
  }
  function peg$f169() {
    return { event: "inline mml", mml: "@107" };
  }
  function peg$f170() {
    return { event: "inline mml", mml: "@108" };
  }
  function peg$f171() {
    return { event: "inline mml", mml: "@109" };
  }
  function peg$f172() {
    return { event: "inline mml", mml: "@110" };
  }
  function peg$f173() {
    return { event: "inline mml", mml: "@111" };
  }
  function peg$f174() {
    return { event: "inline mml", mml: "@112" };
  }
  function peg$f175() {
    return { event: "inline mml", mml: "@113" };
  }
  function peg$f176() {
    return { event: "inline mml", mml: "@114" };
  }
  function peg$f177() {
    return { event: "inline mml", mml: "@115" };
  }
  function peg$f178() {
    return { event: "inline mml", mml: "@116" };
  }
  function peg$f179() {
    return { event: "inline mml", mml: "@117" };
  }
  function peg$f180() {
    return { event: "inline mml", mml: "@118" };
  }
  function peg$f181() {
    return { event: "inline mml", mml: "@119" };
  }
  function peg$f182() {
    return { event: "inline mml", mml: "@120" };
  }
  function peg$f183() {
    return { event: "inline mml", mml: "@121" };
  }
  function peg$f184() {
    return { event: "inline mml", mml: "@122" };
  }
  function peg$f185() {
    return { event: "inline mml", mml: "@123" };
  }
  function peg$f186() {
    return { event: "inline mml", mml: "@124" };
  }
  function peg$f187() {
    return { event: "inline mml", mml: "@125" };
  }
  function peg$f188() {
    return { event: "inline mml", mml: "@126" };
  }
  function peg$f189() {
    return { event: "inline mml", mml: "@127" };
  }
  let peg$currPos = options.peg$currPos | 0;
  let peg$savedPos = peg$currPos;
  const peg$posDetailsCache = [{ line: 1, column: 1 }];
  let peg$maxFailPos = peg$currPos;
  let peg$maxFailExpected = options.peg$maxFailExpected || [];
  let peg$silentFails = options.peg$silentFails | 0;
  let peg$result;
  if (options.startRule) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
    }
    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }
  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }
  function offset() {
    return peg$savedPos;
  }
  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }
  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }
  function expected(description, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location2
    );
  }
  function error(message, location2) {
    location2 = location2 !== void 0 ? location2 : peg$computeLocation(peg$savedPos, peg$currPos);
    throw peg$buildSimpleError(message, location2);
  }
  function peg$getUnicode(pos = peg$currPos) {
    const cp = input.codePointAt(pos);
    if (cp === void 0) {
      return "";
    }
    return String.fromCodePoint(cp);
  }
  function peg$literalExpectation(text2, ignoreCase) {
    return { type: "literal", text: text2, ignoreCase };
  }
  function peg$classExpectation(parts, inverted, ignoreCase, unicode) {
    return { type: "class", parts, inverted, ignoreCase, unicode };
  }
  function peg$anyExpectation() {
    return { type: "any" };
  }
  function peg$endExpectation() {
    return { type: "end" };
  }
  function peg$otherExpectation(description) {
    return { type: "other", description };
  }
  function peg$computePosDetails(pos) {
    let details = peg$posDetailsCache[pos];
    let p;
    if (details) {
      return details;
    } else {
      if (pos >= peg$posDetailsCache.length) {
        p = peg$posDetailsCache.length - 1;
      } else {
        p = pos;
        while (!peg$posDetailsCache[--p]) {
        }
      }
      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };
      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }
        p++;
      }
      peg$posDetailsCache[pos] = details;
      return details;
    }
  }
  function peg$computeLocation(startPos, endPos, offset2) {
    const startPosDetails = peg$computePosDetails(startPos);
    const endPosDetails = peg$computePosDetails(endPos);
    const res = {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
    if (offset2 && peg$source && typeof peg$source.offset === "function") {
      res.start = peg$source.offset(res.start);
      res.end = peg$source.offset(res.end);
    }
    return res;
  }
  function peg$fail(expected2) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }
    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }
    peg$maxFailExpected.push(expected2);
  }
  function peg$buildSimpleError(message, location2) {
    return new peg$SyntaxError(message, null, null, location2);
  }
  function peg$buildStructuredError(expected2, found, location2) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected2, found),
      expected2,
      found,
      location2
    );
  }
  function peg$parseCHORDS() {
    let s0, s1, s2;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseEVENT();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parseEVENT();
    }
    s2 = peg$parse_();
    peg$savedPos = s0;
    s0 = peg$f0(s1);
    return s0;
  }
  function peg$parseEVENT() {
    let s0;
    s0 = peg$parseINLINE_ABC();
    if (s0 === peg$FAILED) {
      s0 = peg$parseINLINE_MML();
      if (s0 === peg$FAILED) {
        s0 = peg$parseBAR_SLASH();
        if (s0 === peg$FAILED) {
          s0 = peg$parseMIDI_PROGRAM_CHANGE();
          if (s0 === peg$FAILED) {
            s0 = peg$parseTEMPO();
            if (s0 === peg$FAILED) {
              s0 = peg$parseOCTAVE_UP_UPPER();
              if (s0 === peg$FAILED) {
                s0 = peg$parseOCTAVE_DOWN_UPPER();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseOCTAVE_UP_LOWER();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseOCTAVE_DOWN_LOWER();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseOCTAVE_UP();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseOCTAVE_DOWN();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseSLASH_CHORD_MODE_CHORD_OVER_BASS_NOTE();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseSLASH_CHORD_MODE_POLYCHORD();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseSLASH_CHORD_MODE_INVERSION();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseINVERSION_MODE_ROOT_INV();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseINVERSION_MODE_1ST_INV();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseINVERSION_MODE_2ND_INV();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseINVERSION_MODE_3RD_INV();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseOPEN_HARMONY_MODE_DROP2AND4();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseOPEN_HARMONY_MODE_DROP4();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseOPEN_HARMONY_MODE_DROP2();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseOPEN_HARMONY_MODE_CLOSE();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseBASS_PLAY_MODE_NO_BASS();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parseBASS_PLAY_MODE_ROOT();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseBAR();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseSCALE();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseKEY();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseSLASH_CHORD();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseON_CHORD();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parseCHORD();
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parseCHORD() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$parseROOT();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseCHORD_QUALITY();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseINVERSION();
        s5 = peg$parseOCTAVE_OFFSET();
        s6 = peg$parseCHORD_SEPARATOR();
        if (s6 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f1(s2, s3, s4, s5);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSLASH_CHORD() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$parseROOT();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseCHORD_QUALITY();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseINVERSION();
        s5 = peg$parseOCTAVE_OFFSET();
        if (input.charCodeAt(peg$currPos) === 47) {
          s6 = peg$c0;
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e0);
          }
        }
        if (s6 !== peg$FAILED) {
          s7 = peg$parseROOT();
          if (s7 === peg$FAILED) {
            s7 = null;
          }
          s8 = peg$parseCHORD_QUALITY();
          if (s8 === peg$FAILED) {
            s8 = null;
          }
          s9 = peg$parseINVERSION();
          s10 = peg$parseOCTAVE_OFFSET();
          s11 = peg$parseCHORD_SEPARATOR();
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f2(s2, s3, s4, s5, s7, s8, s9, s10);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseON_CHORD() {
    let s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$parseROOT();
    if (s2 !== peg$FAILED) {
      s3 = peg$parseCHORD_QUALITY();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseINVERSION();
        s5 = peg$parseOCTAVE_OFFSET();
        if (input.substr(peg$currPos, 2) === peg$c1) {
          s6 = peg$c1;
          peg$currPos += 2;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e1);
          }
        }
        if (s6 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c2) {
            s6 = peg$c2;
            peg$currPos += 4;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
        }
        if (s6 !== peg$FAILED) {
          s7 = peg$parseROOT();
          if (s7 === peg$FAILED) {
            s7 = null;
          }
          s8 = peg$parseCHORD_QUALITY();
          if (s8 === peg$FAILED) {
            s8 = null;
          }
          s9 = peg$parseINVERSION();
          s10 = peg$parseOCTAVE_OFFSET();
          s11 = peg$parseCHORD_SEPARATOR();
          if (s11 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f3(s2, s3, s4, s5, s7, s8, s9, s10);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSLASH_CHORD_MODE_CHORD_OVER_BASS_NOTE() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 20);
    if (s2.toLowerCase() === peg$c3) {
      peg$currPos += 20;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e3);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f4();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSLASH_CHORD_MODE_INVERSION() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 21);
    if (s2.toLowerCase() === peg$c4) {
      peg$currPos += 21;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e5);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f5();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSLASH_CHORD_MODE_POLYCHORD() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 21);
    if (s2.toLowerCase() === peg$c5) {
      peg$currPos += 21;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e6);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 15);
      if (s2.toLowerCase() === peg$c6) {
        peg$currPos += 15;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e7);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 3);
        if (s2.toLowerCase() === peg$c7) {
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e8);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = input.substr(peg$currPos, 2);
          if (s2.toLowerCase() === peg$c8) {
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
          if (s2 === peg$FAILED) {
            s2 = input.substr(peg$currPos, 9);
            if (s2.toLowerCase() === peg$c9) {
              peg$currPos += 9;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e10);
              }
            }
            if (s2 === peg$FAILED) {
              s2 = input.substr(peg$currPos, 4);
              if (s2.toLowerCase() === peg$c10) {
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e11);
                }
              }
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f6();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINLINE_MML() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c11) {
      s1 = peg$c11;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e12);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = input.charAt(peg$currPos);
      if (peg$r1.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e13);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = peg$parseINLINE_MML_SUB();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 47) {
            s3 = peg$c0;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e0);
            }
          }
        }
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = input.charAt(peg$currPos);
          if (peg$r1.test(s3)) {
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e13);
            }
          }
          if (s3 === peg$FAILED) {
            s3 = peg$parseINLINE_MML_SUB();
            if (s3 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s3 = peg$c0;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e0);
                }
              }
            }
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c12) {
          s3 = peg$c12;
          peg$currPos += 2;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e14);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f7(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINLINE_MML_SUB() {
    let s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 42) {
      s1 = peg$c13;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e15);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = input.charAt(peg$currPos);
      if (peg$r2.test(s2)) {
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e16);
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f8();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINLINE_ABC() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c14) {
      s1 = peg$c14;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e17);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = input.charAt(peg$currPos);
      if (peg$r1.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e13);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = peg$parseINLINE_MML_SUB();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 47) {
            s3 = peg$c0;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e0);
            }
          }
        }
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = input.charAt(peg$currPos);
          if (peg$r1.test(s3)) {
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e13);
            }
          }
          if (s3 === peg$FAILED) {
            s3 = peg$parseINLINE_MML_SUB();
            if (s3 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s3 = peg$c0;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e0);
                }
              }
            }
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c15) {
          s3 = peg$c15;
          peg$currPos += 4;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e18);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f9(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINVERSION_MODE_ROOT_INV() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c16) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e19);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f10();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINVERSION_MODE_1ST_INV() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c17) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e20);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f11();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINVERSION_MODE_2ND_INV() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c18) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e21);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f12();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINVERSION_MODE_3RD_INV() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c19) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e22);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f13();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOPEN_HARMONY_MODE_CLOSE() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c20) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e23);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 5);
      if (s2.toLowerCase() === peg$c21) {
        peg$currPos += 5;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e24);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f14();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOPEN_HARMONY_MODE_DROP2() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c22) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e25);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c23) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e26);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 10);
        if (s2.toLowerCase() === peg$c24) {
          peg$currPos += 10;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e27);
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f15();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOPEN_HARMONY_MODE_DROP4() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c25) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e28);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c26) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e29);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f16();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOPEN_HARMONY_MODE_DROP2AND4() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c27) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e30);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 12);
      if (s2.toLowerCase() === peg$c28) {
        peg$currPos += 12;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e31);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f17();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseBASS_PLAY_MODE_NO_BASS() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c29) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e32);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f18();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseBASS_PLAY_MODE_ROOT() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c30) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e33);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 15);
      if (s2.toLowerCase() === peg$c31) {
        peg$currPos += 15;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e34);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 14);
        if (s2.toLowerCase() === peg$c32) {
          peg$currPos += 14;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e35);
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f19();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseTEMPO() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 3);
    if (s2.toLowerCase() === peg$c33) {
      peg$currPos += 3;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e36);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 5);
      if (s2.toLowerCase() === peg$c34) {
        peg$currPos += 5;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e37);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parse_();
      s4 = [];
      s5 = input.charAt(peg$currPos);
      if (peg$r3.test(s5)) {
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e38);
        }
      }
      if (s5 !== peg$FAILED) {
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          s5 = input.charAt(peg$currPos);
          if (peg$r3.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e38);
            }
          }
        }
      } else {
        s4 = peg$FAILED;
      }
      if (s4 !== peg$FAILED) {
        s5 = input.charAt(peg$currPos);
        if (peg$r0.test(s5)) {
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s6 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f20(s4);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseBAR() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parse_();
    if (input.charCodeAt(peg$currPos) === 124) {
      s2 = peg$c35;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e39);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f21();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseBAR_SLASH() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parse_();
    if (input.substr(peg$currPos, 2) === peg$c36) {
      s2 = peg$c36;
      peg$currPos += 2;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e40);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f22();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseKEY() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 3);
    if (s2.toLowerCase() === peg$c37) {
      peg$currPos += 3;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e41);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r4.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e42);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parseKEY_EVENT();
      if (s4 !== peg$FAILED) {
        s5 = input.charAt(peg$currPos);
        if (peg$r0.test(s5)) {
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s5 === peg$FAILED) {
          s5 = null;
        }
        s6 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f23(s4);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseKEY_EVENT() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = input.charAt(peg$currPos);
    if (peg$r5.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e43);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseSHARP();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseSHARP();
      }
      s3 = [];
      s4 = peg$parseFLAT();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parseFLAT();
      }
      s4 = input.substr(peg$currPos, 5);
      if (s4.toLowerCase() === peg$c38) {
        peg$currPos += 5;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e44);
        }
      }
      if (s4 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 109) {
          s4 = peg$c39;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e45);
          }
        }
      }
      if (s4 === peg$FAILED) {
        s4 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f24(s1, s2, s3, s4);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSCALE() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 6);
    if (s2.toLowerCase() === peg$c40) {
      peg$currPos += 6;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e46);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c41) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e47);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 8);
        if (s2.toLowerCase() === peg$c42) {
          peg$currPos += 8;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e48);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = input.substr(peg$currPos, 6);
          if (s2.toLowerCase() === peg$c43) {
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e49);
            }
          }
          if (s2 === peg$FAILED) {
            s2 = input.substr(peg$currPos, 10);
            if (s2.toLowerCase() === peg$c44) {
              peg$currPos += 10;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e50);
              }
            }
            if (s2 === peg$FAILED) {
              s2 = input.substr(peg$currPos, 7);
              if (s2.toLowerCase() === peg$c45) {
                peg$currPos += 7;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e51);
                }
              }
              if (s2 === peg$FAILED) {
                s2 = input.substr(peg$currPos, 7);
                if (s2.toLowerCase() === peg$c46) {
                  peg$currPos += 7;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e52);
                  }
                }
              }
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f25(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOCTAVE_UP() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 6);
    if (s3.toLowerCase() === peg$c47) {
      peg$currPos += 6;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = input.charAt(peg$currPos);
      if (peg$r6.test(s4)) {
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e54);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = input.substr(peg$currPos, 2);
        if (s5.toLowerCase() === peg$c48) {
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e55);
          }
        }
        if (s5 !== peg$FAILED) {
          s3 = [s3, s4, s5];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f26();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOCTAVE_UP_UPPER() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 6);
    if (s3.toLowerCase() === peg$c47) {
      peg$currPos += 6;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = input.charAt(peg$currPos);
      if (peg$r6.test(s4)) {
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e54);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = input.substr(peg$currPos, 2);
        if (s5.toLowerCase() === peg$c48) {
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e55);
          }
        }
        if (s5 !== peg$FAILED) {
          s3 = [s3, s4, s5];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 47) {
        s3 = peg$c0;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e0);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = input.charAt(peg$currPos);
        if (peg$r0.test(s4)) {
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s5 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f27();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOCTAVE_UP_LOWER() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    s1 = peg$parse_();
    if (input.charCodeAt(peg$currPos) === 47) {
      s2 = peg$c0;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$currPos;
      s4 = input.substr(peg$currPos, 6);
      if (s4.toLowerCase() === peg$c47) {
        peg$currPos += 6;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e53);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = input.charAt(peg$currPos);
        if (peg$r6.test(s5)) {
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e54);
          }
        }
        if (s5 !== peg$FAILED) {
          s6 = input.substr(peg$currPos, 2);
          if (s6.toLowerCase() === peg$c48) {
            peg$currPos += 2;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e55);
            }
          }
          if (s6 !== peg$FAILED) {
            s4 = [s4, s5, s6];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s4 = input.charAt(peg$currPos);
        if (peg$r0.test(s4)) {
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s5 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f28();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOCTAVE_DOWN() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 6);
    if (s3.toLowerCase() === peg$c47) {
      peg$currPos += 6;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = input.charAt(peg$currPos);
      if (peg$r6.test(s4)) {
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e54);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = input.substr(peg$currPos, 4);
        if (s5.toLowerCase() === peg$c49) {
          peg$currPos += 4;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e56);
          }
        }
        if (s5 !== peg$FAILED) {
          s3 = [s3, s4, s5];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f29();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOCTAVE_DOWN_UPPER() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 6);
    if (s3.toLowerCase() === peg$c47) {
      peg$currPos += 6;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e53);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = input.charAt(peg$currPos);
      if (peg$r6.test(s4)) {
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e54);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = input.substr(peg$currPos, 4);
        if (s5.toLowerCase() === peg$c49) {
          peg$currPos += 4;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e56);
          }
        }
        if (s5 !== peg$FAILED) {
          s3 = [s3, s4, s5];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 47) {
        s3 = peg$c0;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e0);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = input.charAt(peg$currPos);
        if (peg$r0.test(s4)) {
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s5 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f30();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseOCTAVE_DOWN_LOWER() {
    let s0, s1, s2, s3, s4, s5, s6;
    s0 = peg$currPos;
    s1 = peg$parse_();
    if (input.charCodeAt(peg$currPos) === 47) {
      s2 = peg$c0;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$currPos;
      s4 = input.substr(peg$currPos, 6);
      if (s4.toLowerCase() === peg$c47) {
        peg$currPos += 6;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e53);
        }
      }
      if (s4 !== peg$FAILED) {
        s5 = input.charAt(peg$currPos);
        if (peg$r6.test(s5)) {
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e54);
          }
        }
        if (s5 !== peg$FAILED) {
          s6 = input.substr(peg$currPos, 4);
          if (s6.toLowerCase() === peg$c49) {
            peg$currPos += 4;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e56);
            }
          }
          if (s6 !== peg$FAILED) {
            s4 = [s4, s5, s6];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s4 = input.charAt(peg$currPos);
        if (peg$r0.test(s4)) {
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s5 = peg$parse_();
        peg$savedPos = s0;
        s0 = peg$f31();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseROOT() {
    let s0;
    s0 = peg$parseROOT_CDEFGAB();
    if (s0 === peg$FAILED) {
      s0 = peg$parseROOT_DEGREE();
    }
    return s0;
  }
  function peg$parseROOT_CDEFGAB() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = input.charAt(peg$currPos);
    if (peg$r5.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e43);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseSHARP();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseSHARP();
      }
      s3 = [];
      s4 = peg$parseFLAT();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parseFLAT();
      }
      peg$savedPos = s0;
      s0 = peg$f32(s1, s2, s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseROOT_DEGREE() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseSHARP();
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      s2 = peg$parseSHARP();
    }
    s2 = [];
    s3 = peg$parseFLAT();
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      s3 = peg$parseFLAT();
    }
    if (input.substr(peg$currPos, 3) === peg$c50) {
      s3 = peg$c50;
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e57);
      }
    }
    if (s3 === peg$FAILED) {
      if (input.substr(peg$currPos, 3) === peg$c51) {
        s3 = peg$c51;
        peg$currPos += 3;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e58);
        }
      }
      if (s3 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c52) {
          s3 = peg$c52;
          peg$currPos += 2;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e59);
          }
        }
        if (s3 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c53) {
            s3 = peg$c53;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e60);
            }
          }
          if (s3 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c54) {
              s3 = peg$c54;
              peg$currPos += 2;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e61);
              }
            }
            if (s3 === peg$FAILED) {
              s3 = input.charAt(peg$currPos);
              if (peg$r7.test(s3)) {
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e62);
                }
              }
            }
          }
        }
      }
    }
    if (s3 !== peg$FAILED) {
      peg$savedPos = s0;
      s0 = peg$f33(s1, s2, s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseSHARP() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.charAt(peg$currPos);
    if (peg$r8.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e63);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f34();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseFLAT() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.charAt(peg$currPos);
    if (peg$r9.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e64);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f35();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseCHORD_QUALITY() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parseQUARTAL_HARMONY();
    if (s2 === peg$FAILED) {
      s2 = peg$parseMAJ9();
      if (s2 === peg$FAILED) {
        s2 = peg$parseMIN7();
        if (s2 === peg$FAILED) {
          s2 = peg$parseMAJ7();
          if (s2 === peg$FAILED) {
            s2 = peg$parseMAJ_LONG();
            if (s2 === peg$FAILED) {
              s2 = peg$parseMIN_LONG();
              if (s2 === peg$FAILED) {
                s2 = peg$parseSEVENTH_SUS4();
                if (s2 === peg$FAILED) {
                  s2 = peg$parseSEVENTH_SUS2();
                  if (s2 === peg$FAILED) {
                    s2 = peg$parseSUS4();
                    if (s2 === peg$FAILED) {
                      s2 = peg$parseSUS2();
                      if (s2 === peg$FAILED) {
                        s2 = peg$parseDIM_TRIAD();
                        if (s2 === peg$FAILED) {
                          s2 = peg$parseAUG();
                          if (s2 === peg$FAILED) {
                            s2 = peg$parseTHIRTEENTH();
                            if (s2 === peg$FAILED) {
                              s2 = peg$parseELEVENTH();
                              if (s2 === peg$FAILED) {
                                s2 = peg$parseNINTH();
                                if (s2 === peg$FAILED) {
                                  s2 = peg$parseSEVENTH();
                                  if (s2 === peg$FAILED) {
                                    s2 = peg$parseSIXTH();
                                    if (s2 === peg$FAILED) {
                                      s2 = peg$parseMIN_SHORT();
                                      if (s2 === peg$FAILED) {
                                        s2 = peg$parseMAJ_SHORT();
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$parseOMIT_N();
      if (s4 === peg$FAILED) {
        s4 = peg$parseADD_N();
        if (s4 === peg$FAILED) {
          s4 = peg$parseFLATTED_FIFTH();
          if (s4 === peg$FAILED) {
            s4 = peg$parseAUGMENTED_FIFTH();
          }
        }
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parseOMIT_N();
        if (s4 === peg$FAILED) {
          s4 = peg$parseADD_N();
          if (s4 === peg$FAILED) {
            s4 = peg$parseFLATTED_FIFTH();
            if (s4 === peg$FAILED) {
              s4 = peg$parseAUGMENTED_FIFTH();
            }
          }
        }
      }
      s2 = [s2, s3];
      s1 = s2;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f36(s1);
    }
    s0 = s1;
    return s0;
  }
  function peg$parseMAJ_LONG() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.substr(peg$currPos, 3);
    if (s1.toLowerCase() === peg$c55) {
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e65);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f37();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseMAJ_SHORT() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 77) {
      s1 = peg$c56;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e66);
      }
    }
    if (s1 === peg$FAILED) {
      s1 = "";
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f38();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseMAJ7() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.substr(peg$currPos, 4);
    if (s1.toLowerCase() === peg$c57) {
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e67);
      }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c58) {
        s1 = peg$c58;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e68);
        }
      }
      if (s1 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 9651) {
          s1 = peg$c59;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e69);
          }
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f39();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseMAJ9() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = input.substr(peg$currPos, 3);
    if (s1.toLowerCase() === peg$c55) {
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e65);
      }
    }
    if (s1 === peg$FAILED) {
      s1 = input.charAt(peg$currPos);
      if (peg$r10.test(s1)) {
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e70);
        }
      }
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 40) {
        s2 = peg$c60;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e71);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (input.charCodeAt(peg$currPos) === 57) {
        s3 = peg$c61;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e72);
        }
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 41) {
          s4 = peg$c62;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e73);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f40();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseMIN_LONG() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.substr(peg$currPos, 3);
    if (s1.toLowerCase() === peg$c63) {
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e74);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f41();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseMIN_SHORT() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.charAt(peg$currPos);
    if (peg$r11.test(s1)) {
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e75);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f42();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseMIN7() {
    let s0, s1;
    s0 = peg$currPos;
    s1 = input.substr(peg$currPos, 4);
    if (s1.toLowerCase() === peg$c64) {
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e76);
      }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c65) {
        s1 = peg$c65;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e77);
        }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c66) {
          s1 = peg$c66;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e78);
          }
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f43();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseSIXTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 54) {
      s1 = peg$c67;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e79);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f44();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseSEVENTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 55) {
      s1 = peg$c68;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e80);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f45();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseNINTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 57) {
      s1 = peg$c61;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e72);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f46();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseELEVENTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c69) {
      s1 = peg$c69;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e81);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f47();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseTHIRTEENTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c70) {
      s1 = peg$c70;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e82);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f48();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseSUS2() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c71) {
      s1 = peg$c71;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e83);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f49();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseSUS4() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c72) {
      s1 = peg$c72;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e84);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f50();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseSEVENTH_SUS2() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c73) {
      s1 = peg$c73;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e85);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f51();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseSEVENTH_SUS4() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c74) {
      s1 = peg$c74;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e86);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f52();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseDIM_TRIAD() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c75) {
      s1 = peg$c75;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e87);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f53();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseAUG() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c76) {
      s1 = peg$c76;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e88);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f54();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseQUARTAL_HARMONY() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c77) {
      s1 = peg$c77;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e89);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = input.charAt(peg$currPos);
      if (peg$r12.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e90);
        }
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = input.charAt(peg$currPos);
          if (peg$r12.test(s3)) {
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e90);
            }
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f55(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseFLATTED_FIFTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c78) {
      s1 = peg$c78;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e91);
      }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c79) {
        s1 = peg$c79;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e92);
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f56();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseAUGMENTED_FIFTH() {
    let s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c80) {
      s1 = peg$c80;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e93);
      }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c81) {
        s1 = peg$c81;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e94);
        }
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f57();
    }
    s0 = s1;
    return s0;
  }
  function peg$parseOMIT_N() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c60;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e71);
      }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (input.substr(peg$currPos, 4) === peg$c82) {
      s2 = peg$c82;
      peg$currPos += 4;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e95);
      }
    }
    if (s2 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 111) {
        s2 = peg$c83;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e96);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r13.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e97);
        }
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 41) {
          s4 = peg$c62;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e73);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f58(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseADD_N() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c60;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e71);
      }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (input.substr(peg$currPos, 3) === peg$c84) {
      s2 = peg$c84;
      peg$currPos += 3;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e98);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = input.charAt(peg$currPos);
      if (peg$r3.test(s4)) {
        peg$currPos++;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e38);
        }
      }
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = input.charAt(peg$currPos);
          if (peg$r3.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e38);
            }
          }
        }
      } else {
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 41) {
          s4 = peg$c62;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e73);
          }
        }
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f59(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseINVERSION() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 94) {
      s2 = peg$c85;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e99);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r14.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e100);
        }
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    peg$savedPos = s0;
    s1 = peg$f60();
    s0 = s1;
    return s0;
  }
  function peg$parseOCTAVE_OFFSET() {
    let s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = [];
    if (input.charCodeAt(peg$currPos) === 39) {
      s2 = peg$c86;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e101);
      }
    }
    while (s2 !== peg$FAILED) {
      s1.push(s2);
      if (input.charCodeAt(peg$currPos) === 39) {
        s2 = peg$c86;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e101);
        }
      }
    }
    s2 = [];
    if (input.charCodeAt(peg$currPos) === 44) {
      s3 = peg$c87;
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e102);
      }
    }
    while (s3 !== peg$FAILED) {
      s2.push(s3);
      if (input.charCodeAt(peg$currPos) === 44) {
        s3 = peg$c87;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e102);
        }
      }
    }
    peg$savedPos = s0;
    s0 = peg$f61(s1, s2);
    return s0;
  }
  function peg$parse_() {
    let s0, s1;
    peg$silentFails++;
    s0 = [];
    s1 = peg$parseWHITE_SPACE();
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      s1 = peg$parseWHITE_SPACE();
    }
    peg$silentFails--;
    return s0;
  }
  function peg$parseWHITE_SPACE() {
    let s0;
    s0 = input.charAt(peg$currPos);
    if (peg$r15.test(s0)) {
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e103);
      }
    }
    return s0;
  }
  function peg$parseHYPHEN() {
    let s0, s1, s2, s3;
    if (input.substr(peg$currPos, 3) === peg$c88) {
      s0 = peg$c88;
      peg$currPos += 3;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e104);
      }
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parse_();
      s2 = input.charAt(peg$currPos);
      if (peg$r16.test(s2)) {
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e105);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    return s0;
  }
  function peg$parseCHORD_SEPARATOR() {
    let s0, s1;
    s0 = peg$parseHYPHEN();
    if (s0 === peg$FAILED) {
      s0 = peg$parseWHITE_SPACE();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        peg$silentFails++;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e106);
          }
        }
        peg$silentFails--;
        if (s1 === peg$FAILED) {
          s0 = void 0;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }
    return s0;
  }
  function peg$parseMIDI_PROGRAM_CHANGE() {
    let s0;
    s0 = peg$parsePC000();
    if (s0 === peg$FAILED) {
      s0 = peg$parsePC001();
      if (s0 === peg$FAILED) {
        s0 = peg$parsePC002();
        if (s0 === peg$FAILED) {
          s0 = peg$parsePC003();
          if (s0 === peg$FAILED) {
            s0 = peg$parsePC004();
            if (s0 === peg$FAILED) {
              s0 = peg$parsePC005();
              if (s0 === peg$FAILED) {
                s0 = peg$parsePC006();
                if (s0 === peg$FAILED) {
                  s0 = peg$parsePC007();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parsePC008();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parsePC009();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parsePC010();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parsePC011();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parsePC012();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parsePC013();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parsePC014();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parsePC015();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parsePC016();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parsePC017();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parsePC018();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parsePC019();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parsePC020();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parsePC021();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parsePC022();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parsePC023();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parsePC024();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parsePC025();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parsePC026();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parsePC027();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parsePC028();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parsePC029();
                                                              if (s0 === peg$FAILED) {
                                                                s0 = peg$parsePC030();
                                                                if (s0 === peg$FAILED) {
                                                                  s0 = peg$parsePC031();
                                                                  if (s0 === peg$FAILED) {
                                                                    s0 = peg$parsePC032();
                                                                    if (s0 === peg$FAILED) {
                                                                      s0 = peg$parsePC033();
                                                                      if (s0 === peg$FAILED) {
                                                                        s0 = peg$parsePC034();
                                                                        if (s0 === peg$FAILED) {
                                                                          s0 = peg$parsePC035();
                                                                          if (s0 === peg$FAILED) {
                                                                            s0 = peg$parsePC036();
                                                                            if (s0 === peg$FAILED) {
                                                                              s0 = peg$parsePC037();
                                                                              if (s0 === peg$FAILED) {
                                                                                s0 = peg$parsePC038();
                                                                                if (s0 === peg$FAILED) {
                                                                                  s0 = peg$parsePC039();
                                                                                  if (s0 === peg$FAILED) {
                                                                                    s0 = peg$parsePC040();
                                                                                    if (s0 === peg$FAILED) {
                                                                                      s0 = peg$parsePC041();
                                                                                      if (s0 === peg$FAILED) {
                                                                                        s0 = peg$parsePC042();
                                                                                        if (s0 === peg$FAILED) {
                                                                                          s0 = peg$parsePC043();
                                                                                          if (s0 === peg$FAILED) {
                                                                                            s0 = peg$parsePC044();
                                                                                            if (s0 === peg$FAILED) {
                                                                                              s0 = peg$parsePC045();
                                                                                              if (s0 === peg$FAILED) {
                                                                                                s0 = peg$parsePC046();
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  s0 = peg$parsePC047();
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    s0 = peg$parsePC048();
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      s0 = peg$parsePC049();
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        s0 = peg$parsePC050();
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          s0 = peg$parsePC051();
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            s0 = peg$parsePC052();
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              s0 = peg$parsePC053();
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                s0 = peg$parsePC054();
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  s0 = peg$parsePC055();
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    s0 = peg$parsePC056();
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      s0 = peg$parsePC057();
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        s0 = peg$parsePC058();
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          s0 = peg$parsePC059();
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            s0 = peg$parsePC060();
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              s0 = peg$parsePC061();
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                s0 = peg$parsePC062();
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  s0 = peg$parsePC063();
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    s0 = peg$parsePC064();
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      s0 = peg$parsePC065();
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        s0 = peg$parsePC066();
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          s0 = peg$parsePC067();
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            s0 = peg$parsePC068();
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              s0 = peg$parsePC069();
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                s0 = peg$parsePC070();
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  s0 = peg$parsePC071();
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    s0 = peg$parsePC072();
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      s0 = peg$parsePC073();
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        s0 = peg$parsePC074();
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          s0 = peg$parsePC075();
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            s0 = peg$parsePC076();
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              s0 = peg$parsePC077();
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                s0 = peg$parsePC078();
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  s0 = peg$parsePC079();
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    s0 = peg$parsePC080();
                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                      s0 = peg$parsePC081();
                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                        s0 = peg$parsePC082();
                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                          s0 = peg$parsePC083();
                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                            s0 = peg$parsePC084();
                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                              s0 = peg$parsePC085();
                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                s0 = peg$parsePC086();
                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                  s0 = peg$parsePC087();
                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                    s0 = peg$parsePC088();
                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                      s0 = peg$parsePC089();
                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                        s0 = peg$parsePC090();
                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                          s0 = peg$parsePC091();
                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                            s0 = peg$parsePC092();
                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                              s0 = peg$parsePC093();
                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                s0 = peg$parsePC094();
                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                  s0 = peg$parsePC095();
                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                    s0 = peg$parsePC096();
                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                      s0 = peg$parsePC097();
                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                        s0 = peg$parsePC098();
                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                          s0 = peg$parsePC099();
                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                            s0 = peg$parsePC100();
                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                              s0 = peg$parsePC101();
                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                s0 = peg$parsePC102();
                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                  s0 = peg$parsePC103();
                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                    s0 = peg$parsePC104();
                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                      s0 = peg$parsePC105();
                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                        s0 = peg$parsePC106();
                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                          s0 = peg$parsePC107();
                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                            s0 = peg$parsePC108();
                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                              s0 = peg$parsePC109();
                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                s0 = peg$parsePC110();
                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                  s0 = peg$parsePC111();
                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                    s0 = peg$parsePC112();
                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                      s0 = peg$parsePC113();
                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                        s0 = peg$parsePC114();
                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                          s0 = peg$parsePC115();
                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                            s0 = peg$parsePC116();
                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                              s0 = peg$parsePC117();
                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                s0 = peg$parsePC118();
                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                  s0 = peg$parsePC119();
                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                    s0 = peg$parsePC120();
                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                      s0 = peg$parsePC121();
                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                        s0 = peg$parsePC122();
                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                          s0 = peg$parsePC123();
                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                            s0 = peg$parsePC124();
                                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                              s0 = peg$parsePC125();
                                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                s0 = peg$parsePC126();
                                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                                  s0 = peg$parsePC127();
                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parsePC000() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c89) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e107);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 49) {
        s5 = peg$c90;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e108);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 20);
      if (s2.toLowerCase() === peg$c91) {
        peg$currPos += 20;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e109);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 11);
        if (s2.toLowerCase() === peg$c92) {
          peg$currPos += 11;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e110);
          }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c93) {
            s2 = peg$c93;
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e111);
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f62();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC001() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c89) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e107);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 50) {
        s5 = peg$c94;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e112);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 21);
      if (s2.toLowerCase() === peg$c95) {
        peg$currPos += 21;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e113);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f63();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC002() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c89) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e107);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 51) {
        s5 = peg$c96;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e114);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 20);
      if (s2.toLowerCase() === peg$c97) {
        peg$currPos += 20;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e115);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f64();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC003() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c98) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e116);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 16);
      if (s2.toLowerCase() === peg$c99) {
        peg$currPos += 16;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e117);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f65();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC004() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 7);
    if (s3.toLowerCase() === peg$c100) {
      peg$currPos += 7;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e118);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 49) {
        s5 = peg$c90;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e108);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 16);
      if (s2.toLowerCase() === peg$c101) {
        peg$currPos += 16;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e119);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 6);
        if (s2.toLowerCase() === peg$c102) {
          peg$currPos += 6;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e120);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = input.substr(peg$currPos, 9);
          if (s2.toLowerCase() === peg$c103) {
            peg$currPos += 9;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e121);
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f66();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC005() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 7);
    if (s3.toLowerCase() === peg$c100) {
      peg$currPos += 7;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e118);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 50) {
        s5 = peg$c94;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e112);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 16);
      if (s2.toLowerCase() === peg$c104) {
        peg$currPos += 16;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e122);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 8);
        if (s2.toLowerCase() === peg$c105) {
          peg$currPos += 8;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e123);
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f67();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC006() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c106) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e124);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f68();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC007() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c107) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e125);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 8);
      if (s2.toLowerCase() === peg$c108) {
        peg$currPos += 8;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e126);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f69();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC008() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c109) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e127);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f70();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC009() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c110) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e128);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 12);
      if (s2.toLowerCase() === peg$c111) {
        peg$currPos += 12;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e129);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f71();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC010() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c112) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e130);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f72();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC011() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c113) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e131);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f73();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC012() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c114) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e132);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f74();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC013() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c115) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e133);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f75();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC014() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c116) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e134);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 13);
      if (s2.toLowerCase() === peg$c117) {
        peg$currPos += 13;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e135);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f76();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC015() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 6);
    if (s2.toLowerCase() === peg$c118) {
      peg$currPos += 6;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e136);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 8);
      if (s2.toLowerCase() === peg$c119) {
        peg$currPos += 8;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e137);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f77();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC016() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c120) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e138);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 49) {
        s5 = peg$c90;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e108);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 13);
      if (s2.toLowerCase() === peg$c121) {
        peg$currPos += 13;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e139);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f78();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC017() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c120) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e138);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 50) {
        s5 = peg$c94;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e112);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 16);
      if (s2.toLowerCase() === peg$c122) {
        peg$currPos += 16;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e140);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f79();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC018() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c120) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e138);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 51) {
        s5 = peg$c96;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e114);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 10);
      if (s2.toLowerCase() === peg$c123) {
        peg$currPos += 10;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e141);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f80();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC019() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 10);
    if (s3.toLowerCase() === peg$c124) {
      peg$currPos += 10;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e142);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s5 = input.charAt(peg$currPos);
      if (peg$r17.test(s5)) {
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e143);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 12);
      if (s2.toLowerCase() === peg$c125) {
        peg$currPos += 12;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e144);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f81();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC020() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c126) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e145);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f82();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC021() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 9);
    if (s3.toLowerCase() === peg$c127) {
      peg$currPos += 9;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e146);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s5 = input.charAt(peg$currPos);
      if (peg$r18.test(s5)) {
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e147);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 9);
      if (s2.toLowerCase() === peg$c127) {
        peg$currPos += 9;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e146);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f83();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC022() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c128) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e148);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f84();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC023() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c129) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e149);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f85();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC024() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c130) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e150);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 23);
      if (s2.toLowerCase() === peg$c131) {
        peg$currPos += 23;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e151);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f86();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC025() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c132) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e152);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 23);
      if (s2.toLowerCase() === peg$c133) {
        peg$currPos += 23;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e153);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f87();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC026() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c134) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e154);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 22);
      if (s2.toLowerCase() === peg$c135) {
        peg$currPos += 22;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e155);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f88();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC027() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c136) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e156);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 23);
      if (s2.toLowerCase() === peg$c137) {
        peg$currPos += 23;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e157);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f89();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC028() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c138) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e158);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 23);
      if (s2.toLowerCase() === peg$c139) {
        peg$currPos += 23;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e159);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f90();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC029() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 9);
    if (s3.toLowerCase() === peg$c140) {
      peg$currPos += 9;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e160);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s5 = input.substr(peg$currPos, 2);
      if (s5.toLowerCase() === peg$c141) {
        peg$currPos += 2;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e161);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 27);
      if (s2.toLowerCase() === peg$c142) {
        peg$currPos += 27;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e162);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f91();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC030() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 5);
    if (s3.toLowerCase() === peg$c143) {
      peg$currPos += 5;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e163);
      }
    }
    if (s3 === peg$FAILED) {
      s3 = input.substr(peg$currPos, 10);
      if (s3.toLowerCase() === peg$c144) {
        peg$currPos += 10;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e164);
        }
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = input.substr(peg$currPos, 3);
      if (s4.toLowerCase() === peg$c145) {
        peg$currPos += 3;
      } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e165);
        }
      }
      if (s4 === peg$FAILED) {
        s4 = input.substr(peg$currPos, 2);
        if (s4.toLowerCase() === peg$c141) {
          peg$currPos += 2;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e161);
          }
        }
      }
      if (s4 !== peg$FAILED) {
        s3 = [s3, s4];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 28);
      if (s2.toLowerCase() === peg$c146) {
        peg$currPos += 28;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e166);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f92();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC031() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c147) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e167);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 12);
      if (s2.toLowerCase() === peg$c148) {
        peg$currPos += 12;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e168);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 27);
        if (s2.toLowerCase() === peg$c149) {
          peg$currPos += 27;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e169);
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f93();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC032() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c150) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e170);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f94();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC033() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 22);
    if (s2.toLowerCase() === peg$c151) {
      peg$currPos += 22;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e171);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f95();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC034() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 22);
    if (s2.toLowerCase() === peg$c152) {
      peg$currPos += 22;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e172);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f96();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC035() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 24);
    if (s2.toLowerCase() === peg$c153) {
      peg$currPos += 24;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e173);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f97();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC036() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c154) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e174);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f98();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC037() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c155) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e175);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f99();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC038() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c156) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e176);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f100();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC039() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c157) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e177);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f101();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC040() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 6);
    if (s2.toLowerCase() === peg$c158) {
      peg$currPos += 6;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e178);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f102();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC041() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c159) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e179);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f103();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC042() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c160) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e180);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f104();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC043() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c161) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e181);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f105();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC044() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 15);
    if (s2.toLowerCase() === peg$c162) {
      peg$currPos += 15;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e182);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f106();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC045() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 17);
    if (s2.toLowerCase() === peg$c163) {
      peg$currPos += 17;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e183);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f107();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC046() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 15);
    if (s2.toLowerCase() === peg$c164) {
      peg$currPos += 15;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e184);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f108();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC047() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c165) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e185);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f109();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC048() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 7);
    if (s3.toLowerCase() === peg$c166) {
      peg$currPos += 7;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e186);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s5 = input.substr(peg$currPos, 8);
      if (s5.toLowerCase() === peg$c167) {
        peg$currPos += 8;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e187);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 49) {
          s7 = peg$c90;
          peg$currPos++;
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e108);
          }
        }
        if (s7 !== peg$FAILED) {
          s3 = [s3, s4, s5, s6, s7];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = peg$currPos;
      s3 = input.substr(peg$currPos, 7);
      if (s3.toLowerCase() === peg$c166) {
        peg$currPos += 7;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e186);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 49) {
          s5 = peg$c90;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e108);
          }
        }
        if (s5 !== peg$FAILED) {
          s3 = [s3, s4, s5];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = peg$currPos;
        s3 = input.substr(peg$currPos, 4);
        if (s3.toLowerCase() === peg$c168) {
          peg$currPos += 4;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e188);
          }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 49) {
            s5 = peg$c90;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e108);
            }
          }
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f110();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC049() {
    let s0, s1, s2, s3, s4, s5, s6, s7;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 7);
    if (s3.toLowerCase() === peg$c166) {
      peg$currPos += 7;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e186);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      s5 = input.substr(peg$currPos, 8);
      if (s5.toLowerCase() === peg$c167) {
        peg$currPos += 8;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e187);
        }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 50) {
          s7 = peg$c94;
          peg$currPos++;
        } else {
          s7 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e112);
          }
        }
        if (s7 !== peg$FAILED) {
          s3 = [s3, s4, s5, s6, s7];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = peg$currPos;
      s3 = input.substr(peg$currPos, 7);
      if (s3.toLowerCase() === peg$c166) {
        peg$currPos += 7;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e186);
        }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 50) {
          s5 = peg$c94;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e112);
          }
        }
        if (s5 !== peg$FAILED) {
          s3 = [s3, s4, s5];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = peg$currPos;
        s3 = input.substr(peg$currPos, 4);
        if (s3.toLowerCase() === peg$c168) {
          peg$currPos += 4;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e188);
          }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 50) {
            s5 = peg$c94;
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e112);
            }
          }
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f111();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC050() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 15);
    if (s2.toLowerCase() === peg$c169) {
      peg$currPos += 15;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e189);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f112();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC051() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 15);
    if (s2.toLowerCase() === peg$c170) {
      peg$currPos += 15;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e190);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f113();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC052() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c171) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e191);
      }
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 10);
      if (s2.toLowerCase() === peg$c172) {
        peg$currPos += 10;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e192);
        }
      }
      if (s2 === peg$FAILED) {
        s2 = input.substr(peg$currPos, 5);
        if (s2.toLowerCase() === peg$c173) {
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e193);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = input.substr(peg$currPos, 5);
          if (s2.toLowerCase() === peg$c174) {
            peg$currPos += 5;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e194);
            }
          }
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f114();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC053() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c175) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e195);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f115();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC054() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c176) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e196);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f116();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC055() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c177) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e197);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f117();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC056() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c178) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e198);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f118();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC057() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c179) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e199);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f119();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC058() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 4);
    if (s2.toLowerCase() === peg$c180) {
      peg$currPos += 4;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e200);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f120();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC059() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c181) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e201);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f121();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC060() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c182) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e202);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f122();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC061() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c183) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e203);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f123();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC062() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c184) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e204);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f124();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC063() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 13);
    if (s2.toLowerCase() === peg$c185) {
      peg$currPos += 13;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e205);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f125();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC064() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c186) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e206);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f126();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC065() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c187) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e207);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f127();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC066() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c188) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e208);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f128();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC067() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c189) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e209);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f129();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC068() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 4);
    if (s2.toLowerCase() === peg$c190) {
      peg$currPos += 4;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e210);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f130();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC069() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c191) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e211);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f131();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC070() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c192) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e212);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f132();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC071() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c193) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e213);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f133();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC072() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c194) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e214);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f134();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC073() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c195) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e215);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f135();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC074() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c196) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e216);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f136();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC075() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c197) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e217);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f137();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC076() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c198) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e218);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f138();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC077() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c199) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e219);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f139();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC078() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c200) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e220);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f140();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC079() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c201) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e221);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f141();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC080() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 49) {
        s5 = peg$c90;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e108);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c203) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e223);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f142();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC081() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 50) {
        s5 = peg$c94;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e112);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 8);
      if (s2.toLowerCase() === peg$c204) {
        peg$currPos += 8;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e224);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f143();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC082() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 51) {
        s5 = peg$c96;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e114);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 8);
      if (s2.toLowerCase() === peg$c205) {
        peg$currPos += 8;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e225);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f144();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC083() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 52) {
        s5 = peg$c206;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e226);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 5);
      if (s2.toLowerCase() === peg$c207) {
        peg$currPos += 5;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e227);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f145();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC084() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 53) {
        s5 = peg$c208;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e228);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 7);
      if (s2.toLowerCase() === peg$c209) {
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e229);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f146();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC085() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 54) {
        s5 = peg$c67;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e79);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 5);
      if (s2.toLowerCase() === peg$c210) {
        peg$currPos += 5;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e230);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f147();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC086() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 55) {
        s5 = peg$c68;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e80);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c211) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e231);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f148();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC087() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 4);
    if (s3.toLowerCase() === peg$c202) {
      peg$currPos += 4;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e222);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 56) {
        s5 = peg$c212;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e232);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 13);
      if (s2.toLowerCase() === peg$c213) {
        peg$currPos += 13;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e233);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f149();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC088() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 49) {
        s5 = peg$c90;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e108);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 7);
      if (s2.toLowerCase() === peg$c215) {
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e235);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f150();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC089() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 50) {
        s5 = peg$c94;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e112);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 4);
      if (s2.toLowerCase() === peg$c216) {
        peg$currPos += 4;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e236);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f151();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC090() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 51) {
        s5 = peg$c96;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e114);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 9);
      if (s2.toLowerCase() === peg$c217) {
        peg$currPos += 9;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e237);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f152();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC091() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 52) {
        s5 = peg$c206;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e226);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 5);
      if (s2.toLowerCase() === peg$c173) {
        peg$currPos += 5;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e193);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f153();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC092() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 53) {
        s5 = peg$c208;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e228);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 11);
      if (s2.toLowerCase() === peg$c218) {
        peg$currPos += 11;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e238);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f154();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC093() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 54) {
        s5 = peg$c67;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e79);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 8);
      if (s2.toLowerCase() === peg$c219) {
        peg$currPos += 8;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e239);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f155();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC094() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 55) {
        s5 = peg$c68;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e80);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 4);
      if (s2.toLowerCase() === peg$c220) {
        peg$currPos += 4;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e240);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f156();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC095() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 3);
    if (s3.toLowerCase() === peg$c214) {
      peg$currPos += 3;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e234);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 56) {
        s5 = peg$c212;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e232);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 5);
      if (s2.toLowerCase() === peg$c221) {
        peg$currPos += 5;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e241);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f157();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC096() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 49) {
        s5 = peg$c90;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e108);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 4);
      if (s2.toLowerCase() === peg$c223) {
        peg$currPos += 4;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e243);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f158();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC097() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 50) {
        s5 = peg$c94;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e112);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 10);
      if (s2.toLowerCase() === peg$c224) {
        peg$currPos += 10;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e244);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f159();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC098() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 51) {
        s5 = peg$c96;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e114);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 7);
      if (s2.toLowerCase() === peg$c225) {
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e245);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f160();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC099() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 52) {
        s5 = peg$c206;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e226);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 10);
      if (s2.toLowerCase() === peg$c226) {
        peg$currPos += 10;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e246);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f161();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC100() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 53) {
        s5 = peg$c208;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e228);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 10);
      if (s2.toLowerCase() === peg$c227) {
        peg$currPos += 10;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e247);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f162();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC101() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 54) {
        s5 = peg$c67;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e79);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 7);
      if (s2.toLowerCase() === peg$c228) {
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e248);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f163();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC102() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 55) {
        s5 = peg$c68;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e80);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c229) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e249);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f164();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC103() {
    let s0, s1, s2, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = peg$currPos;
    s3 = input.substr(peg$currPos, 2);
    if (s3.toLowerCase() === peg$c222) {
      peg$currPos += 2;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e242);
      }
    }
    if (s3 !== peg$FAILED) {
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 56) {
        s5 = peg$c212;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e232);
        }
      }
      if (s5 !== peg$FAILED) {
        s3 = [s3, s4, s5];
        s2 = s3;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 === peg$FAILED) {
      s2 = input.substr(peg$currPos, 6);
      if (s2.toLowerCase() === peg$c230) {
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e250);
        }
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f165();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC104() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c231) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e251);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f166();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC105() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c232) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e252);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f167();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC106() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c233) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e253);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f168();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC107() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 4);
    if (s2.toLowerCase() === peg$c234) {
      peg$currPos += 4;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e254);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f169();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC108() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c235) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e255);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f170();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC109() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c236) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e256);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f171();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC110() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 6);
    if (s2.toLowerCase() === peg$c237) {
      peg$currPos += 6;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e257);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f172();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC111() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 6);
    if (s2.toLowerCase() === peg$c238) {
      peg$currPos += 6;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e258);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f173();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC112() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c239) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e259);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f174();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC113() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c240) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e260);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f175();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC114() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c241) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e261);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f176();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC115() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 9);
    if (s2.toLowerCase() === peg$c242) {
      peg$currPos += 9;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e262);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f177();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC116() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 5);
    if (s2.toLowerCase() === peg$c243) {
      peg$currPos += 5;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e263);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f178();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC117() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 11);
    if (s2.toLowerCase() === peg$c244) {
      peg$currPos += 11;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e264);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f179();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC118() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c245) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e265);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f180();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC119() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 14);
    if (s2.toLowerCase() === peg$c246) {
      peg$currPos += 14;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e266);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f181();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC120() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 17);
    if (s2.toLowerCase() === peg$c247) {
      peg$currPos += 17;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e267);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f182();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC121() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 12);
    if (s2.toLowerCase() === peg$c248) {
      peg$currPos += 12;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e268);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f183();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC122() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c249) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e269);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f184();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC123() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c250) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e270);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f185();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC124() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 14);
    if (s2.toLowerCase() === peg$c251) {
      peg$currPos += 14;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e271);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f186();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC125() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 10);
    if (s2.toLowerCase() === peg$c252) {
      peg$currPos += 10;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e272);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f187();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC126() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 8);
    if (s2.toLowerCase() === peg$c253) {
      peg$currPos += 8;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e273);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f188();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsePC127() {
    let s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parse_();
    s2 = input.substr(peg$currPos, 7);
    if (s2.toLowerCase() === peg$c254) {
      peg$currPos += 7;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e274);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = input.charAt(peg$currPos);
      if (peg$r0.test(s3)) {
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      peg$savedPos = s0;
      s0 = peg$f189();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  let gKey = 0;
  let gScale = "ionian";
  peg$result = peg$startRuleFunction();
  const peg$success = peg$result !== peg$FAILED && peg$currPos === input.length;
  function peg$throw() {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }
    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? peg$getUnicode(peg$maxFailPos) : null,
      peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
  if (options.peg$library) {
    return (
      /** @type {any} */
      {
        peg$result,
        peg$currPos,
        peg$FAILED,
        peg$maxFailExpected,
        peg$maxFailPos,
        peg$success,
        peg$throw: peg$success ? void 0 : peg$throw
      }
    );
  }
  if (peg$success) {
    return peg$result;
  } else {
    peg$throw();
  }
}

// src/chord2mml_ast2ast.ts
function astToAst(asts) {
  let slashMode = "chord over bass note";
  let bassPlayMode = "no bass";
  for (let ast of asts) {
    switch (ast.event) {
      case "change slash chord mode to chord over bass note":
        slashMode = "chord over bass note";
        break;
      case "change slash chord mode to inversion":
        slashMode = "inversion";
        break;
      case "change slash chord mode to polychord":
        slashMode = "polychord";
        break;
      case "slash chord":
        ast.event = slashMode;
        break;
      case "change bass play mode to root":
        bassPlayMode = "root";
        break;
      case "change bass play mode to no bass":
        bassPlayMode = "no bass";
        break;
      case "chord":
        if (bassPlayMode == "root") {
          ast.event = "chord over bass note";
          ast.upperRoot = ast.root;
          ast.upperQuality = ast.quality;
          ast.upperInversion = ast.inversion;
          ast.upperOctaveOffset = ast.octaveOffset;
          ast.lowerRoot = ast.root;
          ast.lowerQuality = ast.quality;
          ast.lowerInversion = ast.inversion;
          ast.lowerOctaveOffset = ast.octaveOffset;
          delete ast.root;
          delete ast.quality;
          delete ast.inversion;
          delete ast.octaveOffset;
        }
        break;
    }
  }
  asts = bar2noteLength(asts);
  return asts;
}
function bar2noteLength(asts) {
  let barCount = 0;
  let totalNoteLength = 1;
  let chordIndexes = [];
  for (let i = 0; i < asts.length; i++) {
    let ast = asts[i];
    switch (ast.event) {
      case "chord":
      case "chord over bass note":
      case "inversion":
      case "polychord":
        ast.noteLength = 1;
        chordIndexes.push(i);
        break;
      case "bar":
        barCount++;
        asts = updateAstNoteLength(asts, chordIndexes, totalNoteLength);
        chordIndexes = [];
        totalNoteLength = 1;
        break;
      case "bar slash":
        barCount++;
        totalNoteLength = 2;
        asts = updateAstNoteLength(asts, chordIndexes, totalNoteLength);
        chordIndexes = [];
        break;
    }
  }
  if (barCount) asts = updateAstNoteLength(asts, chordIndexes, totalNoteLength);
  return asts;
}
function updateAstNoteLength(asts, chordIndexes, totalNoteLength) {
  const noteLength = chordIndexes.length * totalNoteLength;
  for (let iChord of chordIndexes) {
    asts[iChord].noteLength = noteLength;
  }
  return asts;
}

// src/chord2mml_ast2notes.ts
function astToNotes(asts) {
  let result = [];
  let inversionMode = "root inv";
  let openHarmonyMode = "close";
  let bassPlayMode = "no bass";
  let octaveOffsetUpper = 0;
  let octaveOffsetLower = 0;
  for (let ast of asts) {
    switch (ast.event) {
      case "chord":
        ast.notes = getNotesByChord(ast.root, ast.quality, ast.inversion ?? inversionMode, openHarmonyMode, octaveOffsetUpper + ast.octaveOffset);
        ast = deleteProperties(ast);
        result.push(ast);
        break;
      case "chord over bass note":
        ast.notes = getNotesByChordOverBassNote(
          ast.upperRoot,
          ast.upperQuality,
          ast.lowerRoot,
          ast.upperInversion ?? inversionMode,
          openHarmonyMode,
          octaveOffsetUpper + ast.upperOctaveOffset,
          octaveOffsetLower + ast.lowerOctaveOffset
        );
        ast = deleteProperties(ast);
        result.push(ast);
        break;
      case "inversion":
        ast.notes = getNotesByInversionChord(ast.upperRoot, ast.upperQuality, ast.lowerRoot, bassPlayMode, octaveOffsetUpper + ast.upperOctaveOffset);
        ast = deleteProperties(ast);
        result.push(ast);
        break;
      case "polychord":
        ast.notes = getNotesByPolychord(
          ast.upperRoot,
          ast.upperQuality,
          ast.upperInversion ?? inversionMode,
          ast.lowerRoot,
          ast.lowerQuality,
          ast.lowerInversion ?? inversionMode,
          octaveOffsetUpper + ast.upperOctaveOffset,
          octaveOffsetLower + ast.lowerOctaveOffset
        );
        ast = deleteProperties(ast);
        result.push(ast);
        break;
      case "change inversion mode to root inv":
        inversionMode = "root inv";
        break;
      case "change inversion mode to 1st inv":
        inversionMode = "1st inv";
        break;
      case "change inversion mode to 2nd inv":
        inversionMode = "2nd inv";
        break;
      case "change inversion mode to 3rd inv":
        inversionMode = "3rd inv";
        break;
      case "change open harmony mode to close":
        openHarmonyMode = "close";
        break;
      case "change open harmony mode to drop2":
        openHarmonyMode = "drop2";
        break;
      case "change open harmony mode to drop4":
        openHarmonyMode = "drop4";
        break;
      case "change open harmony mode to drop2and4":
        openHarmonyMode = "drop2and4";
        break;
      case "change bass play mode to root":
        bassPlayMode = "root";
        break;
      case "change bass play mode to no bass":
        bassPlayMode = "no bass";
        break;
      case "octave up":
        octaveOffsetUpper++;
        octaveOffsetLower++;
        break;
      case "octave up upper":
        octaveOffsetUpper++;
        break;
      case "octave up lower":
        octaveOffsetLower++;
        break;
      case "octave down":
        octaveOffsetUpper--;
        octaveOffsetLower--;
        break;
      case "octave down upper":
        octaveOffsetUpper--;
        break;
      case "octave down lower":
        octaveOffsetLower--;
        break;
      default:
        result.push(ast);
        break;
    }
  }
  return result;
}
function deleteProperties(ast) {
  delete ast.event;
  delete ast.root;
  delete ast.quality;
  delete ast.inversion;
  delete ast.octaveOffset;
  delete ast.upperRoot;
  delete ast.upperQuality;
  delete ast.upperInversion;
  delete ast.upperOctaveOffset;
  delete ast.lowerRoot;
  delete ast.lowerQuality;
  delete ast.lowerInversion;
  delete ast.lowerOctaveOffset;
  return ast;
}
function getNotesByChord(root, quality, inversionMode, openHarmonyMode, octaveOffset) {
  let notes = getNotes(root, quality);
  notes = inversionAndOpenHarmony(notes, inversionMode, openHarmonyMode);
  notes = keyShiftNotes(notes, octaveOffset * 12);
  return notes;
}
function getNotesByChordOverBassNote(upperRoot, upperQuality, lowerRoot, inversionMode, openHarmonyMode, octaveOffsetUpper, octaveOffsetLower) {
  let lowerNotes = [lowerRoot];
  let upperNotes = getNotes(upperRoot, upperQuality);
  upperNotes = inversionAndOpenHarmony(upperNotes, inversionMode, openHarmonyMode);
  upperNotes = keyShiftUpperNotes(upperNotes, lowerNotes);
  let notes = concatLowerAndUpper(upperNotes, octaveOffsetUpper, lowerNotes, octaveOffsetLower);
  notes = keyShiftNotes(notes, -12);
  return notes;
}
function concatLowerAndUpper(upperNotes, octaveOffsetUpper, lowerNotes, octaveOffsetLower) {
  lowerNotes = keyShiftNotes(lowerNotes, octaveOffsetLower * 12);
  upperNotes = keyShiftNotes(upperNotes, octaveOffsetUpper * 12);
  if (upperNotes[0] <= lowerNotes[lowerNotes.length - 1]) throw new Error(`ERROR : lower\u3068upper\u304C\u885D\u7A81\u3057\u307E\u3057\u305F lowerNotes:${lowerNotes} upperNotes:${upperNotes}`);
  let notes = [];
  notes.push(...lowerNotes, ...upperNotes);
  return notes;
}
function keyShiftUpperNotes(upperNotes, lowerNotes) {
  while (upperNotes[0] <= lowerNotes[lowerNotes.length - 1]) {
    upperNotes = keyShiftNotes(upperNotes, 12);
  }
  return upperNotes;
}
function getNotesByInversionChord(upperRoot, upperQuality, lowerRoot, bassPlayMode, octaveOffset) {
  if (bassPlayMode == "root") {
    let lowerNotes = [upperRoot];
    let upperNotes = getNotes(upperRoot, upperQuality);
    upperNotes = inversionByTargetNote(upperNotes, lowerRoot);
    let notes = concatLowerAndUpper(upperNotes, octaveOffset, lowerNotes, octaveOffset);
    notes = keyShiftNotes(notes, -12);
    return notes;
  } else {
    let notes = getNotes(upperRoot, upperQuality);
    notes = keyShiftNotes(notes, octaveOffset * 12);
    notes = inversionByTargetNote(notes, lowerRoot);
    return notes;
  }
}
function getNotesByPolychord(upperRoot, upperQuality, upperInversion, lowerRoot, lowerQuality, lowerInversion, octaveOffsetUpper, octaveOffsetLower) {
  let upperNotes = getNotes(upperRoot, upperQuality);
  let lowerNotes = getNotes(lowerRoot, lowerQuality);
  upperNotes = inversionAndOpenHarmony(upperNotes, upperInversion, "");
  lowerNotes = inversionAndOpenHarmony(lowerNotes, lowerInversion, "");
  upperNotes = keyShiftUpperNotes(upperNotes, lowerNotes);
  let notes = concatLowerAndUpper(upperNotes, octaveOffsetUpper, lowerNotes, octaveOffsetLower);
  notes = keyShiftNotes(notes, -12);
  return notes;
}
function getNotes(root, quality) {
  const q = quality.split(",");
  let notes = [];
  switch (q[0]) {
    case "maj":
      notes = [0, 4, 7];
      break;
    case "maj7":
      notes = [0, 4, 7, 11];
      break;
    case "min":
      notes = [0, 3, 7];
      break;
    case "min7":
      notes = [0, 3, 7, 10];
      break;
    case "sus2":
      notes = [0, 2, 7];
      break;
    case "sus4":
      notes = [0, 5, 7];
      break;
    case "7sus2":
      notes = [0, 2, 7, 10];
      break;
    case "7sus4":
      notes = [0, 5, 7, 10];
      break;
    case "dim triad":
      notes = [0, 3, 6];
      break;
    case "aug":
      notes = [0, 4, 8];
      break;
    case "6":
      notes = [0, 4, 7, 9];
      break;
    case "7":
      notes = [0, 4, 7, 10];
      break;
    case "9":
      notes = [0, 4, 7, 10, 14];
      break;
    case "11":
      notes = [0, 4, 7, 10, 14, 17];
      break;
    case "13":
      notes = [0, 4, 7, 10, 14, 17, 21];
      break;
    default:
      if (q[0].substring(0, 2) == "4.") {
        notes = [0];
        for (let i = 1; i < parseInt(q[0][2]); i++) {
          notes.push(i * 5);
        }
      }
      break;
  }
  for (let o of q) {
    switch (o) {
      case "omit1":
        notes = notes.filter((e) => e !== 0);
        break;
      case "omit3":
        notes = notes.filter((e) => ![3, 4].includes(e));
        break;
      case "omit5":
        notes = notes.filter((e) => e !== 7);
        break;
      case "add2":
        notes = addNote(notes, 2);
        break;
      case "add9":
        notes = addNote(notes, 2 + 12);
        break;
      case "add4":
        notes = addNote(notes, 5);
        break;
      case "add11":
        notes = addNote(notes, 5 + 12);
        break;
      case "add6":
        notes = addNote(notes, 9);
        break;
      case "add13":
        notes = addNote(notes, 9 + 12);
        break;
      case "flatted fifth":
        notes = notes.map((note) => note === 7 ? 6 : note);
        break;
      case "augmented fifth":
        notes = notes.map((note) => note === 7 ? 8 : note);
        break;
    }
  }
  notes = keyShiftNotes(notes, root);
  return notes;
}
function addNote(notes, n) {
  if (!notes.includes(n)) {
    notes.push(n);
    notes.sort((a, b) => a - b);
  }
  return notes;
}
function inversionAndOpenHarmony(notes, inversionMode, openHarmonyMode) {
  switch (inversionMode) {
    case "1st inv":
      notes = inversionByCount(notes, 1);
      break;
    case "2nd inv":
      notes = inversionByCount(notes, 2);
      break;
    case "3rd inv":
      notes = inversionByCount(notes, 3);
      break;
  }
  switch (openHarmonyMode) {
    case "drop2":
      notes = drop2(notes);
      break;
    case "drop4":
      notes = drop4(notes);
      break;
    case "drop2and4":
      notes = drop2and4(notes);
      break;
  }
  return notes;
}
function keyShiftNotes(notes, v) {
  for (let iNotes = 0; iNotes < notes.length; iNotes++) {
    notes[iNotes] += v;
  }
  return notes;
}
function inversionByTargetNote(notes, targetNote) {
  let isInverted = false;
  for (let _dummy of notes) {
    if ((notes[0] % 12 + 12) % 12 == (targetNote % 12 + 12) % 12) {
      isInverted = true;
      break;
    }
    notes.push(notes.shift());
  }
  if (isInverted) {
    notes = adjustNotesOctave(notes);
    return notes;
  }
  throw new Error(`ERROR : ${JSON.stringify(notes)} \u3092\u8EE2\u56DE\u3057\u3088\u3046\u3068\u3057\u307E\u3057\u305F\u304C\u3001chord\u306B ${JSON.stringify(targetNote)} \u304C\u542B\u307E\u308C\u3066\u3044\u307E\u305B\u3093\u3002chord\u306B\u542B\u307E\u308C\u308Bnote\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
}
function inversionByCount(notes, count) {
  for (let i = 0; i < count; i++) {
    notes.push(notes.shift());
  }
  notes = adjustNotesOctave(notes);
  return notes;
}
function adjustNotesOctave(notes) {
  let oldNote = -128;
  for (let i = 0; i < notes.length; i++) {
    for (let iNote = -128; iNote < 128; iNote += 12) {
      if (notes[i] > oldNote) break;
      notes[i] += 12;
    }
    oldNote = notes[i];
  }
  return notes;
}
function drop2(notes) {
  if (notes.length < 2) {
    return notes;
  } else {
    const secondLast = notes[notes.length - 2] - 12;
    notes.splice(notes.length - 2, 1);
    notes.unshift(secondLast);
    return notes;
  }
}
function drop4(notes) {
  if (notes.length < 4) {
    return notes;
  } else {
    const fourthLast = notes[notes.length - 4] - 12;
    notes.splice(notes.length - 4, 1);
    notes.unshift(fourthLast);
    return notes;
  }
}
function drop2and4(notes) {
  if (notes.length < 4) {
    return notes;
  } else {
    const secondLast = notes[notes.length - 2] - 12;
    const fourthLast = notes[notes.length - 4] - 12;
    notes.splice(notes.length - 2, 1);
    notes.splice(notes.length - 4 + 1, 1);
    notes.unshift(secondLast);
    notes.unshift(fourthLast);
    return notes;
  }
}

// src/chord2mml_notes2mml.ts
function notesToMml(noteAsts) {
  const twelveIonians = create12ionians();
  let mml = "v11";
  let keyAst = { event: "key", root: "C", sharpLength: 0, flatLength: 0, offset: 0 };
  let scaleAst = { event: "scale", offsets: [0, 2, 4, 5, 7, 9, 11] };
  let isSharp = isSharpByKeyAndScale(keyAst.offset, scaleAst.offsets, twelveIonians);
  for (let noteAst of noteAsts) {
    switch (noteAst.event) {
      case "inline mml":
        mml += noteAst.mml;
        continue;
      case "bar":
        mml += "/*|*/";
        continue;
      case "key":
        keyAst = noteAst;
        isSharp = isSharpByKeyAndScale(keyAst.offset, scaleAst.offsets, twelveIonians);
        continue;
      case "scale":
        scaleAst = noteAst;
        isSharp = isSharpByKeyAndScale(keyAst.offset, scaleAst.offsets, twelveIonians);
        continue;
    }
    const notes = noteAst.notes;
    if (!notes) {
      continue;
    }
    let lastOctaveOffset = 0;
    if (notes.length) mml += "'";
    let bottomNote = notes[0];
    while (bottomNote < 0) {
      bottomNote += 12;
      mml += ">";
      lastOctaveOffset--;
    }
    for (let iNotes = 0; iNotes < notes.length; iNotes++) {
      let note = notes[iNotes];
      let octaveOffset = Math.floor(note / 12);
      while (octaveOffset > lastOctaveOffset) {
        mml += "<";
        lastOctaveOffset++;
      }
      if (isSharp) {
        switch ((note % 12 + 12) % 12) {
          case 0:
            mml += "c";
            break;
          case 1:
            mml += "c+";
            break;
          case 2:
            mml += "d";
            break;
          case 3:
            mml += "d+";
            break;
          case 4:
            mml += "e";
            break;
          case 5:
            mml += "f";
            break;
          case 6:
            mml += "f+";
            break;
          case 7:
            mml += "g";
            break;
          case 8:
            mml += "g+";
            break;
          case 9:
            mml += "a";
            break;
          case 10:
            mml += "a+";
            break;
          case 11:
            mml += "b";
            break;
        }
      } else {
        switch ((note % 12 + 12) % 12) {
          case 0:
            mml += "c";
            break;
          case 1:
            mml += "d-";
            break;
          case 2:
            mml += "d";
            break;
          case 3:
            mml += "e-";
            break;
          case 4:
            mml += "e";
            break;
          case 5:
            mml += "f";
            break;
          case 6:
            mml += "g-";
            break;
          case 7:
            mml += "g";
            break;
          case 8:
            mml += "a-";
            break;
          case 9:
            mml += "a";
            break;
          case 10:
            mml += "b-";
            break;
          case 11:
            mml += "b";
            break;
        }
      }
      if (!iNotes && noteAst.noteLength) {
        mml += noteAst.noteLength;
      }
    }
    if (notes.length) mml += "'";
  }
  return mml;
}
function create12ionians() {
  const cIonian = [0, 2, 4, 5, 7, 9, 11];
  const twelveIonians = generateIonians(cIonian);
  const normalized12ionians = normalizeArrays(twelveIonians);
  return normalized12ionians;
  function generateIonians(base) {
    let result = [];
    for (let i = 0; i < 12; i++) {
      const ionian = base.map((x) => (x + i) % 12);
      result.push(ionian);
    }
    return result;
  }
  function normalizeArrays(arrays) {
    return arrays.map((arr) => arr.sort((a, b) => a - b));
  }
}
function isSharpByKeyAndScale(key, offsets, twelveIonians) {
  const result = searchIonians(key, offsets, twelveIonians);
  switch (result) {
    case 0:
      return true;
    case 1:
      return false;
    case 2:
      return true;
    case 3:
      return false;
    case 4:
      return true;
    case 5:
      return false;
    case 6:
      return false;
    case 7:
      return true;
    case 8:
      return false;
    case 9:
      return true;
    case 10:
      return false;
    case 11:
      return true;
    default:
      throw new Error(`ERROR : isSharpByKeyAndScale`);
  }
  function searchIonians(key2, offsets2, ionians) {
    const keyOffsets = offsets2.map((offset) => offset + key2);
    const sortedOffsets = keyOffsets.map((koffset) => koffset % 12).sort((a, b) => a - b);
    for (let i = 0; i < ionians.length; i++) {
      if (JSON.stringify(ionians[i]) === JSON.stringify(sortedOffsets)) {
        return i;
      }
    }
    throw new Error(`ERROR : isSharpByKeyAndScale searchIonians`);
  }
}

// src/chord2mml.ts
var chord2mml = { parse: peg$parse };
chord2mml.parse = function(chord) {
  let ast = peg$parse(chord);
  ast = astToAst(ast);
  const notes = astToNotes(ast);
  const mml = notesToMml(notes);
  return mml;
};
export {
  chord2mml
};
