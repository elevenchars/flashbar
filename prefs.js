// SPDX-License-Identifier: GPL-3.0-or-later
// Flashbar - Preferences

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

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

        const colorRow = new Adw.EntryRow({
            title: _('Flash Color'),
            text: settings.get_string('flash-color'),
        });
        appearanceGroup.add(colorRow);

        colorRow.connect('changed', () => {
            const text = colorRow.text;
            if (text.match(/^(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\))$/)) {
                settings.set_string('flash-color', text);
            }
        });

        settings.connect('changed::flash-color', () => {
            const newColor = settings.get_string('flash-color');
            if (colorRow.text !== newColor) {
                colorRow.text = newColor;
            }
        });
    }
}
