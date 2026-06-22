const pptxgen = require("pptxgenjs");
const path = require("path");

const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";

// ---- brand palette ----
const NAVY = "00294F", NAVY_DEEP = "001A38", INK = "0B2A4A";
const TEAL = "0E9C92", TEALB = "1FC9C2", GREEN = "46E0B0";
const SUB = "5C6E80", SUBD = "AEC4D6", LIGHT = "F2FBF9", WHITE = "FFFFFF";
const F = "DM Sans";
const W = 13.333, H = 7.5;
const LOGO = path.resolve(__dirname, "assets/delta-logo.png");
const LOGOW = path.resolve(__dirname, "assets/delta-logo-white.png");
const RATIO = 721 / 1600; // h/w

function darkBg(s){ s.background = { color: NAVY };
  s.addShape("rect", { x:0, y:0, w:W, h:H, fill:{ color: NAVY_DEEP, transparency: 100 } });
  s.addShape("ellipse", { x:W-5.2, y:H-4.4, w:6.4, h:6.4, fill:{ color: TEALB, transparency: 88 }, line:{ type:"none" } });
  s.addShape("ellipse", { x:-2.2, y:-2.4, w:5.4, h:5.4, fill:{ color: "1C6FB0", transparency: 90 }, line:{ type:"none" } });
}
function lightBg(s){ s.background = { color: LIGHT };
  s.addShape("ellipse", { x:W-4.6, y:-2.2, w:6.0, h:6.0, fill:{ color: TEALB, transparency: 90 }, line:{ type:"none" } });
  s.addShape("ellipse", { x:-2.4, y:H-3.6, w:6.0, h:6.0, fill:{ color: GREEN, transparency: 92 }, line:{ type:"none" } });
}
function kicker(s, txt, x, y, color){ s.addText(txt.toUpperCase(), { x, y, w:9, h:0.4, fontFace:F, fontSize:14, bold:true, color: color||TEAL, charSpacing:3, align:"left", margin:0 }); }
function checkRow(s, x, y, txt){
  const d = 0.46;
  s.addShape("ellipse", { x, y, w:d, h:d, fill:{ color: TEALB }, line:{ type:"none" } });
  s.addText("✓", { x, y:y-0.01, w:d, h:d, fontFace:F, fontSize:16, bold:true, color: WHITE, align:"center", valign:"middle", margin:0 });
  s.addText(txt, { x:x+d+0.28, y:y-0.12, w:5.2, h:0.7, fontFace:F, fontSize:21, bold:true, color: INK, align:"left", valign:"middle", margin:0 });
}
function bullet(s, x, y, txt, wdt){
  s.addShape("rect", { x, y:y+0.12, w:0.18, h:0.18, fill:{ color: TEALB }, line:{ type:"none" } });
  s.addText(txt, { x:x+0.4, y:y-0.12, w:wdt||6.4, h:0.8, fontFace:F, fontSize:20, color: INK, align:"left", valign:"top", margin:0 });
}

// ============ S1 — Title ============
let s = p.addSlide(); darkBg(s);
s.addImage({ path: LOGOW, x:(W-4.2)/2, y:1.45, w:4.2, h:4.2*RATIO });
s.addText("Master AI.", { x:0, y:3.78, w:W, h:1.1, fontFace:F, fontSize:54, bold:true, color: WHITE, align:"center", margin:0 });
s.addText("Learn to command AI — at its highest quality.", { x:0, y:4.95, w:W, h:0.6, fontFace:F, fontSize:22, color: TEALB, align:"center", margin:0 });
s.addText("DELTA AI ACADEMY", { x:0, y:6.6, w:W, h:0.4, fontFace:F, fontSize:13, bold:true, color: SUBD, charSpacing:4, align:"center", margin:0 });

// ============ S2 — The opportunity ============
s = p.addSlide(); lightBg(s);
kicker(s, "The Opportunity", 0.85, 0.85);
s.addText("Meet your 24/7 AI assistant.", { x:0.8, y:1.35, w:7.4, h:1.6, fontFace:F, fontSize:40, bold:true, color: INK, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.0 });
s.addText(
  "An assistant that works anytime, anywhere, on almost any task — and guides you even when you don't know where to start.\n\nThat assistant already exists: Artificial Intelligence.",
  { x:0.85, y:3.5, w:6.7, h:3.0, fontFace:F, fontSize:21, color: SUB, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.25 });
// right card
s.addShape("roundRect", { x:8.5, y:2.05, w:4.0, h:3.6, rectRadius:0.22, fill:{ color: NAVY }, line:{ type:"none" }, shadow:{ type:"outer", color:"0A2540", blur:14, offset:5, opacity:0.25 } });
s.addText("24/7", { x:8.5, y:2.95, w:4.0, h:1.4, fontFace:F, fontSize:72, bold:true, color: TEALB, align:"center", valign:"middle", margin:0 });
s.addText("Anytime · Anywhere · Any task", { x:8.5, y:4.5, w:4.0, h:0.5, fontFace:F, fontSize:16, color: WHITE, align:"center", margin:0 });

// ============ S3 — Mission ============
s = p.addSlide(); lightBg(s);
kicker(s, "Meet Delta AI Academy", 0.85, 0.8);
s.addText("We teach you to control, guide,\nand master AI.", { x:0.8, y:1.3, w:11.6, h:1.7, fontFace:F, fontSize:38, bold:true, color: INK, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.02 });
const goals = ["Master AI","Scale your skills","Boost your productivity","Turn big tasks into small ones","Build your own AI workflows & assistants"];
const col1 = goals.slice(0,3), col2 = goals.slice(3);
col1.forEach((g,i)=> checkRow(s, 0.9, 3.5 + i*0.92, g));
col2.forEach((g,i)=> checkRow(s, 6.95, 3.96 + i*0.92, g));   // 2 rows centered against the 3-row column

// ============ S4 — Three Phases divider ============
s = p.addSlide(); darkBg(s);
s.addText("THE ACADEMY STRUCTURE", { x:0, y:2.05, w:W, h:0.4, fontFace:F, fontSize:14, bold:true, color: TEALB, charSpacing:3, align:"center", margin:0 });
s.addText("Three Phases.", { x:0, y:2.5, w:W, h:1.4, fontFace:F, fontSize:64, bold:true, color: WHITE, align:"center", margin:0 });
const phs = [["01","Software"],["02","Creative"],["03","Automation"]];
phs.forEach((ph,i)=>{
  const cw=2.7, gap=0.7, total=cw*3+gap*2, x0=(W-total)/2 + i*(cw+gap);
  s.addText(ph[0], { x:x0, y:4.5, w:cw, h:0.9, fontFace:F, fontSize:40, bold:true, color: TEALB, align:"center", margin:0 });
  s.addText(ph[1], { x:x0, y:5.35, w:cw, h:0.5, fontFace:F, fontSize:18, color: SUBD, align:"center", margin:0 });
});

// ============ phase helper ============
function phaseSlide(num, label, title, bullets, cardWord){
  const s = p.addSlide(); lightBg(s);
  kicker(s, label, 0.85, 0.8);
  s.addText(title, { x:0.8, y:1.3, w:7.4, h:1.7, fontFace:F, fontSize:38, bold:true, color: INK, align:"left", valign:"top", margin:0, lineSpacingMultiple:1.02 });
  bullets.forEach((b,i)=> bullet(s, 0.9, 3.45 + i*0.95, b, 6.5));
  // right number card
  s.addShape("roundRect", { x:8.7, y:1.7, w:3.8, h:4.0, rectRadius:0.22, fill:{ color: NAVY }, line:{ type:"none" }, shadow:{ type:"outer", color:"0A2540", blur:14, offset:5, opacity:0.25 } });
  s.addText(num, { x:8.7, y:2.2, w:3.8, h:1.8, fontFace:F, fontSize:120, bold:true, color: TEALB, align:"center", margin:0 });
  s.addText(cardWord, { x:8.7, y:4.35, w:3.8, h:0.6, fontFace:F, fontSize:20, bold:true, color: WHITE, align:"center", charSpacing:1, margin:0 });
  return s;
}

// ============ S5 — Phase 1 ============
s = phaseSlide("01", "Phase One · Software",
  "Build software without code.",
  ["Production-ready apps, websites & SaaS","Your ideas — built anytime you want","No agencies, no waiting, no extra charges"],
  "SOFTWARE");
// cost callout under bullets
s.addText("₹1,00,000+  →  a fraction of the cost", { x:0.9, y:6.35, w:7.4, h:0.6, fontFace:F, fontSize:22, bold:true, color: TEAL, align:"left", margin:0 });

// ============ S6 — Phase 2 ============
phaseSlide("02", "Phase Two · Creative",
  "Marketing, video & motion graphics.",
  ["Ads & marketing campaigns","Videos & motion graphics","Cinematic-quality content — faster"],
  "CREATIVE");

// ============ S7 — Phase 3 ============
phaseSlide("03", "Phase Three · Systems",
  "Automation & workflow systems.",
  ["Automate repetitive daily tasks","Intelligent, time-saving workflows","Built on your Phase 1 skills"],
  "SYSTEMS");

// ============ S8 — By the numbers ============
s = p.addSlide(); lightBg(s);
kicker(s, "By the Numbers", 0.85, 0.85);
s.addText("Why it matters.", { x:0.8, y:1.35, w:11, h:1.0, fontFace:F, fontSize:40, bold:true, color: INK, align:"left", margin:0 });
const stats = [["3","Phases to master"],["100%","No-code build"],["24/7","AI on demand"],["₹1L+","Saved vs agencies"]];
stats.forEach((st,i)=>{
  const cw=2.85, gap=0.4, total=cw*4+gap*3, x0=(W-total)/2 + i*(cw+gap);
  s.addShape("roundRect", { x:x0, y:3.2, w:cw, h:2.9, rectRadius:0.18, fill:{ color: WHITE }, line:{ color:"DCEAE6", width:1 }, shadow:{ type:"outer", color:"9DBDB6", blur:10, offset:4, opacity:0.18 } });
  s.addText(st[0], { x:x0, y:3.55, w:cw, h:1.5, fontFace:F, fontSize:54, bold:true, color: TEAL, align:"center", valign:"middle", margin:0 });
  s.addText(st[1], { x:x0+0.15, y:5.2, w:cw-0.3, h:0.6, fontFace:F, fontSize:16, color: SUB, align:"center", margin:0 });
});

// ============ S9 — Finale ============
s = p.addSlide(); darkBg(s);
s.addText("The future is at your fingertips.", { x:1.0, y:2.5, w:11.3, h:1.8, fontFace:F, fontSize:50, bold:true, color: WHITE, align:"center", margin:0, lineSpacingMultiple:1.05 });
s.addText("The AI era has already started — it's happening right now.", { x:1.0, y:4.3, w:11.3, h:0.6, fontFace:F, fontSize:20, color: SUBD, align:"center", margin:0 });
s.addText("Ready to learn, adapt, and scale?", { x:1.0, y:5.1, w:11.3, h:0.7, fontFace:F, fontSize:26, bold:true, color: TEALB, align:"center", margin:0 });

// ============ S10 — Closing ============
s = p.addSlide(); darkBg(s);
s.addImage({ path: LOGOW, x:(W-4.0)/2, y:1.7, w:4.0, h:4.0*RATIO });
s.addText("Welcome aboard.", { x:0, y:4.05, w:W, h:1.0, fontFace:F, fontSize:46, bold:true, color: WHITE, align:"center", margin:0 });
s.addText("Start your AI journey today  ·  deltaaiacademy.com", { x:0, y:5.2, w:W, h:0.6, fontFace:F, fontSize:18, color: TEALB, align:"center", margin:0 });

p.writeFile({ fileName: "output/Delta-AI-Academy.pptx" }).then(f => console.log("saved", f));
