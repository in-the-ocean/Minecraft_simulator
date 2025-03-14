import {BlockType, getChunkKey, VegetationType} from "./Block";
import {FractalNoise} from "../../Noise";
import {makeNoise2D} from "fast-simplex-noise";
import {SeededRandom} from "../../../../anigraph";
import {MCTerrainModel} from "./MCTerrainModel";
import {HeightGenerator} from "./HeightGenerator";

export enum BiomeType {
    Plains = "plains",
    Desert = "desert",
    ColdPlain = "coldPlain",
    Ocean = "ocean",
    Forest = "forest",
    Jungle = "jungle",
    Beach = "beach",
    SnowyPlain = "snowyPlain",
    Peak = "peak",
    FrozenPeak = "frozenPeak",
}

const VEGETATION_LIST = [
    VegetationType.Tree,
    VegetationType.ShortGrass,
    VegetationType.Dandelion,
    VegetationType.Poppy,
    VegetationType.Daisy,
]

export const VEGETATION_PROBABILITY: Record<BiomeType, number[]>= {
    // [empty, tree, grass, dandelion, poppy, daisy]
    "plains": [0.5, 0.5015, 0.75, 0.85, 0.88, 1],
    "desert": [0.9, 0.9, 1],
    "coldPlain": [0.55, 0.553, 0.85, 0.92, 1],
    "ocean": [1],
    "forest": [0.45, 0.47, 0.7, 0.8, 0.9, 1],
    "jungle": [0.45, 0.48, 0.8, 0.87, 1],
    "beach": [1],
    "snowyPlain": [0.85, 0.855, 1],
    "peak": [1],
    "frozenPeak": [1],
}


export class BiomeGenerator {

    heightGenerator: HeightGenerator;
    vegetationNoise: (x: number, z: number) => number;
    temperatureNoise: FractalNoise;
    humidityNoise: FractalNoise;

    caveNoise: FractalNoise;
    constructor(heightGenerator: HeightGenerator, seed = 0) {
        this.heightGenerator = heightGenerator;
        this.vegetationNoise = makeNoise2D(new SeededRandom(seed + 50).rand);
        this.temperatureNoise = new FractalNoise(true, 4, 0.0003, 4, new SeededRandom(seed + 51).rand, new SeededRandom(52).rand, new SeededRandom(53).rand, new SeededRandom(54).rand);
        this.humidityNoise = new FractalNoise(true, 4, 0.001, 4, new SeededRandom(seed + 55).rand, new SeededRandom(56).rand, new SeededRandom(57).rand, new SeededRandom(58).rand);

        this.caveNoise = new FractalNoise(false, 4, 0.005, 4, new SeededRandom(seed + 59).rand, new SeededRandom(60).rand, new SeededRandom(61).rand, new SeededRandom(62).rand);
    }

    getBlockType(x: number, y: number, z: number, biomeType: BiomeType, heightMap: {[key: string]: number}, vegetation?: VegetationType): BlockType{
        let height = heightMap[getChunkKey(x, z)];
        switch (biomeType) {
            case BiomeType.Plains:
            case BiomeType.Forest:
                if (y >= height - 1) {
                    return BlockType.Grass;
                } else if (y >= height - 3) {
                    return BlockType.Dirt;
                }
                break
            case BiomeType.Jungle:
                if (y >= height - 1) {
                    return BlockType.WarmGrass;
                } else if (y >= height - 3) {
                    return BlockType.Dirt;
                }
                break
            case BiomeType.ColdPlain:
                if (y >= height - 1) {
                    return BlockType.ColdGrass;
                } else if (y >= height - 3) {
                    return BlockType.Dirt;
                }
                break
            case BiomeType.Beach:
            case BiomeType.Ocean:
            case BiomeType.Desert:
                if (y >= height - 2) {
                    return BlockType.Sand;
                }
                break
            case BiomeType.SnowyPlain:
                if (y >= height - 1) {
                    if (vegetation !== undefined) {
                        return BlockType.ColdGrass;
                    }
                    return BlockType.SnowyGrass;
                } else if (y >= height - 2) {
                    return BlockType.Dirt;
                }
                break;
            case BiomeType.Peak:
                return BlockType.Stone;
            case BiomeType.FrozenPeak:
                if (y >= height - 1) {
                    return BlockType.Snow;
                } else if (y >= height - 2) {
                    return BlockType.Ice;
                }
        }
        return BlockType.Stone;

    }

    getBiomeType(x: number, z: number, heightMap: {[key: string]: number}): BiomeType {
        let height = heightMap[getChunkKey(x, z)];
        let continentalness = this.heightGenerator.getContinentalnessAt(x, z);
        let pv = this.heightGenerator.getPVNoiseAt(x, z);
        let temperature = this.temperatureNoise.getNoise(x, z);
        let humidity = this.humidityNoise.getNoise(x, z);
        if (height < MCTerrainModel.SEA_LEVEL) {
            return BiomeType.Ocean;
        }

        if (pv > 0.6 && continentalness > 0.35) { // peak
            if (temperature < -0.2) {
                return BiomeType.FrozenPeak;
            } else {
                return BiomeType.Peak;
            }
        }

        if (continentalness < -0.21) {
            return BiomeType.Beach;
        } else {
            if (temperature > 0.35 && continentalness < 0.35 && humidity < -0.1) {
                return BiomeType.Desert;
            } else if (temperature > -0.1 && humidity > 0.1) {
                if (temperature > 0.25 && humidity > 0.2) {
                    return BiomeType.Jungle
                }
                return BiomeType.Forest;
            } else if (temperature < -0.45) {
                return BiomeType.SnowyPlain
            }
        }
        if (continentalness > 0.38 || temperature < -0.3) {
            return BiomeType.ColdPlain;
        }
        return BiomeType.Plains;
    }

    isCave(x: number, y: number, z: number): boolean {
        let caveNoise = this.caveNoise.getNoise(x, y, z);
        return caveNoise < -0.8;
    }

    getLeafType(biomeType: BiomeType): BlockType {
        switch (biomeType) {
            case BiomeType.Jungle:
                return BlockType.WarmLeaves;
            case BiomeType.SnowyPlain:
                return BlockType.SnowyLeaves;
            case BiomeType.ColdPlain:
                return BlockType.ColdLeaves;
            default:
                return BlockType.Leaves;
        }
    }

    getTreeHeight(x: number, z: number, biomeType: BiomeType): number {
        if (biomeType === BiomeType.Jungle) {
            let rand = this.vegetationNoise(x * 0.7, z * 1.1);
            return Math.round(((rand - 0.4) * 12 + (0.44 - rand) * 6) / 0.04);
        }
        return 7;
    }

    getShortGrassType(biomeType: BiomeType): VegetationType {
        switch (biomeType) {
            case BiomeType.SnowyPlain:
            case BiomeType.ColdPlain:
                return VegetationType.ColdShortGrass;
            case BiomeType.Jungle:
                return VegetationType.WarmShortGrass;
            case BiomeType.Desert:
                return VegetationType.HotShortGrass
            default:
                return VegetationType.ShortGrass;
        }
    }

    getVegetation(x: number, z: number, biomeType: BiomeType): VegetationType | undefined {
        if (VEGETATION_PROBABILITY[biomeType].length == 1) {
            return undefined; // no vegetation
        }
        // multiply by random number to avoid diagonal artifacts
        let rand = this.vegetationNoise(x * 0.7, z * 1.1);
        let idx = VEGETATION_PROBABILITY[biomeType].findIndex((prob) => rand < prob);
        if (idx > 0) {
            if (idx === 2) {
                // short grass
                return this.getShortGrassType(biomeType);
            }
            return VEGETATION_LIST[idx - 1];
        }
        return undefined;
    }
}