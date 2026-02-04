// SPDX-License-Identifier: GPL-3.0-or-later
// Flashbar - GNOME Shell Extension

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const FlashbarToggle = GObject.registerClass(
class FlashbarToggle extends QuickSettings.QuickToggle {
    constructor(extensionObject) {
        super({
            title: _('Flashbar'),
            subtitle: _('Reminder'),
            iconName: 'alarm-symbolic',
            toggleMode: true,
        });

        this._extensionObject = extensionObject;
        this._settings = extensionObject.getSettings();

        this._settings.bind(
            'timer-enabled',
            this,
            'checked',
            Gio.SettingsBindFlags.DEFAULT
        );
    }
});

const FlashbarIndicator = GObject.registerClass(
class FlashbarIndicator extends QuickSettings.SystemIndicator {
    constructor(extensionObject) {
        super();

        this._extensionObject = extensionObject;
        this._settings = extensionObject.getSettings();
        this._flashSourceId = null;

        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'alarm-symbolic';
        this._indicator.add_style_class_name('flashbar-indicator');

        this._settings.bind(
            'show-indicator',
            this._indicator,
            'visible',
            Gio.SettingsBindFlags.DEFAULT
        );

        this._timerEnabledId = this._settings.connect(
            'changed::timer-enabled',
            () => this._updateIndicatorStyle()
        );
        this._updateIndicatorStyle();

        const toggle = new FlashbarToggle(extensionObject);
        this.quickSettingsItems.push(toggle);
    }

    _updateIndicatorStyle() {
        const enabled = this._settings.get_boolean('timer-enabled');
        if (enabled) {
            this._indicator.remove_style_class_name('flashbar-indicator-inactive');
            this._indicator.add_style_class_name('flashbar-indicator-active');
        } else {
            this._indicator.remove_style_class_name('flashbar-indicator-active');
            this._indicator.add_style_class_name('flashbar-indicator-inactive');
        }
    }

    flashIndicator(duration, count) {
        this.stopIndicatorFlash();

        let flashNum = 0;
        const halfDuration = Math.max(50, duration / 2);

        const doFlash = () => {
            if (flashNum >= count * 2) {
                this._indicator.remove_style_class_name('flashbar-indicator-flash');
                this._flashSourceId = null;
                return GLib.SOURCE_REMOVE;
            }

            if (flashNum % 2 === 0) {
                this._indicator.add_style_class_name('flashbar-indicator-flash');
            } else {
                this._indicator.remove_style_class_name('flashbar-indicator-flash');
            }
            flashNum++;
            return GLib.SOURCE_CONTINUE;
        };

        this._flashSourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            halfDuration,
            doFlash
        );
    }

    stopIndicatorFlash() {
        if (this._flashSourceId) {
            GLib.Source.remove(this._flashSourceId);
            this._flashSourceId = null;
        }
        this._indicator.remove_style_class_name('flashbar-indicator-flash');
    }

    destroy() {
        if (this._timerEnabledId) {
            this._settings.disconnect(this._timerEnabledId);
            this._timerEnabledId = null;
        }
        this.stopIndicatorFlash();
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class FlashbarExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._indicator = new FlashbarIndicator(this);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        this._timerSourceId = null;
        this._flashSourceId = null;

        this._settingsConnections = [];

        this._settingsConnections.push(
            this._settings.connect('changed::timer-enabled', () => this._onTimerEnabledChanged())
        );
        this._settingsConnections.push(
            this._settings.connect('changed::flash-interval', () => this._restartTimerIfEnabled())
        );

        if (this._settings.get_boolean('timer-enabled')) {
            this._startTimer();
        }
    }

    disable() {
        this._stopTimer();
        this._stopFlash();

        if (this._settingsConnections) {
            this._settingsConnections.forEach(id => {
                this._settings.disconnect(id);
            });
            this._settingsConnections = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._removePanelFlashClass();

        this._settings = null;
    }

    _onTimerEnabledChanged() {
        if (this._settings.get_boolean('timer-enabled')) {
            this._startTimer();
        } else {
            this._stopTimer();
        }
    }

    _restartTimerIfEnabled() {
        if (this._settings.get_boolean('timer-enabled')) {
            this._stopTimer();
            this._startTimer();
        }
    }

    _startTimer() {
        if (this._timerSourceId) return;

        const intervalSecs = this._settings.get_int('flash-interval');

        this._timerSourceId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            intervalSecs,
            () => {
                this._triggerFlash();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopTimer() {
        if (this._timerSourceId) {
            GLib.Source.remove(this._timerSourceId);
            this._timerSourceId = null;
        }
    }

    _triggerFlash() {
        const flashMode = this._settings.get_int('flash-mode');
        const duration = this._settings.get_int('flash-duration');
        const count = this._settings.get_int('flash-count');

        if (flashMode === 0) {
            this._flashTopBar(duration, count);
        } else {
            this._indicator.flashIndicator(duration, count);
        }
    }

    _flashTopBar(duration, count) {
        this._stopFlash();

        const panel = Main.panel;
        let flashNum = 0;
        const halfDuration = Math.max(50, duration / 2);

        const doFlash = () => {
            if (flashNum >= count * 2) {
                this._removePanelFlashClass();
                this._flashSourceId = null;
                return GLib.SOURCE_REMOVE;
            }

            if (flashNum % 2 === 0) {
                panel.add_style_class_name('flashbar-flash');
            } else {
                panel.remove_style_class_name('flashbar-flash');
            }
            flashNum++;
            return GLib.SOURCE_CONTINUE;
        };

        this._flashSourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            halfDuration,
            doFlash
        );
    }

    _stopFlash() {
        if (this._flashSourceId) {
            GLib.Source.remove(this._flashSourceId);
            this._flashSourceId = null;
        }
        this._removePanelFlashClass();
        if (this._indicator) {
            this._indicator.stopIndicatorFlash();
        }
    }

    _removePanelFlashClass() {
        if (Main.panel) {
            Main.panel.remove_style_class_name('flashbar-flash');
        }
    }
}
