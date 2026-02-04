// SPDX-License-Identifier: GPL-3.0-or-later
// Flashbar - Preferences

import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

function cssToRgba(cssColor) {
    const rgba = new Gdk.RGBA();
    rgba.parse(cssColor);
    return rgba;
}

function rgbaToCss(rgba) {
    return `rgba(${Math.round(rgba.red * 255)}, ${Math.round(rgba.green * 255)}, ${Math.round(rgba.blue * 255)}, ${rgba.alpha})`;
}

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class FlashbarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // Timer Group
        const timerGroup = new Adw.PreferencesGroup({
            title: _('Timer'),
            description: _('Configure the flash reminder interval'),
        });
        page.add(timerGroup);

        const intervalRow = new Adw.SpinRow({
            title: _('Flash Interval'),
            subtitle: _('Time between flashes in seconds'),
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 3600,
                step_increment: 10,
                page_increment: 60,
                value: settings.get_int('flash-interval'),
            }),
        });
        timerGroup.add(intervalRow);
        settings.bind('flash-interval', intervalRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        // Flash Effect Group
        const flashGroup = new Adw.PreferencesGroup({
            title: _('Flash Effect'),
            description: _('Customize the visual flash effect'),
        });
        page.add(flashGroup);

        const flashModeModel = new Gtk.StringList();
        flashModeModel.append(_('Entire Top Bar'));
        flashModeModel.append(_('Indicator Only'));

        const flashModeRow = new Adw.ComboRow({
            title: _('Flash Mode'),
            subtitle: _('What should flash when the timer triggers'),
            model: flashModeModel,
            selected: settings.get_int('flash-mode'),
        });
        flashGroup.add(flashModeRow);

        flashModeRow.connect('notify::selected', () => {
            settings.set_int('flash-mode', flashModeRow.selected);
        });
        settings.connect('changed::flash-mode', () => {
            flashModeRow.selected = settings.get_int('flash-mode');
        });

        const durationRow = new Adw.SpinRow({
            title: _('Flash Duration'),
            subtitle: _('Duration of each flash cycle in milliseconds'),
            adjustment: new Gtk.Adjustment({
                lower: 100,
                upper: 2000,
                step_increment: 50,
                page_increment: 100,
                value: settings.get_int('flash-duration'),
            }),
        });
        flashGroup.add(durationRow);
        settings.bind('flash-duration', durationRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const countRow = new Adw.SpinRow({
            title: _('Flash Count'),
            subtitle: _('Number of flash cycles per trigger'),
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 10,
                step_increment: 1,
                page_increment: 1,
                value: settings.get_int('flash-count'),
            }),
        });
        flashGroup.add(countRow);
        settings.bind('flash-count', countRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        // Appearance Group
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Visual options'),
        });
        page.add(appearanceGroup);

        const indicatorRow = new Adw.SwitchRow({
            title: _('Show Panel Indicator'),
            subtitle: _('Display an icon in the top panel'),
        });
        appearanceGroup.add(indicatorRow);
        settings.bind('show-indicator', indicatorRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const colorDialog = new Gtk.ColorDialog({
            with_alpha: true,
        });

        const colorButton = new Gtk.ColorDialogButton({
            dialog: colorDialog,
            rgba: cssToRgba(settings.get_string('flash-color')),
            valign: Gtk.Align.CENTER,
        });

        const colorRow = new Adw.ActionRow({
            title: _('Flash Color'),
            subtitle: _('Color of the flash effect'),
        });
        colorRow.add_suffix(colorButton);
        colorRow.set_activatable_widget(colorButton);
        appearanceGroup.add(colorRow);

        const initialRgba = cssToRgba(settings.get_string('flash-color'));

        const opacityRow = new Adw.SpinRow({
            title: _('Flash Opacity'),
            subtitle: _('Transparency of the flash effect (0-100%)'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 5,
                page_increment: 10,
                value: Math.round(initialRgba.alpha * 100),
            }),
        });
        appearanceGroup.add(opacityRow);

        let updatingFromOpacity = false;
        let updatingFromColor = false;

        opacityRow.connect('notify::value', () => {
            if (updatingFromColor) return;
            updatingFromOpacity = true;
            const rgba = colorButton.rgba.copy();
            rgba.alpha = opacityRow.value / 100;
            colorButton.rgba = rgba;
            updatingFromOpacity = false;
        });

        colorButton.connect('notify::rgba', () => {
            settings.set_string('flash-color', rgbaToCss(colorButton.rgba));
            if (!updatingFromOpacity) {
                updatingFromColor = true;
                opacityRow.adjustment.value = Math.round(colorButton.rgba.alpha * 100);
                updatingFromColor = false;
            }
        });

        settings.connect('changed::flash-color', () => {
            const newRgba = cssToRgba(settings.get_string('flash-color'));
            if (!colorButton.rgba.equal(newRgba)) {
                colorButton.rgba = newRgba;
            }
        });
    }
}
