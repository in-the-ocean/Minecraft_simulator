import {
    AClickInteraction,
    ADOMPointerMoveInteraction, ADragInteraction,
    AInteractionEvent, AKeyboardInteraction, GetAppState,
    HasInteractionModeCallbacks,
    NodeTransform3D, Particle3D, Quaternion, V3, Vec2,
    Vec3
} from "../../../anigraph";
import {AWheelInteraction} from "../../../anigraph/interaction/AWheelInteraction";
import {ABasicSceneController} from "../../../anigraph/starter";
import {MainAppPointerLockInteractionMode} from "../../StarterCode";
import * as THREE from "three";
import {Euler} from "three";
import {PlayerInterface} from "../../StarterCode/InteractionModes/PlayerInterface";
import {MCPlayerModel} from "../Nodes/Player/MCPlayerModel";
import {MainSceneModel} from "../MainSceneModel";
import {BlockType} from "../Nodes/Terrain/Block";
import { allowedNodeEnvironmentFlags } from "process";

enum ExamplePointerLockControlPanelParams{
    PlayerSpeed="PlayerSpeed"
}

export class PlayerControlInteractionMode extends MainAppPointerLockInteractionMode{
    /**
     * You may want to define some parameters to adjust the speed of controls...
     */
    mouseMovementSpeed:number=1;
    cameraOrbitSpeed:number=0.01;
    cameraUp: Vec3 = Vec3.UnitY();
    onSky:boolean = true;
    skyPos: Vec3 = new Vec3(0, 100, 0)

    get model() {
        return this.owner.model as MainSceneModel;
    }

    get camera(){
        return this.model.camera;
    }

    get player() {
        return this._player as MCPlayerModel;
    }

    constructor(owner?:ABasicSceneController,
                name?:string,
                interactionCallbacks?:HasInteractionModeCallbacks,
                ...args:any[]) {
        super(name, owner, interactionCallbacks, ...args);
        // this.reset();
        let appState = GetAppState();
        /**
         * First argument is just a string we defined in the enum above to avoid type-based bugs...
         */
        // if(appState.getState(ExamplePointerLockControlPanelParams.PlayerSpeed)===undefined) {
        //     appState.addSliderControl(ExamplePointerLockControlPanelParams.PlayerSpeed, 0.1, 0, 1, 0.01);
        // }
    }

    reset(){
        // let playerPosition = this.hasPlayer? this.player.transform.getPosition() : V3();
        // // You can reset the control mode here
        // this.camera.pose = NodeTransform3D.LookAt(
        //     playerPosition.plus(Vec3.UnitY().times(3)),
        //     playerPosition,
        //     Vec3.UnitY()
        // )
        this.onSky = true;
        this.camera.setPose(NodeTransform3D.LookAt(V3(0,100,0), V3(0, 100, -1), V3(0,1,0)))
        this.player.reset();
        this.model.physics.gravity = 0;

    }

    /**
     * This gets called immediately before the interaction mode is activated. For now, we will call reset()
     * @param args
     */
    beforeActivate(...args:any[]) {
        super.beforeActivate(...args);
        this.reset();
    }

    /**
     * Create an instance in a single call, instead of calling new followed by init
     * @param owner
     * @param args
     * @returns {ASceneInteractionMode}
     * @constructor
     */
    static Create(owner: ABasicSceneController, ...args: any[]) {
        let controls = new this();
        controls.init(owner);
        return controls;
    }

    onClick(event: AInteractionEvent) {
        if ( !this.isLocked ) return;
        if(!this.hasPlayer){
            console.warn("No player specified!");
            return;
        }
        let mouseEvent = event.DOMEvent as MouseEvent;
        if (mouseEvent && mouseEvent.button === 0) {
            // add block
            this.model.onLeftClick(event);
        } else if (mouseEvent && mouseEvent.button === 2) {
            // remove block
            this.model.onRightClick(event);
        }
    }

    onWheelMove(event: AInteractionEvent, interaction: AWheelInteraction) {
        let zoom = (event.DOMEvent as WheelEvent).deltaY;
    }

    /**
     * See other interaction mode examples for example of how to define
     * @param event
     * @param interaction
     */
    onKeyDown(event:AInteractionEvent, interaction:AKeyboardInteraction){
        if ( !this.isLocked ) return;
        if(!this.hasPlayer){
            console.warn("No player specified!");
            return;
        }

        const keysDownState = this.getKeyDownState(); 
        let originalVel = this.player.velocity;
        let originalPos = this.player.transform.getPosition();

        if(keysDownState['w']){
            originalVel.z = -6
        }
        if(keysDownState['a'] || keysDownState['ArrowLeft']){
            originalVel.x = -6
        }
        if(keysDownState['s']){
            originalVel.z = 6
        }

        if(keysDownState['d'] || keysDownState['ArrowRight']){
            originalVel.x = 6
        }

        if (this.onSky) {
            if(keysDownState['e']){
                originalVel.y = 6
            }

            if(keysDownState['Shift']){
                originalVel.y = -6
            }
        }

        if(keysDownState['f']){
            if(!this.onSky)     {
                // originalPos = this.skyPos;
                this.model.physics.gravity = 0;
            }
            else {
                this.model.physics.gravity = 25;
            }
            this.onSky = !this.onSky;
        }

        if(keysDownState[' ']) {
            if(!this.onSky && this.player.onGround) {
                originalVel.y += 10;
            }
        }

        // this.player.transform.setPosition(originalPos)
        this.player.setVelocity(originalVel);


        if (keysDownState['1']) {
            this.player.holdedBlock = BlockType.Dirt;
        } else if (keysDownState['2']) {
            this.player.holdedBlock = BlockType.Stone;
        } else if (keysDownState['3']) {
            this.player.holdedBlock = BlockType.Log;
        } else if (keysDownState['4']) {
            this.player.holdedBlock = BlockType.Sand;
        } else if (keysDownState['5']) {
            this.player.holdedBlock = BlockType.Ice;
        } else if (keysDownState['6']) {
            this.player.holdedBlock = BlockType.Grass;
        } else if (keysDownState['0']) {
            this.player.holdedBlock = undefined;
        }
    }

    onKeyUp(event:AInteractionEvent, interaction:AKeyboardInteraction){
        if ( !this.isLocked ) return;

        if(!this.hasPlayer){
            return;
        }
        const keysDownState = this.getKeyDownState(); 
        let originalVel = this.player.velocity;

        if(!keysDownState['w']){
            if(originalVel.z < 0)   originalVel.z = 0
        }

        if(!keysDownState['a'] && !keysDownState['ArrowLeft']){
            if(originalVel.x < 0)   originalVel.x = 0
        }

        if(!keysDownState['s']){
            if(originalVel.z > 0) originalVel.z = 0
        }

        if(!keysDownState['d'] && !keysDownState['ArrowRight']){
            if(originalVel.x > 0) originalVel.x = 0
        }

        if (this.onSky) {
            if(!keysDownState['e']){
                if(originalVel.y > 0) originalVel.y = 0
            }

            if(!keysDownState['Shift']){
                if(originalVel.y < 0) originalVel.y = 0
            }
        }

        if(!keysDownState['f']){

            if(this.onSky){
                this.skyPos = this.player.transform.getPosition()
            }    
        }

        // if(!keysDownState[' ']) {
        //     if(!this.onSky){
        //         this.model.player.velocity.y = 0;
        //         this.model.player.onGround = false;
        //         this.model.physics.gravity = 1;
        //     }
        // }
        this.player.setVelocity(originalVel);
    }

    onDragStart(event: AInteractionEvent, interaction: ADragInteraction): void {
        /**
         * Here we will track some interaction state. Specifically, the last cursor position.
         */
        // interaction.setInteractionState('lastCursor', event.ndcCursor);
    }
    onDragMove(event: AInteractionEvent, interaction: ADragInteraction): void {
        // if(!event.ndcCursor){
        //     return;
        // }
        // let mouseMovement = event.ndcCursor.minus(interaction.getInteractionState('lastCursor'));
        // interaction.setInteractionState('lastCursor', event.ndcCursor);
    }
    onDragEnd(event: AInteractionEvent, interaction: ADragInteraction): void {
        let cursorWorldCoordinates:Vec2|null = event.ndcCursor;
        let dragStartWorldCoordinates:Vec2|null = interaction.dragStartEvent.ndcCursor;
    }


    onMouseMove(event:AInteractionEvent, interaction:ADOMPointerMoveInteraction ) {
        // if(!this.hasPlayer){
        //     console.warn("No player specified!");
        //     return;
        // }
        // // console.log(event);
        if ( this.isLocked === false ) return;

        let webEvent = (event.DOMEvent as MouseEvent);
        // @ts-ignore
        const movementX = webEvent.movementX || webEvent.mozMovementX || webEvent.webkitMovementX || 0;
        // @ts-ignore
        const movementY = webEvent.movementY || webEvent.mozMovementY || webEvent.webkitMovementY || 0;

        let pose = this.camera.getPoseAsNodeTransform();
        let euler = new Euler().setFromQuaternion(pose.rotation, "XZY");

        euler.y += movementX * this.cameraOrbitSpeed;
        euler.x += movementY * this.cameraOrbitSpeed;
        euler.x = Math.max(-Math.PI / 2 + 0.001, Math.min( Math.PI / 2 - 0.001, euler.x ) );

        pose.rotation.setFromEuler(euler);
        this.cameraModel.setPose(pose);
    }



    /**
     * This would be a good place to implement the time update of any movement filters
     * @param t
     * @param args
     */
    timeUpdate(t: number, ...args:any[]) {
    }


}
