import fs from "fs";
import path from "path";
import { Command } from "commander";
import { marked } from "marked";
import puppeteer from 'puppeteer';

const program = new Command();

program
  .name("md2pdf")
  .description("Convert Markdown files to PDF")
  .version("1.0.0")
  .argument("<input>", "input Markdown file")
  .option("-o, --output <output>", "output PDF file")
  .option("-t, --title <title>", "title of html document")
  .action(async (input, options) => {
    const inputPath = path.resolve(process.cwd(), input);

    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`);
      process.exit(1);
    }

    const markdown = fs.readFileSync(inputPath, "utf-8");

    const htmlContent = await marked.parse(markdown);

    const html = buildHtml({
      title: options.title || path.parse(inputPath).name,
      body: htmlContent,
    });

    const outputPath = getOutputPath(input, options.output);

    console.log(outputPath)
    //
    // fs.writeFileSync(outputPath, html);

    renderPdf(html, outputPath)
  });

program.parse(process.argv);

async function renderPdf(html: string, outputPath: string): Promise<void> {
  console.log("Launching Puppeteer...");
  let browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true
  });
  await browser.close()
}

function getOutputPath(input: string, output?: string) {
  if (output) {
    return path.resolve(process.cwd(), output);
  }

  const { dir, name } = path.parse(input);
  return `${dir}/${name}.html`;
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
