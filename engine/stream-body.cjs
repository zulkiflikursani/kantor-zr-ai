/*
 * ZR ENGINE — STREAM BODY (engine/stream-body.cjs)
 *
 * Model membalas JSON ({"body":"..."}); kalau delta mentah dikirim ke UI,
 * yang terlihat justru kurung kurawal dan escape. Ekstraktor ini membaca
 * string JSON secara inkremental, termasuk escape yang terpotong antar chunk,
 * sehingga yang mengalir ke layar adalah isi analisis yang sebenarnya.
 */
const ESCAPES = { n: "\n", t: "\t", r: "\r", '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f" };

class BodyExtractor {
  constructor(key = "body") {
    this.pattern = new RegExp('"' + key + '"\\s*:\\s*"');
    this.buf = "";
    this.started = false;
    this.done = false;
    this.escape = false;
  }

  push(chunk) {
    if (this.done) return "";
    this.buf += String(chunk || "");
    let out = "";

    if (!this.started) {
      const m = this.buf.match(this.pattern);
      if (!m) {
        // jaga memori: kunci "body" muncul di awal, tapi respons bisa bertele-tele
        if (this.buf.length > 8000) this.buf = this.buf.slice(-2000);
        return "";
      }
      this.buf = this.buf.slice(m.index + m[0].length);
      this.started = true;
    }

    let i = 0;
    while (i < this.buf.length) {
      const c = this.buf[i];
      if (this.escape) {
        if (c === "u") {
          if (this.buf.length < i + 5) break; // tunggu 4 digit hex
          const code = parseInt(this.buf.slice(i + 1, i + 5), 16);
          if (Number.isFinite(code)) out += String.fromCharCode(code);
          i += 5;
          this.escape = false;
          continue;
        }
        out += ESCAPES[c] !== undefined ? ESCAPES[c] : c;
        this.escape = false;
        i += 1;
        continue;
      }
      if (c === "\\") { this.escape = true; i += 1; continue; }
      if (c === '"') { this.done = true; i += 1; break; }
      out += c;
      i += 1;
    }

    this.buf = this.buf.slice(i);
    return out;
  }
}

module.exports = { BodyExtractor };
