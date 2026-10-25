## main
### ✨ Features and improvements
- _...Add new stuff here..._

### 🐞 Bug fixes
- _...Add new stuff here..._

- Update packages ([#63](https://github.com/maplibre/vt-pbf/pull/63)) (by [@HarelM](https://github.com/HarelM))
- fix: keep the last point of a polygon ring that does not repeat its first point ([#62](https://github.com/maplibre/vt-pbf/pull/62)) (by [@johncarmack1984](https://github.com/johncarmack1984))
## 4.3.3
### ✨ Features and improvements

### 🐞 Bug fixes
- Fix a polygon ring that does not repeat its first point losing its last corner when encoded ([#8874](https://github.com/maplibre/maplibre-gl-js/issues/8874)) (by [@johncarmack1984](https://github.com/johncarmack1984))

## 4.3.2

### 🐞 Bug fixes

- Fix package external dependencies references due to Rolldown migration ([#47](https://github.com/maplibre/vt-pbf/pull/47)) (by [@HarelM](https://github.com/HarelM))

## 4.3.1

### ✨ Features and improvements

- Update dependencies to latest, mainly pbf to version 5.x. Moved non-runtime dependencies to devDependecies, migrate to Rolldown ([#45](https://github.com/maplibre/vt-pbf/pull/45)) (by [@HarelM](https://github.com/HarelM))

## 4.3.0

### ✨ Features and improvements

- Add ability to add a json prefix to json stringify results of nested objects in the mvt for later parsing ([#28](https://github.com/maplibre/vt-pbf/pull/28)) (by [HarelM](https://github.com/HarelM))

## 4.2.1

### ✨ Features and improvements

- Migrate to @maplibre/geojson-vt ([#25](https://github.com/maplibre/vt-pbf/pull/25)) (by [HarelM](https://github.com/HarelM))
- Update @maplibre/vtvalidate ([#23](https://github.com/maplibre/vt-pbf/pull/23)) (by [mwilsnd](https://github.com/mwilsnd))
- Remove terser from rollup ([#22](https://github.com/maplibre/vt-pbf/pull/22)) (by [mwilsnd](https://github.com/mwilsnd))
- Migrate to shared release workflow ([#19](https://github.com/maplibre/vt-pbf/pull/19)) (by [mwilsnd](https://github.com/mwilsnd))

### 🐞 Bug fixes

- Fix `fromGeojsonVt`, modernize tests ([#20](https://github.com/maplibre/vt-pbf/pull/20)) (by [mwilsnd](https://github.com/mwilsnd))
