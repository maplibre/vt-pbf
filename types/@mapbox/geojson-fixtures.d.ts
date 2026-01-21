declare module '@mapbox/geojson-fixtures' {
  import GeoJSON from 'geojson';
  import geojsonvt from "geojson-vt";

  export type Geometries = 'geometrycollection' | 'polygon' | 'point' |
    'multipoint' | 'multipolygon' | 'multilinestring';

  const geojsonFixtures: {
    geometry: Record<Geometries, GeoJSON.Geometry>;

    featurecollection: {
      'one': geojsonvt.Data;
    };

    feature: {
      'one': geojsonvt.Data;
    };

    all: Record<string, geojsonvt.Data | GeoJSON.Geometry>;
  };

  export default geojsonFixtures;
}