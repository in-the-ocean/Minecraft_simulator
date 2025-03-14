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
    1, 0, 1,
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


const Spline1 = new SplineModel();
Spline1.setVerts(new VertexArray2D([
    0,0,0,
    0,0,0,
    1,1,1,
]))

const Spline2 = new SplineModel();
Spline2.setVerts(new VertexArray2D([
    0,0,0,
    1,1,1
]))

const Spline3 = new SplineModel();
Spline3.setVerts(new VertexArray2D([
    0,0,0,
    0,0,0,
    0,0,0,
    0,0,0
]))




describe("Linear Interpolation Tests", () => {

    test("Short spline progress 0.0", () => {
        const v = shortSpline.getLinearInterpolationPoint(0);
        expect(v.elements).ArrayCloseTo([0, 0]);
    });

    test("Short spline Velocity Vector at progress 0.0", () => {
        const v = shortSpline.getLinearInterpolationVelocity(0.0);
        expect(v.elements).ArrayCloseTo([0, 1]);
    });

    test("Short spline progress 0.2", () => {
        const v = shortSpline.getLinearInterpolationPoint(0.2);
        expect(v.elements).ArrayCloseTo([0.0, 0.6]);
    });

    test("Short spline Velocity Vector at progress 0.2", () => {
        const v = shortSpline.getLinearInterpolationVelocity(0.2);
        expect(v.elements).ArrayCloseTo([0, 1]);
    });


    test("Short spline progress 1.0", () => {
        const v = shortSpline.getLinearInterpolationPoint(1.0);
        expect(v.elements).ArrayCloseTo([1, 0]);
    });

    test("Long spline progress 0.0", () => {
        const v = longSpline.getLinearInterpolationPoint(0);
        expect(v.elements).ArrayCloseTo([0, 0]);
    });

    test("Long spline Velocity Vector at progress 0.0", () => {
        const v = longSpline.getLinearInterpolationVelocity(0.0);
        expect(v.elements).ArrayCloseTo([0, 1]);
    });

    test("Long spline progress 0.5", () => {
        const v = longSpline.getLinearInterpolationPoint(0.5);
        expect(v.elements).ArrayCloseTo([1.5, -1]);
    });

    test("Long spline Velocity Vector at progress 0.5", () => {
        const v = longSpline.getLinearInterpolationVelocity(0.5);
        expect(v.elements).ArrayCloseTo([1, 0]);
    });

    test("Long spline progress 1.0", () => {
        const v = longSpline.getLinearInterpolationPoint(1.0);
        expect(v.elements).ArrayCloseTo([3, 0]);
    });

    test("Handles corner case 1.0", () =>{
        const v = Spline1.getLinearInterpolationPoint(0.2);
        expect(v.elements).ArrayCloseTo([0,0]);
    })

    test("Handles corner case Velocity 1.0", () =>{
        const v = Spline1.getLinearInterpolationVelocity(0.5);
        expect(v.elements).ArrayCloseTo([0,0]);
    })

    test("Handles corner case 2.0", () =>{
        const v = Spline2.getLinearInterpolationPoint(0.2);
        expect(v.elements).ArrayCloseTo([0,0]);
    })

    test("Handles corner case Velocity 2.0", () =>{
        const v = Spline2.getLinearInterpolationVelocity(0.5);
        expect(v.elements).ArrayCloseTo([0, 0]);
    })


    test("Handles corner case 3.0", () =>{
        const v = Spline3.getLinearInterpolationPoint(0.2);
        expect(v.elements).ArrayCloseTo([0,0]);
    })

    test("Handles corner case Velocity 3.0", () =>{
        const v = Spline3.getLinearInterpolationVelocity(0.5);
        expect(v.elements).ArrayCloseTo([0, 0]);
    })


});
