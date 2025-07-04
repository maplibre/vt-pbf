import Point from '@mapbox/point-geometry';
import {VectorTileFeature, VectorTileLayer, type VectorTile} from '@mapbox/vector-tile';
import type {TileFeature, AnyProps} from 'supercluster';
import {type Feature as GeoJSONVTFeature, Geometry} from 'geojson-vt';
import Pbf from 'pbf';

export type Feature = TileFeature<AnyProps, AnyProps> | GeoJSONVTFeature;

export interface GeoJSONOptions {
    version: number;
    extent: number;
}

class FeatureWrapper extends VectorTileFeature {
    feature: Feature;

    constructor(feature: Feature, extent: number) {
        super(new Pbf(), 0, extent, [], []);
        this.feature = feature;
        this.type = feature.type;
        this.properties = feature.tags ? feature.tags : {};

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
}

export class GeoJSONWrapper extends VectorTileLayer implements VectorTile {
    layers: Record<string, VectorTileLayer>;
    name: string;
    extent: number;
    length: number;
    version: number;
    features: Feature[];

    constructor(features: Feature[], options?: GeoJSONOptions) {
        super(new Pbf());
        this.layers = {'_geojsonTileLayer': this};
        this.name = '_geojsonTileLayer';
        this.version = options ? options.version : 1;
        this.extent = options ? options.extent : 4096;
        this.length = features.length;
        this.features = features;
    }

    feature(i: number): VectorTileFeature {
        return new FeatureWrapper(this.features[i], this.extent);
    }
}
