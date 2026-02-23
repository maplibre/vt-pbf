import geojsonvt from '@maplibre/geojson-vt';
import Pbf from 'pbf';
import {test, describe, expect } from 'vitest';
import {VectorTile} from '@mapbox/vector-tile';
import GeoJsonEquality from 'geojson-equality';
import fs from 'fs';
import path from 'path';
import {fromGeojsonVt, fromVectorTileJs, GEOJSON_TILE_LAYER_NAME, GeoJSONWrapper} from '../index';
import {Feature, FeatureCollection} from 'geojson';

const eq = new GeoJsonEquality({ precision: 1 });

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('property encoding', () => {
  test('property encoding: JSON.stringify non-primitive values with prefix', () => {
    const orig: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          obj: { hello: 'world' },
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }]
    };
    const tileindex = geojsonvt(orig, {});
    const tile = tileindex.getTile(1, 0, 0)!;
    const buff = fromVectorTileJs(new GeoJSONWrapper(tile.features), '__json__:');
    const vt = new VectorTile(new Pbf(buff));
    const layer = vt.layers[GEOJSON_TILE_LAYER_NAME];
    const properties = layer.feature(0).properties;
    expect(properties.obj).toStrictEqual('__json__:{"hello":"world"}');
    expect(JSON.parse(properties.obj.toString().replace('__json__:', ''))).toStrictEqual({hello: 'world'});
  });


  test('property encoding: JSON.stringify non-primitive values', () => {
    // Includes two properties with a common non-primitive value for
    // https://github.com/mapbox/vt-pbf/issues/9
    const orig: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          a: 'one',
          b: 1,
          c: { hello: 'world' },
          d: [1, 2, 3],
          e: null
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }, {
        type: 'Feature',
        properties: {
          a: 'two',
          b: 2,
          c: { goodbye: 'planet' },
          d: { hello: 'world' },
          e: false
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }]
    };

    const tileindex = geojsonvt(orig, {});
    const tile = tileindex.getTile(1, 0, 0)!;
    expect(tile).toBeTruthy();
    
    const buff = fromGeojsonVt({ geojsonLayer: tile });

    const vt = new VectorTile(new Pbf(buff));
    const layer = vt.layers.geojsonLayer;

    const first = layer.feature(0).properties;
    const second = layer.feature(1).properties;
    expect(first.b).toStrictEqual(1);
    expect(first.c).toStrictEqual('{"hello":"world"}');
    expect(first.d).toStrictEqual('[1,2,3]');
    expect(first.e).toStrictEqual(undefined);
    expect(second.c).toStrictEqual('{"goodbye":"planet"}');
    expect(second.d).toStrictEqual('{"hello":"world"}');
    expect(second.e).toStrictEqual(false);
  });

  test('number encoding https://github.com/mapbox/vt-pbf/pull/11', () => {
    const orig: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        large_integer: 39953616224,
        non_integer: 331.75415
      },
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    };

    const tileindex = geojsonvt(orig, {});
    const tile = tileindex.getTile(1, 0, 0);
    expect(tile).toBeTruthy();
    if (!tile) {
      return;
    }

    const buff = fromGeojsonVt({ geojsonLayer: tile });
    const vt = new VectorTile(new Pbf(buff));
    const layer = vt.layers.geojsonLayer;

    const properties = layer.feature(0).properties;
    expect(properties.large_integer).toEqual(39953616224);
    expect(properties.non_integer).toEqual(331.75415);
  });
});

test('id encoding', () => {
  const orig: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      id: 123,
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    }, {
      type: 'Feature',
      id: 'invalid',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    }, {
      type: 'Feature',
      // no id
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    }]
  };

  const tileindex = geojsonvt(orig, {});
  const tile = tileindex.getTile(1, 0, 0);
  expect(tile).toBeTruthy();
  if (!tile) {
    return;
  }

  const buff = fromGeojsonVt({ geojsonLayer: tile });
  const vt = new VectorTile(new Pbf(buff));
  const layer = vt.layers.geojsonLayer;

  expect(layer.feature(0).id).toEqual(123);
  expect(layer.feature(1).id).toBeFalsy(); // 'Non-integer values should not be saved'
  expect(layer.feature(2).id).toBeUndefined();
});

test('accept geojson-vt options https://github.com/mapbox/vt-pbf/pull/21', () => {
  const version = 2
  const extent = 8192
  const orig = JSON.parse(fs.readFileSync(path.join(__dirname, '/fixtures/rectangle.geojson'), 'utf-8')) as FeatureCollection;
  const tileindex = geojsonvt(orig, {extent: extent});
  const tile = tileindex.getTile(1, 0, 0);
  expect(tile).toBeTruthy();
  if (!tile) {
    return;
  }

  const options = {version: version, extent: extent};
  const buff = fromGeojsonVt({ geojsonLayer: tile }, options);

  const vt = new VectorTile(new Pbf(buff));
  const layer = vt.layers.geojsonLayer;
  const features: Feature[] = [];
  for (let i = 0; i < layer.length; i++) {
    const feat = layer.feature(i).toGeoJSON(0, 0, 1);
    features.push(feat);
  }

  expect(layer.version).toEqual(options.version);
  expect(layer.extent).toEqual(options.extent);

  orig.features.forEach((expected: Feature) => {
    const actual = features.shift();
    expect(actual).toBeTruthy();
    if (!actual) {
      return;
    }
    expect(eq.compare(actual, expected)).toBeTruthy();
  });
});
