import express from "express";
import { marked } from "marked";
import puppeteer from "puppeteer";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/convert", async (req: any, res: any) => {
  try {
    const body = req.body as {
      markdown?: string;
      title?: string;
      css?: string;
    };

    let markdown = body.markdown;
    let title = body.title;
    let css = body.css;

    if (!markdown) {
      res.status(400).json({ error: "Markdown content is missing" });
      return;
    }

    const pdfBuffer = await convertMarkdownToPdf(
      markdown,
      title || "Resume",
      css,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=output.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error converting Markdown to PDF");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PDF service is running on port ${PORT}`);
});

async function convertMarkdownToPdf(
  markdown: string,
  title: string,
  css?: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  const htmlContent = await marked.parse(markdown);

  const html = buildHtml({
    title,
    body: htmlContent,
    customCss: css,
  });

  let browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      printBackground: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

function buildHtml(opts: {
  title: string;
  body: string;
  customCss?: string;
}): string {
  const baseCss = `
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 2rem;
      line-height: 1.6;
      font-size: 14px;
    }
    h1, h2, h3, h4 {
      font-weight: 600;
      margin-top: 1.5em;
    }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.6rem; }
    h3 { font-size: 1.3rem; }
    code {
      font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    pre code {
      display: block;
      padding: 1em;
      overflow-x: auto;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2em 0;
    }
    .toc {
      border: 1px solid #ddd;
      padding: 1rem;
      margin-bottom: 2rem;
      background: #fafafa;
    }
    .toc h2 {
      margin-top: 0;
    }
    .toc ul {
      list-style: none;
      padding-left: 0;
    }
    .toc li {
      margin-bottom: 0.25rem;
    }
  `;

  const css = baseCss + (opts.customCss ?? "");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(opts.title)}</title>
        <style>${css}</style>
      </head>
      <body>
        ${opts.body}
      </body>
    </html>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
