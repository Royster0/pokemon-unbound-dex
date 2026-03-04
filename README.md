# Unbound Pokedex

A TanStack Start app for browsing and searching Pokemon data sourced from Pokemon Unbound `.c` files.

## Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`

## Unified Data Scripts

Scrape Pokemon IDs from Ydarissep Unbound Pokedex sources:

```bash
npm run data:scrape-ids
```

Build a single-source catalog JSON:

```bash
npm run data:build
```

`data:build` reads `public/pokemon_ids.json` and `scripts/sources/Base_Stats.c` to include IDs, types, abilities, egg groups, held items, growth rate, and catch rate in `public/pokedex_catalog.json`.

Validate catalog shape and consistency:

```bash
npm run data:validate
```

Run both steps in sequence:

```bash
npm run data:refresh
```

Recommended refresh flow:

```bash
npm run data:scrape-ids
npm run data:refresh
```

Default outputs:
- `public/pokemon_ids.json` from `data:scrape-ids`
- `public/pokedex_catalog.json` from `data:build`
