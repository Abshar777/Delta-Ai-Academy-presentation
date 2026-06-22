const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";
for (let i = 1; i <= 16; i++) {
  const s = p.addSlide();
  const n = String(i).padStart(2, "0");
  s.background = { color: "FBFDFE" };
  s.addImage({ path: `/tmp/scenes_ordered/${n}.jpg`, x: 0, y: 0, w: 13.333, h: 7.5 });
}
p.writeFile({ fileName: "output/Delta-AI-Academy-Keynote.pptx" }).then(f => console.log("saved", f));
