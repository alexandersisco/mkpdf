#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Command } from "commander";
import { marked } from "marked";
import puppeteer from "puppeteer";

const program = new Command();

program
  .name("md2pdf")
  .description("Convert Markdown files to PDF")
  .version("1.0.0")
  .argument("<input>", "input Markdown file")
  .option("-o, --output <output>", "output PDF file")
  .action(async (input, options) => {
    const inputPath = path.resolve(process.cwd(), input);

    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`);
      process.exit(1);
    }

    if (options.output) {
      console.log(options.output);
    }
    console.log(inputPath, " <= ", input);

    const markdown = fs.readFileSync(inputPath, "utf-8");

    const htmlContent = marked.parse(markdown);

    console.log(htmlContent);
  });

program.parse(process.argv);
