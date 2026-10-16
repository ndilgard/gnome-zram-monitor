import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

const ZRAM_MM_STAT = "/sys/block/zram0/mm_stat";
const ZRAM_DISKSIZE = "/sys/block/zram0/disksize";
const UPDATE_INTERVAL_SECONDS = 3;

const ZramIndicator = GObject.registerClass(
	class ZramIndicator extends PanelMenu.Button {
		_init() {
			super._init(0.0, "ZRAM Monitor", true);

			this._label = new St.Label({
				text: "zram: --",
				y_align: Clutter.ActorAlign.CENTER,
			});
			this.add_child(this._label);

			this._timeoutId = null;
			this._update();
		}

		_update() {
			this._label.set_text(this._readStats());

			this._timeoutId = GLib.timeout_add_seconds(
				GLib.PRIORITY_DEFAULT,
				UPDATE_INTERVAL_SECONDS,
				() => {
					this._update();
					return GLib.SOURCE_REMOVE;
				},
			);
		}

		_readStats() {
			try {
				const [ok, contents] = GLib.file_get_contents(ZRAM_MM_STAT);
				if (!ok) return "zram: n/a";

				// mm_stat fields: orig_data_size compr_data_size mem_used_total
				// mem_limit mem_used_max same_pages pages_compacted huge_pages ...
				const fields = new TextDecoder()
					.decode(contents)
					.trim()
					.split(/\s+/)
					.map(Number);
				const [origSize, comprSize, memUsedTotal] = fields;

				if (!origSize || !comprSize) return "zram: idle";

				const ratio = (origSize / comprSize).toFixed(2);
				const memUsedMiB = Math.round(memUsedTotal / 1024 / 1024);

				let percentText = "";
				const [diskOk, diskContents] = GLib.file_get_contents(ZRAM_DISKSIZE);
				if (diskOk) {
					const diskSize = Number(
						new TextDecoder().decode(diskContents).trim(),
					);
					if (diskSize > 0) {
						const percent = ((memUsedTotal / diskSize) * 100).toFixed(1);
						percentText = ` ${percent}%`;
					}
				}

				return `zram: ${memUsedMiB}MiB (${ratio}x)${percentText}`;
			} catch (e) {
				return "zram: n/a";
			}
		}

		destroy() {
			if (this._timeoutId) {
				GLib.source_remove(this._timeoutId);
				this._timeoutId = null;
			}
			super.destroy();
		}
	},
);

export default class ZramMonitorExtension extends Extension {
	enable() {
		this._indicator = new ZramIndicator();
		Main.panel.addToStatusArea(this.uuid, this._indicator);
	}

	disable() {
		this._indicator?.destroy();
		this._indicator = null;
	}
}
