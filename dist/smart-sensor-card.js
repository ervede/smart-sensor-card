/*
 * smart-sensor-card
 * A Mushroom-template-card look-alike that picks icon, color, text and badge
 * from the sensor's device_class. Works with a single entity, or with a group
 * selected by label and/or area (e.g. all living room motion sensors).
 *
 * Requires: Mushroom (mushroom-template-card) installed.
 */

const CARD_TYPE = "smart-sensor-card";
const VERSION = "0.6.1";
console.info(`%c SMART-SENSOR-CARD %c v${VERSION} `, "background:#03a9f4;color:#fff", "");
const UNAVAILABLE = ["unavailable", "unknown"];

const toArray = (v) =>
  v === undefined || v === null || v === "" ? [] : Array.isArray(v) ? v : [v];

/* accept configs where group fields were nested under `group:` */
const normalize = (config) => {
  const { group, ...rest } = config || {};
  return group && typeof group === "object" ? { ...rest, ...group } : rest;
};

/* ---------- profiles ---------- */

const BINARY = {
  door: {
    primary: "Door",
    on: "Open",
    off: "Closed",
    iconOn: "mdi:door-open",
    iconOff: "mdi:door",
    colorOn: "brown",
  },
  window: {
    primary: "Window",
    on: "Open",
    off: "Closed",
    iconOn: "mdi:window-open-variant",
    iconOff: "mdi:window-closed-variant",
    colorOn: "blue",
    colorOff: "#666666",
  },
  motion: {
    on: "Detected",
    off: "Clear",
    iconOn: "mdi:motion-sensor",
    iconOff: "mdi:motion-sensor-off",
    colorOn: "red",
    colorOff: "#666666",
  },
  moisture: {
    on: "Wet",
    off: "Dry",
    iconOn: "mdi:water",
    iconOff: "mdi:water-off",
    colorOn: "blue",
    colorOff: "#666666",
  },
  smoke: {
    on: "Smoke",
    off: "Clear",
    iconOn: "mdi:smoke-detector-variant-alert",
    iconOff: "mdi:smoke-detector-variant",
    colorOn: "red",
    colorOff: "#666666",
  },
  default: {
    on: "On",
    off: "Off",
    iconOn: "mdi:checkbox-marked-circle",
    iconOff: "mdi:checkbox-blank-circle-outline",
    colorOn: "amber",
    colorOff: "#666666",
  },
};
BINARY.opening = { ...BINARY.window, primary: "" };
BINARY.occupancy = BINARY.motion;
BINARY.presence = BINARY.motion;

const NUMERIC = {
  humidity: {
    unit: "%",
    icon: "mdi:water-percent",
    color: (v) => (v < 30 ? "blue" : v < 60 ? "green" : v < 80 ? "amber" : "red"),
    badge: (v) =>
      v < 30
        ? { icon: "mdi:water-percent-alert", color: "blue" }
        : v >= 60
        ? { icon: "mdi:water-percent-alert", color: "red" }
        : null,
  },
  temperature: {
    unit: "°C",
    icon: "mdi:thermometer",
    color: (v) => (v < 20 ? "blue" : v < 27 ? "amber" : "red"),
    badge: (v) =>
      v > 27 ? { icon: "mdi:thermometer-alert", color: "amber" } : null,
  },
};

/* Home Assistant's default icons per device class, used when a sensor has no icon of its own
   and no curated profile above. Binary sensors: [icon when on, icon when off]. */
const BINARY_ICONS = {
  battery: ["mdi:battery-outline", "mdi:battery"],
  battery_charging: ["mdi:battery-charging", "mdi:battery"],
  carbon_monoxide: ["mdi:smoke-detector-alert", "mdi:smoke-detector"],
  cold: ["mdi:snowflake", "mdi:thermometer"],
  connectivity: ["mdi:server-network", "mdi:server-network-off"],
  garage_door: ["mdi:garage-open", "mdi:garage"],
  gas: ["mdi:alert-circle", "mdi:check-circle"],
  heat: ["mdi:fire", "mdi:thermometer"],
  light: ["mdi:brightness-7", "mdi:brightness-5"],
  lock: ["mdi:lock-open", "mdi:lock"],
  moving: ["mdi:arrow-right-bold", "mdi:octagon"],
  plug: ["mdi:power-plug", "mdi:power-plug-off"],
  power: ["mdi:flash", "mdi:flash-off"],
  problem: ["mdi:alert-circle", "mdi:check-circle"],
  running: ["mdi:play", "mdi:stop"],
  safety: ["mdi:alert-circle", "mdi:check-circle"],
  sound: ["mdi:music-note", "mdi:music-note-off"],
  tamper: ["mdi:alert-circle", "mdi:check-circle"],
  update: ["mdi:package-up", "mdi:package"],
  vibration: ["mdi:vibrate", "mdi:crop-portrait"],
};

const SENSOR_ICONS = {
  apparent_power: "mdi:flash",
  aqi: "mdi:air-filter",
  atmospheric_pressure: "mdi:gauge",
  battery: "mdi:battery",
  carbon_dioxide: "mdi:molecule-co2",
  carbon_monoxide: "mdi:molecule-co",
  current: "mdi:flash",
  data_rate: "mdi:transmission-tower",
  data_size: "mdi:database",
  date: "mdi:calendar",
  distance: "mdi:arrow-left-right",
  duration: "mdi:progress-clock",
  energy: "mdi:lightning-bolt",
  frequency: "mdi:sine-wave",
  gas: "mdi:meter-gas",
  illuminance: "mdi:brightness-5",
  irradiance: "mdi:sun-wireless",
  moisture: "mdi:water-percent",
  monetary: "mdi:cash",
  nitrogen_dioxide: "mdi:molecule",
  ozone: "mdi:molecule",
  pm1: "mdi:molecule",
  pm10: "mdi:molecule",
  pm25: "mdi:molecule",
  power: "mdi:flash",
  power_factor: "mdi:angle-acute",
  precipitation: "mdi:weather-rainy",
  pressure: "mdi:gauge",
  signal_strength: "mdi:wifi",
  sound_pressure: "mdi:ear-hearing",
  speed: "mdi:speedometer",
  sulphur_dioxide: "mdi:molecule",
  timestamp: "mdi:clock",
  volatile_organic_compounds: "mdi:molecule",
  voltage: "mdi:sine-wave",
  volume: "mdi:car-coolant-level",
  water: "mdi:water",
  weight: "mdi:weight",
  wind_speed: "mdi:weather-windy",
};

/* keys the card owns; everything else in the config goes straight to Mushroom */
const OWN_KEYS = [
  "type",
  "group",
  "entity",
  "label",
  "area",
  "device_class",
  "match",
  "aggregate",
  "name",
  "primary_info",
  "show_secondary",
  "tap_list",
  "color_on",
  "color_off",
  "icon_on",
  "icon_off",
  "grid_options",
  "visibility",
];

/* ---------- entity resolution ---------- */

function resolveEntities(hass, c) {
  if (c.entity) return [c.entity];
  const labels = toArray(c.label);
  const areas = toArray(c.area);
  if (!labels.length && !areas.length) return [];

  const registry = hass.entities || {};
  const devices = hass.devices || {};
  const out = [];
  const stats = {
    registry: Object.keys(registry).length,
    devices: Object.keys(devices).length,
    area: 0,
    label: 0,
  };

  for (const [id, e] of Object.entries(registry)) {
    const domain = id.split(".")[0];
    if (domain !== "binary_sensor" && domain !== "sensor") continue;
    const st = hass.states[id];
    if (!st) continue;

    const deviceId = e.device_id || e.di;
    const d = deviceId ? devices[deviceId] : undefined;
    const area = e.area_id || e.ai || (d && d.area_id);
    const areaOk = !areas.length || areas.includes(area);

    const have = [...(e.labels || e.lb || []), ...((d && d.labels) || [])];
    const labelOk = !labels.length || labels.some((l) => have.includes(l));

    if (areaOk) stats.area++;
    if (labelOk) stats.label++;
    if (!areaOk || !labelOk) continue;

    if (c.device_class && st.attributes.device_class !== c.device_class) continue;
    out.push(id);
  }
  out.sort();
  out.stats = stats;
  return out;
}

/* name of the selected area when exactly one area is chosen */
function areaNameOf(hass, c) {
  const areas = toArray(c.area);
  return areas.length === 1 && hass.areas && hass.areas[areas[0]]
    ? hass.areas[areas[0]].name
    : "";
}

/* tapping a group card opens the list of active entities, unless the user set their own tap_action */
function isListMode(c, ids) {
  return !c.entity && ids.length > 1 && c.tap_list !== false && !c.tap_action;
}

/* ---------- build the Mushroom config ---------- */

function build(hass, c, ids) {
  const states = ids.map((i) => hass.states[i]).filter(Boolean);

  let out;
  if (!states.length) {
    out = {
      entity: undefined,
      primary: c.name ?? "",
      secondary: ids.length
        ? "Entity not found"
        : ids.stats
        ? `No match (registry ${ids.stats.registry}, devices ${ids.stats.devices}, in area ${ids.stats.area}, with label ${ids.stats.label}) v${VERSION}`
        : "No entities selected",
      icon: "mdi:help-circle-outline",
      color: "disabled",
      badge_icon: "",
      badge_color: "",
    };
  } else {
    const first = states[0];
    const domain = first.entity_id.split(".")[0];
    const dc =
      c.device_class ||
      states.map((s) => s.attributes.device_class).find(Boolean) ||
      "default";
    const group = !c.entity && states.length > 1;
    const areaName = areaNameOf(hass, c);

    if (domain === "binary_sensor") {
      const base = BINARY[dc] || BINARY.default;
      // curated profiles keep their own on/off icons; other classes use the
      // entity's own icon if it has one, otherwise the default for the device class
      const curated = dc !== "default" && !!BINARY[dc];
      const own = first.attributes.icon;
      const dflt = BINARY_ICONS[dc];
      const p = {
        ...base,
        iconOn:
          c.icon_on || (curated ? base.iconOn : own || (dflt && dflt[0]) || base.iconOn),
        iconOff:
          c.icon_off || (curated ? base.iconOff : own || (dflt && dflt[1]) || base.iconOff),
        colorOn: c.color_on || base.colorOn,
        colorOff: c.color_off || base.colorOff,
      };
      const valid = states.filter((s) => !UNAVAILABLE.includes(s.state));
      const onList = valid.filter((s) => s.state === "on");
      const active =
        c.match === "all"
          ? valid.length > 0 && onList.length === valid.length
          : onList.length > 0;

      let secondary;
      if (!valid.length) secondary = "Unavailable";
      else if (active) {
        secondary = p.on + (group ? ` (${onList.length}/${states.length})` : "");
      } else secondary = p.off;

      out = {
        entity: (onList[0] || first).entity_id,
        primary: c.name ?? (p.primary || (group ? areaName : "") || ""),
        secondary,
        icon: active ? p.iconOn : p.iconOff,
        color: !valid.length ? "disabled" : active ? p.colorOn : p.colorOff,
        badge_icon: "",
        badge_color: "",
      };
    } else {
      const p = NUMERIC[dc];
      const nums = states
        .map((s) => parseFloat(s.state))
        .filter((n) => !isNaN(n));
      const unit =
        first.attributes.unit_of_measurement || (p ? p.unit : "") || "";

      if (!nums.length) {
        out = {
          entity: first.entity_id,
          primary: c.name ?? "",
          secondary: first.state.charAt(0).toUpperCase() + first.state.slice(1),
          icon:
            (p && p.icon) ||
            first.attributes.icon ||
            SENSOR_ICONS[dc] ||
            "mdi:eye",
          color: "disabled",
          badge_icon: "",
          badge_color: "",
        };
      } else {
        const agg = c.aggregate || "average";
        let v;
        if (!group) v = nums[0];
        else if (agg === "min") v = Math.min(...nums);
        else if (agg === "max") v = Math.max(...nums);
        else v = nums.reduce((a, b) => a + b, 0) / nums.length;

        const shown = group ? String(Math.round(v * 10) / 10) : first.state;
        const badge = p && p.badge ? p.badge(v) : null;

        out = {
          entity: first.entity_id,
          primary: c.name ?? (group ? areaName : ""),
          secondary: `${shown}${unit ? " " + unit : ""}`,
          icon:
            (p && p.icon) ||
            first.attributes.icon ||
            SENSOR_ICONS[dc] ||
            "mdi:eye",
          color: p ? p.color(v) : undefined,
          badge_icon: badge ? badge.icon : "",
          badge_color: badge ? badge.color : "",
        };
      }
    }
  }

  // primary_info: state -> the state text goes on top and the name moves to the secondary line
  if (c.primary_info === "state" && states.length) {
    const nameText = out.primary;
    out.primary = out.secondary;
    out.secondary = nameText;
  }

  if (c.show_secondary === false) out.secondary = "";

  const pass = {};
  for (const [k, v] of Object.entries(c)) {
    if (!OWN_KEYS.includes(k)) pass[k] = v;
  }

  const cfg = {
    type: "custom:mushroom-template-card",
    tap_action: isListMode(c, ids) ? { action: "none" } : { action: "more-info" },
    hold_action: { action: "none" },
    double_tap_action: { action: "none" },
    ...out,
    ...pass,
  };
  Object.keys(cfg).forEach((k) => cfg[k] === undefined && delete cfg[k]);
  return cfg;
}

/* ---------- the card ---------- */

class SmartSensorCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }

  static getStubConfig(hass) {
    const id = Object.keys((hass && hass.states) || {}).find((e) =>
      e.startsWith("binary_sensor.")
    );
    return { entity: id || "" };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = normalize(config);
    this._cacheKey = undefined;
    this._ids = undefined;
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return { columns: 4, rows: 1, min_columns: 3, min_rows: 1 };
  }

  constructor() {
    super();
    this.addEventListener("click", () => {
      if (this._listMode()) this._openPopup();
    });
  }

  disconnectedCallback() {
    this._closePopup();
  }

  _listMode() {
    return !!this._ids && isListMode(this._config, this._ids);
  }

  /* ---- popup with the active entities ---- */

  _openPopup() {
    if (this._popup || !this._hass) return;

    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.5);";
    const box = document.createElement("div");
    box.style.cssText =
      "display:flex;flex-direction:column;width:min(420px,100%);max-height:80vh;overflow:hidden;" +
      "border-radius:var(--ha-card-border-radius,12px);background:var(--card-background-color,#fff);" +
      "color:var(--primary-text-color,#212121);box-shadow:0 8px 32px rgba(0,0,0,0.35);" +
      "font-family:var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,sans-serif));";
    overlay.appendChild(box);
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) this._closePopup();
    });

    this._onKey = (ev) => {
      if (ev.key === "Escape") this._closePopup();
    };
    document.addEventListener("keydown", this._onKey);
    document.body.appendChild(overlay);

    this._popup = { overlay, box, showAll: false, sig: "" };
    this._renderPopup();
  }

  _closePopup() {
    if (!this._popup) return;
    this._popup.overlay.remove();
    document.removeEventListener("keydown", this._onKey);
    this._popup = null;
  }

  _renderPopup() {
    const pop = this._popup;
    const hass = this._hass;
    if (!pop || !hass) return;

    const all = (this._ids || []).map((id) => hass.states[id]).filter(Boolean);
    const binary = all.length > 0 && all[0].entity_id.startsWith("binary_sensor.");
    const active = all.filter((s) => s.state === "on");
    const rows = binary && !pop.showAll ? active : all;

    // only rebuild the DOM when something visible changed
    const sig = JSON.stringify([
      pop.showAll,
      all.length,
      rows.map((s) => [s.entity_id, s.state, s.last_changed]),
    ]);
    if (sig === pop.sig) return;
    pop.sig = sig;

    const box = pop.box;
    box.textContent = "";

    // header
    const head = document.createElement("div");
    head.style.cssText =
      "display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 12px 8px 20px;";
    const titles = document.createElement("div");
    const title = document.createElement("div");
    title.style.cssText = "font-size:18px;font-weight:500;";
    title.textContent = this._title || "Entities";
    const sub = document.createElement("div");
    sub.style.cssText =
      "font-size:13px;margin-top:2px;color:var(--secondary-text-color,#727272);";
    sub.textContent = binary
      ? `${active.length} of ${all.length} active`
      : `${all.length} sensors`;
    titles.append(title, sub);
    const close = document.createElement("button");
    close.textContent = "✕";
    close.setAttribute("aria-label", "Close");
    close.style.cssText =
      "border:none;background:none;cursor:pointer;font-size:18px;line-height:1;padding:6px 10px;border-radius:50%;color:var(--secondary-text-color,#727272);";
    close.addEventListener("click", () => this._closePopup());
    head.append(titles, close);
    box.appendChild(head);

    // list
    const list = document.createElement("div");
    list.style.cssText = "overflow-y:auto;padding:4px 0 8px;";
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "padding:16px 20px;color:var(--secondary-text-color,#727272);";
      empty.textContent = "Nothing active right now";
      list.appendChild(empty);
    }
    rows.forEach((s) => list.appendChild(this._popupRow(s)));
    box.appendChild(list);

    // footer toggle (binary groups only)
    if (binary) {
      const foot = document.createElement("div");
      foot.style.cssText =
        "padding:8px 12px;border-top:1px solid var(--divider-color,rgba(127,127,127,0.3));text-align:right;";
      const toggle = document.createElement("button");
      toggle.textContent = pop.showAll ? "Show active only" : `Show all (${all.length})`;
      toggle.style.cssText =
        "border:none;background:none;cursor:pointer;font:inherit;font-weight:500;padding:8px 12px;border-radius:8px;color:var(--primary-color,#03a9f4);";
      toggle.addEventListener("click", () => {
        pop.showAll = !pop.showAll;
        pop.sig = "";
        this._renderPopup();
      });
      foot.appendChild(toggle);
      box.appendChild(foot);
    }
  }

  _popupRow(s) {
    const hass = this._hass;
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:16px;padding:10px 20px;cursor:pointer;";
    row.addEventListener("mouseenter", () => {
      row.style.background = "var(--secondary-background-color,rgba(127,127,127,0.12))";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "";
    });

    let icon;
    if (customElements.get("ha-state-icon")) {
      icon = document.createElement("ha-state-icon");
      icon.hass = hass;
      icon.stateObj = s;
    } else {
      icon = document.createElement("ha-icon");
      icon.setAttribute("icon", s.attributes.icon || "mdi:eye");
    }
    icon.style.color =
      s.state === "on"
        ? "var(--state-icon-active-color,var(--primary-color,#03a9f4))"
        : "var(--state-icon-color,var(--secondary-text-color,#727272))";

    const text = document.createElement("div");
    text.style.cssText = "flex:1;min-width:0;";
    const name = document.createElement("div");
    name.style.cssText = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    name.textContent = s.attributes.friendly_name || s.entity_id;
    const detail = document.createElement("div");
    detail.style.cssText =
      "font-size:13px;color:var(--secondary-text-color,#727272);";
    const stateText =
      typeof hass.formatEntityState === "function"
        ? hass.formatEntityState(s)
        : s.state;
    detail.append(document.createTextNode(stateText));
    if (customElements.get("ha-relative-time")) {
      const rel = document.createElement("ha-relative-time");
      rel.hass = hass;
      rel.datetime = s.last_changed;
      detail.append(document.createTextNode(" · "), rel);
    }
    text.append(name, detail);

    row.append(icon, text);
    row.addEventListener("click", () => {
      this._closePopup();
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: s.entity_id },
          bubbles: true,
          composed: true,
        })
      );
    });
    return row;
  }

  _update() {
    if (!this._config || !this._hass) return;

    if (!customElements.get("mushroom-template-card")) {
      this.innerHTML =
        '<ha-alert alert-type="error">mushroom-template-card not found. Install Mushroom first.</ha-alert>';
      this._inner = undefined;
      this._key = undefined;
      return;
    }

    // cache the label/area lookup until the registries change
    const regKey = [this._hass.entities, this._hass.devices];
    if (
      !this._ids ||
      this._regKey[0] !== regKey[0] ||
      this._regKey[1] !== regKey[1]
    ) {
      this._ids = resolveEntities(this._hass, this._config);
      this._regKey = regKey;
    }

    const cfg = build(this._hass, this._config, this._ids);
    const key = JSON.stringify(cfg);
    this._title =
      (this._config.primary_info === "state" ? "" : cfg.primary) ||
      this._config.name ||
      areaNameOf(this._hass, this._config) ||
      "Entities";

    if (!this._inner) {
      this.innerHTML = "";
      this._inner = document.createElement("mushroom-template-card");
      this.appendChild(this._inner);
      this._key = undefined;
    }
    if (key !== this._key) {
      this._key = key;
      this._inner.setConfig(cfg);
    }
    this._inner.hass = this._hass;
    this.style.cursor = this._listMode() ? "pointer" : "";
    if (this._popup) this._renderPopup();
  }
}

/* ---------- the visual editor ---------- */

const DC_OPTIONS = [
  "motion",
  "occupancy",
  "presence",
  "door",
  "window",
  "opening",
  "moisture",
  "smoke",
  "humidity",
  "temperature",
].map((v) => ({ value: v, label: v }));

const SCHEMA = [
  {
    name: "entity",
    selector: { entity: { domain: ["binary_sensor", "sensor"] } },
  },
  ...[
      { name: "label", selector: { label: { multiple: true } } },
      { name: "area", selector: { area: { multiple: true } } },
      {
        name: "device_class",
        selector: {
          select: { mode: "dropdown", custom_value: true, options: DC_OPTIONS },
        },
      },
      {
        type: "grid",
        name: "",
        schema: [
          {
            name: "match",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "any", label: "Any sensor active" },
                  { value: "all", label: "All sensors active" },
                ],
              },
            },
          },
          {
            name: "aggregate",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "average", label: "Average" },
                  { value: "min", label: "Minimum" },
                  { value: "max", label: "Maximum" },
                ],
              },
            },
          },
        ],
      },
    ],
  { name: "name", selector: { text: {} } },
  {
    name: "primary_info",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "name", label: "Name" },
          { value: "state", label: "State (Detected / Clear, Open / Closed, ...)" },
        ],
      },
    },
  },
  { name: "show_secondary", selector: { boolean: {} } },
  { name: "tap_list", selector: { boolean: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "color_on", selector: { ui_color: {} } },
      { name: "color_off", selector: { ui_color: {} } },
      { name: "icon_on", selector: { icon: {} } },
      { name: "icon_off", selector: { icon: {} } },
    ],
  },
];

const LABELS = {
  entity: "Entity (single sensor)",
  label: "Labels",
  area: "Areas",
  device_class: "Sensor type (device class), optional filter",
  match: "Binary sensors: card is active when",
  aggregate: "Numeric sensors: combine as",
  name: "Name (optional)",
  group: "Group by label / area",
  primary_info: "Primary text shows",
  show_secondary: "Show secondary line",
  tap_list: "Tap on a group opens a list of active entities",
  color_on: "Color when active",
  color_off: "Color when inactive",
  icon_on: "Icon when active",
  icon_off: "Icon when inactive",
};

const HELPERS = {
  primary_info:
    "With State, the name moves to the secondary line. Turn the secondary line off to show only the state.",
  color_on: "Binary sensors only. Empty = default for the sensor type.",
  tap_list: "Only applies to groups. A tap_action in YAML overrides this.",
  entity: "Leave empty to use labels and/or areas below.",
  label: "With both label and area, only sensors matching both are used.",
};

class SmartSensorCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = normalize(config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => LABELS[s.name] || s.name;
      this._form.computeHelper = (s) => HELPERS[s.name];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = {};
        for (const [k, v] of Object.entries(ev.detail.value)) {
          const empty =
            v === undefined ||
            v === null ||
            v === "" ||
            (Array.isArray(v) && v.length === 0);
          if (!empty) config[k] = v;
        }
        // true is the default for these, keep the YAML clean
        if (config.show_secondary === true) delete config.show_secondary;
        if (config.tap_list === true) delete config.tap_list;
        if (config.primary_info === "name") delete config.primary_info;
        config.type = this._config.type;
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = SCHEMA;
    this._form.data = {
      primary_info: "name",
      show_secondary: true,
      tap_list: true,
      ...this._config,
    };
  }
}

customElements.define(CARD_TYPE, SmartSensorCard);
customElements.define(`${CARD_TYPE}-editor`, SmartSensorCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TYPE,
  name: "Smart Sensor Card",
  description:
    "Mushroom-style card that picks icon, color and badge from the sensor type. Supports label and area groups.",
  preview: true,
});
