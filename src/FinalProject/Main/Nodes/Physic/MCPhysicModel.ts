import {ANodeModel3D, ASerializable, GetAppState, Mat3, Vec3} from "../../../../anigraph";
import {MainSceneModel} from "../../MainSceneModel";
import { MCPlayerModel } from "../Player/MCPlayerModel";
import { MCTerrainModel } from "../Terrain/MCTerrainModel";
import { Block, BlockType, Chunk, getChunkKey, getKey, removeHiddenFaces, VegetationType } from "../Terrain/Block";
import { fromRatio } from "tinycolor2";
import * as THREE from "three";

export type collision_type = {
    // key: string; // "x y z"
    block: {x: number, y: number, z: number},
    contactPoint: {x: number, y: number, z: number},
    normal: Vec3,
    overlap: number
}

const collisionMaterial = new THREE.MeshBasicMaterial({
    color:  0xff0000,
    transparent: true,
    opacity: 0.2
});

const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001)

const contactMaterial = new THREE.MeshBasicMaterial({
    wireframe:true,
    color:  0x00ff00
});

const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6)

@ASerializable("MCPhysicModel")
export class MCPhysicModel extends ANodeModel3D {
    gravity:number = 0;
    helpers:any
    OVERSHOOT = 0.01

    get parent(): MainSceneModel {
        return this._parent as MainSceneModel;
    }

    constructor() {
        super();
        this.helpers = new THREE.Group();
        this.helpers.visible = false;
    }

    reset() {
    }

    broadPhase(player:MCPlayerModel, world:MCTerrainModel){
        const candidates:any = [];

        // const blocks: {[key: string]: Block} = [];

        const extents = {
            x: {
                min: Math.floor(player.transform.getPosition().x - MCPlayerModel.radius),
                max: Math.ceil(player.transform.getPosition().x + MCPlayerModel.radius)
            },
            y: {
                min: Math.floor(player.transform.getPosition().y - MCPlayerModel.height),
                max: Math.ceil(player.transform.getPosition().y)
    
            },
            z: {
                min: Math.floor(player.transform.getPosition().z - MCPlayerModel.radius),
                max: Math.ceil(player.transform.getPosition().z + MCPlayerModel.radius)
            }
        }

        for(let x = extents.x.min; x <= extents.x.max; x++) {
            for(let y = extents.y.min; y <= extents.y.max; y++) {
                for(let z = extents.z.min; z <= extents.z.max; z++) {
                    let blockInfo = world.findBlockAt(x, y, z);
                    if(blockInfo)   {
                        const blockPos = {x, y, z};
                        candidates.push(blockPos);
                        this.addCollisionHelper(blockPos);
                    }
                }
            }
        }

        // console.log(`Broadphase Candidates: ${candidates.length}`);
    
        return candidates;
    }

    narrowPhase(candidates:any, player:MCPlayerModel){
        let collisions:any = [];

        for (const block of candidates) {
            const p = player.transform.getPosition();
            const closestPoint = {
                x: Math.max(block.x - 0.5, Math.min(p.x, block.x + 0.5)),
                y: Math.max(block.y - 0.5, Math.min(p.y - (MCPlayerModel.height / 2), block.y + 0.5)),
                z: Math.max(block.z - 0.5, Math.min(p.z, block.z + 0.5))

                // x: Math.max(block.x, Math.min(p.x, block.x + 1)),
                // y: Math.max(block.y, Math.min(p.y - (MCPlayerModel.height / 2), block.y + 1)),
                // z: Math.max(block.z, Math.min(p.z, block.z + 1))
            }

            const dx = closestPoint.x - p.x;
            const dy = closestPoint.y - (p.y - (MCPlayerModel.height / 2));
            const dz = closestPoint.z - p.z;

            if(this.pointInPlayerBoundingCylinder(closestPoint, player)) {
                const overlapY = (MCPlayerModel.height / 2) - Math.abs(dy);
                const overlapXZ = MCPlayerModel.radius - Math.sqrt(dx * dx + dz * dz);

                // compute the normal of collision and the overlap between the point and player's bounding cylinder 
                let normal, overlap;
                if(overlapY < overlapXZ) {
                    normal = new Vec3(0, -Math.sign(dy), 0);
                    overlap = overlapY;
                    player.onGround = true;
                } else {
                    normal = new Vec3(-dx, 0, -dz);
                    normal.normalize();
                    overlap = overlapXZ;
                }

                let collision:collision_type = {block, contactPoint:closestPoint, normal, overlap};

                collisions.push(collision);

                this.addContactPointHelper(closestPoint);
            }
        }

        // console.log(`Narrowphase Collisions: ${collisions.length}`);

        return collisions
    }

    detectCollisions(player:MCPlayerModel, world:MCTerrainModel){
        player.onGround = false;
        const candidates = this.broadPhase(player, world);
        const collisions = this.narrowPhase(candidates, player);

        if(collisions.length > 0) {
            this.resolveCollisions(collisions, player);
        }

    }

    resolveCollisions(collisions:[collision_type], player:MCPlayerModel){ 

        collisions.sort((a:collision_type, b:collision_type) => {
            if (a.normal.y !== 0 && b.normal.y === 0) return -1;
            if (a.normal.y === 0 && b.normal.y !== 0) return 1;
            if(a.overlap < b.overlap) return -1;
            if(a.overlap > b.overlap) return 1;
            return 0;
        });

        for(const collision of collisions) {
            if(collision && collision.overlap && collision.normal.L2()) {
                if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player)) {
                    continue;
                }
                let deltaPosition = collision.normal.clone();
                deltaPosition = deltaPosition.times(collision.overlap);
                let p = player.transform.getPosition();
                p = p.plus(deltaPosition);
                player.transform.setPosition(p);    

                let magnitude = player.getWorldVelocity().y * 2;

                // console.log(`WorldVelocity x: ${player.getWorldVelocity().x}`)
                // console.log(`WorldVelocity y: ${player.getWorldVelocity().y}`)
                // console.log(`WorldVelocity z: ${player.getWorldVelocity().z}`)

                // console.log(`collision.normal x: ${collision.normal.x}`)
                // console.log(`collision.normal y: ${collision.normal.y}`)
                // console.log(`collision.normal z: ${collision.normal.z}`)

                // console.log(`magnitude: ${magnitude}`)


                // console.log(`velocityAdjustment x: ${velocityAdjustment.x}`)
                // console.log(`velocityAdjustment y: ${velocityAdjustment.y}`)
                // console.log(`velocityAdjustment z: ${velocityAdjustment.z}`)
                // if(magnitude < 0) {
                //     let velocityAdjustment = Vec3.UnitY().times(magnitude)
                //     player.applyWorldDeltaVelocity(velocityAdjustment.negate());
                // }
                
            }
        }

    }

    UpdateGravity(player:MCPlayerModel){
        if(player.onGround) {
            // this.gravity = 0;
            player.velocity.y = 0;
        }
    }

    timeUpdate(t: number, player?:MCPlayerModel, world?:MCTerrainModel) {
        let appState = GetAppState();
        this.helpers.visible = appState.getState(MCPlayerModel.BOUNDS_DISPLAY);

    }

    addCollisionHelper(blockPos: {x:number, y:number, z:number}){
        const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
        blockMesh.position.copy(new THREE.Vector3(blockPos.x, blockPos.y, blockPos.z))
        this.helpers.add(blockMesh)
    }

    addContactPointHelper(p:{x:number, y:number, z:number}){
        const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
        contactMesh.position.copy(new THREE.Vector3(p.x, p.y, p.z));
        this.helpers.add(contactMesh);
    }


    pointInPlayerBoundingCylinder(p:{x:number, y:number, z:number}, player:MCPlayerModel){
        const player_p = player.transform.getPosition();
        const dx = p.x - player_p.x;
        const dy = p.y - (player_p.y - (MCPlayerModel.height / 2));
        const dz = p.z - player_p.z;
        const r_sq = dx * dx + dz * dz;

        // check if contact point is inside the player's boundng cylinder
        return (Math.abs(dy) < MCPlayerModel.height / 2) && (r_sq < MCPlayerModel.radius * MCPlayerModel.radius);
    }



}