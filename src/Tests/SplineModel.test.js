import {V2, Vec2, Vec3, VertexArray2D} from "../anigraph";
import {SplineModel} from "../A1/nodes";
import {
    ArrayEqualTo,
    ArrayCloseTo,
    MatrixEqual,
    VecEqual,
    VertexArray2DCircToBeCloseTo,
    VertexArray2DToBeCloseTo
} from "./helpers/TestHelpers";
expect.extend(ArrayEqualTo);
expect.extend(ArrayCloseTo);
expect.extend(VertexArray2DToBeCloseTo);
expect.extend(MatrixEqual);
expect.extend(VecEqual);
expect.extend(VertexArray2DCircToBeCloseTo);


const emptySpline = new SplineModel();

const shortSpline = new SplineModel();
shortSpline.setVerts(new VertexArray2D([
    0, 0, 1,
    0, 1, 1,
    1, 1, 1,
    1, -1, 1 // last control point
]))

const longSpline = new SplineModel();
longSpline.setVerts(new VertexArray2D([
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
]))

////////////////////////////////////////////////////////////



describe("nBezierSegments Tests", () => {

    test("Empty spline", () => {
        const n = emptySpline.nBezierSegments;
        expect(n).toEqual(0);
    });

    test("Short spline", () => {
        const n = shortSpline.nBezierSegments;
        expect(n).toEqual(1);
    });

    test("Long spline", () => {
        const n = longSpline.nBezierSegments;
        expect(n).toEqual(3);
    });
});


describe("nInterpolatedControlPoints Tests", () => {
    const InterpolatedPointSpline =
    test("Empty spline", () => {
        let splineModel = new SplineModel();
        splineModel.setVerts(new VertexArray2D())
        expect(splineModel.nInterpolatedControlPoints).toEqual(0);
    });

    test("Spline with one control point", () => {
        let splineModel = new SplineModel();
        splineModel.setVerts(VertexArray2D.FromLists(
            [Vec2.Random()]
        ))
        expect(splineModel.nInterpolatedControlPoints).toEqual(1);
    });

    test("Spline with two control points", () => {
        let splineModel = new SplineModel();
        splineModel.setVerts(VertexArray2D.FromLists(
            [
                Vec2.Random(),
                Vec2.Random(),
            ]
        ))
        expect(splineModel.nInterpolatedControlPoints).toEqual(1);
    });

    test("Spline with three control points", () => {
        let splineModel = new SplineModel();
        splineModel.setVerts(VertexArray2D.FromLists(
            [
                Vec2.Random(),
                Vec2.Random(),
                Vec2.Random(),
            ]
        ))
        expect(splineModel.nInterpolatedControlPoints).toEqual(1);
    });

    test("Spline with four control points", () => {
        let splineModel = new SplineModel();
        splineModel.setVerts(VertexArray2D.FromLists(
            [
                Vec2.Random(),
                Vec2.Random(),
                Vec2.Random(),
                Vec2.Random(),
            ]
        ))

        expect(splineModel.nInterpolatedControlPoints).toEqual(2);
    });
});


describe("Bezier Interpolation Tests", () => {

    test("Short spline progress 0.0", () => {
        const v = shortSpline.getCubicBezierInterpolationPoint(0);
        expect(v.elements).ArrayCloseTo([0, 0]);
    });

    test("Short spline Velocity Vector at Progress 0.0", () => {
        const v = shortSpline.getCubicBezierVelocityVector(0);
        expect(v.elements).ArrayCloseTo([0, 3]);
    });

    test("Short spline progress 0.2", () => {
        const v = shortSpline.getCubicBezierInterpolationPoint(0.2);
        expect(v.elements).ArrayCloseTo([0.104, 0.472], null, null, [0.01,0.01]);
    });

    test("Short spline Velocity Vector at Progress 0.2", () => {
        const v = shortSpline.getCubicBezierVelocityVector(0.2);
        expect(v.elements).ArrayCloseTo([0.96,1.68], null, null, [0.01,0.01] );
    });

    test("Short spline progress 1.0", () => {
        const v = shortSpline.getCubicBezierInterpolationPoint(1.0);
        expect(v.elements).ArrayCloseTo([1, -1]);
    });

    test("Short spline Velocity Vector at Progress 1.0", () => {
        const v = shortSpline.getCubicBezierVelocityVector(1.0);
        expect(v.elements).ArrayCloseTo([0,-6]);
    });

    test("Long spline progress 0.0", () => {
        const v = longSpline.getCubicBezierInterpolationPoint(0);
        expect(v.elements).ArrayCloseTo([0, 0]);
    });

    test("Long spline Velocity Vector at progress 0.0", () => {
        const v = longSpline.getCubicBezierVelocityVector(0.0);
        expect(v.elements).ArrayCloseTo([0, 3]);
    });

    test("Long spline progress 0.5", () => {
        const v = longSpline.getCubicBezierInterpolationPoint(0.5);
        expect(v.elements).ArrayCloseTo([1.5, -0.75]);
    });

    test("Long spline Velocity Vector at progress 0.5", () => {
        const v = longSpline.getCubicBezierVelocityVector(0.5);
        expect(v.elements).ArrayCloseTo([1.5, 0]);
    });

    test("Long spline progress 1.0", () => {
        const v = longSpline.getCubicBezierInterpolationPoint(1.0);
        expect(v.elements).ArrayCloseTo([3, 0]);
    });

    test("Long spline Velocity Vector at progress 1.0", () => {
        const v = longSpline.getCubicBezierVelocityVector(1.0);
        expect(v.elements).ArrayCloseTo([0, -3]);
    });

});
