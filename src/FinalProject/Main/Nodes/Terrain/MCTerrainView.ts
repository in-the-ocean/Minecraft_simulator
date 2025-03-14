import {
    ANodeModel,
    ANodeView,
    AThreeJSMeshGraphic,
    GetAppState,
    NodeTransform3D,
    Quaternion,
    V3
} from "../../../../anigraph";
import {MCTerrainModel} from "./MCTerrainModel";
import * as THREE from "three";
import {
    Block,
    BlockType,
    Chunk, DECOR_TEXTURES,
    getBottomMaterial, getChunkKey,
    getSideMaterial,
    getTopMaterial, NO_SHADOW_TEXTURES,
    pushToArray, TRANSPARENT_TEXTURES
} from "./Block";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils"

export class MCTerrainView extends ANodeView {

    blockGeometries = [];
    // sides_: THREE.PlaneGeometry[] = [];
    // tops: THREE.PlaneGeometry[] = [];
    // bottoms: THREE.PlaneGeometry[] = [];

    get model(): MCTerrainModel {
        return this._model as MCTerrainModel;
    }

    constructor() {
        super();
    }

    setModel(model: ANodeModel) {
        super.setModel(model);
        let start = performance.now();
        this.renderTerrain();
        this.subscribe(this.model.addEventListener(MCTerrainModel.TERRAIN_UPDATED, (args: {toRemove: string[], toAdd: string[]}) => this.rebuildChunks(args.toRemove, args.toAdd)));
        console.log("render terrain ", performance.now() - start)
    }

    init() {}

    renderTerrain() {
        for (let key in this.model.chunks) {
            this.createChunkGeometry(this.model.chunks[key]);
        }
    }

    createChunkGeometry(chunk: Chunk) {
        let appState = GetAppState();
        let radius = appState.getState(MCTerrainModel.RENDER_DISTANCE);
        let geometryByTexture: {[key: string]: THREE.PlaneGeometry[]} = {}
        for (let key in chunk.blocks) {
            this.createCubeGeometry(chunk.blocks[key], geometryByTexture);
        }
        for (let key in chunk.decors) {
            this.createDecorGeometry(chunk.decors[key], geometryByTexture);
        }

        // merge geometries using same texture into single mesh
        for (let matName in geometryByTexture) {
            if (TRANSPARENT_TEXTURES.has(matName)) {
                continue;
            }
            let merged = BufferGeometryUtils.mergeBufferGeometries(geometryByTexture[matName]);
            this.createMesh(merged, matName, chunk);
        }
        TRANSPARENT_TEXTURES.forEach((matName) => {
            if (matName in geometryByTexture) {
                let merged = BufferGeometryUtils.mergeBufferGeometries(geometryByTexture[matName]);
                this.createMesh(merged, matName, chunk);
            }
        })

        for (let chunkX = chunk.position.x - radius; chunkX <= chunk.position.x + radius; chunkX++) {
            for (let chunkZ = chunk.position.z - radius; chunkZ <= chunk.position.z + radius; chunkZ++) {
                let chunkKey = getChunkKey(chunkX, chunkZ);
                let otherChunk = this.model.chunks[chunkKey];
                if (otherChunk === undefined) {
                    continue;
                }
                for (let m in otherChunk.meshes) {
                    if (DECOR_TEXTURES.has(m)) {
                        this.disposeGraphic(otherChunk.meshes[m]);
                        this.createMesh(otherChunk.meshes[m].geometry, m, otherChunk);
                    }
                }
            }
        }
    }

    createCubeGeometry(block: Block, geometryByTexture: {[key: string]: THREE.PlaneGeometry[]}) {

        if (block.renderFace[0]) {
            const top = new THREE.PlaneGeometry(1, 1);
            top.rotateX(-Math.PI / 2);
            top.translate(block.position.x, 0.5 + block.position.y, block.position.z);
            let materialName = getTopMaterial(block.type!);
            pushToArray(geometryByTexture, materialName, top);
        }

        if (block.renderFace[1]) {
            const bottom = new THREE.PlaneGeometry(1, 1);
            bottom.rotateX(Math.PI / 2);
            bottom.translate(block.position.x, -0.5 + block.position.y, block.position.z);
            let materialName = getBottomMaterial(block.type!);
            pushToArray(geometryByTexture, materialName, bottom);
        }

        if (block.renderFace[2]) {
            let left = new THREE.PlaneGeometry(1, 1);
            left.rotateY(-Math.PI / 2);
            left.translate(-0.5 + block.position.x, block.position.y, block.position.z);

            let materialName = getSideMaterial(block.type!);
            pushToArray(geometryByTexture, materialName, left);
        }

        if (block.renderFace[3]) {
            let right = new THREE.PlaneGeometry(1, 1);
            right.rotateY(Math.PI / 2);
            right.translate(0.5 + block.position.x, block.position.y, block.position.z);
            let materialName = getSideMaterial(block.type!);
            pushToArray(geometryByTexture, materialName, right);
        }

        if (block.renderFace[4]) {
            let front = new THREE.PlaneGeometry(1, 1);
            front.translate(block.position.x, block.position.y, 0.5 + block.position.z);
            let materialName = getSideMaterial(block.type!);
            pushToArray(geometryByTexture, materialName, front);
        }

        if (block.renderFace[5]) {
            let back = new THREE.PlaneGeometry(1, 1);
            back.rotateY(Math.PI );
            back.translate(block.position.x, block.position.y, -0.5 + block.position.z);
            let materialName = getSideMaterial(block.type!);
            pushToArray(geometryByTexture, materialName, back);
        }

    }

    createDecorGeometry(block: Block, geometryByTexture: {[key: string]: THREE.PlaneGeometry[]}) {
        let plane1 = new THREE.PlaneGeometry(1, 1);
        plane1.rotateY(-Math.PI / 4);
        plane1.translate(block.position.x, block.position.y, block.position.z);
        let plane2 = new THREE.PlaneGeometry(1, 1);
        plane2.rotateY(Math.PI / 4);
        plane2.translate(block.position.x, block.position.y, block.position.z);
        let materialName = getTopMaterial(block.type!);
        pushToArray(geometryByTexture, materialName, plane1);
        pushToArray(geometryByTexture, materialName, plane2);
    }

    createMesh(geometry: THREE.BufferGeometry, matName: string, chunk: Chunk) {
        let mesh = AThreeJSMeshGraphic.Create(geometry, this.model.materials[matName]);
        if (!NO_SHADOW_TEXTURES.has(matName)) {
            mesh.threejs.castShadow = true;
            mesh.threejs.receiveShadow = true;
        }
        this.registerAndAddGraphic(mesh);
        chunk.meshes[matName] = mesh;
    }

    rebuildChunks(toRemove: string[], toAdd: string[]) {
        for (let key of toRemove) {
            for (let mesh of Object.values(this.model.chunks[key].meshes)) {
                this.disposeGraphic(mesh);
                mesh.geometry.dispose();
                // TODO: dispose material?
            }
            this.model.chunks[key].meshes = {};
        }

        let start = performance.now();
        for (let key of toAdd) {
            this.createChunkGeometry(this.model.chunks[key]);
        }
        // console.log("rebuild chunks ", performance.now() - start)
    }


    update(...args: any[]): void {
        /**
         * Still want to update the transform of the threejs object based on the model's transformation
         */
        this.setTransform(this.model.transform);
    }
}