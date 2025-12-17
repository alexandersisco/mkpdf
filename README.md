# md2pdf

## Overview

md2pdf is a command-line tool for converting Markdown files into PDFs using HTML rendering and CSS styling. It produces consistent, high-quality PDFs by running Puppeteer inside Docker.

## Quick Start

```
git clone <repo-url>
cd md2pdf
ln -s "$(pwd)/scripts/mkpdf.sh" /usr/local/bin/md2pdf

md2pdf README.md "My Document"
```

> Requirements: Docker must be installed and running.

## Installation

Clone the repository and create a symbolic link to the script from a directory in your PATH:

```
git clone <repo-url>
cd md2pdf
ln -s "$(pwd)/scripts/mkpdf.sh" /usr/local/bin/md2pdf
```

## Usage

### Basic usage
```
md2pdf -f <markdown-file-path> -t <pdf-title>
```

- <markdown-file>: Path to the Markdown file
- <pdf-title>: Title embedded in the PDF

## Custom CSS
```
md2pdf -f <markdown-file-path> -t <pdf-title> -s <css-file-path>
```

## How It Works

- Markdown is rendered to HTML and converted to PDF using Puppeteer.
- Docker encapsulates the Puppeteer runtime to ensure consistent output across environments.
- The mkpdf.sh script communicates with Puppeteer via a lightweight HTTP server using curl.

Requirements

- Docker
- POSIX-compatible shell
- curl
