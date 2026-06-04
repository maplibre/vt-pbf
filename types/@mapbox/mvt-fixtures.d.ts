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
    proto?: string;
    syntax?: string;
  }

  export interface CreateResult {
    buffer: Buffer;
  }

  export function get(id: string | number): Fixture;

  export function each(fn: (fixture: Fixture) => void): void;

  export function create(definition: object, options?: CreateOptions): CreateResult;
}
