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
  .action(async (input, options) => {
    const inputPath = path.resolve(process.cwd(), input);

    console.log(inputPath, " <= ", input);
  });

program.parse(process.argv);
