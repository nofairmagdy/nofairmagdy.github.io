# Nofair Magdy — portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript with no build step and no dependencies, hosted on GitHub Pages.

Live site: https://nofairmagdy.github.io/

## Structure

```
index.html              All page content, including the project detail sheets
404.html                Not-found page
assets/css/styles.css   Styles (design tokens at the top of the file)
assets/js/main.js       Navigation, scroll spy, project sheets, copy-email
assets/js/rectifier.js  Interactive plate-rectification demo in the hero
assets/cv/              Place for the CV PDFs (empty for now)
assets/img/             Portrait, favicon, social preview image
assets/fonts/           Self-hosted fonts (Archivo, IBM Plex; SIL Open Font License)
robots.txt, sitemap.xml, site.webmanifest
```

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Update the content

Everything is in `index.html`. Edit the file, commit and push; GitHub Pages republishes within a minute or two.

- **CV downloads (currently switched off):** put `Nofair_Magdy_CV_EN.pdf` and `Nofair_Magdy_CV_DE.pdf` into `assets/cv/`, then search `index.html` for `hidden` next to the four CV links (navigation, hero, two in Contact) and delete that word. Anything in this repository is public, so use a CV version without home address and phone number.
- **New experience or education entry:** copy an existing `<li class="job">` or `<article class="edu">` block and change the text.
- **New project:** copy one `<article class="project">` block in the Projects section and one `<dialog class="sheet">` block near the end of the file. Give both a new id (`project-name`, `sheet-name`) and point the button's `data-sheet` attribute at the new sheet id. Add `class="project project-flip"` to put the figure on the right.
- **Skills:** edit the `<li>` items in the Skills section.
- **Colours and fonts:** change the variables under `:root` in `assets/css/styles.css`.

## Publish on GitHub Pages

1. Push this folder to the `main` branch of a public repository named `nofairmagdy.github.io`.
2. In the repository, open Settings → Pages and set the source to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site is served at https://nofairmagdy.github.io/ over HTTPS.

If the site moves to another address, update the absolute URLs in the `<head>` of `index.html` (canonical, Open Graph, JSON-LD) and in `robots.txt` and `sitemap.xml`.

## Notes

- The diagrams are drawn from the project repositories. The path plot in the evasive-manoeuvre project uses the repository's reference trajectory and a re-run of its tracking loop.
- The hero demo is a geometry demonstration of perspective rectification. It does not run a neural network.
- No analytics, cookies or third-party requests.
