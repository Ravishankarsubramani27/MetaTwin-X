/* bodyDraw.js — realistic medical canvas renderer */

function rC(s){return s<0.4?"#10b981":s<0.7?"#f59e0b":"#ef4444"}
function lighten(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgb(${Math.min(r+a,255)},${Math.min(g+a,255)},${Math.min(b+a,255)})`}
function darken(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgb(${Math.max(r-a,0)},${Math.max(g-a,0)},${Math.max(b-a,0)})`}

export function draw(g, W, H, t, sc, hoveredOrgan){
  const cx=W/2;

  /* ── BACKGROUND ── */
  const bg=g.createRadialGradient(cx,H*0.35,30,cx,H*0.35,H*0.7);
  bg.addColorStop(0,"#080f1e"); bg.addColorStop(1,"#020408");
  g.fillStyle=bg; g.fillRect(0,0,W,H);

  /* ── GRID ── */
  g.strokeStyle="rgba(56,189,248,0.045)"; g.lineWidth=0.8;
  for(let x=0;x<W;x+=36){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
  for(let y=0;y<H;y+=36){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}

  /* ── SCAN LINE ── */
  const sy=((t*52)%(H+30))-15;
  const sg=g.createLinearGradient(0,0,W,0);
  sg.addColorStop(0,"transparent");sg.addColorStop(0.25,"rgba(56,189,248,0)");
  sg.addColorStop(0.5,"rgba(56,189,248,0.55)");
  sg.addColorStop(0.75,"rgba(56,189,248,0)");sg.addColorStop(1,"transparent");
  g.fillStyle=sg; g.fillRect(0,sy,W,1.5);

  /* ════════════════════════════════════════
     REALISTIC BODY OUTLINE
  ════════════════════════════════════════ */
  const bodyStroke="rgba(56,189,248,0.38)";
  const bodyFill=g.createLinearGradient(cx-80,80,cx+80,H-60);
  bodyFill.addColorStop(0,"rgba(10,26,52,0.88)");
  bodyFill.addColorStop(0.5,"rgba(8,18,38,0.8)");
  bodyFill.addColorStop(1,"rgba(5,12,26,0.75)");

  /* LEFT ARM full */
  g.beginPath();
  g.moveTo(cx-68,168);
  g.bezierCurveTo(cx-90,168,cx-112,175,cx-118,195);
  g.bezierCurveTo(cx-126,218,cx-122,252,cx-118,288);
  g.bezierCurveTo(cx-115,315,cx-112,345,cx-114,380);
  g.bezierCurveTo(cx-116,410,cx-115,435,cx-110,458);
  g.lineTo(cx-94,455);
  g.bezierCurveTo(cx-92,432,cx-92,410,cx-90,382);
  g.bezierCurveTo(cx-88,348,cx-90,318,cx-92,290);
  g.bezierCurveTo(cx-96,258,cx-98,230,cx-94,208);
  g.bezierCurveTo(cx-90,188,cx-78,180,cx-68,178);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.3; g.stroke();

  /* RIGHT ARM full */
  g.beginPath();
  g.moveTo(cx+68,168);
  g.bezierCurveTo(cx+90,168,cx+112,175,cx+118,195);
  g.bezierCurveTo(cx+126,218,cx+122,252,cx+118,288);
  g.bezierCurveTo(cx+115,315,cx+112,345,cx+114,380);
  g.bezierCurveTo(cx+116,410,cx+115,435,cx+110,458);
  g.lineTo(cx+94,455);
  g.bezierCurveTo(cx+92,432,cx+92,410,cx+90,382);
  g.bezierCurveTo(cx+88,348,cx+90,318,cx+92,290);
  g.bezierCurveTo(cx+96,258,cx+98,230,cx+94,208);
  g.bezierCurveTo(cx+90,188,cx+78,180,cx+68,178);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.3; g.stroke();

  /* TORSO */
  g.beginPath();
  g.moveTo(cx-68,168);
  g.bezierCurveTo(cx-78,172,cx-80,200,cx-78,240);
  g.bezierCurveTo(cx-76,280,cx-72,320,cx-68,360);
  g.bezierCurveTo(cx-64,390,cx-56,415,cx-48,428);
  g.lineTo(cx+48,428);
  g.bezierCurveTo(cx+56,415,cx+64,390,cx+68,360);
  g.bezierCurveTo(cx+72,320,cx+76,280,cx+78,240);
  g.bezierCurveTo(cx+80,200,cx+78,172,cx+68,168);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.5; g.stroke();

  /* PELVIS */
  g.beginPath();
  g.moveTo(cx-48,428);
  g.bezierCurveTo(cx-60,436,cx-66,452,cx-62,468);
  g.bezierCurveTo(cx-56,480,cx-32,488,cx,488);
  g.bezierCurveTo(cx+32,488,cx+56,480,cx+62,468);
  g.bezierCurveTo(cx+66,452,cx+60,436,cx+48,428);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.4; g.stroke();

  /* LEFT LEG */
  g.beginPath();
  g.moveTo(cx-30,484);
  g.bezierCurveTo(cx-46,490,cx-54,520,cx-52,562);
  g.bezierCurveTo(cx-50,596,cx-46,620,cx-44,638);
  g.lineTo(cx-26,636);
  g.bezierCurveTo(cx-24,618,cx-24,596,cx-24,562);
  g.bezierCurveTo(cx-22,524,cx-16,494,cx-8,486);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.3; g.stroke();

  /* RIGHT LEG */
  g.beginPath();
  g.moveTo(cx+30,484);
  g.bezierCurveTo(cx+46,490,cx+54,520,cx+52,562);
  g.bezierCurveTo(cx+50,596,cx+46,620,cx+44,638);
  g.lineTo(cx+26,636);
  g.bezierCurveTo(cx+24,618,cx+24,596,cx+24,562);
  g.bezierCurveTo(cx+22,524,cx+16,494,cx+8,486);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.3; g.stroke();

  /* NECK */
  g.beginPath();
  g.moveTo(cx-15,148); g.lineTo(cx-15,172);
  g.lineTo(cx+15,172); g.lineTo(cx+15,148);
  g.closePath();
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.2; g.stroke();

  /* HEAD */
  g.beginPath();
  g.ellipse(cx,98,46,54,0,0,Math.PI*2);
  g.fillStyle=bodyFill; g.fill();
  g.strokeStyle=bodyStroke; g.lineWidth=1.5; g.stroke();
  // Eye sockets
  g.fillStyle="rgba(56,189,248,0.18)";
  g.beginPath(); g.ellipse(cx-15,88,9,6.5,0,0,Math.PI*2); g.fill();
  g.beginPath(); g.ellipse(cx+15,88,9,6.5,0,0,Math.PI*2); g.fill();
  g.strokeStyle="rgba(56,189,248,0.4)"; g.lineWidth=1;
  g.beginPath(); g.ellipse(cx-15,88,9,6.5,0,0,Math.PI*2); g.stroke();
  g.beginPath(); g.ellipse(cx+15,88,9,6.5,0,0,Math.PI*2); g.stroke();
  // Nose
  g.strokeStyle="rgba(56,189,248,0.22)"; g.lineWidth=1.2;
  g.beginPath(); g.moveTo(cx-5,96); g.quadraticCurveTo(cx,108,cx+5,96); g.stroke();
  // Mouth
  g.beginPath(); g.arc(cx,116,11,0.08*Math.PI,0.92*Math.PI,false); g.stroke();
  // Skull detail lines
  g.strokeStyle="rgba(56,189,248,0.1)"; g.lineWidth=0.8;
  g.beginPath(); g.moveTo(cx-22,60); g.quadraticCurveTo(cx,52,cx+22,60); g.stroke();
  g.beginPath(); g.moveTo(cx-40,90); g.lineTo(cx-38,90); g.stroke();
  g.beginPath(); g.moveTo(cx+38,90); g.lineTo(cx+40,90); g.stroke();

  /* ════ RIBCAGE ════ */
  g.strokeStyle="rgba(56,189,248,0.32)"; g.lineWidth=1.4;
  // Sternum
  g.beginPath(); g.moveTo(cx,172); g.lineTo(cx,298); g.stroke();
  // Ribs L+R
  const ribData=[
    [cx-62,178,cx+62,178, 18, 0],
    [cx-66,196,cx+66,196, 20, 0],
    [cx-68,214,cx+68,214, 21, 0],
    [cx-67,232,cx+67,232, 20, 0],
    [cx-64,250,cx+64,250, 18, 0],
    [cx-58,268,cx+58,268, 14, 0],
    [cx-50,284,cx+50,284, 10, 0],
  ];
  ribData.forEach(([x1,y1,x2,y2,bow])=>{
    g.beginPath(); g.moveTo(x1,y1); g.quadraticCurveTo(cx,y1+bow,x2,y2); g.stroke();
    // Cartilage endpoints
    g.strokeStyle="rgba(56,189,248,0.18)"; g.lineWidth=0.9;
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x1-8,y1+4); g.stroke();
    g.beginPath(); g.moveTo(x2,y2); g.lineTo(x2+8,y2+4); g.stroke();
    g.strokeStyle="rgba(56,189,248,0.32)"; g.lineWidth=1.4;
  });
  // Costal arch
  g.strokeStyle="rgba(56,189,248,0.22)"; g.lineWidth=1.2;
  g.beginPath();
  g.moveTo(cx-50,284); g.bezierCurveTo(cx-34,310,cx,318,cx+34,310); g.lineTo(cx+50,284); g.stroke();
  // Clavicles
  g.strokeStyle="rgba(56,189,248,0.42)"; g.lineWidth=2.2;
  g.beginPath(); g.moveTo(cx-8,166); g.bezierCurveTo(cx-36,162,cx-62,168,cx-74,178); g.stroke();
  g.beginPath(); g.moveTo(cx+8,166); g.bezierCurveTo(cx+36,162,cx+62,168,cx+74,178); g.stroke();

  /* ════ SPINE ════ */
  g.fillStyle="rgba(56,189,248,0.24)";
  for(let i=0;i<14;i++){
    const sy2=174+i*14;
    g.beginPath(); g.roundRect(cx-5.5,sy2,11,10,2); g.fill();
    // Transverse processes
    g.fillStyle="rgba(56,189,248,0.14)";
    g.beginPath(); g.roundRect(cx-13,sy2+2,6,6,1); g.fill();
    g.beginPath(); g.roundRect(cx+7,sy2+2,6,6,1); g.fill();
    g.fillStyle="rgba(56,189,248,0.24)";
  }

  /* ════ DIAPHRAGM ════ */
  g.strokeStyle="rgba(56,189,248,0.28)"; g.lineWidth=1.5;
  g.setLineDash([7,5]);
  g.beginPath(); g.moveTo(cx-66,310); g.bezierCurveTo(cx-30,300,cx+30,300,cx+66,310); g.stroke();
  g.setLineDash([]);

  /* ════ LUNGS ════ */
  const breathe=1+Math.sin(t*1.25)*0.026;
  g.globalAlpha=0.2;
  [[cx-46,235,-1],[cx+46,235,1]].forEach(([lx,ly,m])=>{
    g.save(); g.translate(lx,ly); g.scale(m*breathe,breathe); g.translate(-lx,-ly);
    const lg=g.createRadialGradient(lx,ly,10,lx,ly,85);
    lg.addColorStop(0,"rgba(59,130,246,0.7)");
    lg.addColorStop(1,"rgba(30,58,138,0.2)");
    g.fillStyle=lg;
    g.beginPath();
    g.moveTo(lx+m*4,170); // top at bronchus
    g.bezierCurveTo(lx+m*30,172,lx+m*48,188,lx+m*56,210);
    g.bezierCurveTo(lx+m*64,235,lx+m*62,268,lx+m*56,290);
    g.bezierCurveTo(lx+m*48,312,lx+m*30,320,lx+m*12,318);
    g.bezierCurveTo(lx-m*6,315,lx-m*8,298,lx-m*4,280);
    g.bezierCurveTo(lx-m*2,262,lx+m*2,242,lx-m*4,222);
    g.bezierCurveTo(lx-m*8,204,lx-m*2,176,lx+m*4,170);
    g.closePath(); g.fill();
    // Bronchial tree
    g.strokeStyle="rgba(56,189,248,0.3)"; g.lineWidth=2.5; g.globalAlpha=0.35;
    g.beginPath(); g.moveTo(lx+m*4,172); g.lineTo(lx+m*4,196); g.stroke();
    g.lineWidth=1.6;
    g.beginPath(); g.moveTo(lx+m*4,196); g.bezierCurveTo(lx+m*4,205,lx+m*18,210,lx+m*22,218); g.stroke();
    g.beginPath(); g.moveTo(lx+m*4,196); g.bezierCurveTo(lx+m*4,205,lx-m*8,212,lx-m*10,222); g.stroke();
    g.lineWidth=1;
    g.beginPath(); g.moveTo(lx+m*22,218); g.bezierCurveTo(lx+m*26,226,lx+m*34,230,lx+m*36,240); g.stroke();
    g.restore();
  });
  g.globalAlpha=1;

  /* ════ BLOOD VESSELS ════ */
  // Aorta
  g.strokeStyle="rgba(220,38,38,0.6)"; g.lineWidth=5;
  g.beginPath(); g.moveTo(cx-3,220);
  g.bezierCurveTo(cx-3,232,cx-16,228,cx-16,242);
  g.bezierCurveTo(cx-16,258,cx-5,258,cx-5,390); g.stroke();
  // Aortic arch
  g.beginPath(); g.moveTo(cx-3,220);
  g.bezierCurveTo(cx-2,206,cx+10,202,cx+12,214); g.stroke();
  // Vena cava
  g.strokeStyle="rgba(37,99,235,0.55)"; g.lineWidth=4.5;
  g.beginPath(); g.moveTo(cx+6,225); g.lineTo(cx+6,390); g.stroke();
  // Pulmonary
  g.strokeStyle="rgba(239,68,68,0.4)"; g.lineWidth=3;
  g.beginPath(); g.moveTo(cx-6,220); g.bezierCurveTo(cx-20,210,cx-44,212,cx-52,220); g.stroke();
  g.beginPath(); g.moveTo(cx-6,220); g.bezierCurveTo(cx+8,210,cx+32,212,cx+40,220); g.stroke();
  // Renal arteries
  g.strokeStyle="rgba(239,68,68,0.35)"; g.lineWidth=2;
  g.beginPath(); g.moveTo(cx-10,300); g.bezierCurveTo(cx-30,300,cx-50,298,cx-66,295); g.stroke();
  g.beginPath(); g.moveTo(cx+10,300); g.bezierCurveTo(cx+30,300,cx+50,298,cx+66,295); g.stroke();
  // Portal vein
  g.strokeStyle="rgba(59,130,246,0.3)"; g.lineWidth=2.5;
  g.beginPath(); g.moveTo(cx+12,320); g.bezierCurveTo(cx+20,310,cx+28,300,cx+24,288); g.stroke();
  // Hepatic veins
  g.lineWidth=1.5;
  g.beginPath(); g.moveTo(cx+30,275); g.bezierCurveTo(cx+20,262,cx+10,252,cx+8,240); g.stroke();

  /* ════ STOMACH ════ */
  g.globalAlpha=0.18;
  const stomGrad=g.createRadialGradient(cx-18,340,4,cx-18,340,32);
  stomGrad.addColorStop(0,"rgba(168,85,247,0.8)");
  stomGrad.addColorStop(1,"rgba(109,40,217,0.2)");
  g.fillStyle=stomGrad;
  g.beginPath();
  g.moveTo(cx-8,322); g.bezierCurveTo(cx+8,316,cx+18,324,cx+14,342);
  g.bezierCurveTo(cx+10,358,cx-4,365,cx-16,360);
  g.bezierCurveTo(cx-28,354,cx-32,338,cx-26,326);
  g.bezierCurveTo(cx-22,320,cx-16,318,cx-8,322);
  g.fill();
  g.globalAlpha=1;

  /* ════ INTESTINES ════ */
  g.globalAlpha=0.12;
  g.strokeStyle="rgba(139,92,246,0.6)"; g.lineWidth=7;
  const loops=[
    [[cx-40,375,cx-20,395,cx+20,395,cx+35,375]],
    [[cx+35,375,cx+42,360,cx+32,345,cx+10,350]],
    [[cx+10,350,cx-18,355,cx-38,348,cx-42,362]],
    [[cx-42,362,cx-40,378,cx-20,388,cx+5,385]],
    [[cx+5,385,cx+28,382,cx+40,370,cx+38,355]],
  ];
  loops.forEach(([pts])=>{
    g.beginPath(); g.moveTo(pts[0],pts[1]);
    g.bezierCurveTo(pts[0],pts[1],pts[2],pts[3],pts[4]??pts[2],pts[5]??pts[3]);
    g.stroke();
  });
  g.globalAlpha=1;

  /* ════ ORGANS ════ */

  // ── HEART ──
  const hColor=rC(sc.heart);
  const hBeat=1+Math.sin(t*5.8)*0.07+Math.sin(t*11.6)*0.04;
  const hHov=hoveredOrgan==="heart";
  g.save(); g.translate(cx-20,250); g.scale(hBeat*(hHov?1.12:1),hBeat*(hHov?1.12:1));
  // Outer glow
  if(sc.heart>=0.7){
    const hg2=g.createRadialGradient(0,0,5,0,0,55);
    hg2.addColorStop(0,hColor+"44"); hg2.addColorStop(1,"transparent");
    g.fillStyle=hg2; g.beginPath(); g.arc(0,0,55,0,Math.PI*2); g.fill();
  }
  const hg=g.createRadialGradient(-10,-10,3,0,0,36);
  hg.addColorStop(0,lighten(hColor,65));
  hg.addColorStop(0.4,hColor);
  hg.addColorStop(0.75,darken(hColor,30));
  hg.addColorStop(1,darken(hColor,60));
  g.fillStyle=hg;
  // Anatomical heart path
  g.beginPath();
  g.moveTo(0,22);
  g.bezierCurveTo(-4,14,-14,6,-20,-2);
  g.bezierCurveTo(-28,-12,-32,-24,-22,-30);
  g.bezierCurveTo(-14,-36,-4,-28,0,-22);
  g.bezierCurveTo(4,-28,14,-36,22,-30);
  g.bezierCurveTo(32,-24,28,-12,20,-2);
  g.bezierCurveTo(14,6,4,14,0,22);
  g.closePath(); g.fill();
  g.strokeStyle="rgba(255,255,255,0.3)"; g.lineWidth=1.2; g.stroke();
  // Ventricle division
  g.strokeStyle="rgba(0,0,0,0.35)"; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(0,-22); g.lineTo(0,14); g.stroke();
  // Highlight
  g.fillStyle="rgba(255,255,255,0.22)";
  g.beginPath(); g.ellipse(-10,-12,9,6,-0.4,0,Math.PI*2); g.fill();
  g.restore();

  // ── LIVER ──
  const lColor=rC(sc.liver);
  const lBreath=1+Math.sin(t*1.4+0.5)*0.022;
  const lHov=hoveredOrgan==="liver";
  g.save(); g.translate(cx+22,295); g.scale(lBreath*(lHov?1.08:1),lBreath*(lHov?1.08:1));
  if(sc.liver>=0.7){
    const lg2=g.createRadialGradient(0,0,8,0,0,70);
    lg2.addColorStop(0,lColor+"33"); lg2.addColorStop(1,"transparent");
    g.fillStyle=lg2; g.beginPath(); g.arc(0,0,70,0,Math.PI*2); g.fill();
  }
  const liverG=g.createRadialGradient(-14,-8,5,0,0,52);
  liverG.addColorStop(0,lighten(lColor,55));
  liverG.addColorStop(0.45,lColor);
  liverG.addColorStop(0.8,darken(lColor,28));
  liverG.addColorStop(1,darken(lColor,55));
  g.fillStyle=liverG;
  // Right lobe
  g.beginPath();
  g.moveTo(2,2);
  g.bezierCurveTo(24,-16,48,-10,46,14);
  g.bezierCurveTo(44,32,28,40,12,38);
  g.bezierCurveTo(6,36,0,26,2,2);
  g.fill();
  // Left lobe
  g.beginPath();
  g.moveTo(2,2);
  g.bezierCurveTo(-18,-16,-38,-10,-34,10);
  g.bezierCurveTo(-30,24,-16,30,-4,28);
  g.bezierCurveTo(2,26,4,14,2,2);
  g.fill();
  g.strokeStyle="rgba(255,255,255,0.22)"; g.lineWidth=1.2; g.stroke();
  // Surface detail lines
  g.strokeStyle="rgba(0,0,0,0.2)"; g.lineWidth=1;
  g.beginPath(); g.moveTo(2,2); g.bezierCurveTo(16,4,30,8,40,14); g.stroke();
  g.beginPath(); g.moveTo(2,2); g.bezierCurveTo(-12,6,-24,12,-28,18); g.stroke();
  // Gallbladder
  g.fillStyle=darken(lColor,15)+"cc";
  g.beginPath(); g.ellipse(22,36,9,7,0.4,0,Math.PI*2); g.fill();
  g.strokeStyle="rgba(255,255,255,0.2)"; g.lineWidth=1; g.stroke();
  // Hepatic vessels
  g.strokeStyle="rgba(255,255,255,0.18)"; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(10,0); g.bezierCurveTo(8,-8,4,-14,2,-18); g.stroke();
  // Highlight
  g.fillStyle="rgba(255,255,255,0.18)";
  g.beginPath(); g.ellipse(-10,-6,12,7,-0.3,0,Math.PI*2); g.fill();
  g.restore();

  // ── KIDNEYS ──
  const kColor=rC(sc.kidney);
  const kBreath=1+Math.sin(t*1.7)*0.022;
  const kHov=hoveredOrgan==="kidney";

  [[cx-68,300,1,"L"],[cx+68,300,-1,"R"]].forEach(([kx,ky,mir,side])=>{
    g.save(); g.translate(kx,ky); g.scale(mir*kBreath*(kHov?1.1:1),kBreath*(kHov?1.1:1));
    if(sc.kidney>=0.7){
      const kg2=g.createRadialGradient(0,0,4,0,0,34);
      kg2.addColorStop(0,kColor+"44"); kg2.addColorStop(1,"transparent");
      g.fillStyle=kg2; g.beginPath(); g.arc(0,0,34,0,Math.PI*2); g.fill();
    }
    const kG=g.createRadialGradient(-4,-4,2,0,0,22);
    kG.addColorStop(0,lighten(kColor,50));
    kG.addColorStop(0.5,kColor);
    kG.addColorStop(1,darken(kColor,35));
    g.fillStyle=kG;
    // Bean shape
    g.beginPath();
    g.moveTo(-4,-24);
    g.bezierCurveTo(-18,-22,-22,-10,-20,2);
    g.bezierCurveTo(-18,14,-10,22,0,24);
    g.bezierCurveTo(12,24,20,14,20,2);
    g.bezierCurveTo(20,-10,14,-20,4,-24);
    g.closePath(); g.fill();
    // Renal pelvis notch
    g.fillStyle="rgba(5,12,24,0.55)";
    g.beginPath(); g.ellipse(12,0,7,10,0,0,Math.PI*2); g.fill();
    // Calices
    g.strokeStyle="rgba(255,255,255,0.2)"; g.lineWidth=1;
    g.beginPath(); g.ellipse(10,-8,4,3,0.2,0,Math.PI*2); g.stroke();
    g.beginPath(); g.ellipse(10,8,4,3,-0.2,0,Math.PI*2); g.stroke();
    // Ureter
    g.strokeStyle=kColor+"88"; g.lineWidth=2;
    g.beginPath(); g.moveTo(0,24); g.bezierCurveTo(-2,36,-4,50,-4,70); g.stroke();
    g.strokeStyle="rgba(255,255,255,0.18)"; g.lineWidth=1.3; g.stroke();
    // Highlight
    g.fillStyle="rgba(255,255,255,0.18)";
    g.beginPath(); g.ellipse(-5,-8,6,4,-0.3,0,Math.PI*2); g.fill();
    g.restore();
  });

  /* ════ ORGAN LABELS ════ */
  const labels=[
    {key:"heart", lx:cx-20, ly:250, off:-58, text:"Heart", s:sc.heart},
    {key:"liver", lx:cx+22, ly:295, off:-62, text:"Liver", s:sc.liver},
    {key:"kidney",lx:cx-68, ly:300, off:-50, text:"Kidney",s:sc.kidney},
  ];
  g.font="bold 10px Inter,sans-serif";
  labels.forEach(({key,lx,ly,off,text,s})=>{
    const col=rC(s), pct=(s*100).toFixed(0), lbl=`${text}: ${pct}%`;
    const tw=g.measureText(lbl).width+18;
    const bx=lx-tw/2, by=ly+off-16;
    // Connector line
    g.strokeStyle=col+"90"; g.lineWidth=1; g.setLineDash([4,3]);
    g.beginPath(); g.moveTo(lx,ly+off+14); g.lineTo(lx,ly+off-2); g.stroke();
    g.setLineDash([]);
    // Badge background
    g.fillStyle="rgba(4,9,20,0.92)";
    g.strokeStyle=col; g.lineWidth=1.5;
    g.beginPath(); g.roundRect(bx,by,tw,22,6); g.fill(); g.stroke();
    // Colored dot
    g.fillStyle=col;
    g.beginPath(); g.arc(bx+8,by+11,4,0,Math.PI*2); g.fill();
    // Text
    g.fillStyle="#e2e8f0"; g.textAlign="left";
    g.fillText(lbl,bx+16,by+14);
  });

  /* ════ DATA PANELS ════ */
  const panels=[
    {label:"HR",   value:"72 bpm",  col:"#ef4444", y:195},
    {label:"SpO₂", value:"98%",     col:"#10b981", y:245},
    {label:"BP",   value:"118/76",  col:"#3b82f6", y:295},
    {label:"HRV",  value:"42 ms",   col:"#8b5cf6", y:345},
  ];
  panels.forEach(({label,value,col,y})=>{
    const px=W-16,py=y;
    g.fillStyle="rgba(4,9,20,0.88)";
    g.strokeStyle=col+"44"; g.lineWidth=1;
    g.beginPath(); g.roundRect(px-80,py-18,80,40,8); g.fill(); g.stroke();
    g.strokeStyle=col; g.lineWidth=3;
    g.beginPath(); g.moveTo(px-80,py-18); g.lineTo(px-80,py+22); g.stroke();
    g.fillStyle="#64748b"; g.font="bold 9px Inter,sans-serif"; g.textAlign="left";
    g.fillText(label,px-72,py-4);
    g.fillStyle=col; g.font="bold 13px Inter,sans-serif";
    g.fillText(value,px-72,py+14);
  });

  /* ════ HOVER GLOW OVERLAY ════ */
  if(hoveredOrgan){
    const orgPos={heart:[cx-20,250],liver:[cx+22,295],kidney:[cx-68,300]};
    const [ox,oy]=orgPos[hoveredOrgan]??[0,0];
    const hoverG=g.createRadialGradient(ox,oy,10,ox,oy,80);
    const hc=rC(sc[hoveredOrgan]??0);
    hoverG.addColorStop(0,hc+"22"); hoverG.addColorStop(1,"transparent");
    g.fillStyle=hoverG; g.beginPath(); g.arc(ox,oy,80,0,Math.PI*2); g.fill();
  }
}
