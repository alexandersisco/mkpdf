# mkpdf

mkpdf is a command-line tool for converting Markdown files into PDFs using HTML rendering and CSS styling. It produces consistent, high-quality PDFs by running Puppeteer inside Docker.

## Quick Start

```
git clone <repo-url>
cd mkpdf
ln -s "$(pwd)/scripts/mkpdf.sh" /usr/local/bin/mkpdf

mkpdf README.md
```

> Requirements: Docker must be installed and running.

## Installation

Clone the repository and create a symbolic link to the script from a directory in your PATH:

```
git clone <repo-url>
cd mkpdf
ln -s "$(pwd)/scripts/mkpdf.sh" /usr/local/bin/mkpdf
```

## Usage

### Basic usage
```
mkpdf <INPUT>
mkpdf <INPUT> --title "My PDF"
mkpdf <INPUT> --output docs/
```

### Custom CSS
```
mkpdf <INPUT> --css styles.css
```

## How It Works

- Markdown is rendered to HTML and converted to PDF using Puppeteer.
- Docker encapsulates the Puppeteer runtime to ensure consistent output across environments.
- The mkpdf.sh script communicates with Puppeteer via a lightweight HTTP server using curl.

## Requirements

- Docker
- POSIX-compatible shell
- curl
