import {Mat2DH, Vec2DH, Point2DH} from "../A1/math";
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




describe("Homogeneous Coordinate Tests", () => {
    test("Test zero vector", () => {
        const v = Vec2DH(0, 0);
        expect(v.elements).ArrayEqualTo([0,0,0]);
    });

    test("Test non-zero vector", () => {
        const v = Vec2DH(1, 3);
        expect(v.elements).ArrayEqualTo([1,3,0]);
    });

    test("Test zero point", () => {
        const p = Point2DH(0, 0);
        expect(p.elements).ArrayEqualTo([0,0,1]);
    });

    test("Test non-zero point", () => {
        const p = Point2DH(2, 5);
        expect(p.elements).ArrayEqualTo([2,5,1]);
    });
});


describe("Mat2DH Scaling Matrix Tests", () => {
    test("Test identity scaling", () => {
        const m = Mat2DH.Scale2D(1, 1);
        expect(m.elements).ArrayEqualTo([1,0,0,0,1,0,0,0,1]);
    });

    test("Test positive scaling", () => {
        const m = Mat2DH.Scale2D(2, 6);
        expect(m.elements).ArrayEqualTo([2,0,0,0,6,0,0,0,1]);
    });

    test("Test negative scaling", () => {
        const m = Mat2DH.Scale2D(-5, -2);
        expect(m.elements).ArrayEqualTo([-5,0,0,0,-2,0,0,0,1]);
    });
});

describe("Mat2DH Translation Matrix Tests", () => {
    test("Test zero translation", () => {
        const m = Mat2DH.Translation2D(0, 0);
        expect(m.elements).ArrayEqualTo([1,0,0,0,1,0,0,0,1]);
    });

    test("Test non-zero translation", () => {
        const m = Mat2DH.Translation2D(-2, 4);
        expect(m.elements).ArrayEqualTo([1,0,-2,0,1,4,0,0,1]);
    });
});

describe("Mat2DH Rotation Matrix Tests", () => {
    test("Test zero rotation", () => {
        const m = Mat2DH.Rotation2D(0);
        expect(m.elements).ArrayEqualTo([1,0,0,0,1,0,0,0,1]);
    });

    test("Test identity rotation", () => {
        const m = Mat2DH.Rotation2D(Math.PI*2);
        expect(m.elements).ArrayCloseTo([1,0,0,0,1,0,0,0,1]);
    });

    test("Test positive rotation", () => {
        const v = 1/Math.sqrt(2);
        const m = Mat2DH.Rotation2D(Math.PI/4);
        expect(m.elements).ArrayCloseTo([v,-v,0,v,v,0,0,0,1]);
    });

    test("Test negative rotation", () => {
        const v = 1/Math.sqrt(2);
        const m = Mat2DH.Rotation2D(-Math.PI/4);
        expect(m.elements).ArrayCloseTo([v,v,0,-v,v,0,0,0,1]);
    });

    test("Test large rotation", () => {
        const v = 1/Math.sqrt(2);
        const m = Mat2DH.Rotation2D(Math.PI * 9/4);
        expect(m.elements).ArrayCloseTo([v,-v,0,v,v,0,0,0,1]);
    });
});

