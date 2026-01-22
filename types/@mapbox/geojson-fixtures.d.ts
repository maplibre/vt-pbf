declare module '@mapbox/geojson-fixtures' {
  import geojsonvt from "@maplibre/geojson-vt";

  export type Geometries = 'geometrycollection' | 'polygon' | 'point' |
    'multipoint' | 'multipolygon' | 'multilinestring';

  const geojsonFixtures: {
    geometry: Record<Geometries, GeoJSON.Geometry>;

    featurecollection: {
      'one': GeoJSON.GeoJSON;
    };

    feature: {
      'one': GeoJSON.GeoJSON;
    };

    all: Record<string, GeoJSON.GeoJSON>;
  };

  export default geojsonFixtures;
}