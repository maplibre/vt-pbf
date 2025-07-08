import geojsonvt from 'geojson-vt'
import Pbf from 'pbf'
import { test, describe, expect } from 'vitest'
import { VectorTile } from '@mapbox/vector-tile'
import GeoJsonEquality from 'geojson-equality'
import fs from 'fs'
import path from 'path'
import { fromGeojsonVt } from '../'

const eq = new GeoJsonEquality({ precision: 1 })

describe('property encoding', function () {
  test('property encoding: JSON.stringify non-primitive values', function () {
    // Includes two properties with a common non-primitive value for
    // https://github.com/mapbox/vt-pbf/issues/9
    const orig = {
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
          d: { hello: 'world' }
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }]
    }

    const tileindex = geojsonvt(orig)
    const tile = tileindex.getTile(1, 0, 0)
    const buff = fromGeojsonVt({ geojsonLayer: tile })

    const vt = new VectorTile(new Pbf(buff))
    const layer = vt.layers.geojsonLayer

    const first = layer.feature(0).properties
    const second = layer.feature(1).properties
    expect(first.c).toEqual('{"hello":"world"}')
    expect(first.d).toEqual('[1,2,3]')
    expect(first.e).toEqual(undefined)
    expect(second.c).toEqual('{"goodbye":"planet"}')
    expect(second.d).toEqual('{"hello":"world"}')
  })

  test('number encoding https://github.com/mapbox/vt-pbf/pull/11', function () {
    const orig = {
      type: 'Feature',
      properties: {
        large_integer: 39953616224,
        non_integer: 331.75415
      },
      geometry: {
        type: 'Point',
        coordinates: [0, 0]
      }
    }

    const tileindex = geojsonvt(orig)
    const tile = tileindex.getTile(1, 0, 0)
    const buff = fromGeojsonVt({ geojsonLayer: tile })
    const vt = new VectorTile(new Pbf(buff))
    const layer = vt.layers.geojsonLayer

    const properties = layer.feature(0).properties
    expect(properties.large_integer).toEqual(39953616224)
    expect(properties.non_integer).toEqual(331.75415)
  })
})

test('id encoding', function () {
  const orig = {
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
  }

  const tileindex = geojsonvt(orig)
  const tile = tileindex.getTile(1, 0, 0)
  const buff = fromGeojsonVt({ geojsonLayer: tile })
  const vt = new VectorTile(new Pbf(buff))
  const layer = vt.layers.geojsonLayer
  expect(layer.feature(0).id).toEqual(123)
  expect(layer.feature(1).id).toBeFalsy() // 'Non-integer values should not be saved'
  expect(layer.feature(2).id).toBeFalsy()
})

test('accept geojson-vt options https://github.com/mapbox/vt-pbf/pull/21', function () {
  const version = 2
  const extent = 8192
  const orig = JSON.parse(fs.readFileSync(path.join(__dirname, '/fixtures/rectangle.geojson')))
  const tileindex = geojsonvt(orig, { extent: extent })
  const tile = tileindex.getTile(1, 0, 0)
  const options = { version: version, extent: extent }
  const buff = fromGeojsonVt({ geojsonLayer: tile }, options)

  const vt = new VectorTile(new Pbf(buff))
  const layer = vt.layers.geojsonLayer
  const features = []
  for (let i = 0; i < layer.length; i++) {
    const feat = layer.feature(i).toGeoJSON(0, 0, 1)
    features.push(feat)
  }

  expect(layer.version).toEqual(options.version, 'version should be equal')
  expect(layer.extent).toEqual(options.extent, 'extent should be equal')

  orig.features.forEach(function (expected) {
    const actual = features.shift()
    expect(eq.compare(actual, expected)).toBeTruthy()
  })
})
