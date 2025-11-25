import Point from "@mapbox/point-geometry";
import {
    classifyRings,
  VectorTileFeature,
  VectorTileLayer,
  type VectorTile,
} from "@mapbox/vector-tile";
import type { TileFeature, AnyProps } from "supercluster";
import { type Feature as GeoJSONVTFeature, Geometry } from "geojson-vt";
import Pbf from "pbf";
import type { VectorTileFeatureLike, VectorTileLayerLike } from "../index";

export type Feature = TileFeature<AnyProps, AnyProps> | GeoJSONVTFeature;

export interface GeoJSONOptions {
    version: number;
    extent: number;
}

class FeatureWrapper implements VectorTileFeatureLike {
    feature: Feature;

    type: 0 | 1 | 2 | 3;
    properties: Record<string, number | string | boolean>;
    id: number | undefined;
    extent: number;

    constructor(feature: Feature, extent: number) {
        this.feature = feature;
        this.type = feature.type;
        this.properties = feature.tags ? feature.tags : {};
        this.extent = extent;

        // If the feature has a top-level `id` property, copy it over, but only
        // if it can be coerced to an integer, because this wrapper is used for
        // serializing geojson feature data into vector tile PBF data, and the
        // vector tile spec only supports integer values for feature ids --
        // allowing non-integer values here results in a non-compliant PBF
        // that causes an exception when it is parsed with vector-tile-js
        if ('id' in feature) {
            if (typeof feature.id === 'string') {
                this.id = parseInt(feature.id, 10);
            } else if (typeof feature.id === 'number' && !isNaN(feature.id as number)) {
                this.id = feature.id;
            }
        }
    }

    loadGeometry() {
        const geometry = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawGeo = this.feature.type === 1 ? [this.feature.geometry] : this.feature.geometry as any as Geometry[][];
        for (const ring of rawGeo) {
            const newRing = [];
            for (const point of ring) {
                newRing.push(new Point(point[0], point[1]));
            }
            geometry.push(newRing);
        }
        return geometry;
    }

    toGeoJSON(x: number, y: number, z: number): GeoJSON.Feature {
        const size = this.extent * Math.pow(2, z),
            x0 = this.extent * x,
            y0 = this.extent * y,
            vtCoords = this.loadGeometry();

        function projectPoint(p: Point) {
            return [
                (p.x + x0) * 360 / size - 180,
                360 / Math.PI * Math.atan(Math.exp((1 - (p.y + y0) * 2 / size) * Math.PI)) - 90
            ];
        }

        function projectLine(line: Point[]) {
            return line.map(projectPoint);
        }

        let geometry: GeoJSON.Geometry;

        if (this.type === 1) {
            const points = [];
            for (const line of vtCoords) {
                points.push(line[0]);
            }
            const coordinates = projectLine(points);
            geometry = points.length === 1 ?
                {type: 'Point', coordinates: coordinates[0]} :
                {type: 'MultiPoint', coordinates};

        } else if (this.type === 2) {

            const coordinates = vtCoords.map(projectLine);
            geometry = coordinates.length === 1 ?
                {type: 'LineString', coordinates: coordinates[0]} :
                {type: 'MultiLineString', coordinates};

        } else if (this.type === 3) {
            const polygons = classifyRings(vtCoords);
            const coordinates = [];
            for (const polygon of polygons) {
                coordinates.push(polygon.map(projectLine));
            }
            geometry = coordinates.length === 1 ?
                {type: 'Polygon', coordinates: coordinates[0]} :
                {type: 'MultiPolygon', coordinates};
        } else {

            throw new Error('unknown feature type');
        }

        const result: GeoJSON.Feature = {
            type: 'Feature',
            geometry,
            properties: this.properties
        };

        if (this.id != null) {
            result.id = this.id;
        }

        return result;
    }
}

export class GeoJSONWrapper implements VectorTileLayerLike {
    layers: Record<string, VectorTileLayerLike>;
    name: string;
    extent: number;
    length: number;
    version: number;
    features: Feature[];

    constructor(features: Feature[], options?: GeoJSONOptions) {
        this.layers = {'_geojsonTileLayer': this};
        this.name = '_geojsonTileLayer';
        this.version = options ? options.version : 1;
        this.extent = options ? options.extent : 4096;
        this.length = features.length;
        this.features = features;
    }

    feature(i: number): VectorTileFeatureLike {
        return new FeatureWrapper(this.features[i], this.extent);
    }
}
