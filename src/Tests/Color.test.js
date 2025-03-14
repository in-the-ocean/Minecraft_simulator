import { VehicleDriveMode} from "../A1/nodes";
import {Vec3, VertexArray2D, Color, VertexAttributeColorArray} from "../anigraph";
import {TrackModel} from "../A1/nodes/Track/TrackModel";
import {
    ArrayEqualTo,
    ArrayCloseTo,
    MatrixEqual,
    VecEqual,
    VertexArray2DCircToBeCloseTo,
    VertexArray2DToBeCloseTo
} from "./helpers/TestHelpers";

expect.extend(ArrayCloseTo);

const track = new TrackModel();
let brightness = 1.0;
track.setVerts(new VertexArray2D([
    0, 0, 1,
    0, 1, 1,
    1, 1, 1,
    1, 0, 1,
    1, -1, 1,
    2, -1, 1,
    2, 0, 1,
    2, 1, 1,
    3, 1, 1,
    3, 0, 1,
    3, -1, 1 // last control point
], [0, 0, 1, 1,
    0, 1, 1, 1,
    1, 1, 1, 1,
    1, 0, 1, 1,
    1, -1, 1, 1,
    2, -1, 1, 1,
    2, 0, 1, 1,
    2, 1, 1, 1,
    3, 1, 1, 1,
    3, 0, 1, 1,
    3, -1, 1, 1]))

describe("Track Model Tests using Color", () => {

    test("Track progress at 0.0", () => {
        const v = track.getLinearInterpolationColor(0.0);
        expect(v.elements).ArrayCloseTo([0, 0, 1, 1]);
    });

    test("Track progress at 0.5", () => {
        const v = track.getLinearInterpolationColor(0.5);
        expect(v.elements).ArrayCloseTo([1.5, -1, 1, 1]);
    });

    test("Track progress at 0.8", () => {
        const v = track.getLinearInterpolationColor(0.8);
        expect(v.elements).ArrayCloseTo([2.2, 1, 1, 1]);
    });

    test("Track progress at 1.0", () => {
        const v = track.getLinearInterpolationColor(1.0);
        expect(v.elements).ArrayCloseTo([3, 0, 1, 1]);
    });

    test("Track progress at 0.0", () => {
        const v = track.getCubicBezierInterpolatedColor(0.0);
        expect(v.elements).ArrayCloseTo([0, 0, 1, 1]);
    });

    test("Track progress at 0.5", () => {
        const v = track.getCubicBezierInterpolatedColor(0.5);
        expect(v.elements).ArrayCloseTo([1.5, -0.75, 1, 1]);
    });

    test("Track progress at 0.8", () => {
        const v = track.getCubicBezierInterpolatedColor(0.8);
        expect(v.elements).ArrayCloseTo([2.352,0.72,1,1],null, null, [0.01,0.01, 0.01, 0.01]);
    });

    test("Track progress at 1.0", () => {
        const v = track.getCubicBezierInterpolatedColor(1.0);
        expect(v.elements).ArrayCloseTo([3, 0, 1, 1]);
    });


});
