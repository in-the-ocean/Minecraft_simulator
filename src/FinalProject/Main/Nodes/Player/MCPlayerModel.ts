import {ANodeModel3D, ASerializable, GetAppState, Mat3, Vec3} from "../../../../anigraph";
import { Quaternion } from "../../../../anigraph";
import {MainSceneModel} from "../../MainSceneModel";
import * as THREE from "three";
import {BlockType} from "../Terrain/Block";
import {Euler} from "three";

@ASerializable("MCPlayerModel")
export class MCPlayerModel extends ANodeModel3D {
    static ENABLE_COLLISION = "Collision"
    static BOUNDS_DISPLAY = "Helpers"

    static radius: number = 0.5;
    static height: number = 1.75;

    static SPEED: number = 10;
    velocity: Vec3;
    scaledVel: Vec3;
    onGround:Boolean = false;
    jumpSpeed:number = 1.5;
    holdedBlock: BlockType | undefined = undefined;
    heading: Vec3 = Vec3.UnitZ();

    lastUpdateTime:number=0;

    cameraUp: Vec3 = Vec3.UnitY();

    // boundsHelper:any
    private worldVelocity: Vec3 = Vec3.UnitY();

    get parent(): MainSceneModel {
        return this._parent as MainSceneModel;
    }

    constructor() {
        super();
        this.velocity = new Vec3();
        this.scaledVel = new Vec3();
        this.transform.setPosition(new Vec3(0, 100, 0));

    }

    reset() {
        this.transform.setPosition(new Vec3(0, 100, 0));
        this.velocity = new Vec3();
    }

    setVelocity(velocity:Vec3) {
        this.velocity = velocity
        this.scaledVel = this.velocity.deepCopy()
        let speed = this.scaledVel.L2();
        if (speed > MCPlayerModel.SPEED) {
            this.scaledVel = this.scaledVel.times(MCPlayerModel.SPEED / speed);
        }
        // this.scaledVel.normalize()
        // this.scaledVel = this.scaledVel.times(MCPlayerModel.SPEED)
        // console.log("Velocity: " + this.velocity);
    }

    getWorldVelocity():Vec3 {
        this.worldVelocity = this.velocity.clone();
        // let pose = this.parent.camera.getPoseAsNodeTransform();
        // let euler = new Euler().setFromQuaternion(pose.rotation, "XZY");

        // euler.x = 0;
        // euler.y = 0;


        // let quaternion1 = new Quaternion().setFromEuler(euler);
        // this.worldVelocity.getRotatedByTHREEQuaternion(quaternion1)
        return this.worldVelocity;
    }

    applyWorldDeltaVelocity(WorldDeltaVelocity:Vec3) {
        // let pose = this.parent.camera.getPoseAsNodeTransform();
        // let euler = new Euler().setFromQuaternion(pose.rotation, "XZY");
        // euler.x = 0;
        // euler.y = 0;
        // euler.z *= -1;

        // let quaternion = new Quaternion().setFromEuler(euler);
        // WorldDeltaVelocity.getRotatedByTHREEQuaternion(quaternion)

        // console.log(`WorldDeltaVelocity x: ${WorldDeltaVelocity.x}`)
        // console.log(`WorldDeltaVelocity y: ${WorldDeltaVelocity.y}`)
        // console.log(`WorldDeltaVelocity z: ${WorldDeltaVelocity.z}`)

        this.velocity = this.velocity.plus(WorldDeltaVelocity)
    }

    // updateBoundsHelper(){
    //     this.boundsHelper.position.copy(this.transform.getPosition());
    //     this.boundsHelper.position.y -= (MCPlayerModel.height / 2);
    // }

    timeUpdate(t: number, ...args: any[]) {
        if (t === this.lastUpdateTime) {
            return;
        }
        let appState = GetAppState();
        let enableCollision = appState.getState(MCPlayerModel.ENABLE_COLLISION);
        let dt = t - this.lastUpdateTime;

        this.parent.physics.helpers.clear();
        let originalVel = this.velocity;
        originalVel.y -= (this.parent.physics.gravity * dt);
        this.setVelocity(originalVel);

        let cam = this.parent.camera;
        this.heading = cam.forward;
        let xAxis = cam.right;
        let zAxis = xAxis.cross(this.cameraUp);
        let movement = Mat3.FromColumns(xAxis, Vec3.UnitY(), zAxis).times(this.scaledVel);

        this.transform._setQuaternionRotation(cam.pose._getQuaternionRotation())
        this.transform.setPosition(this.transform.getPosition().plus(movement.times(dt)));

        if (enableCollision || this.parent.physics.gravity !== 0) {
            this.parent.physics.detectCollisions(this, this.parent.terrain);
        }

        if (this.onGround) {
            originalVel.y = 0;
            this.setVelocity(originalVel);
        }
        this.lastUpdateTime = t;
        this.parent.camera.position = this.transform.getPosition();

        this.lastUpdateTime = t;

        // console.log(`PlayerVelocity x: ${this.velocity.x}`)
        // console.log(`PlayerVelocity y: ${this.velocity.y}`)
        // console.log(`PlayerVelocity z: ${this.velocity.z}`)

    }


}