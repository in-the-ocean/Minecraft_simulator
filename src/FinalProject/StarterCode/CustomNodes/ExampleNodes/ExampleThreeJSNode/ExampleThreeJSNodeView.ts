import * as THREE from "three";
import {ANodeView, AThreeJSMeshGraphic, Color, Mat4, NodeTransform3D, Quaternion, V3, Vec3} from "../../../../../anigraph";

export class ExampleThreeJSNodeView extends ANodeView{
    init(): void {


        /**
         * Below I show two ways to add arbitrary threejs content to your scene. I recommend using the second approach, which makes better use of AniGraph features and is generally a better idea. However, if you are determined to minimize AniGraph use and focus on threejs, which is open source (AniGraph is not yet--though, I intend to release some version of it eventually), you are welcome to use the first approach.
         */

        /**
         * Option 1 is to directly add threejs elements to the view. This has the advantage of being simple, but it sidesteps resource management (e.g., if you dispose of the node it won't free up corresponding allocated resources connected to the GPU)
         */
        const dodecahedronGeometry = new THREE.DodecahedronGeometry(0.25);
        const lambertMaterial = new THREE.MeshLambertMaterial({ color: Color.FromString("#ee2222").asThreeJS()});
        const dodecahedron = new THREE.Mesh(dodecahedronGeometry, lambertMaterial);

        // add directly to the underlying threejs group node for this view
        this.threejs.add(dodecahedron);

        /**
         * Transforming threejs objects is a bit weird. Frankly, if there is one thing AniGraph does a lot better than
         * threejs it's the basic Matrix / math operations... but you are welcome to explore using threejs math if you
         * like.
         *
         * Some words of warning:
         * - matrices are declared in row-major order but stored in column-major order.
         *         // - Object3D transformations are specified EITHER by a matrix or by a position quaternion combo, and there is no
         */
        dodecahedron.position.set(1,0,0);




        /**
         * An alternative approach is to create a AGraphicObject and add that.
         * This does a better job of managing resources, and it's easier to customize AGraphicObject subclasses.
         * For general threejs graphics, the `AThreeJSMeshGraphic` class is useful.
         */

        //we start the same way...
        const elementDodecahedronGeometry = new THREE.DodecahedronGeometry(0.25);
        const elementLambertMaterial = new THREE.MeshLambertMaterial({ color: Color.FromString("#22aa22").asThreeJS()});

        //but noe we wrap in a graphic element subclass
        let element = AThreeJSMeshGraphic.Create(elementDodecahedronGeometry, elementLambertMaterial)
        this.registerAndAddGraphic(element);

        // we can also set the transformation of elements with AniGraph classes.
        let position = V3(-1, 0.5,0);
        let orientation = Quaternion.FromZAndUp(Vec3.UnitY(), Vec3.UnitZ().times(-1));
        element.setTransform(new NodeTransform3D(position, orientation));

        this.setTransform(this.model.transform);
    }

    update(...args: any[]): void {
        /**
         * Still want to update the transform of the threejs object based on the model's transformation
         */
        this.setTransform(this.model.transform);
    }


}


