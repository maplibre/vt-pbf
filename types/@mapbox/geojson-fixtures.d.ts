declare module '@mapbox/geojson-fixtures' {
  export type Geometries = 'geometrycollection' | 'polygon' | 'point' |
    'multipoint' | 'multipolygon' | 'multilinestring';

  // Keyed by geometry type as well as `${type}-xyz` variants, so allow any string.
  export const geometry: Record<string, GeoJSON.Geometry>;

  export const featurecollection: {
    'one': GeoJSON.GeoJSON;
  };

  export const feature: {
    'one': GeoJSON.GeoJSON;
  };

  export const all: Record<string, GeoJSON.GeoJSON>;
}
