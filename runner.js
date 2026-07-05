(function () {
  'use strict';

  const C = {
    skyTop: '#7EB3D4',
    skyMid: '#C4DFEF',
    skyBottom: '#F2DCC4',
    skyWarm: '#F8E8C8',
    hillFar: '#9AAD88',
    hillFarShadow: '#7E9470',
    hillMid: '#7A9168',
    hillMidLight: '#95AA7E',
    hillNear: '#C8B48E',
    hillNearShadow: '#A89572',
    ground: '#DFCFAE',
    groundLight: '#EBDDBE',
    groundDark: '#BFA882',
    cypress: '#2F4230',
    cypressLight: '#4A6248',
    groomSuit: '#2E5F7A',
    groomSuitDark: '#1E4A62',
    groomSkin: '#F5D8C8',
    groomSkinShadow: '#E8C8B0',
    brideDress: '#FAFAFA',
    brideDressShadow: '#E8E4E0',
    brideHair: '#baa087',
    brideHairLight: '#ceb59a',
    lemon: '#F5D547',
    lemonDark: '#D4B030',
    white: '#FFFFFF',
    blue: '#4A7C9B',
    pink: '#E8A0B0',
    pinkSoft: '#F5D0DA',
    wine: '#6B3A5C',
    green: '#6B8E4E',
    altarGold: '#C9A84C',
  };

  function initCountdownRunner(canvas) {
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;
    let groundY = 0;
    let frame = 0;
    let scroll = 0;
    let phase = 'run'; // run | escape | married
    let frozenScroll = 0;
    let textAlpha = 0;

    const couple = {
      x: 0,
      y: 0,
      runPhase: 0,
    };

    const clouds = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(rect.width, 280);
      h = Math.max(rect.height, 120);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      groundY = h * 0.78;
      couple.x = w * 0.2;
    }

    function seedScenery() {
      clouds.length = 0;
      for (let i = 0; i < 6; i++) {
        clouds.push({
          x: (w / 6) * i + Math.random() * 50,
          y: h * (0.06 + Math.random() * 0.12),
          size: 18 + Math.random() * 14,
          speed: 0.08 + Math.random() * 0.12,
          drift: Math.random() * Math.PI * 2,
          puffs: 4 + Math.floor(Math.random() * 3),
        });
      }
    }

    function cypressRand(n) {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    }

    function drawCypresses(offset) {
      const scrollX = offset * 0.85;
      const spacing = 36;
      const base = groundY - h * 0.05;
      const first = Math.floor((scrollX - 50) / spacing);
      const last = Math.ceil((scrollX + w + 50) / spacing);

      for (let i = first; i <= last; i++) {
        const x = i * spacing - scrollX;
        drawCypress(x, base, {
          height: 30 + cypressRand(i) * 30,
          width: 7 + cypressRand(i + 500) * 6,
          lean: (cypressRand(i + 1000) - 0.5) * 0.1,
        });
      }
    }

    function drawSky() {
      const g = ctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, C.skyTop);
      g.addColorStop(0.45, C.skyMid);
      g.addColorStop(0.78, C.skyBottom);
      g.addColorStop(1, C.skyWarm);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, groundY);

      const sunX = w * 0.82;
      const sunY = h * 0.14;
      const sunR = h * 0.07;
      const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
      glow.addColorStop(0, 'rgba(255, 248, 220, 0.55)');
      glow.addColorStop(0.35, 'rgba(255, 230, 180, 0.18)');
      glow.addColorStop(1, 'rgba(255, 230, 180, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, groundY);

      ctx.fillStyle = 'rgba(255, 245, 210, 0.92)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHeartCloud(cx, cy, size, drift) {
      ctx.save();
      ctx.translate(cx, cy + Math.sin(drift) * 2);

      const puff = (px, py, r, alpha) => {
        const g = ctx.createRadialGradient(px, py, r * 0.1, px, py, r);
        g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        g.addColorStop(0.55, `rgba(255, 250, 252, ${alpha * 0.75})`);
        g.addColorStop(1, `rgba(255, 240, 245, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      };

      const s = size;
      puff(-s * 0.42, -s * 0.08, s * 0.42, 0.82);
      puff(s * 0.42, -s * 0.08, s * 0.4, 0.8);
      puff(0, s * 0.18, s * 0.46, 0.78);
      puff(-s * 0.12, -s * 0.28, s * 0.3, 0.65);
      puff(s * 0.12, -s * 0.28, s * 0.28, 0.62);
      puff(0, -s * 0.02, s * 0.34, 0.55);

      ctx.fillStyle = 'rgba(232, 160, 176, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.42);
      ctx.bezierCurveTo(-s * 0.08, s * 0.18, -s * 0.34, s * 0.12, -s * 0.34, s * 0.32);
      ctx.bezierCurveTo(-s * 0.34, s * 0.5, 0, s * 0.62, 0, s * 0.62);
      ctx.bezierCurveTo(0, s * 0.62, s * 0.34, s * 0.5, s * 0.34, s * 0.32);
      ctx.bezierCurveTo(s * 0.34, s * 0.12, s * 0.08, s * 0.18, 0, s * 0.42);
      ctx.fill();

      ctx.restore();
    }

    function drawClouds() {
      clouds.forEach((cl) => {
        cl.drift += 0.018;
        drawHeartCloud(cl.x, cl.y, cl.size, cl.drift);
        if (phase === 'run') cl.x -= cl.speed;
        if (cl.x < -cl.size * 2) {
          cl.x = w + cl.size + Math.random() * 40;
          cl.y = h * (0.06 + Math.random() * 0.12);
        }
      });
    }

    function drawHillLayer(offset, baseY, amplitude, colorTop, colorBottom, speed, seed) {
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      const points = [];
      for (let x = 0; x <= w; x += 3) {
        const nx = x + offset * speed + seed;
        const y = baseY
          + Math.sin(nx * 0.0065) * amplitude
          + Math.sin(nx * 0.014 + 1.2) * amplitude * 0.45
          + Math.sin(nx * 0.023 + 2.4) * amplitude * 0.18;
        points.push({ x, y });
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();

      const minY = Math.min(...points.map((p) => p.y));
      const g = ctx.createLinearGradient(0, minY, 0, groundY);
      g.addColorStop(0, colorTop);
      g.addColorStop(1, colorBottom);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function drawHills(offset) {
      drawHillLayer(offset, groundY - h * 0.3, h * 0.045, C.hillFar, C.hillFarShadow, 0.25, 0);
      drawHillLayer(offset, groundY - h * 0.19, h * 0.055, C.hillMidLight, C.hillMid, 0.5, 40);
      drawHillLayer(offset, groundY - h * 0.09, h * 0.038, C.hillNear, C.hillNearShadow, 0.8, 90);

      ctx.fillStyle = 'rgba(255, 249, 240, 0.08)';
      ctx.fillRect(0, groundY - h * 0.32, w, h * 0.32);
    }

    function drawCypress(x, base, tree) {
      const top = base - tree.height;
      const mid = base - tree.height * 0.55;
      const cx = x + tree.width / 2;

      const body = ctx.createLinearGradient(cx, top, cx, base);
      body.addColorStop(0, C.cypressLight);
      body.addColorStop(0.5, C.cypress);
      body.addColorStop(1, '#243528');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x - tree.width * 0.15, mid, cx + tree.width * tree.lean, top);
      ctx.quadraticCurveTo(x + tree.width * 1.15, mid, x + tree.width, base);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(36, 53, 40, 0.35)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) {
        const ly = top + tree.height * (0.15 + i * 0.18);
        ctx.beginPath();
        ctx.moveTo(cx - tree.width * 0.35, ly);
        ctx.lineTo(cx + tree.width * 0.35, ly + tree.height * 0.04);
        ctx.stroke();
      }
    }

    function drawGround(sc) {
      const g = ctx.createLinearGradient(0, groundY, 0, h);
      g.addColorStop(0, C.groundLight);
      g.addColorStop(0.35, C.ground);
      g.addColorStop(1, C.groundDark);
      ctx.fillStyle = g;
      ctx.fillRect(0, groundY, w, h - groundY);

      ctx.fillStyle = 'rgba(191, 168, 130, 0.35)';
      ctx.fillRect(0, groundY, w, 3);

      const pathY = groundY + (h - groundY) * 0.42;
      ctx.fillStyle = 'rgba(180, 155, 115, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, pathY - 3);
      for (let x = 0; x <= w; x += 8) {
        const nx = x + sc * 0.4;
        ctx.lineTo(x, pathY + Math.sin(nx * 0.04) * 1.5);
      }
      ctx.lineTo(w, pathY + 8);
      ctx.lineTo(0, pathY + 8);
      ctx.closePath();
      ctx.fill();
    }

    function drawCoupleShadow() {
      const bob = Math.abs(Math.sin(couple.runPhase * 2)) * 1.5;
      ctx.fillStyle = 'rgba(90, 70, 50, 0.18)';
      ctx.beginPath();
      ctx.ellipse(couple.x + 2, groundY + 2 - bob * 0.2, 22, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawGroom(x, y, legPhase, armPhase) {
      const s = h / 145;
      const legSwing = Math.sin(legPhase) * 5 * s;
      const armSwing = Math.sin(armPhase) * 4 * s;
      const bob = Math.abs(Math.sin(legPhase * 2)) * 1.2 * s;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.strokeStyle = C.groomSuitDark;
      ctx.lineWidth = 3.2 * s;
      ctx.beginPath();
      ctx.moveTo(x - 3 * s, y - 2 * s - bob);
      ctx.lineTo(x - 3 * s + legSwing, y + 11 * s);
      ctx.moveTo(x + 3 * s, y - 2 * s - bob);
      ctx.lineTo(x + 3 * s - legSwing, y + 11 * s);
      ctx.stroke();

      const torsoTop = y - 20 * s - bob;
      const jacket = ctx.createLinearGradient(x - 8 * s, torsoTop, x + 8 * s, y);
      jacket.addColorStop(0, C.groomSuit);
      jacket.addColorStop(1, C.groomSuitDark);
      ctx.fillStyle = jacket;
      ctx.beginPath();
      ctx.moveTo(x - 8 * s, torsoTop + 4 * s);
      ctx.lineTo(x + 8 * s, torsoTop + 4 * s);
      ctx.lineTo(x + 7 * s, y - 2 * s);
      ctx.lineTo(x - 7 * s, y - 2 * s);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.moveTo(x - 1.5 * s, torsoTop + 4 * s);
      ctx.lineTo(x + 1.5 * s, torsoTop + 4 * s);
      ctx.lineTo(x + 1 * s, y - 4 * s);
      ctx.lineTo(x - 1 * s, y - 4 * s);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = C.groomSuit;
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(x - 8 * s, torsoTop + 7 * s);
      ctx.lineTo(x - 2 * s, y - 5 * s);
      ctx.moveTo(x + 8 * s, torsoTop + 7 * s);
      ctx.lineTo(x + 2 * s, y - 5 * s);
      ctx.stroke();

      ctx.strokeStyle = C.groomSkinShadow;
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath();
      ctx.moveTo(x + 6 * s, torsoTop + 8 * s);
      ctx.quadraticCurveTo(x + 10 * s + armSwing, torsoTop + 12 * s, x + 4 * s, torsoTop + 16 * s);
      ctx.stroke();

      const headY = torsoTop - 1 * s;
      const face = ctx.createRadialGradient(x - 2 * s, headY - 2 * s, 1, x, headY, 8 * s);
      face.addColorStop(0, C.groomSkin);
      face.addColorStop(1, C.groomSkinShadow);
      ctx.fillStyle = face;
      ctx.beginPath();
      ctx.arc(x, headY, 7 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = C.brideHairLight;
      ctx.beginPath();
      ctx.arc(x, headY - 1 * s, 7.4 * s, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.fillStyle = C.brideHair;
      ctx.beginPath();
      ctx.arc(x, headY - 1 * s, 7.2 * s, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();

      ctx.fillStyle = C.lemon;
      ctx.beginPath();
      ctx.arc(x + 5.5 * s, torsoTop + 9 * s, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.ellipse(x + 6.5 * s, torsoTop + 8 * s, 1.5 * s, 3 * s, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBride(x, y, legPhase, armPhase) {
      const s = h / 145;
      const legSwing = Math.sin(legPhase + Math.PI) * 5 * s;
      const armSwing = Math.sin(armPhase + Math.PI) * 3.5 * s;
      const bob = Math.abs(Math.sin(legPhase * 2)) * 1.2 * s;

      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(220, 215, 210, 0.9)';
      ctx.lineWidth = 2.8 * s;
      ctx.beginPath();
      ctx.moveTo(x - 2.5 * s, y - 1 * s - bob);
      ctx.lineTo(x - 2.5 * s + legSwing, y + 11 * s);
      ctx.moveTo(x + 2.5 * s, y - 1 * s - bob);
      ctx.lineTo(x + 2.5 * s - legSwing, y + 11 * s);
      ctx.stroke();

      const dressTop = y - 19 * s - bob;
      const dress = ctx.createLinearGradient(x - 14 * s, dressTop, x + 14 * s, y);
      dress.addColorStop(0, C.brideDress);
      dress.addColorStop(0.55, C.brideDress);
      dress.addColorStop(1, C.brideDressShadow);
      ctx.fillStyle = dress;
      ctx.beginPath();
      ctx.moveTo(x - 7 * s, dressTop + 2 * s);
      ctx.quadraticCurveTo(x - 10 * s, dressTop + 10 * s, x - 13 * s, y + 1 * s);
      ctx.quadraticCurveTo(x - 4 * s, y + 3 * s, x, y + 1 * s);
      ctx.quadraticCurveTo(x + 4 * s, y + 3 * s, x + 13 * s, y + 1 * s);
      ctx.quadraticCurveTo(x + 10 * s, dressTop + 10 * s, x + 7 * s, dressTop + 2 * s);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(x - 5 * s, dressTop + 6 * s);
      ctx.quadraticCurveTo(x, dressTop + 10 * s, x + 5 * s, dressTop + 6 * s);
      ctx.stroke();

      ctx.strokeStyle = C.groomSkinShadow;
      ctx.lineWidth = 2.4 * s;
      ctx.beginPath();
      ctx.moveTo(x - 5 * s, dressTop + 5 * s);
      ctx.quadraticCurveTo(x - 9 * s - armSwing, dressTop + 10 * s, x - 3 * s, dressTop + 14 * s);
      ctx.stroke();

      const headY = dressTop - 2 * s;
      ctx.fillStyle = C.brideHairLight;
      ctx.beginPath();
      ctx.arc(x, headY - 1 * s, 7.4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.brideHair;
      ctx.beginPath();
      ctx.arc(x, headY - 1 * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();

      const face = ctx.createRadialGradient(x - 1.5 * s, headY - 2 * s, 1, x, headY, 6 * s);
      face.addColorStop(0, C.groomSkin);
      face.addColorStop(1, C.groomSkinShadow);
      ctx.fillStyle = face;
      ctx.beginPath();
      ctx.arc(x, headY + 1 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();

      const veil = ctx.createLinearGradient(x + 4 * s, headY - 8 * s, x + 16 * s, y - 4 * s);
      veil.addColorStop(0, 'rgba(255,255,255,0.75)');
      veil.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.fillStyle = veil;
      ctx.beginPath();
      ctx.moveTo(x + 3 * s, headY - 5 * s);
      ctx.quadraticCurveTo(x + 14 * s, headY - 2 * s, x + 11 * s, y - 6 * s);
      ctx.quadraticCurveTo(x + 6 * s, dressTop + 2 * s, x + 4 * s, dressTop + 4 * s);
      ctx.closePath();
      ctx.fill();

      ['#E8A0B0', '#F5D547', '#FFFFFF'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x - 10 * s - armSwing * 0.3, dressTop + 13 * s + i * 1.5 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawHeldHands(gx, bx, y, armPhase) {
      const s = h / 145;
      const bob = Math.abs(Math.sin(couple.runPhase * 2)) * 1.2 * s;
      const handY = y - 19 * s - bob + 14 * s + Math.sin(armPhase) * s;
      const handX = (gx + bx) / 2 + 1 * s;

      ctx.fillStyle = C.groomSkin;
      ctx.beginPath();
      ctx.arc(handX - 2 * s, handY, 2.2 * s, 0, Math.PI * 2);
      ctx.arc(handX + 2 * s, handY, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawRollingRing(cx, y, phase) {
      const s = h / 145;
      const r = 8.5 * s;
      const cy = y - r;

      ctx.fillStyle = 'rgba(90, 70, 50, 0.14)';
      ctx.beginPath();
      ctx.ellipse(cx, y + 1.5 * s, r * 0.85, 2.2 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phase * 0.9);

      const band = ctx.createLinearGradient(-r, -r, r, r);
      band.addColorStop(0, '#B8922E');
      band.addColorStop(0.35, '#F5E6B8');
      band.addColorStop(0.65, C.altarGold);
      band.addColorStop(1, '#9A7820');

      ctx.lineWidth = 3.8 * s;
      ctx.strokeStyle = band;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.2 * s;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, r - 1.8 * s, -0.6, 0.8);
      ctx.stroke();

      const gx = 0;
      const gy = -r;

      ctx.fillStyle = '#D8EEF8';
      ctx.strokeStyle = '#7EB3D4';
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 4 * s);
      ctx.lineTo(gx + 3 * s, gy - 0.5 * s);
      ctx.lineTo(gx, gy + 2 * s);
      ctx.lineTo(gx - 3 * s, gy - 0.5 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(gx - 1 * s, gy - 1.5 * s, 1 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#C9A84C';
      ctx.beginPath();
      ctx.moveTo(gx - 1.8 * s, gy + 1.2 * s);
      ctx.lineTo(gx + 1.8 * s, gy + 1.2 * s);
      ctx.lineTo(gx, gy + 2.8 * s);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawCouple() {
      const y = couple.y;
      const gx = couple.x - 12;
      const bx = couple.x + 8;
      const armPhase = couple.runPhase * 1.1;
      const ringX = couple.x + 46;

      drawCoupleShadow();
      drawGroom(gx, y, couple.runPhase, armPhase);
      drawBride(bx, y, couple.runPhase, armPhase);
      drawHeldHands(gx, bx, y, armPhase);
      drawRollingRing(ringX, y, couple.runPhase);
    }

    function drawMarried() {
      ctx.fillStyle = '#FFF3B0';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#2E5F7A';
      ctx.font = `600 ${Math.round(h * 0.16)}px "Cormorant Garamond", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Just Married ♥️', w / 2, h / 2);
      ctx.restore();
    }

    function updateRun() {
      scroll += 2.4;
      couple.runPhase += 0.24;
      couple.y = groundY;
    }

    function updateEscape() {
      couple.x += 4.5;
      couple.runPhase += 0.29;
      couple.y = groundY;
      if (couple.x > w + 70) {
        phase = 'married';
        textAlpha = 0;
      }
    }

    function updateMarried() {
      textAlpha = Math.min(1, textAlpha + 0.035);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      if (phase === 'married') {
        drawMarried();
        return;
      }

      const sc = phase === 'escape' ? frozenScroll : scroll;
      drawSky();
      drawClouds();
      drawHills(sc);
      drawCypresses(sc);
      drawGround(sc);
      drawCouple();
    }

    function tick() {
      frame++;
      if (phase === 'run') updateRun();
      else if (phase === 'escape') updateEscape();
      else if (phase === 'married' && textAlpha < 1) updateMarried();

      draw();

      if (phase !== 'married' || textAlpha < 1) {
        requestAnimationFrame(tick);
      }
    }

    function startMarriedSequence() {
      if (phase !== 'run') return;
      frozenScroll = scroll;
      phase = 'escape';
    }

    resize();
    seedScenery();
    couple.y = groundY;
    requestAnimationFrame(tick);

    window.addEventListener('resize', () => {
      resize();
      if (phase === 'run') seedScenery();
      draw();
    });

    return { startMarriedSequence };
  }

  window.initCountdownRunner = initCountdownRunner;
})();
