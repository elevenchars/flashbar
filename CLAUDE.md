# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GNOME Shell extension (UUID: `flashbar@elevenchars.github.io`) that flashes the top bar or a panel indicator at configurable intervals as a visual reminder. Supports GNOME Shell versions 45-48.

## Installation & Development

```bash
# Install to GNOME extensions directory
cp -r . ~/.local/share/gnome-shell/extensions/flashbar@elevenchars.github.io/

# Recompile schemas after modifying gschema.xml
glib-compile-schemas schemas/

# Restart GNOME Shell to reload extension
# X11: Alt+F2, type 'r', Enter
# Wayland: Log out and back in

# View extension logs
journalctl -f -o cat /usr/bin/gnome-shell
```

## Architecture

- **extension.js** - Main extension with three classes:
  - `FlashbarExtension` - Lifecycle management (enable/disable), timer loop
  - `FlashbarIndicator` - System indicator in quick settings panel
  - `FlashbarToggle` - Quick settings toggle button

- **prefs.js** - Adwaita preferences window with timer, flash effect, and appearance settings

- **schemas/** - GSettings schema defining 8 configuration keys (timer-enabled, flash-interval, flash-mode, flash-duration, flash-count, flash-color, show-indicator)

- **stylesheet.css** - CSS classes for flash animations applied to top bar or indicator

## Key Patterns

- Timer uses `GLib.timeout_add_seconds()` with settings-driven interval
- Flash effect cycles via recursive `GLib.timeout_add()` calls
- Settings changes auto-apply via `settings.connect('changed::key-name', callback)`
- Two flash modes: 0 = top bar panel, 1 = indicator only

## Documentation Resources

The gjs.guide website (https://gjs.guide/) is pre-approved for WebFetch and provides GObject introspection API documentation for GNOME Shell extension development.
