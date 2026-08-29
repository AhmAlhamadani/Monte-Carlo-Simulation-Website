import { Document, ImageRun, Packer, Paragraph, TextRun } from "docx";
import type { Analysis } from "../types";
import type { SimulationResult } from "../lib/monte-carlo";
import { formatPct, summariseResults, type CountBar } from "./summary";

export async function exportResultsDocx(analysis: Analysis, result: SimulationResult) {
  const { chartData, mostLikely, oneOrMore, twoOrMore } = summariseResults(result);
  const title = analysis.name.trim() || "Untitled analysis";
  const png = await chartPng(chartData);

  const doc = new Document({
    creator: "NHS PercentAbnormK",
    title: `PercentAbnormK – ${title}`,
    sections: [{
      children: [
        p("Results", { bold: true, color: "005EB6", size: 32 }),
        p(title, { bold: true, size: 26 }),
        p(`${analysis.percentile}th percentile · z = ${result.threshold.toFixed(2)} · ${analysis.numTests} tests · ${result.iterations.toLocaleString()} simulations`, { italics: true, color: "5C6A70" }),
        p(`${formatPct(oneOrMore)}% chance of 1 or more low scores by chance.`),
        p(`${formatPct(twoOrMore)}% chance of 2 or more low scores by chance.`),
        p(`Most likely count: ${mostLikely.k} (${formatPct(mostLikely.pct)}% of the time).`),
        p("Chance of this many or more low scores", { bold: true, color: "005EB6" }),
        new Paragraph({
          children: [new ImageRun({
            type: "png",
            data: png,
            transformation: { width: 540, height: 288 },
            altText: { name: "Results chart", description: "Chance of k or more low scores" },
          })],
        }),
        ...(analysis.notes.trim() ? [p(`Notes: ${analysis.notes}`, { italics: true, color: "5C6A70" })] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `PercentAbnormK-${title.replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, "-").slice(0, 60)}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function p(text: string, run: { bold?: boolean; size?: number; italics?: boolean; color?: string } = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, ...run })],
  });
}

function chartPng(data: CountBar[]): Promise<Uint8Array> {
  const W = 1200, H = 640, L = 88, T = 40, R = 24, B = 64;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Could not draw chart"));

  const plotW = W - L - R, plotH = H - T - B;
  const yMax = Math.min(100, Math.max(10, Math.ceil(Math.max(...data.map((d) => d.atLeastPct), 1) / 10) * 10));
  const n = Math.max(data.length, 1);
  const barW = Math.min(72, plotW / n - 12);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.font = "22px sans-serif";
  ctx.strokeStyle = "#d8dde0";
  for (let i = 0; i <= 4; i++) {
    const t = (yMax * i) / 4;
    const y = T + plotH - (t / yMax) * plotH;
    ctx.beginPath();
    ctx.moveTo(L, y);
    ctx.lineTo(W - R, y);
    ctx.stroke();
    ctx.fillStyle = "#5c6a70";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(t)}%`, L - 10, y);
  }

  data.forEach((d, i) => {
    const x = L + (plotW / n) * i + (plotW / n - barW) / 2;
    const h = (d.atLeastPct / yMax) * plotH;
    const y = T + plotH - h;
    ctx.fillStyle = "#005eb6";
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = "#5c6a70";
    ctx.textAlign = "center";
    if (d.atLeastPct >= 0.5) {
      ctx.textBaseline = "bottom";
      ctx.fillText(`${d.atLeastPct.toFixed(0)}%`, x + barW / 2, y - 4);
    }
    ctx.textBaseline = "top";
    ctx.fillText(d.label, x + barW / 2, T + plotH + 10);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Could not create chart image"));
      else void blob.arrayBuffer().then((b) => resolve(new Uint8Array(b)), reject);
    }, "image/png");
  });
}
