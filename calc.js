/* Petits calculateurs des pages de règles. Mêmes règles que l'app Notes (arrondi au demi-point, x.25 et x.75 vers le haut).
   Chaque bloc .calc[data-calc] est recalculé à chaque saisie. Sans JavaScript, le texte des pages reste complet. */
(function () {
  "use strict";
  function half(x) { return Math.floor(x * 2 + 0.5 + 1e-9) / 2; }
  function num(s) { var t = String(s == null ? "" : s).trim().replace(",", "."); if (!t) return null; var n = Number(t); return isFinite(n) ? n : NaN; }
  function fmt(x) { return Number.isInteger(x) ? String(x) : (Math.round(x * 100) / 100).toString(); }
  function fmt2(x) { return x.toFixed(2); }
  function grade(n) { return n != null && !isNaN(n) && n >= 1 && n <= 6; }
  function list(s) {
    var out = [], bad = false;
    String(s).split(/[\s;]+/).forEach(function (t) { if (!t) return; var n = num(t); if (grade(n)) out.push(n); else bad = true; });
    return { v: out, bad: bad };
  }
  function line(state, html) { return '<li><span class="dot ' + state + '"></span><span>' + html + "</span></li>"; }
  function err(msg) { return '<span>' + msg + "</span>"; }

  var CALCS = {
    groupe: function (f) {
      var k = ["fr", "l2", "l3", "ma", "os"], v = {};
      for (var i = 0; i < k.length; i++) { v[k[i]] = num(f[k[i]].value); if (!grade(v[k[i]])) return err("Entre cinq notes entre 1 et 6."); }
      var lang = half((v.l2 + v.l3) / 2), g = v.fr + lang + v.ma + v.os;
      return "Moyenne L2 et L3 : " + fmt((v.l2 + v.l3) / 2) + ", arrondie à <b>" + fmt(lang) + "</b>.<br>Groupe : " + fmt(v.fr) + " + " + fmt(lang) + " + " + fmt(v.ma) + " + " + fmt(v.os) +
        " = <b>" + fmt(g) + " points</b>" + (g >= 16 ? " : condition remplie (16 au minimum)." : " : il manque " + fmt(16 - g) + " point" + (16 - g > 1 ? "s" : "") + " pour atteindre 16.");
    },
    promo: function (f) {
      var L = list(f.all.value); if (L.bad || L.v.length < 3) return err("Entre tes notes de bulletin entre 1 et 6, séparées par des espaces.");
      var k = ["fr", "l2", "l3", "ma", "os"], v = {};
      for (var i = 0; i < k.length; i++) { v[k[i]] = num(f[k[i]].value); if (!grade(v[k[i]])) return err("Entre aussi les cinq notes du groupe."); }
      var n = L.v.length, tot = L.v.reduce(function (a, b) { return a + b; }, 0), fails = L.v.filter(function (x) { return x < 4; }).length;
      var g = v.fr + half((v.l2 + v.l3) / 2) + v.ma + v.os, ok = tot >= 4 * n && g >= 16 && fails <= 4;
      return '<ul class="chk">' +
        line(tot >= 4 * n ? "ok" : "ko", "Total : <b>" + fmt(tot) + "</b> pour " + n + " notes (minimum " + fmt(4 * n) + ")") +
        line(g >= 16 ? "ok" : "ko", "Groupe : <b>" + fmt(g) + "</b> (minimum 16)") +
        line(fails <= 4 ? "ok" : "ko", "Notes sous 4 : <b>" + fails + "</b> (4 au maximum)") + "</ul>" +
        "<b>" + (ok ? "Les trois conditions sont remplies." : "Au moins une condition n'est pas remplie.") + "</b>";
    },
    moyenne: function (f) {
      var parts = String(f.notes.value).split(/[\s;]+/).filter(Boolean), sw = 0, s = 0;
      for (var i = 0; i < parts.length; i++) {
        var m = parts[i].split(/[x×*]/i), n = num(m[0]), c = m.length > 1 ? num(m[1]) : 1;
        if (!grade(n) || !(c > 0)) return err("Écris tes notes entre 1 et 6, avec un coefficient éventuel : 5×2.");
        s += n * c; sw += c;
      }
      if (!sw) return err("Entre au moins une note.");
      var avg = s / sw, out = "Moyenne exacte : <b>" + fmt2(avg) + "</b> · note de bulletin : <b>" + fmt(half(avg)) + "</b>.";
      var cible = num(f.cible.value), c2 = num(f.coef.value);
      if (grade(cible) && c2 > 0) {
        var need = null;
        for (var x = 1; x <= 6.0001; x += 0.5) if (half((s + x * c2) / (sw + c2)) >= cible) { need = x; break; }
        out += "<br>Pour avoir <b>" + fmt(cible) + "</b> au bulletin, " + (need == null ? "même un 6 au prochain test ne suffirait pas." :
          need <= 1 ? "n'importe quelle note au prochain test suffit." : "il te faut au moins <b>" + fmt(need) + "</b> au prochain test (coefficient " + fmt(c2) + ").");
      }
      return out;
    },
    certificat: function (f) {
      var L = list(f.all.value); if (L.bad || !L.v.length) return err("Entre tes notes de maturité entre 1 et 6.");
      var n = L.v.length, tot = 0, def = 0, fails = 0;
      L.v.forEach(function (x) { tot += x; if (x < 4) { def += 4 - x; fails++; } });
      var score = tot - def, ex = num(f.exams.value), lines =
        line(score >= 56 ? "ok" : "ko", "Total avec double compensation : " + fmt(tot) + " − " + fmt(def) + " = <b>" + fmt(score) + "</b> (minimum 56)") +
        line(fails <= 4 ? "ok" : "ko", "Notes sous 4 : <b>" + fails + "</b> (4 au maximum)");
      if (ex != null && !isNaN(ex)) lines += line(ex >= 38.5 ? "ok" : "ko", "Examens : <b>" + fmt(ex) + "</b> (minimum 38.5)");
      return (n !== 14 ? "<span>Attention : " + n + " notes au lieu de 14.</span>" : "") + '<ul class="chk">' + lines + "</ul>";
    },
    examen: function (f) {
      var na = num(f.na.value), e = num(f.e.value), o = num(f.o.value), oc = f.oc.checked;
      if (!grade(na)) return err("Entre ta note annuelle entre 1 et 6.");
      if (e != null && !grade(e) || o != null && !grade(o)) return err("Les notes d'examen vont de 1 à 6.");
      function fin(w, r) { return oc ? half((na + r) / 2) : half((2 * na + w + r) / 4); }
      if (oc ? o != null : (e != null && o != null)) {
        var fv = fin(e, o);
        return "Note de maturité : " + (oc ? "(" + fmt(na) + " + " + fmt(o) + ") ÷ 2" : "(2 × " + fmt(na) + " + " + fmt(e) + " + " + fmt(o) + ") ÷ 4") + " = <b>" + fmt(fv) + "</b>" + (fv < 4 ? " (insuffisante)." : ".");
      }
      for (var x = 1; x <= 6.0001; x += 0.5) {
        var w = e != null ? e : x, r = o != null ? o : x;
        if (fin(w, r) >= 4) return x <= 1 ? "Tu as 4 dans cette branche quelle que soit la note de l'examen." : "Note minimale à viser" + (oc || e != null || o != null ? "" : " à l'écrit et à l'oral") + " pour avoir 4 : <b>" + fmt(x) + "</b>.";
      }
      return "Même avec 6, la branche resterait sous 4.";
    },
    ecg: function (f) {
      var L = list(f.all.value); if (L.bad || L.v.length < 3) return err("Entre tes notes de bulletin entre 1 et 6, séparées par des espaces.");
      var n = L.v.length, tot = 0, def = 0, fails = 0;
      L.v.forEach(function (x) { tot += x; if (x < 4) { def += 4 - x; fails++; } });
      var ok = tot >= 4 * n && def <= 2 && fails <= 3;
      return '<ul class="chk">' +
        line(tot >= 4 * n ? "ok" : "ko", "Total : <b>" + fmt(tot) + "</b> pour " + n + " notes (minimum " + fmt(4 * n) + ")") +
        line(def <= 2 ? "ok" : "ko", "Écarts sous 4 : <b>" + fmt(def) + "</b> (2 au maximum)") +
        line(fails <= 3 ? "ok" : "ko", "Notes sous 4 : <b>" + fails + "</b> (3 au maximum)") + "</ul>" +
        "<b>" + (ok ? "Les trois conditions sont remplies." : "Au moins une condition n'est pas remplie.") + "</b>";
    },
    bareme: function (f) {
      var p = num(f.pts.value), m = num(f.max.value), s = num(f.pct.value);
      if (!(m > 0) || !(p >= 0) || p > m) return err("Entre des points entre 0 et le maximum.");
      if (!(s >= 10 && s <= 90)) return err("Le pourcentage qui donne 4 va de 10 à 90.");
      var q = s / 100;
      function note(r) { return r <= q ? 1 + 3 * r / q : 4 + 2 * (r - q) / (1 - q); }
      function pts(n) { var r = n <= 4 ? (n - 1) * q / 3 : q + (n - 4) * (1 - q) / 2; return Math.ceil(r * m * 4 - 1e-9) / 4; }
      var r = p / m, n = note(r);
      return fmt(p) + " sur " + fmt(m) + " = " + (Math.round(r * 1000) / 10) + " % → note <b>" + fmt2(n) + "</b> (au dixième : " + (Math.round(n * 10) / 10).toFixed(1) + ", au demi-point : " + fmt(half(n)) + ").<br>" +
        "Points pour 4 : <b>" + fmt(pts(4)) + "</b> · pour 5 : <b>" + fmt(pts(5)) + "</b> · pour 6 : <b>" + fmt(m) + "</b>.";
    },
    ta: function (f) {
      var p = num(f.pts.value), m = num(f.max.value), s = num(f.pct.value);
      if (!(m > 0) || !(p >= 0) || p > m) return err("Entre des points entre 0 et le maximum.");
      if (!(s >= 10 && s <= 90)) return err("Le pourcentage qui donne 4 va de 10 à 90.");
      var r = p / m, q = s / 100, note = r <= q ? 1 + 3 * r / q : 4 + 2 * (r - q) / (1 - q);
      return fmt(p) + " sur " + fmt(m) + " = " + Math.round(r * 100) + " % → " + fmt2(note) + ", arrondi à <b>" + fmt(half(note)) + "</b>.";
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll(".calc[data-calc]"), function (box) {
    var fn = CALCS[box.getAttribute("data-calc")], out = box.querySelector(".out");
    if (!fn || !out) return;
    var f = {};
    Array.prototype.forEach.call(box.querySelectorAll("input[name]"), function (i) { f[i.name] = i; });
    function run() { out.innerHTML = fn(f); }
    box.addEventListener("input", run); box.addEventListener("change", run); run();
  });
})();
