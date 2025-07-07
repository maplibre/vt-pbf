import Pbf from 'pbf';
import {type GeoJSONOptions, type Feature, GeoJSONWrapper} from './lib/geojson_wrapper';
import geojsonvt from 'geojson-vt';
import {type VectorTileLayer, type VectorTile, VectorTileFeature} from '@mapbox/vector-tile';

class Context {
    keys: string[] = [];
    values: string[] = [];
    keycache: Record<string, number> = {};
    valuecache: Record<string, number> = {};
    feature?: VectorTileFeature;
}

const writeTile = (tile: VectorTile, pbf: Pbf) => {
    for (const key in tile.layers) {
        pbf.writeMessage(3, writeLayer, tile.layers[key]);
    }
}

const writeProperties = (context: Context, pbf: Pbf) => {
    for (const key in context.feature?.properties) {
        let value = context.feature.properties[key];

        let keyIndex = context.keycache[key];
        if (value === null) continue // don't encode null value properties

        if (typeof keyIndex === 'undefined') {
            context.keys.push(key);
            keyIndex = context.keys.length - 1;
            context.keycache[key] = keyIndex;
        }
        pbf.writeVarint(keyIndex);

        if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number') {
            value = JSON.stringify(value);
        }
        const valueKey = typeof value + ':' + value;
        let valueIndex = context.valuecache[valueKey];
        if (typeof valueIndex === 'undefined') {
            context.values.push(value as string);
            valueIndex = context.values.length - 1;
            context.valuecache[valueKey] = valueIndex;
        }
        pbf.writeVarint(valueIndex);
    }
}

const writeGeometry = (feature: VectorTileFeature, pbf: Pbf) => {
    const command = (cmd: number, length: number) => {
        return (length << 3) + (cmd & 0x7);
    }
    const zigzag = (num: number) => {
        return (num << 1) ^ (num >> 31);
    }

    const geometry = feature.loadGeometry();
    const type = feature.type;
    let x = 0;
    let y = 0;
    for (let r = 0; r < geometry.length; r++) {
        const ring = geometry[r];
        let count = 1;
        if (type === 1) {
            count = ring.length;
        }
        pbf.writeVarint(command(1, count)); // moveto
        // do not write polygon closing path as lineto
        const lineCount = type === 3 ? ring.length - 1 : ring.length;
        for (let i = 0; i < lineCount; i++) {
            if (i === 1 && type !== 1) {
                pbf.writeVarint(command(2, lineCount - 1)); // lineto
            }
            const dx = ring[i].x - x;
            const dy = ring[i].y - y;
            pbf.writeVarint(zigzag(dx));
            pbf.writeVarint(zigzag(dy));
            x += dx;
            y += dy;
        }
        if (feature.type === 3) {
            pbf.writeVarint(command(7, 1)); // closepath
        }
    }
}

const writeValue = (value: string | boolean | number, pbf: Pbf) => {
    const type = typeof value;
    if (type == 'string') {
        pbf.writeStringField(1, value as string);
    } else if (type === 'boolean') {
        pbf.writeBooleanField(7, value as boolean);
    } else if (type === 'number') {
        if (value as number % 1 !== 0) {
            pbf.writeDoubleField(3, value as number);
        } else if (value as number < 0) {
            pbf.writeSVarintField(6, value as number);
        } else {
            pbf.writeVarintField(5, value as number);
        }
    }
}

const writeFeature = (context: Context, pbf: Pbf) => {
    if (!context.feature) {
        return;
    }

    const feature = context.feature;

    if (feature.id !== undefined) {
        pbf.writeVarintField(1, feature.id);
    }

    pbf.writeMessage(2, writeProperties, context);
    pbf.writeVarintField(3, feature.type);
    pbf.writeMessage(4, writeGeometry, feature);
}

const writeLayer = (layer: VectorTileLayer, pbf: Pbf) => {
    pbf.writeVarintField(15, layer.version || 1);
    pbf.writeStringField(1, layer.name || '');
    pbf.writeVarintField(5, layer.extent || 4096);

    const context: Context = new Context();

    for (let i = 0; i < layer.length; i++) {
        context.feature = layer.feature(i);
        pbf.writeMessage(2, writeFeature, context);
    }

    const keys = context.keys;
    for (let i = 0; i < keys.length; i++) {
        pbf.writeStringField(3, keys[i]);
    }

    const values = context.values;
    for (let i = 0; i < values.length; i++) {
        pbf.writeMessage(4, writeValue, values[i]);
    }
}

/**
 * Serialize a vector-tile-js-created tile to pbf
 *
 * @param {VectorTile} tile
 * @return {Uint8Array} uncompressed, pbf-serialized tile data
 */
export function fromVectorTileJs(tile: VectorTile): Uint8Array {
    const out = new Pbf();
    writeTile(tile, out);
    return out.finish();
}

/**
 * Serialized a geojson-vt-created tile to pbf.
 *
 * @param {Object} layers - An object mapping layer names to geojson-vt-created vector tile objects
 * @param {GeoJSONOptions} [options] - An object specifying the vector-tile specification version and extent that were used to create `layers`.
 * @param {Number} [options.version=1] - Version of vector-tile spec used
 * @param {Number} [options.extent=40966] - Extent of the vector tile
 * @return {Uint8Array} uncompressed, pbf-serialized tile data
 */
export function fromGeojsonVt(layers: geojsonvt.Tile[], options?: GeoJSONOptions): Uint8Array {
    const l: Record<string, VectorTileLayer> = {};
    for (const k in layers) {
        l[k] = new GeoJSONWrapper(layers[k].features, options);
        l[k].name = k;
        l[k].version = options ? options.version : 1;
        l[k].extent = options ? options.extent : 4096;
    }
    return fromVectorTileJs({ layers: l });
}

export {
    GeoJSONWrapper,
    GeoJSONOptions,
    Feature
}
