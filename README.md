# Church Ministry

Official hub site for Allen Vincent Lucas's church tech and worship ministry projects.

- **[Tech Worship Academy](tech-worship-academy/index.html)** — AV volunteer training (OBS, Zoom, FreeShow, PowerPoint, Google Slides, X32/L12 mixers)
- **[Ten Minutes with the Gospel](ten-minutes-with-the-gospel/index.html)** — Daily Gospel reflections
- **[Worship Chord Library](worship-chord-library/site/index.html)** — ChordPro chart generator and song catalog

## Structure

```
/                              landing/hub page
/_shared/theme.css             shared brand tokens (Paper/Ink/Index Blue/Stone + fonts)
/tech-worship-academy/         training site (static HTML)
/ten-minutes-with-the-gospel/  daily reflection site (static HTML)
/worship-chord-library/        song catalog (Node build pipeline -> /worship-chord-library/site/)
```

Each project retains its own commit history from before the merge. All three now share
one brand theme (Paper #FAF9F6, Ink #191B1F, Index Blue #2A4B8D, Stone #84806F;
Space Grotesk / Inter / JetBrains Mono).

## Worship Chord Library build

The chord library is generated, not static. After editing `.cho` files in
`worship-chord-library/songs/`, rebuild with:

```
cd worship-chord-library
npm install
npm run build
```

## Deployment

Served via GitHub Pages from the repository root of the `main` branch.
