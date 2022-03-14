export interface OrbitGlobal {
    globals: any;
    assert: (description: string, test: boolean) => void;
    deprecate: (message: string, test?: boolean | (() => boolean)) => void;
    uuid: () => string;
}
declare const Orbit: OrbitGlobal;
export default Orbit;
