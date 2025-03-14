import {
    ANodeView,
    APlaneGraphic,
    Color,
    GetAppState,
    NodeTransform3D,
    Quaternion,
    V3,
    Vec3
} from "../../../../anigraph";
import {MainSceneController} from "../../MainSceneController";
import * as THREE from "three";
import {MCPlayerModel} from "./MCPlayerModel";
import {BlockType, getBottomMaterial, getSideMaterial, getTopMaterial, pushToArray} from "../Terrain/Block";


export class MCPlayerView extends ANodeView {

    BLOCK_SIZE = 0.005;
    crosshair!: THREE.Group;
    boundsHelper!: any;
    block!: THREE.Group;
    topMesh!: THREE.Mesh;
    bottomMesh!: THREE.Mesh;
    leftMesh!: THREE.Mesh;
    rightMesh!: THREE.Mesh;
    frontMesh!: THREE.Mesh;
    backMesh!: THREE.Mesh;

    lastBlockType: BlockType | undefined = undefined;

    up = Vec3.UnitY();

    get model() {
        return this._model as MCPlayerModel;
    }

    get controller() {
        return this._controller as MainSceneController;
    }

    init() {
        this.crosshair = new THREE.Group();
        this.threejs.add(this.crosshair);
        const crosshairMat = new THREE.MeshBasicMaterial({color: new THREE.Color(), transparent: true, opacity: 0.7});
        const crosshairHorizontalGeom = new THREE.PlaneGeometry(0.0005, 0.00005);
        const crosshairHorizontal = new THREE.Mesh(crosshairHorizontalGeom, crosshairMat);
        const crosshairVerticalGeom = new THREE.PlaneGeometry(0.00005, 0.0005);
        const crosshairVertical = new THREE.Mesh(crosshairVerticalGeom, crosshairMat);

        this.crosshair.add(crosshairHorizontal);
        this.crosshair.add(crosshairVertical);

        const geometry = new THREE.CylinderGeometry(MCPlayerModel.radius, MCPlayerModel.radius, MCPlayerModel.height, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        this.boundsHelper = new THREE.Mesh(geometry, material);
        this.boundsHelper.visible = false;
        this.threejs.add(this.boundsHelper);


        this.block = new THREE.Group();
        this.threejs.add(this.block);
        const top = new THREE.PlaneGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE);
        top.rotateX(-Math.PI / 2);
        top.translate(0, this.BLOCK_SIZE / 2, 0);
        this.topMesh = new THREE.Mesh(top);
        this.block.add(this.topMesh);

        const bottom = new THREE.PlaneGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE);
        bottom.rotateX(Math.PI / 2);
        bottom.translate(0, -this.BLOCK_SIZE / 2, 0);
        this.bottomMesh = new THREE.Mesh(bottom);
        this.block.add(this.bottomMesh);

        const left = new THREE.PlaneGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE);
        left.rotateY(-Math.PI / 2);
        left.translate(-this.BLOCK_SIZE / 2, 0, 0);
        this.leftMesh = new THREE.Mesh(left);
        this.block.add(this.leftMesh);

        const right = new THREE.PlaneGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE);
        right.rotateY(Math.PI / 2);
        right.translate(this.BLOCK_SIZE / 2, 0, 0);
        this.rightMesh = new THREE.Mesh(right);
        this.block.add(this.rightMesh);

        const front = new THREE.PlaneGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE);
        front.translate(0, 0, this.BLOCK_SIZE / 2);
        this.frontMesh = new THREE.Mesh(front);
        this.block.add(this.frontMesh);

        const back = new THREE.PlaneGeometry(this.BLOCK_SIZE, this.BLOCK_SIZE);
        back.rotateY(Math.PI);
        back.translate(0, 0, -this.BLOCK_SIZE / 2);
        this.backMesh = new THREE.Mesh(back);
        this.block.add(this.backMesh);
    }

    updateBoundsHelper(){
        this.boundsHelper.position.copy(this.model.transform.getPosition());
        this.boundsHelper.position.y -= (MCPlayerModel.height / 2);
    }



    update() {
        let appState = GetAppState();
        let displayHelper = appState.getState(MCPlayerModel.BOUNDS_DISPLAY);

        let playerPos = this.model.transform.getPosition();
        this.controller.light.target.position.set(playerPos.x, 10, playerPos.z);
        this.controller.light.position.set(playerPos.x - 80, 200, playerPos.z - 80);

        let zAxis = this.model.heading.times(0.01);
        let rot = this.model.transform._getQuaternionRotation().getInverse();
        this.crosshair.rotation.setFromQuaternion(rot);
        this.crosshair.position.set(playerPos.x + zAxis.x, playerPos.y + zAxis.y, playerPos.z + zAxis.z);

        if (this.model.holdedBlock === undefined) {
            this.block.visible = false;
        } else {
            let xAxis = this.model.heading.cross(this.up)
            xAxis.normalize();
            let yAxis = xAxis.cross(this.model.heading);
            let blockOffset = zAxis.minus(yAxis.times(0.009)).plus(xAxis.times(0.009));
            this.block.rotation.setFromQuaternion(rot);
            this.block.position.set(playerPos.x + blockOffset.x, playerPos.y + blockOffset.y, playerPos.z + blockOffset.z);
            if (this.lastBlockType !== this.model.holdedBlock) {
                this.block.visible = true;
                this.topMesh.material = this.controller.model.terrain.materials[getTopMaterial(this.model.holdedBlock)];
                this.bottomMesh.material = this.controller.model.terrain.materials[getBottomMaterial(this.model.holdedBlock)];
                this.leftMesh.material = this.controller.model.terrain.materials[getSideMaterial(this.model.holdedBlock)];
                this.rightMesh.material = this.controller.model.terrain.materials[getSideMaterial(this.model.holdedBlock)];
                this.frontMesh.material = this.controller.model.terrain.materials[getSideMaterial(this.model.holdedBlock)];
                this.backMesh.material = this.controller.model.terrain.materials[getSideMaterial(this.model.holdedBlock)];
                this.lastBlockType = this.model.holdedBlock;
            }
        }

        if (displayHelper) {
            this.updateBoundsHelper();
            this.boundsHelper.visible = true;
        } else {
            this.boundsHelper.visible = false;
        }

    }
}