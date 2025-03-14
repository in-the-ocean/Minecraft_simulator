import {MCTerrainModel} from "./MCTerrainModel";
import {FractalNoise} from "../../Noise";

export class HeightGenerator {
    static HEIGHT_VARIATION = 62
    static CONTINENTAL_CONTROL_POINTS = [[-1, -0.7], [-0.4, -0.5], [-0.2, 0.1], [0.3, 0.3], [0.4, 1.1], [0.6, 1.3], [1, 1.4]];
    static PV_CONTROL_POINTS = [[-1, -0.7], [-0.5, 0], [0.3, 0], [0.7, 0.8], [1, 1]]

    continentalNoise: FractalNoise;
    ridgesNoise: FractalNoise;

    constructor(continentalNoise: FractalNoise, ridgesNoise: FractalNoise) {
        this.continentalNoise = continentalNoise;
        this.ridgesNoise = ridgesNoise;
    }

    getHeightAt(x: number, z: number) {
        let pvNoiseVal = this.getPVNoiseAt(x, z);
        return MCTerrainModel.SEA_LEVEL + HeightGenerator.HEIGHT_VARIATION * (0.5 * this.getValleyValue(pvNoiseVal) + this.getContinentalValue(x, z) * this.getPeakValue(pvNoiseVal));
    }


    getContinentalnessAt(x: number, z: number) {
        return this.continentalNoise.getNoise(x, z);
    }

    getPVNoiseAt(x: number, z: number) {
        let pv = this.ridgesNoise.getNoise(x, z);
        return 1 - Math.abs(3 * Math.abs(pv) - 2);
    }

    getValleyValue(pvNoise: number) {
        if (pvNoise < -0.5) {
            // linear interpolation between 0 and -0.7
            let a = (-0.5 - pvNoise) * 2;
            return -a * 0.7;
        }
        return 0;
    }

    getPeakValue(pvNoise: number) {
        if (pvNoise > 0.5) {
            let a = (1 - pvNoise) * 2;
            return a + (1 - a) * 1.5;
        }
        return 1;
    }

    getContinentalValue(x: number, z: number) {
        let noiseVal = this.continentalNoise.getNoise(x, z);
        let controledVal = this.linearInterpControlPoints(HeightGenerator.CONTINENTAL_CONTROL_POINTS, noiseVal);
        return controledVal;
    }

    getPVValue(x: number, z: number) {
        let pv = this.getPVNoiseAt(x, z);
        pv = this.linearInterpControlPoints(HeightGenerator.PV_CONTROL_POINTS, pv);
        return pv
    }

    linearInterpControlPoints(controlPoints: number[][], x: number) {
        let controlIdx = controlPoints.findIndex((point) => point[0] > x);
        let alpha = (controlPoints[controlIdx][0] - x) / (controlPoints[controlIdx][0] - controlPoints[controlIdx - 1][0]);
        return alpha * controlPoints[controlIdx - 1][1] + (1 - alpha) * controlPoints[controlIdx][1];
    }
}