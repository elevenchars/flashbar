# Flashbar

GNOME Shell extension that flashes the top bar or a panel indicator at configurable intervals as a visual reminder.

## Features

- Configurable flash interval
- Two flash modes: entire top bar or indicator only
- Customizable flash color, duration, and count
- Quick settings toggle integration
- Panel indicator with active/inactive state

## Installation

1. Clone or download this repository
2. Copy to the GNOME extensions directory:
   ```bash
   cp -r . ~/.local/share/gnome-shell/extensions/flashbar@elevenchars.github.io/
   ```
3. Compile the settings schema:
   ```bash
   glib-compile-schemas schemas/
   ```
4. Restart GNOME Shell:
   - **X11:** Alt+F2, type `r`, press Enter
   - **Wayland:** Log out and back in
5. Enable the extension:
   ```bash
   gnome-extensions enable flashbar@elevenchars.github.io
   ```

## Settings

| Setting | Description |
|---------|-------------|
| Timer enabled | Start or stop the flash timer |
| Flash interval | Time between flashes in seconds (60–3600) |
| Flash mode | Entire top bar (0) or panel indicator only (1) |
| Flash duration | Length of each flash in milliseconds (100–2000) |
| Flash count | Number of flash cycles per trigger (1–10) |
| Flash color | CSS color value for the flash effect |
| Show indicator | Show an indicator icon in the top panel |
