// ---------------------------------------------------------------------------
// art.js - all the vector drawings of CapyCake (no image files):
// ingredients, the capybara chef and its outfits, paws, bowl, baking tins,
// oven, little move pictograms. Everything is drawn around (0, 0).
// ---------------------------------------------------------------------------

export const INK = '#5b3a3a';           // outline colour (warm dark brown)
export const FUR = '#b98a5e';
export const FUR_DARK = '#9a6c45';
export const FUR_LIGHT = '#d2a77c';

// ---- helpers ----------------------------------------------------------------
export function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function fs(g, fill, stroke = INK, lw = 3) {
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

function circle(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
}

function ellipse(g, x, y, rx, ry, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function shine(g, x, y, rx, ry, a = 0.7) {
  g.fillStyle = `rgba(255,255,255,${a})`;
  ellipse(g, x, y, rx, ry, -0.5);
  g.fill();
}

/** tiny kawaii face: two dot eyes and a smile */
function face(g, x, y, s = 1, blush = true) {
  g.fillStyle = INK;
  circle(g, x - 7 * s, y, 2.6 * s);
  g.fill();
  circle(g, x + 7 * s, y, 2.6 * s);
  g.fill();
  g.lineWidth = 2 * s;
  g.strokeStyle = INK;
  g.beginPath();
  g.arc(x, y + 2 * s, 3.5 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  if (blush) {
    g.fillStyle = 'rgba(255,120,150,0.45)';
    ellipse(g, x - 12 * s, y + 4 * s, 3.5 * s, 2.2 * s);
    g.fill();
    ellipse(g, x + 12 * s, y + 4 * s, 3.5 * s, 2.2 * s);
    g.fill();
  }
}

// ---- ingredients ------------------------------------------------------------
/** Draw an ingredient or other belt item, about 70 px tall at s = 1. */
export function drawItem(g, kind, x, y, s = 1, rot = 0) {
  g.save();
  g.translate(x, y);
  if (rot) g.rotate(rot);
  g.scale(s, s);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  (ITEM_ART[kind] ?? ITEM_ART.unknown)(g);
  g.restore();
}

const ITEM_ART = {
  flour(g) {
    g.beginPath();
    g.moveTo(-22, -16);
    g.quadraticCurveTo(-30, 10, -26, 28);
    g.quadraticCurveTo(0, 36, 26, 28);
    g.quadraticCurveTo(30, 10, 22, -16);
    g.quadraticCurveTo(0, -12, -22, -16);
    fs(g, '#f7ead3');
    // gathered top
    g.beginPath();
    g.moveTo(-20, -16);
    g.lineTo(-14, -30);
    g.lineTo(-4, -22);
    g.lineTo(4, -32);
    g.lineTo(12, -22);
    g.lineTo(20, -30);
    g.lineTo(20, -16);
    fs(g, '#efdcbc');
    rr(g, -16, -20, 32, 6, 3);
    fs(g, '#e3a35b', INK, 2);
    // label
    rr(g, -16, 2, 32, 16, 4);
    fs(g, '#8fd3ff', INK, 2);
    g.fillStyle = INK;
    g.font = 'bold 9px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.fillText('FLOUR', 0, 14);
    face(g, 0, -6, 0.75);
  },
  sugar(g) {
    rr(g, -20, -18, 40, 46, 10);
    fs(g, 'rgba(220,240,255,0.9)');
    // cubes
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#c9b8c9';
    g.lineWidth = 1.5;
    for (const [cx, cy] of [[-9, 16], [5, 18], [-2, 6], [10, 6], [-11, 4]]) {
      rr(g, cx - 5, cy - 5, 10, 10, 2);
      g.fill();
      g.stroke();
    }
    rr(g, -23, -28, 46, 13, 6);
    fs(g, '#ff8fbf');
    shine(g, -12, -4, 3, 9, 0.8);
    face(g, 0, -6, 0.7, false);
  },
  egg(g) {
    g.beginPath();
    g.moveTo(0, -30);
    g.bezierCurveTo(22, -30, 26, 6, 24, 12);
    g.bezierCurveTo(22, 30, -22, 30, -24, 12);
    g.bezierCurveTo(-26, 6, -22, -30, 0, -30);
    fs(g, '#fffaf0');
    shine(g, -9, -12, 5, 9);
    face(g, 0, 6, 0.85);
  },
  butter(g) {
    // block in perspective
    g.beginPath();
    g.moveTo(-28, -6);
    g.lineTo(-10, -18);
    g.lineTo(30, -12);
    g.lineTo(14, 0);
    g.closePath();
    fs(g, '#fff0a8');
    g.beginPath();
    g.moveTo(-28, -6);
    g.lineTo(14, 0);
    g.lineTo(14, 22);
    g.lineTo(-28, 16);
    g.closePath();
    fs(g, '#ffe066');
    g.beginPath();
    g.moveTo(14, 0);
    g.lineTo(30, -12);
    g.lineTo(30, 10);
    g.lineTo(14, 22);
    g.closePath();
    fs(g, '#f2c84a');
    // wrapper
    g.beginPath();
    g.moveTo(-4, 3);
    g.lineTo(14, 0);
    g.lineTo(14, 22);
    g.lineTo(-4, 19);
    g.closePath();
    fs(g, '#7ab8ff', INK, 2);
    face(g, -12, 8, 0.7);
  },
  milk(g) {
    rr(g, -18, -12, 36, 42, 4);
    fs(g, '#ffffff');
    g.beginPath();
    g.moveTo(-18, -12);
    g.lineTo(-10, -26);
    g.lineTo(10, -26);
    g.lineTo(18, -12);
    g.closePath();
    fs(g, '#6fb7ff');
    rr(g, -6, -33, 12, 8, 2);
    fs(g, '#6fb7ff', INK, 2);
    // cow spots
    g.fillStyle = '#4a4a5a';
    ellipse(g, 10, 20, 5, 4);
    g.fill();
    ellipse(g, -12, 22, 3, 3);
    g.fill();
    rr(g, -14, -6, 28, 10, 3);
    fs(g, '#6fb7ff', null);
    g.fillStyle = '#ffffff';
    g.font = 'bold 8px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.fillText('MILK', 0, 2);
    face(g, 0, 12, 0.75);
  },
  chocolate(g) {
    g.rotate(-0.15);
    rr(g, -24, -26, 48, 54, 6);
    fs(g, '#7b4a2e');
    g.strokeStyle = '#5e3520';
    g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        rr(g, -19 + j * 20, -21 + i * 14, 18, 12, 3);
        g.stroke();
      }
    }
    // wrapper bottom
    g.beginPath();
    g.moveTo(-24, 8);
    g.lineTo(-18, 2);
    g.lineTo(-10, 8);
    g.lineTo(0, 1);
    g.lineTo(10, 8);
    g.lineTo(18, 2);
    g.lineTo(24, 8);
    g.lineTo(24, 22);
    g.quadraticCurveTo(24, 28, 18, 28);
    g.lineTo(-18, 28);
    g.quadraticCurveTo(-24, 28, -24, 22);
    g.closePath();
    fs(g, '#ff5d73');
    g.fillStyle = '#ffd6de';
    g.font = 'bold 8px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.fillText('CHOCO', 0, 21);
  },
  strawberry(g) {
    g.beginPath();
    g.moveTo(0, 30);
    g.bezierCurveTo(-30, 10, -28, -18, -12, -18);
    g.quadraticCurveTo(0, -22, 12, -18);
    g.bezierCurveTo(28, -18, 30, 10, 0, 30);
    fs(g, '#ff4f6a');
    g.fillStyle = '#ffe9a0';
    for (const [sx, sy] of [[-12, -6], [0, -8], [12, -6], [-8, 6], [6, 6], [-2, 18], [-16, 4], [16, 4]]) {
      ellipse(g, sx, sy, 1.6, 2.4);
      g.fill();
    }
    // leaves
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      g.moveTo(0, -20);
      g.quadraticCurveTo(Math.cos(a) * 10, -20 + Math.sin(a) * 4 - 6, Math.cos(a) * 18, -20 - Math.sin(a) * -6);
    }
    g.lineWidth = 6;
    g.strokeStyle = '#3fae5a';
    g.stroke();
    rr(g, -2, -32, 4, 12, 2);
    fs(g, '#3fae5a', INK, 2);
    shine(g, -10, -6, 3, 6, 0.6);
  },
  cherry(g) {
    g.lineWidth = 3;
    g.strokeStyle = '#4c8a3a';
    g.beginPath();
    g.moveTo(-10, 6);
    g.quadraticCurveTo(-4, -18, 6, -28);
    g.moveTo(12, 10);
    g.quadraticCurveTo(10, -14, 6, -28);
    g.stroke();
    g.beginPath();
    g.moveTo(6, -28);
    g.quadraticCurveTo(22, -34, 24, -20);
    g.quadraticCurveTo(12, -18, 6, -28);
    fs(g, '#6cc35a', INK, 2);
    circle(g, -12, 14, 13);
    fs(g, '#e8233f');
    circle(g, 12, 17, 13);
    fs(g, '#d81b36');
    shine(g, -16, 10, 3, 5);
    shine(g, 8, 13, 3, 5);
  },
  lemon(g) {
    circle(g, 0, 2, 26);
    fs(g, '#ffd83d');
    g.fillStyle = 'rgba(230,160,20,0.35)';
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4;
      const r = 8 + (i % 3) * 6;
      circle(g, Math.cos(a) * r, 2 + Math.sin(a) * r, 1.6);
      g.fill();
    }
    g.beginPath();
    g.moveTo(2, -24);
    g.quadraticCurveTo(20, -36, 26, -22);
    g.quadraticCurveTo(12, -16, 2, -24);
    fs(g, '#5fbf5a', INK, 2);
    shine(g, -10, -8, 4, 7);
    face(g, 0, 6, 0.8);
  },
  honey(g) {
    g.beginPath();
    g.moveTo(-18, -16);
    g.bezierCurveTo(-34, -6, -30, 28, -14, 30);
    g.lineTo(14, 30);
    g.bezierCurveTo(30, 28, 34, -6, 18, -16);
    g.closePath();
    fs(g, '#ffb320');
    rr(g, -20, -26, 40, 12, 5);
    fs(g, '#d8902a');
    // drips
    g.beginPath();
    g.moveTo(-18, -14);
    g.quadraticCurveTo(-12, -4, -8, -12);
    g.quadraticCurveTo(-4, 2, 2, -12);
    g.quadraticCurveTo(8, -6, 18, -14);
    g.closePath();
    fs(g, '#ffd060', null);
    rr(g, -14, 4, 28, 12, 4);
    fs(g, '#fff4d6', INK, 2);
    g.fillStyle = INK;
    g.font = 'bold 8px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.fillText('HONEY', 0, 13);
    face(g, 0, 22, 0.6, false);
  },
  carrot(g) {
    g.rotate(0.6);
    g.beginPath();
    g.moveTo(-10, -16);
    g.quadraticCurveTo(0, -22, 10, -16);
    g.lineTo(2, 30);
    g.quadraticCurveTo(0, 33, -2, 30);
    g.closePath();
    fs(g, '#ff9233');
    g.strokeStyle = '#d96a1a';
    g.lineWidth = 2;
    for (const yy of [-4, 6, 16]) {
      g.beginPath();
      g.moveTo(-6 + yy * 0.12, yy);
      g.lineTo(-1, yy + 2);
      g.stroke();
    }
    g.fillStyle = '#4fb34a';
    for (const a of [-0.5, 0, 0.5]) {
      g.save();
      g.translate(0, -18);
      g.rotate(a);
      ellipse(g, 0, -10, 4, 11);
      fs(g, '#4fb34a', INK, 2);
      g.restore();
    }
  },
  broccoli(g) {
    g.beginPath();
    g.moveTo(-8, 4);
    g.lineTo(-6, 28);
    g.lineTo(6, 28);
    g.lineTo(8, 4);
    fs(g, '#8fd16a');
    for (const [cx, cy, r] of [[-14, -4, 12], [14, -4, 12], [0, -14, 14], [-6, 2, 10], [8, 2, 10]]) {
      circle(g, cx, cy, r);
      fs(g, '#3f9e45');
    }
    g.fillStyle = 'rgba(255,255,255,0.25)';
    circle(g, -4, -18, 4);
    g.fill();
  },
  fish(g) {
    g.beginPath();
    g.moveTo(-26, 0);
    g.quadraticCurveTo(-4, -22, 16, -4);
    g.lineTo(30, -16);
    g.lineTo(28, 14);
    g.lineTo(16, 4);
    g.quadraticCurveTo(-4, 22, -26, 0);
    fs(g, '#7cc4ff');
    g.strokeStyle = '#4d93d6';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(-2, 0, 8, -1, 1);
    g.stroke();
    g.fillStyle = INK;
    circle(g, -16, -3, 2.6);
    g.fill();
  },
  sock(g) {
    g.beginPath();
    g.moveTo(-8, -28);
    g.lineTo(12, -28);
    g.lineTo(12, 6);
    g.quadraticCurveTo(28, 10, 26, 22);
    g.quadraticCurveTo(22, 32, 4, 28);
    g.quadraticCurveTo(-10, 26, -8, 10);
    g.closePath();
    fs(g, '#c7a6ff');
    g.strokeStyle = '#ff8fbf';
    g.lineWidth = 5;
    for (const yy of [-18, -8, 2]) {
      g.beginPath();
      g.moveTo(-7, yy);
      g.lineTo(11, yy);
      g.stroke();
    }
    rr(g, -10, -32, 24, 8, 3);
    fs(g, '#ffffff', INK, 2);
  },
  chili(g) {
    g.beginPath();
    g.moveTo(-6, -18);
    g.bezierCurveTo(12, -18, 16, 4, 8, 20);
    g.quadraticCurveTo(0, 32, -12, 30);
    g.quadraticCurveTo(0, 18, -4, 4);
    g.quadraticCurveTo(-8, -6, -6, -18);
    fs(g, '#ff3b2f');
    rr(g, -10, -26, 10, 10, 3);
    fs(g, '#3fae5a', INK, 2);
    shine(g, 4, -6, 2, 6);
  },
  duck(g) {
    ellipse(g, 0, 12, 26, 16);
    fs(g, '#ffd93b');
    circle(g, -8, -10, 15);
    fs(g, '#ffd93b');
    g.beginPath();
    g.moveTo(-22, -10);
    g.quadraticCurveTo(-34, -8, -26, -2);
    g.quadraticCurveTo(-20, -4, -20, -6);
    fs(g, '#ff8a2a', INK, 2);
    g.fillStyle = INK;
    circle(g, -11, -13, 2.6);
    g.fill();
    g.beginPath();
    g.moveTo(4, 8);
    g.quadraticCurveTo(14, 2, 20, 10);
    g.lineWidth = 2;
    g.strokeStyle = '#e0b21a';
    g.stroke();
  },
  orange(g) {
    circle(g, 0, 2, 25);
    fs(g, '#ffa13a');
    g.fillStyle = 'rgba(200,100,0,0.25)';
    for (let i = 0; i < 12; i++) {
      const a = i * 2.2;
      circle(g, Math.cos(a) * (6 + (i % 3) * 6), 2 + Math.sin(a) * (6 + (i % 3) * 6), 1.4);
      g.fill();
    }
    g.beginPath();
    g.moveTo(0, -22);
    g.quadraticCurveTo(-18, -34, -22, -20);
    g.quadraticCurveTo(-8, -16, 0, -22);
    fs(g, '#4fb34a', INK, 2);
    rr(g, -2, -26, 4, 6, 2);
    fs(g, '#7a5232', null);
    shine(g, -10, -8, 4, 7);
  },
  unknown(g) {
    circle(g, 0, 0, 24);
    fs(g, '#dddddd');
  },
};

// ---- the capybara chef -------------------------------------------------------
/**
 * opts: { hat, apron: {color, dark}, mood: idle|happy|oops|wow|nom|spicy,
 *         t (time, s), orange (bool), wave (0..1 arm wave), noBody }
 * (x, y) = centre of the head. s = scale (1 = head ~170 px wide).
 */
export function drawCapy(g, x, y, s, opts = {}) {
  const t = opts.t ?? 0;
  const mood = opts.mood ?? 'idle';
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const apron = opts.apron ?? { color: '#ff8fbf', dark: '#e2669f' };

  // body + apron
  if (!opts.noBody) {
    ellipse(g, 0, 150, 118, 100);
    fs(g, FUR, INK, 4);
    // apron bib
    g.beginPath();
    g.moveTo(-50, 80);
    g.lineTo(50, 80);
    g.quadraticCurveTo(58, 150, 70, 240);
    g.lineTo(-70, 240);
    g.quadraticCurveTo(-58, 150, -50, 80);
    fs(g, apron.color, INK, 4);
    // straps
    g.lineWidth = 8;
    g.strokeStyle = apron.dark;
    g.beginPath();
    g.moveTo(-44, 82);
    g.lineTo(-58, 58);
    g.moveTo(44, 82);
    g.lineTo(58, 58);
    g.stroke();
    // heart pocket
    g.save();
    g.translate(0, 120);
    g.beginPath();
    g.moveTo(0, 14);
    g.bezierCurveTo(-26, -2, -14, -20, 0, -8);
    g.bezierCurveTo(14, -20, 26, -2, 0, 14);
    fs(g, '#ffffff', INK, 3);
    g.restore();
    // little arms (waving on the title screen)
    const wave = opts.wave ?? 0;
    if (opts.arms) {
      const armA = -0.4 - Math.sin(t * 8) * 0.5 * wave;
      g.save();
      g.translate(96, 110);
      g.rotate(armA - 0.9 * wave);
      ellipse(g, 26, 0, 34, 20);
      fs(g, FUR, INK, 4);
      circle(g, 54, 0, 17);
      fs(g, FUR_LIGHT, INK, 3);
      g.restore();
      g.save();
      g.translate(-96, 110);
      g.rotate(0.4);
      ellipse(g, -26, 0, 34, 20);
      fs(g, FUR, INK, 4);
      circle(g, -54, 0, 17);
      fs(g, FUR_LIGHT, INK, 3);
      g.restore();
    }
  }

  const bob = Math.sin(t * 2.2) * 2;
  g.translate(0, bob);

  // ears: tiny, on top of the head
  for (const sx of [-1, 1]) {
    ellipse(g, sx * 52, -80, 15, 12, sx * 0.25);
    fs(g, FUR_DARK, INK, 4);
    ellipse(g, sx * 52, -78, 7, 5, sx * 0.25);
    fs(g, '#7a4f33', null);
  }
  // head: a rounded box, like a real capybara
  const spicy = mood === 'spicy';
  rr(g, -86, -82, 172, 164, [56, 56, 62, 62]);
  fs(g, spicy ? '#e0785a' : FUR, INK, 4);
  // fur tuft on top
  g.fillStyle = FUR_DARK;
  g.beginPath();
  g.moveTo(-16, -81);
  g.quadraticCurveTo(-8, -96, 0, -82);
  g.quadraticCurveTo(8, -98, 16, -81);
  g.closePath();
  g.fill();
  // long boxy muzzle
  rr(g, -60, -4, 120, 80, [30, 30, 46, 46]);
  fs(g, spicy ? '#d8684a' : '#a87a52', null);
  // nose: wide and flat with two nostrils
  rr(g, -30, 6, 60, 20, 10);
  fs(g, '#4a2f22', null);
  g.fillStyle = '#2d1b13';
  ellipse(g, -14, 17, 5, 3.5, 0.4);
  g.fill();
  ellipse(g, 14, 17, 5, 3.5, -0.4);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.25)';
  ellipse(g, -8, 10, 8, 2.5);
  g.fill();
  // mouth
  g.lineWidth = 3.5;
  g.strokeStyle = INK;
  if (mood === 'nom') {
    const open = Math.abs(Math.sin(t * 14)) * 6;
    ellipse(g, 0, 52, 8, 3 + open);
    fs(g, '#8a3a3a', INK, 3);
  } else if (mood === 'oops' || mood === 'spicy') {
    g.beginPath();
    g.moveTo(-10, 54);
    g.quadraticCurveTo(-5, 49, 0, 54);
    g.quadraticCurveTo(5, 59, 10, 54);
    g.stroke();
  } else if (mood === 'wow' || mood === 'happy') {
    g.beginPath();
    g.moveTo(-12, 47);
    g.quadraticCurveTo(0, 64, 12, 47);
    g.closePath();
    fs(g, '#ff8a9a', INK, 3);
  } else {
    g.beginPath();
    g.moveTo(-12, 48);
    g.quadraticCurveTo(-6, 55, 0, 48);
    g.quadraticCurveTo(6, 55, 12, 48);
    g.stroke();
  }
  // cheeks
  g.fillStyle = 'rgba(255,120,150,0.5)';
  ellipse(g, -68, 4, 12, 7);
  g.fill();
  ellipse(g, 68, 4, 12, 7);
  g.fill();
  // eyes
  const blink = (t % 3.7) < 0.12;
  for (const sx of [-1, 1]) {
    const ex = sx * 42;
    const ey = -32;
    g.lineWidth = 4;
    g.strokeStyle = INK;
    if (mood === 'happy' || mood === 'nom') {
      g.beginPath();
      g.arc(ex, ey + 4, 9, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    } else if (mood === 'oops' || mood === 'spicy') {
      g.beginPath();
      g.moveTo(ex - 8 * sx, ey - 7);
      g.lineTo(ex + 6 * sx, ey);
      g.lineTo(ex - 8 * sx, ey + 7);
      g.stroke();
    } else if (mood === 'wow') {
      g.fillStyle = '#2d1b13';
      circle(g, ex, ey, 11);
      g.fill();
      g.fillStyle = '#ffffff';
      starPath(g, ex + 1, ey - 1, 7);
      g.fill();
    } else if (blink) {
      g.beginPath();
      g.moveTo(ex - 8, ey);
      g.lineTo(ex + 8, ey);
      g.stroke();
    } else {
      g.fillStyle = '#2d1b13';
      ellipse(g, ex, ey, 7, 8.5);
      g.fill();
      g.fillStyle = '#ffffff';
      circle(g, ex + 2.5, ey - 3, 2.8);
      g.fill();
    }
  }
  if (mood === 'oops') {
    // sweat drop
    g.beginPath();
    g.moveTo(78, -40);
    g.quadraticCurveTo(90, -20, 78, -14);
    g.quadraticCurveTo(66, -20, 78, -40);
    fs(g, '#8fd3ff', INK, 2);
  }
  if (spicy) {
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 4;
    for (const sx of [-1, 1]) {
      g.beginPath();
      const p = (t * 3) % 1;
      g.moveTo(sx * 90, -40 - p * 30);
      g.quadraticCurveTo(sx * 100, -55 - p * 30, sx * 92, -70 - p * 30);
      g.stroke();
    }
  }

  drawHat(g, opts.hat ?? 'none', t);
  if (opts.orange) {
    const hy = { chef: -170, party: -175, strawberry: -140, crown: -135, yuzu: -150 }[opts.hat] ?? -105;
    drawItem(g, 'orange', 0, hy, 0.95, 0);
  }
  g.restore();
}

function starPath(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr2 = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
  }
  g.closePath();
}

export function drawHat(g, hat, t = 0) {
  g.save();
  switch (hat) {
    case 'chef': {
      for (const [cx, cy, r] of [[-38, -122, 30], [38, -122, 30], [0, -138, 38]]) {
        circle(g, cx, cy, r);
        fs(g, '#ffffff', INK, 4);
      }
      circle(g, 0, -118, 30);
      fs(g, '#ffffff', null);
      rr(g, -56, -104, 112, 30, 10);
      fs(g, '#ffffff', INK, 4);
      g.strokeStyle = '#e8dcd8';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-20, -100);
      g.lineTo(-20, -80);
      g.moveTo(20, -100);
      g.lineTo(20, -80);
      g.stroke();
      break;
    }
    case 'bow': {
      g.translate(40, -78);
      g.rotate(0.25);
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(sx * 30, -36, sx * 42, -8);
        g.quadraticCurveTo(sx * 44, 18, 0, 0);
        fs(g, '#ff6fae', INK, 4);
      }
      circle(g, 0, -2, 10);
      fs(g, '#ff8fc4', INK, 4);
      g.fillStyle = '#ffffff';
      circle(g, -22, -14, 3);
      g.fill();
      circle(g, 26, -10, 3);
      g.fill();
      break;
    }
    case 'flowers': {
      const cols = ['#ff8fbf', '#ffe066', '#8fd3ff', '#c4a6ff', '#ff9a6b'];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.15 + i * 0.175);
        const fx = Math.cos(a) * 78;
        const fy = Math.sin(a) * 30 - 72;
        g.fillStyle = cols[i];
        for (let k = 0; k < 5; k++) {
          const b = (k / 5) * Math.PI * 2 + t * 0.5;
          circle(g, fx + Math.cos(b) * 9, fy + Math.sin(b) * 9, 7);
          fs(g, cols[i], INK, 2);
        }
        circle(g, fx, fy, 5);
        fs(g, '#fff6b0', INK, 2);
      }
      break;
    }
    case 'strawberry': {
      g.beginPath();
      g.moveTo(-74, -66);
      g.quadraticCurveTo(-70, -150, 0, -150);
      g.quadraticCurveTo(70, -150, 74, -66);
      g.quadraticCurveTo(0, -84, -74, -66);
      fs(g, '#ff4f6a', INK, 4);
      g.fillStyle = '#ffe9a0';
      for (const [sx, sy] of [[-40, -100], [-10, -120], [24, -110], [46, -88], [-52, -82], [6, -94], [-26, -130]]) {
        ellipse(g, sx, sy, 3, 4.5);
        g.fill();
      }
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.1 + i * 0.2);
        g.beginPath();
        g.moveTo(0, -148);
        g.quadraticCurveTo(Math.cos(a) * 20, -150 + Math.sin(a) * 18, Math.cos(a) * 32, -146 + Math.sin(a) * 14);
        g.lineWidth = 9;
        g.strokeStyle = '#3fae5a';
        g.stroke();
      }
      rr(g, -4, -170, 8, 20, 4);
      fs(g, '#3fae5a', INK, 3);
      break;
    }
    case 'party': {
      g.translate(-10, -80);
      g.rotate(-0.18);
      g.beginPath();
      g.moveTo(-40, 0);
      g.lineTo(0, -95);
      g.lineTo(40, 0);
      g.quadraticCurveTo(0, 10, -40, 0);
      fs(g, '#8fd3ff', INK, 4);
      g.save();
      g.clip();
      g.strokeStyle = '#ff8fbf';
      g.lineWidth = 10;
      for (let k = -100; k < 20; k += 26) {
        g.beginPath();
        g.moveTo(-50, k);
        g.lineTo(50, k + 30);
        g.stroke();
      }
      g.restore();
      g.beginPath();
      g.moveTo(-40, 0);
      g.lineTo(0, -95);
      g.lineTo(40, 0);
      fs(g, null, INK, 4);
      circle(g, 0, -98, 12);
      fs(g, '#ffe066', INK, 3);
      break;
    }
    case 'yuzu': {
      drawItem(g, 'lemon', 0, -100, 1.15, 0);
      break;
    }
    case 'crown': {
      g.beginPath();
      g.moveTo(-50, -72);
      g.lineTo(-56, -126);
      g.lineTo(-28, -100);
      g.lineTo(0, -136);
      g.lineTo(28, -100);
      g.lineTo(56, -126);
      g.lineTo(50, -72);
      g.quadraticCurveTo(0, -84, -50, -72);
      fs(g, '#ffd23d', INK, 4);
      for (const [cx, cy, c] of [[-30, -84, '#ff5d73'], [0, -88, '#58c7ff'], [30, -84, '#7ce08a']]) {
        circle(g, cx, cy, 6);
        fs(g, c, INK, 2);
      }
      for (const [cx, cy] of [[-56, -126], [0, -136], [56, -126]]) {
        circle(g, cx, cy, 6);
        fs(g, '#fff3b0', INK, 2);
      }
      break;
    }
    default:
      break;
  }
  g.restore();
}

// ---- paws (the player's hands) -------------------------------------------------
export function drawPaw(g, x, y, fist, cuff = '#ff8fbf', s = 1, flip = false) {
  g.save();
  g.translate(x, y);
  g.scale(flip ? -s : s, s);
  g.lineJoin = 'round';
  // cuff / sleeve
  rr(g, -20, 22, 40, 18, 8);
  fs(g, cuff, INK, 3);
  if (fist) {
    rr(g, -26, -22, 52, 48, 20);
    fs(g, FUR_LIGHT, INK, 4);
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    for (const fx of [-9, 4]) {
      g.moveTo(fx, -22);
      g.quadraticCurveTo(fx + 2, -12, fx, -4);
    }
    g.stroke();
    ellipse(g, 0, 10, 12, 8);
    fs(g, '#f3a3b5', null);
  } else {
    // palm
    ellipse(g, 0, 4, 28, 26);
    fs(g, FUR_LIGHT, INK, 4);
    // toes
    for (const [tx, ty] of [[-22, -20], [-8, -30], [8, -30], [22, -20]]) {
      ellipse(g, tx, ty, 9, 10);
      fs(g, FUR_LIGHT, INK, 3);
      ellipse(g, tx, ty + 1, 4.5, 5);
      fs(g, '#f3a3b5', null);
    }
    // big pad
    g.beginPath();
    g.moveTo(0, -4);
    g.bezierCurveTo(16, -6, 16, 14, 0, 14);
    g.bezierCurveTo(-16, 14, -16, -6, 0, -4);
    fs(g, '#f3a3b5', null);
  }
  g.restore();
}

// ---- bowl ---------------------------------------------------------------------
export function drawBowlBack(g, x, y, tilt = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  ellipse(g, 0, -40, 100, 22);
  fs(g, '#e9f8ff', INK, 4);
  g.restore();
}

/** contents: list of kinds, mixed 0..1, batter colour */
export function drawBowlContents(g, x, y, contents, mixed, batter, t, tilt = 0) {
  if (!contents.length) return;
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  const level = Math.min(1, contents.length / 5);
  ellipse(g, 0, -40 + 8 * (1 - level), 88, 17);
  g.fillStyle = batter;
  g.fill();
  g.save();
  g.clip();
  // unmixed ingredients show as blobs, mixed batter as a swirl
  const blobs = Math.round((1 - mixed) * 10);
  contents.forEach((k, i) => {
    const c = CONTENT_COL[k] ?? '#ffffff';
    for (let j = 0; j < Math.max(1, Math.round(blobs / 3)); j++) {
      const a = i * 2.3 + j * 1.7;
      g.fillStyle = c;
      ellipse(g, Math.cos(a) * 50, -40 + Math.sin(a) * 9, 16, 6);
      g.fill();
    }
  });
  if (mixed > 0.05) {
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = 3;
    g.beginPath();
    for (let k = 0; k < 40; k++) {
      const a = k * 0.35 + t * 2 * mixed;
      const r = k * 1.8;
      g.lineTo(Math.cos(a) * r, -40 + Math.sin(a) * r * 0.2);
    }
    g.stroke();
  }
  g.restore();
  g.restore();
}

const CONTENT_COL = {
  flour: '#ffffff', sugar: '#ffe6f0', egg: '#ffd23d', butter: '#ffe066', milk: '#fffdf8',
  chocolate: '#7b4a2e', strawberry: '#ff6f86', cherry: '#e8233f', lemon: '#ffe14d', honey: '#ffb320',
};

export function drawBowlFront(g, x, y, tilt = 0, wobble = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt + Math.sin(wobble * 20) * wobble * 0.06);
  g.beginPath();
  g.moveTo(-100, -40);
  g.quadraticCurveTo(-96, 40, 0, 44);
  g.quadraticCurveTo(96, 40, 100, -40);
  g.ellipse(0, -40, 100, 22, 0, 0, Math.PI, false);
  g.closePath();
  const grd = g.createLinearGradient(0, -40, 0, 44);
  grd.addColorStop(0, '#9fe0ff');
  grd.addColorStop(1, '#6fc3f0');
  fs(g, grd, INK, 4);
  // stripe + hearts
  g.strokeStyle = '#ffffff';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-94, -6);
  g.quadraticCurveTo(0, 22, 94, -6);
  g.stroke();
  g.fillStyle = '#ff8fbf';
  for (const hx of [-50, 0, 50]) {
    heart(g, hx, 14 + (hx === 0 ? 4 : 0), 7);
    g.fill();
  }
  shine(g, -70, -12, 6, 14, 0.5);
  // foot
  rr(g, -36, 40, 72, 10, 5);
  fs(g, '#6fc3f0', INK, 3);
  g.restore();
}

export function heart(g, x, y, r) {
  g.beginPath();
  g.moveTo(x, y + r);
  g.bezierCurveTo(x - r * 2, y - r * 0.2, x - r, y - r * 1.6, x, y - r * 0.5);
  g.bezierCurveTo(x + r, y - r * 1.6, x + r * 2, y - r * 0.2, x, y + r);
}

export function drawEggOnRim(g, x, y, crackT) {
  drawItem(g, 'egg', x + 64, y - 62, 0.8, 0.5);
  if (crackT > 0) {
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 54, y - 66);
    g.lineTo(x + 60, y - 60);
    g.lineTo(x + 56, y - 54);
    g.stroke();
  }
}

export function drawWhisk(g, x, y, t, shake = 0, s = 1) {
  g.save();
  g.translate(x + Math.sin(t * 30) * shake * 6, y + 30 * s);
  g.scale(s, s);
  g.rotate(0.2);
  rr(g, -5, -60, 10, 34, 5);
  fs(g, '#ff8fbf', INK, 3);
  for (const [col, lw] of [[INK, 6], ['#e3e8f2', 3]]) {
    g.strokeStyle = col;
    g.lineWidth = lw;
    for (const w of [8, 15, 22]) {
      g.beginPath();
      g.moveTo(0, -28);
      g.bezierCurveTo(-w, 0, -w, 30, 0, 36);
      g.bezierCurveTo(w, 30, w, 0, 0, -28);
      g.stroke();
    }
  }
  g.restore();
}

export function drawSpoon(g, x, y, s = 1) {
  g.save();
  g.translate(x, y + 20 * s);
  g.scale(s, s);
  g.rotate(-0.4);
  rr(g, -5, -60, 10, 60, 5);
  fs(g, '#e8b878', INK, 3);
  ellipse(g, 0, 10, 14, 20);
  fs(g, '#e8b878', INK, 3);
  g.restore();
}

export function drawPipingBag(g, x, y, color) {
  g.save();
  g.translate(x, y + 10);
  g.rotate(0.3);
  g.beginPath();
  g.moveTo(-18, -50);
  g.lineTo(18, -50);
  g.lineTo(3, 20);
  g.lineTo(-3, 20);
  g.closePath();
  fs(g, '#ffffff', INK, 3);
  g.beginPath();
  g.moveTo(-12, -20);
  g.lineTo(12, -20);
  g.lineTo(3, 20);
  g.lineTo(-3, 20);
  g.closePath();
  fs(g, color, null);
  g.restore();
}

export function drawShaker(g, x, y) {
  g.save();
  g.translate(x, y + 10);
  rr(g, -14, -30, 28, 44, 8);
  fs(g, '#ffe066', INK, 3);
  rr(g, -16, -40, 32, 14, 6);
  fs(g, '#ff8fbf', INK, 3);
  g.fillStyle = INK;
  for (const dx of [-6, 0, 6]) {
    circle(g, dx, -33, 1.6);
    g.fill();
  }
  g.restore();
}

// ---- baking tins and baked goods ------------------------------------------------------
const BAKED = { raw: '#f3dfa8', perfect: '#e3a24f', dark: '#b8743a', burnt: '#4f3326' };

/**
 * tin: { type, filled 0..1, baked: null|'raw'|..., frost 0..1, sprinkles, toppings, batter }
 */
export function drawTin(g, x, y, tin, frostColor = '#ffb3d1', t = 0) {
  g.save();
  g.translate(x, y);
  g.lineJoin = 'round';
  if (tin.type === 'cupcake') drawCupcakeTray(g, tin, frostColor, t);
  else if (tin.type === 'cookie') drawCookieTray(g, tin);
  else drawCakeTin(g, tin, frostColor);
  // sprinkles and toppings on top
  if (tin.baked) {
    const topY = tin.type === 'cake' ? -78 : tin.type === 'cupcake' ? -46 : -16;
    for (const sp of tin.sprinkles) {
      g.save();
      g.translate(sp.dx * (tin.type === 'cake' ? 0.8 : 1), topY + sp.dy * 0.6);
      g.rotate(sp.a);
      g.fillStyle = sp.c;
      rr(g, -5, -1.5, 10, 3, 1.5);
      g.fill();
      g.restore();
    }
    tin.toppings.forEach((k, i) => {
      const n = tin.toppings.length;
      const tx = (i - (n - 1) / 2) * 34;
      drawItem(g, k, tx, topY - 18, 0.6, 0);
    });
  }
  g.restore();
}

function drawCupcakeTray(g, tin, frostColor, t) {
  rr(g, -105, 0, 210, 18, 8);
  fs(g, '#c9cfe0', INK, 4);
  for (let i = 0; i < 3; i++) {
    const cx = (i - 1) * 66;
    // dome (batter / baked)
    if (tin.filled > 0 || tin.baked) {
      const rise = tin.baked ? 1 : tin.filled * 0.4;
      const col = tin.baked ? BAKED[tin.baked] : tin.batter;
      ellipse(g, cx, -14 - rise * 10, 30, 8 + rise * 16);
      fs(g, col, INK, 3);
      if (tin.baked === 'burnt') {
        g.fillStyle = 'rgba(30,20,20,0.5)';
        ellipse(g, cx - 6, -26, 6, 3);
        g.fill();
      }
    }
    // paper cup
    g.beginPath();
    g.moveTo(cx - 30, -16);
    g.lineTo(cx + 30, -16);
    g.lineTo(cx + 22, 8);
    g.lineTo(cx - 22, 8);
    g.closePath();
    fs(g, '#ffb3d1', INK, 3);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.moveTo(cx + k * 11, -14);
      g.lineTo(cx + k * 8.5, 6);
      g.stroke();
    }
    // frosting swirl
    if (tin.baked && tin.frost > 0) {
      const f = tin.frost;
      for (let k = 0; k < 3; k++) {
        if (f < k / 3) break;
        const kk = Math.min(1, (f - k / 3) * 3);
        ellipse(g, cx, -34 - k * 11, (24 - k * 7) * kk, 8 * kk);
        fs(g, frostColor, INK, 3);
      }
      if (f >= 1) {
        circle(g, cx, -66, 4);
        fs(g, frostColor, INK, 2);
      }
    }
  }
}

function drawCookieTray(g, tin) {
  rr(g, -110, -4, 220, 16, 6);
  fs(g, '#c9cfe0', INK, 4);
  const spots = [[-75, -12], [-25, -14], [25, -12], [75, -14], [-50, -30], [0, -32], [50, -30]];
  if (!(tin.filled > 0 || tin.baked)) return;
  const n = tin.baked ? spots.length : Math.ceil(tin.filled * spots.length);
  for (let i = 0; i < n; i++) {
    const [cx, cy] = spots[i];
    if (tin.baked) {
      ellipse(g, cx, cy, 24, 11);
      fs(g, BAKED[tin.baked], INK, 3);
      g.fillStyle = '#5e3520';
      for (const [dx, dy] of [[-8, -2], [6, -4], [0, 4], [10, 3]]) {
        circle(g, cx + dx, cy + dy, 2.6);
        g.fill();
      }
    } else {
      ellipse(g, cx, cy - 4, 16, 11);
      fs(g, tin.batter, INK, 3);
    }
  }
}

function drawCakeTin(g, tin, frostColor) {
  // baked cake on a plate, or the round tin with batter
  if (tin.baked) {
    ellipse(g, 0, 12, 110, 16);
    fs(g, '#ffffff', INK, 4);
    const col = BAKED[tin.baked];
    g.beginPath();
    g.moveTo(-86, -64);
    g.lineTo(-86, 0);
    g.ellipse(0, 0, 86, 18, 0, Math.PI, 0, true);
    g.lineTo(86, -64);
    g.closePath();
    fs(g, col, INK, 4);
    // cream layer
    g.strokeStyle = '#fff4e6';
    g.lineWidth = 6;
    g.beginPath();
    g.ellipse(0, -30, 86, 18, 0, 0, Math.PI);
    g.stroke();
    ellipse(g, 0, -64, 86, 18);
    fs(g, col, INK, 4);
    if (tin.frost > 0) {
      const f = tin.frost;
      g.save();
      g.beginPath();
      g.ellipse(0, -64, 88, 20, 0, 0, Math.PI * 2);
      g.fillStyle = frostColor;
      g.globalAlpha = Math.min(1, f * 1.5);
      g.fill();
      // drips
      if (f > 0.5) {
        g.beginPath();
        for (let k = 0; k <= 8; k++) {
          const a = Math.PI - (k / 8) * Math.PI;
          const px = Math.cos(a) * 88;
          const py = -64 + Math.sin(a) * 20;
          g.lineTo(px, py + (k % 2 ? 14 * (f - 0.5) * 2 : 2));
        }
        g.lineTo(88, -64);
        g.closePath();
        g.fill();
      }
      g.globalAlpha = 1;
      g.restore();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.beginPath();
      g.ellipse(0, -64, 88, 20, 0, 0, Math.PI * 2);
      g.stroke();
    }
    return;
  }
  // round tin
  ellipse(g, 0, -40, 96, 18);
  fs(g, '#b9c1d6', INK, 4);
  if (tin.filled > 0) {
    ellipse(g, 0, -40 + 22 * (1 - tin.filled) * 0.5, 88 * (0.4 + 0.6 * tin.filled), 15 * (0.4 + 0.6 * tin.filled));
    fs(g, tin.batter, null);
  }
  g.beginPath();
  g.moveTo(-96, -40);
  g.lineTo(-96, 0);
  g.ellipse(0, 0, 96, 18, 0, Math.PI, 0, true);
  g.lineTo(96, -40);
  g.ellipse(0, -40, 96, 18, 0, 0, Math.PI, false);
  g.closePath();
  fs(g, '#d7dcea', INK, 4);
  shine(g, -70, -14, 5, 12, 0.6);
}

// ---- move pictograms (recipe bar + hints) ------------------------------------------------
export function drawMoveIcon(g, type, x, y, s = 1, t = 0, col = INK) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 4;
  switch (type) {
    case 'crack': {
      // two paws meeting with a cracked egg
      drawItem(g, 'egg', 0, 4, 0.55, 0);
      g.strokeStyle = INK;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(-10, 2);
      g.lineTo(-4, 8);
      g.lineTo(2, 0);
      g.lineTo(8, 8);
      g.lineTo(12, 2);
      g.stroke();
      g.strokeStyle = col;
      g.lineWidth = 4;
      const k = Math.abs(Math.sin(t * 4)) * 6;
      arrow(g, -34 - k, -14, -18 - k, -6);
      arrow(g, 34 + k, -14, 18 + k, -6);
      break;
    }
    case 'whisk':
      drawWhisk(g, 0, -18, t, 0.5);
      g.strokeStyle = col;
      arrow(g, -10, 26, -32, 26);
      arrow(g, 10, 26, 32, 26);
      break;
    case 'sprinkle':
      drawShaker(g, Math.sin(t * 12) * 6, -8);
      g.strokeStyle = col;
      arrow(g, -12, 26, -32, 26);
      arrow(g, 12, 26, 32, 26);
      break;
    case 'stir':
    case 'frost': {
      if (type === 'stir') drawSpoon(g, 0, -12); else drawPipingBag(g, 0, -10, '#ffb3d1');
      g.strokeStyle = col;
      g.lineWidth = 4;
      g.beginPath();
      g.ellipse(0, 18, 26, 10, 0, 0.3, Math.PI * 1.8);
      g.stroke();
      const a = Math.PI * 1.8;
      arrowHead(g, Math.cos(a) * 26, 18 + Math.sin(a) * 10, 1.2);
      break;
    }
    case 'pour': {
      g.save();
      g.translate(-6, -6);
      g.rotate(-0.6);
      g.scale(0.32, 0.32);
      drawBowlFront(g, 0, 0, 0, 0);
      g.restore();
      g.fillStyle = '#f3dfa8';
      rr(g, 10, 2, 7, 22, 3);
      g.fill();
      rr(g, -4, 22, 40, 10, 4);
      fs(g, '#c9cfe0', INK, 2.5);
      break;
    }
    case 'bake': {
      rr(g, -26, -24, 52, 46, 8);
      fs(g, '#ff9eb8', INK, 3);
      rr(g, -18, -10, 36, 24, 5);
      fs(g, '#5a3a4a', INK, 2);
      g.fillStyle = `rgba(255,150,60,${0.5 + Math.sin(t * 5) * 0.3})`;
      rr(g, -15, -7, 30, 18, 4);
      g.fill();
      for (const kx of [-14, 0, 14]) {
        circle(g, kx, -18, 3);
        fs(g, '#ffe066', INK, 1.5);
      }
      break;
    }
    case 'grab': {
      drawPaw(g, 0, 0, Math.sin(t * 4) > 0, '#ff8fbf', 0.6);
      break;
    }
    default:
      break;
  }
  g.restore();
}

export function arrow(g, x1, y1, x2, y2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.beginPath();
  g.moveTo(x2, y2);
  g.lineTo(x2 - Math.cos(a - 0.6) * 9, y2 - Math.sin(a - 0.6) * 9);
  g.moveTo(x2, y2);
  g.lineTo(x2 - Math.cos(a + 0.6) * 9, y2 - Math.sin(a + 0.6) * 9);
  g.stroke();
}

function arrowHead(g, x, y, a) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - Math.cos(a - 0.6) * 10, y - Math.sin(a - 0.6) * 10);
  g.moveTo(x, y);
  g.lineTo(x - Math.cos(a + 0.6) * 10, y - Math.sin(a + 0.6) * 10);
  g.stroke();
}
