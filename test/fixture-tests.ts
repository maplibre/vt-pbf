import {test, expect, describe} from 'vitest';
import {GeoJSONVT} from '@maplibre/geojson-vt';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
import {isValid} from '@maplibre/vtvalidate';
import {geometry as geometryFixtures, Geometries} from '@mapbox/geojson-fixtures';
import {each as mvtEach, Fixture} from '@mapbox/mvt-fixtures';
import GeoJsonEquality from 'geojson-equality';
import {readFileSync} from 'fs';
import {fromVectorTileJs, fromGeojsonVt} from '../index';

interface FixtureEntry {
  name: string,
  data: GeoJSON.GeoJSON;
};

const eq = new GeoJsonEquality({ precision: 1 });

describe('geojson-vt', function () {
  [
    // Geometries
    ...[
      'polygon',
      'point',
      'multipoint',
      'multipolygon',
      'polygon',
      'multilinestring'
    ].map((type: string): FixtureEntry => {
      return {
        name: type,
        data: {
          type: 'Feature',
          properties: {},
          geometry: geometryFixtures[type as Geometries]
        }
      };
    }),
    // FeatureCollection
   {
    name: 'collection',
    data: JSON.parse(
      readFileSync(__dirname + '/fixtures/featurecollection.geojson').toString()
    ) as GeoJSON.GeoJSON
   }
  ].forEach((fixture: FixtureEntry) => {
    test(fixture.name, () => {
      const tile = new GeoJSONVT(fixture.data, {}).getTile(0, 0, 0);
      expect(tile).toBeTruthy();
      if (!tile) {
        return;
      }

      const buff = fromGeojsonVt({ geojsonLayer: tile });
      isValid(buff as unknown as ArrayBufferLike, (error: Error, result: string) => {
        expect(error).toBeFalsy();
        expect(result).toEqual('');

        // Compare roundtripped features with originals
        const expected = fixture.data.type === 'FeatureCollection' ? fixture.data.features : [fixture.data];
        const layer = new VectorTile(new PbfReader(buff)).layers.geojsonLayer;
        expect(layer.length).toEqual(expected.length);

        for (let i = 0; i < layer.length; i++) {
          const actual = layer.feature(i).toGeoJSON(0, 0, 0);
          // @mapbox/vector-tile v3 returns null-prototype properties; normalize
          // so geojson-equality's strict deep-equal matches the originals.
          const normalized = {...actual, properties: {...actual.properties}};
          expect(eq.compare(normalized, expected[i])).toBeTruthy();
        }
      });
    });
  });
});

describe('vector-tile-js', () => {
  // See https://github.com/mapbox/mvt-fixtures/blob/master/FIXTURES.md for
  // fixture descriptions
  mvtEach((fixture: Fixture) => {
    // skip invalid tiles
    if (!fixture.validity.v2) return;

    test('mvt-fixtures: ' + fixture.id + ' ' + fixture.description, () => {
      const original = new VectorTile(new PbfReader(new Uint8Array(fixture.buffer)));

      if (fixture.id === '020') {
        console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/30');
        return;
      }

      if (fixture.id === '049' || fixture.id === '050') {
        console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/31');
        return;
      }

      const buff = fromVectorTileJs(original);
      const roundtripped = new VectorTile(new PbfReader(buff));

      isValid(buff as unknown as ArrayBufferLike, (error: Error, message: string) => {
        if (error) {
          throw error;
        }

        // UNKOWN geometry type is valid in the spec, but vtvalidate considers
        // it an error
        if (fixture.id === '016' || fixture.id === '039') {
          message = '';
        }

        expect(!message).toBeTruthy();

        // Compare roundtripped features with originals
        for (const name in original.layers) {
          const originalLayer = original.layers[name];
          expect(roundtripped.layers[name]).toBeTruthy();
          const roundtrippedLayer = roundtripped.layers[name];
          expect(roundtrippedLayer.length).toEqual(originalLayer.length);
          for (let i = 0; i < originalLayer.length; i++) {
            const actual = roundtrippedLayer.feature(i);
            const expected = originalLayer.feature(i);

            expect(actual.id).toEqual(expected.id);
            expect(actual.type).toEqual(expected.type);
            expect(actual.properties).toEqual(expected.properties);
            expect(actual.loadGeometry()).toEqual(expected.loadGeometry());
          }
        }
      });
    });
  });
});
