

## Plan: Update PWA Icons and Configuration

### Steps

1. **Copy uploaded icons to `/public`**
   - `user-uploads://icon-512.png` → `public/icon-512.png`
   - `user-uploads://icon-192.png` → `public/icon-192.png`
   - `user-uploads://apple-touch-icon.png` → `public/apple-touch-icon.png`

2. **Update `public/manifest.json`**
   - Change icon `src` paths to `/icon-192.png` and `/icon-512.png`
   - Set `theme_color` to `#8B0000`
   - Set `background_color` to `#0f1923`

3. **Update `index.html`**
   - Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   - Add `<link rel="icon" href="/icon-512.png">`

