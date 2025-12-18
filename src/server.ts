import express from "express";
import { marked } from "marked";
import puppeteer from "puppeteer";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/md-to-pdf", async (req: any, res: any) => {
  try {
    const body = req.body as {
      markdown?: string;
      title?: string;
      css?: string;
      js?: string;
    };

    let markdown = body.markdown;
    let title = body.title;
    let css = body.css;
    let js = body.js;

    if (!markdown) {
      res.status(400).json({ error: "Markdown content is missing" });
      return;
    }

    const baseCss = ''

    const pdfBuffer = await convertMarkdownToPdf(
      markdown,
      title || "No Title",
      baseCss,
      css,
      js
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=output.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error converting Markdown to PDF");
  }
});

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

    const baseCss = ''

    const pdfBuffer = await convertMarkdownToPdfOld(
      markdown,
      title || "No Title",
      baseCss,
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



app.post("/md-to-html", async (req: any, res: any) => {
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

    const baseCss = ''

    const html = await convertMarkdownToHtml(
      markdown,
      title || "No Title",
      baseCss,
      css,
    );

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", "inline; filename=index.html");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error converting Markdown to HTML");
  }
});

app.post("/html-to-pdf", async (req: any, res: any) => {
  try {
    const body = req.body as {
      html?: string;
    };

    let markdown = body.html;

    if (!markdown) {
      res.status(400).json({ error: "Markdown content is missing" });
      return;
    }

    const pdfBuffer = await convertHtmlToPdf(
      markdown
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

async function convertMarkdownToPdfOld(
  markdown: string,
  title: string,
  baseCss: string,
  css?: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  const htmlContent = await marked.parse(markdown);

  const html = buildHtml({
    title,
    body: htmlContent,
    baseCss: baseCss,
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

async function convertMarkdownToPdf(
  markdown: string,
  title: string,
  baseCss: string,
  css?: string,
  js?: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  const html = await convertMarkdownToHtml(
    markdown,
    title || "No Title",
    baseCss,
    css,
  );

  return await convertHtmlToPdf(html, js)
}

async function convertHtmlToPdf(
  html: string,
  js?: string,
): Promise<Uint8Array<ArrayBufferLike>> {
  let browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    console.log("About to check presence of script...")
    if (js) {
      console.log(js)
      await page.evaluate(js);
    }

    const pdf = await page.pdf({
      printBackground: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
}


async function convertMarkdownToHtml(
  markdown: string,
  title: string,
  baseCss: string,
  css?: string,
): Promise<string> {
  const htmlContent = await marked.parse(markdown);

  const html = buildHtml({
    title,
    body: htmlContent,
    baseCss: baseCss,
    customCss: css,
  });

  return html
}

function buildHtml(opts: {
  title: string;
  body: string;
  baseCss: string;
  customCss?: string;
}): string {
  const css = opts.baseCss + (opts.customCss ?? "");

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
