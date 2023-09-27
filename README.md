# Electron Custom Cursor

Set custom cursor for Windows 10/11 using PNG or SVG file.

## Tech Stack

- Electron v25.7.0
- Koffi v2.5.20 (for ffi call)
- Vite v4.4.9 (for bundling)

## Prepare

Install package using:
```bash
npm install
```

## Building

Make sure to list unused file in `electron-builder.yml` at `files`:

```yaml
files:
  - '!**/.vscode/*'
  - '!src/*'
  - '!dist/*'
  - '!temp/*'
  - '!*.{cur,zip}'
  - '!electron.vite.config.{js,ts,mjs,cjs}'
  - '!{.eslintignore,.eslintrc.js,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}'
  - '!{.env,.env.*,.npmrc,pnpm-lock.yaml}'
```

Then run this command:

```bash
npm run build
# or
pnpm build
```

The result will be output in `./dist` directory
