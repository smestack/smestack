# Skill-Guide systeem

Een klein generator-systeempje om voor elke skill die je aanmaakt een
klantvriendelijke installatie-handleiding te maken — met dezelfde look-and-feel,
ingebedde screenshots, en zonder dat je elke keer in HTML hoeft te knutselen.

Eén JSON per skill → één zelfstandig HTML-bestand uit, klaar om op je site te
plakken of als losse pagina te delen.

## Hoe je een nieuwe guide maakt

1. **Maak een mapje** voor de skill onder `skills/`, bijvoorbeeld
   `skills/quickbooks-monthly-report/`.
2. **Zet je screenshots** in een submap `screenshots/` daarbinnen, met
   beschrijvende namen (`step-login.png`, `step-export.png`, …).
3. **Kopieer** `skills/moneybird-payment-reminders/skill.json` naar die nieuwe
   map en pas hem aan: titel, sub-titel, data-flow (Bron → Systeem →
   Bestemming), benodigdheden, stappen, screenshots, FAQ, footer.
4. **Genereer** de HTML:
   ```bash
   python3 skill_guide.py skills/quickbooks-monthly-report/skill.json
   ```
   De output verschijnt naast het systeem-mapje, met de `slug` uit je JSON als
   bestandsnaam (of stem van het JSON-bestand als je geen `slug` opgeeft).
5. **Embed** het resultaat: open de HTML, of plak het body-blok
   (`<div class="mb-guide-root">…</div>` plus de `<style>` daaronder) in je
   website-CMS. Alle CSS is met `.mb-guide-root` geprefixt zodat het je
   bestaande pagina-styling niet stoort.

## Wat zit er in een `skill.json`?

```json
{
  "slug": "kort-bestandsnaam-zonder-extensie",
  "lang": "nl",
  "title_tag": "Wat in de browser-tab komt te staan",

  "hero": {
    "estimated_time_label": "Klaar in ongeveer 5 minuten",
    "title": "Hoofdtitel van de guide",
    "subtitle": "Een vriendelijke ondertitel die spanning wegneemt."
  },

  "sections": [
    { "type": "section", "heading": "...",
      "paragraphs": ["..."], "card_items": ["..."],
      "callout": { "type": "info", "title": "...", "body": "..." } },

    { "type": "flow", "nodes": [
        { "title": "Moneybird",   "subtitle": "open facturen" },
        { "title": "Ons systeem", "subtitle": "checkt dagelijks" },
        { "title": "Outlook",     "subtitle": "stuurt herinnering" }
      ] },

    { "type": "step", "number": 1, "title": "...",
      "paragraphs": ["..."], "ordered_list": ["..."],
      "screenshot": { "src": "screenshots/foo.jpg",
                      "alt": "...", "caption": "..." },
      "callout": { "type": "warn", "title": "...", "body": "..." } },

    { "type": "faq", "heading": "Veelgestelde vragen",
      "items": [ { "q": "...", "a": "..." } ] }
  ],

  "footer": "Korte disclaimer of credits."
}
```

Sections worden gerenderd in de volgorde waarin je ze opschrijft. Combineer ze
zoals het past bij de skill — je kunt evenveel `step`-blokken hebben als je
wilt, meerdere `flow`-diagrammen, meerdere `section`-blokken voor extra uitleg,
enzovoort.

### Inline-tekst-syntax

Binnen elk tekstveld (`paragraphs`, `card_items`, `ordered_list`, callout
`body`, captions, FAQ vragen/antwoorden) kun je drie korte markeringen
gebruiken:

| Schrijf je…    | Krijg je…                                           |
|----------------|-----------------------------------------------------|
| `**vet**`      | **vet**                                             |
| `*cursief*`    | *cursief*                                           |
| `` `Knop` ``   | `Knop` (UI-knop-stijl, "pill")                     |
| Een nieuwe regel binnen één string | regel-einde (`<br>`)            |

HTML-tags die je per ongeluk in je JSON zet worden veilig geescaped (om
prompt-injectie of layout-ongelukken te voorkomen).

### Callouts

Drie kleuren beschikbaar:
- `"info"` — blauw, voor uitleg en context
- `"warn"` — geel, voor "let op" en valkuilen
- `"good"` — groen, voor afronding / handoff / succes

### Screenshots

Pad relatief aan het JSON-bestand. JPEG/PNG/GIF/WebP worden allemaal
ondersteund. Wordt automatisch base64-ingebed in de HTML, dus je hoeft op je
website niets aan asset-paden te doen.

## Huisstijl aanpassen

Alle visuele tokens (kleuren, radii, schaduwen, lettertype) zitten in het
`STYLESHEET`-blok bovenaan `skill_guide.py` als CSS custom properties. Pas die
één keer aan, regenereer al je guides, en ze zien er allemaal uit volgens je
nieuwe huisstijl.

## Foutmeldingen

Het script geeft duidelijke fouten terug als er iets mist:
```
Fout in skill-bestand: step 4 screenshot: ontbrekend veld 'src'
```
Niets wordt half-opgeleverd; bij een fout wordt er geen HTML weggeschreven.
