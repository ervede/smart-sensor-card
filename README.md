# Smart Sensor Card

A Home Assistant dashboard card with the look and feel of the [Mushroom](https://github.com/piitaya/lovelace-mushroom) template card, but you only pick the sensor. The card reads the sensor's `device_class` and chooses the icon, color, state text and badge for you.

It can also watch a whole group: select a **label** and/or an **area** (for example all motion sensors in the living room) and the card reflects the group, and tapping it lists the entities that are on.

## Features

- **Pick only the entity.** Door, window, motion, presence, occupancy, moisture, smoke, humidity and temperature get tuned icons, colors and wording. Every other device class falls back to Home Assistant's default icon for that class.
- **Groups by label and/or area.** "Any sensor active" or "all sensors active" for binary sensors, average / min / max for numeric sensors.
- **Tap a group to see what's on.** A popup lists the active entities (with a "show all" toggle). Tapping a row opens that entity's more-info dialog.
- **Visual editor and full YAML.** Every option is in the editor, and the YAML editor works as usual.
- **Mushroom pass-through.** Any other option of the Mushroom template card (`primary`, `secondary`, `icon`, `color`, `badge_icon`, `tap_action`, ...) is passed straight on and overrides what the card computes.

## Requirements

- Home Assistant 2024.4 or newer (labels were added in 2024.4)
- [Mushroom](https://github.com/piitaya/lovelace-mushroom) installed (the card uses `mushroom-template-card`)

## Installation

### HACS (custom repository)

1. In Home Assistant open **HACS**, then the three-dot menu, then **Custom repositories**.
2. Add this repository's URL and choose the type **Dashboard**.
3. Find **Smart Sensor Card** in HACS and download it.
4. Reload your browser (hard refresh). HACS registers the resource for you on dashboards in storage mode.

### Manual

1. Download `smart-sensor-card.js` from the latest release (or from `dist/`).
2. Copy it to `/config/www/smart-sensor-card.js`.
3. Add a dashboard resource: Settings, Dashboards, three-dot menu, Resources, with URL `/local/smart-sensor-card.js` and type **JavaScript module**.

After updating a manually installed file, change the URL to `/local/smart-sensor-card.js?v=2` (and so on) to get past the browser cache.

## Usage

Single sensor:

```yaml
type: custom:smart-sensor-card
entity: binary_sensor.ds_bedroom1_contact
```

All motion sensors in one area:

```yaml
type: custom:smart-sensor-card
label: motion_sensors
area: living_room
match: any
```

Show the state as the main text:

```yaml
type: custom:smart-sensor-card
entity: binary_sensor.ws_bedroom1_contact
primary_info: state
```

Label and area values are IDs (the slugs), not display names. The pickers in the editor fill them in. With both a label and an area, a sensor must match both.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | | A single `binary_sensor` or `sensor`. If set, label and area are ignored. |
| `label` | string or list | | Include sensors that have one of these labels (on the entity or its device). |
| `area` | string or list | | Include sensors in these areas (entity area, or the device's area). |
| `device_class` | string | auto | Only include sensors of this class, and use its profile. Detected automatically when omitted. |
| `match` | `any` / `all` | `any` | Binary groups: active when any, or all, sensors are on. |
| `aggregate` | `average` / `min` / `max` | `average` | Numeric groups: how the values are combined. |
| `name` | string | | Name shown in the card. Defaults to "Door" / "Window" for those classes, or the area name for a single-area group. |
| `primary_info` | `name` / `state` | `name` | What the primary line shows. With `state`, the name moves to the secondary line. |
| `show_secondary` | boolean | `true` | Show or hide the secondary line. |
| `tap_list` | boolean | `true` | Groups only: tapping opens the list of active entities. |
| `color_on`, `color_off` | color | by class | Binary sensors: icon color when active / inactive. |
| `icon_on`, `icon_off` | icon | by class | Binary sensors: icon when active / inactive. |

Any option the card doesn't know is handed to the Mushroom template card, so for example `tap_action`, `hold_action`, `grid_options` and `badge_icon` work as they do there. A `tap_action` you set yourself replaces the group popup. The nested form `group: { label, area, match }` is also accepted.

## How it picks things

| Device class | State text (on / off) | Icon (on / off) | Color (on / off) |
|---|---|---|---|
| `door` | Open / Closed | `mdi:door-open` / `mdi:door` | brown / default |
| `window`, `opening` | Open / Closed | `mdi:window-open-variant` / `mdi:window-closed-variant` | blue / grey |
| `motion`, `occupancy`, `presence` | Detected / Clear | `mdi:motion-sensor` / `mdi:motion-sensor-off` | red / grey |
| `moisture` | Wet / Dry | `mdi:water` / `mdi:water-off` | blue / grey |
| `smoke` | Smoke / Clear | `mdi:smoke-detector-variant-alert` / `mdi:smoke-detector-variant` | red / grey |
| anything else | On / Off | the entity's own icon, else the default for its device class | amber / grey |

Numeric sensors:

| Device class | Color | Badge |
|---|---|---|
| `humidity` | blue below 30, green below 60, amber below 80, red from 80 | blue below 30, red from 60 |
| `temperature` | blue below 20, amber below 27, red from 27 | amber above 27 |

Other numeric classes show the value with its unit and the entity's icon, or the default icon for the class. For groups the shown value is the average, minimum or maximum.

Unavailable and unknown states are ignored in groups. If every sensor is unavailable the card is grey and says so.

## Troubleshooting

- **The card shows "No entities selected".** Neither an entity, a label nor an area reached the card. Check the YAML in the code editor.
- **The card shows "No match (...)".** The numbers tell you how many sensors are in the area and how many carry the label. A label set only on a device counts, and so does an area set only on a device.
- **An update doesn't show.** Hard refresh the browser. In the companion app use Settings, Companion app, Troubleshooting, Reset frontend cache. The browser console prints the loaded card version.
- **"mushroom-template-card not found".** Install Mushroom first.

## Development

The card is a single file with no build step: `dist/smart-sensor-card.js`. To release a new version:

1. Change `VERSION` at the top of the file.
2. Commit, then tag it with the same version, for example `git tag v0.6.2 && git push origin v0.6.2`.
3. The release workflow checks that tag and `VERSION` agree and publishes a GitHub release.

The `Validate` workflow runs the HACS validation and a JavaScript syntax check on every push.

## License

MIT, see [LICENSE](LICENSE).
