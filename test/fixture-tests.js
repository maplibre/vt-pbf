import { test, expect, describe } from 'vitest'
import geojsonvt from 'geojson-vt'
import { VectorTile } from '@mapbox/vector-tile'
import Pbf from 'pbf'
import vtvalidate from '@maplibre/vtvalidate'
import geojsonFixtures from '@mapbox/geojson-fixtures'
import mvtf from '@mapbox/mvt-fixtures'
import GeoJsonEquality from 'geojson-equality'
import { fromVectorTileJs, fromGeojsonVt } from '../'

const eq = new GeoJsonEquality({ precision: 1 })

describe('geojson-vt', function () {
  const geometryTypes = ['polygon', 'point', 'multipoint', 'multipolygon', 'polygon', 'multilinestring']

  const fixtures = geometryTypes.map(function (type) {
    return {
      name: type,
      data: { type: 'Feature', properties: {}, geometry: geojsonFixtures.geometry[type] }
    }
  })

  fixtures.forEach(function (fixture) {
    test(fixture.name, function () {
      const tile = geojsonvt(fixture.data).getTile(0, 0, 0)
      const buff = fromGeojsonVt({ geojsonLayer: tile })
      vtvalidate.isValid(buff, (err, result) => {
        expect(err).toBeFalsy()
        expect(result).toEqual('')

        // Compare roundtripped features with originals
        const expected = fixture.data.type === 'FeatureCollection' ? fixture.data.features : [fixture.data]
        const layer = new VectorTile(new Pbf(buff)).layers.geojsonLayer
        expect(layer.length).toEqual(expected.length, expected.length + ' features')
        for (let i = 0; i < layer.length; i++) {
          const actual = layer.feature(i).toGeoJSON(0, 0, 0)
          expect(eq.compare(actual, expected[i])).toBeTruthy()
        }
      })
    })
  })
})

describe('vector-tile-js', function () {
  // See https://github.com/mapbox/mvt-fixtures/blob/master/FIXTURES.md for
  // fixture descriptions
  mvtf.each(function (fixture) {
    // skip invalid tiles
    if (!fixture.validity.v2) return

    test('mvt-fixtures: ' + fixture.id + ' ' + fixture.description, function () {
      const original = new VectorTile(new Pbf(new Uint8Array(fixture.buffer)))

      if (fixture.id === '020') {
        console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/30')
        return
      }

      if (fixture.id === '049' || fixture.id === '050') {
        console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/31')
        return
      }

      const buff = fromVectorTileJs(original)
      const roundtripped = new VectorTile(new Pbf(buff))

      vtvalidate.isValid(buff, (err, invalid) => {
        if (err) {
          throw err
        }

        if (invalid && invalid === 'ClosePath command count is not 1') {
          console.log('Skipping test due to https://github.com/mapbox/vt-pbf/issues/28')
          return
        }

        // UNKOWN geometry type is valid in the spec, but vtvalidate considers
        // it an error
        if (fixture.id === '016' || fixture.id === '039') {
          invalid = null
        }

        expect(!invalid).toBeTruthy()

        // Compare roundtripped features with originals
        for (const name in original.layers) {
          const originalLayer = original.layers[name]
          expect(roundtripped.layers[name]).toBeTruthy()
          const roundtrippedLayer = roundtripped.layers[name]
          expect(roundtrippedLayer.length).toEqual(originalLayer.length)
          for (let i = 0; i < originalLayer.length; i++) {
            const actual = roundtrippedLayer.feature(i)
            const expected = originalLayer.feature(i)

            expect(actual.id).toEqual(expected.id, 'id')
            expect(actual.type).toEqual(expected.type, 'type')
            expect(actual.properties).toEqual(expected.properties, 'properties')
            expect(actual.loadGeometry()).toEqual(expected.loadGeometry(), 'geometry')
          }
        }
      })
    })
  })
})
