declare module '@mapbox/mvt-fixtures' {
  export interface Fixture {
    id: string;
    description: string;
    specification_reference: string;
    json: string;
    proto: string;
    validity: Record<string, boolean>;
    buffer: Buffer;
  }

  export interface CreateOptions {
    syntax: string;
  }

  export interface CreateResult {
    buffer: Buffer;
  }

  export function get(id: string | number): Fixture;
  
  export function each(fn: (fixture: Fixture) => void): void;
  
  export function create(json: string, proto: string, options?: CreateOptions): CreateResult;

  const mvtf: {
    get: (id: string | number) => Fixture;
    each: (fn: (fixture: Fixture) => void) => void;
    create: (json: string, proto: string, options?: CreateOptions) => CreateResult;
  };

  export default mvtf;
}