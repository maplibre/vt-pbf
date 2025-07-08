import Point from '@mapbox/point-geometry';
import Pbf from 'pbf';
import {VectorTileFeature, type VectorTileLayer, type VectorTile} from '@mapbox/vector-tile';
import type {TileFeature, AnyProps} from 'supercluster';
import type {Feature as GeoJSONVTFeature} from 'geojson-vt';

export type Feature = TileFeature<AnyProps, AnyProps> | GeoJSONVTFeature;

export interface GeoJSONOptions {
    version: number;
    extent: number;
}

class FeatureWrapper implements VectorTileFeature {
    _feature: Feature;

    extent: number;
    type: Feature['type'];
    id: number | undefined = undefined;
    properties: {[_: string]: string | number | boolean};
    _pbf: Pbf = new Pbf();
    _geometry: number = -1;
    _keys: string[] = [];
    _values: unknown[] = [];

    bbox(): number[] {
        return VectorTileFeature.prototype.bbox.call(this);
    }

    constructor(feature: Feature, extent: number) {
        this._feature = feature;

        this.extent = extent;
        this.type = feature.type;
        this.properties = feature.tags ? feature.tags : {};

        // If the feature has a top-level `id` property, copy it over, but only
        // if it can be coerced to an integer, because this wrapper is used for
        // serializing geojson feature data into vector tile PBF data, and the
        // vector tile spec only supports integer values for feature ids --
        // allowing non-integer values here results in a non-compliant PBF
        // that causes an exception when it is parsed with vector-tile-js
        if ('id' in feature && !isNaN(feature.id as any)) {
            this.id = parseInt(feature.id, 10);
        }
    }

    loadGeometry() {
        const geometry = [];
        const rawGeo = this._feature.type === 1 ? [this._feature.geometry] : this._feature.geometry;
        for (const ring of rawGeo) {
            let newRing = [];
            for (let i = 0; i < ring.length; i++) {
                newRing.push(new Point(ring[i][0], ring[i][1]));
            }
            geometry.push(newRing);
        }
        return geometry;
    }

    toGeoJSON(x: number, y: number, z: number) {
        return VectorTileFeature.prototype.toGeoJSON.call(this, x, y, z);
    }
}

export class GeoJSONWrapper implements VectorTile, VectorTileLayer {
    layers: {[_: string]: VectorTileLayer};
    name: string;
    extent: number;
    length: number;
    version: number;
    _features: number[] = [];
    _pbf: Pbf = new Pbf();
    _keys: string[] = [];
    _values: unknown[] = [];
    _geoJSONFeatures: Array<Feature>;

    constructor(features: Feature[], options?: GeoJSONOptions) {
        this.layers = {'_geojsonTileLayer': this};
        this.name = '_geojsonTileLayer';
        this.version = options ? options.version : 1;
        this.extent = options ? options.extent : 4096;
        this.length = features.length;
        this._geoJSONFeatures = features;
    }

    feature(i: number): VectorTileFeature {
        return new FeatureWrapper(this._geoJSONFeatures[i], this.extent);
    }
}
