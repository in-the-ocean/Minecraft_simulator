import {makeNoise2D, makeNoise3D} from "fast-simplex-noise";

export class FractalNoise {
    is2D: boolean;
    octaves: number;
    noises2D: ((x: number, y: number) => number)[];
    noises3D: ((x: number, y: number, z: number) => number)[];
    base_frequency: number;
    frequencies: number[];
    amplitudes: number[];
    lacunarity: number;
    persistence: number;
    constructor(is2D: boolean, octaves: number, base_frequency: number, lacunarity: number,  ...args: any[]) {
        this.is2D = is2D;
        this.octaves = octaves;
        this.base_frequency = base_frequency;
        this.lacunarity = lacunarity;
        this.persistence = 1 / lacunarity;
        this.noises2D = [];
        this.noises3D = []
        for (let i = 0; i < octaves; i++) {
            if (is2D) {
                this.noises2D.push(makeNoise2D(args[i]));
            } else {
                this.noises3D.push(makeNoise3D(args[i]));
            }
        }
        this.frequencies = [];
        this.amplitudes = [];
        for (let i = 0; i < octaves; i++) {
            this.frequencies.push(Math.pow(this.lacunarity, i) * this.base_frequency);
            this.amplitudes.push(Math.pow(this.persistence, i));
        }
        let totalAmplitude = this.amplitudes.reduce((a, b) => a + b, 0);
        this.amplitudes = this.amplitudes.map((amp) => amp / totalAmplitude);
    }

    getNoise(x: number, y: number, z = 0) {
        let res = 0;
        for (let i = 0; i < this.octaves; i++) {
            if (this.is2D) {
                res += this.noises2D[i](x * this.frequencies[i], y * this.frequencies[i]) * this.amplitudes[i];
            } else {
                res += this.noises3D[i](x * this.frequencies[i], y * this.frequencies[i], z * this.frequencies[i]) * this.amplitudes[i];
            }
        }
        return res;
    }
}

