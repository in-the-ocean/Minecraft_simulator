/**
 * @file Main scene controller for your application
 * @description This is where you connect models to views.
 * This is done mainly by defining your model view spec and interaction modes.
 */
import {MainSceneModel} from "./MainSceneModel";
import {
    ADragInteraction,
    AGLContext,
    AInteractionEvent,
    AKeyboardInteraction,
    Color,
    GetAppState
} from "../../anigraph";
import {CustomNode1Model, CustomNode1View} from "./Nodes/CustomNode1";
import {ABasicSceneController, ADebugInteractionMode} from "../../anigraph/starter";
import {CustomInteractionMode} from "./InteractionModes/CustomInteractionMode";
import {TerrainModel, TerrainView} from "../StarterCode/CustomNodes";
import {PlayerControlInteractionMode} from "./InteractionModes/PlayerControlInteractionMode";
import {MCTerrainModel} from "./Nodes/Terrain/MCTerrainModel";
import {MCTerrainView} from "./Nodes/Terrain/MCTerrainView";
import {MCPlayerModel} from "./Nodes/Player/MCPlayerModel";
import {MCPlayerView} from "./Nodes/Player/MCPlayerView";
import { MCPhysicModel } from "./Nodes/Physic/MCPhysicModel";
import { MCPhysicView } from "./Nodes/Physic/MCPhysicView";
import * as THREE from "three";

/**
 * This is your Main Controller class. The scene controller is responsible for managing user input with the keyboard
 * and mouse, as well as making sure that the view hierarchy matches the model heirarchy.
 */
export class MainSceneController extends ABasicSceneController{
    light!: THREE.DirectionalLight;

    get model():MainSceneModel{
        return this._model as MainSceneModel;
    }

    /**
     * The main customization you might do here would be to set the background color or set a background image.
     * @returns {Promise<void>}
     */
    async initScene(): Promise<void> {
        await super.initScene();
        this.initSkyBoxCubeMap("./images/cube/skyboxsun25deg/");
        this.initControlPanel();
        this.renderer.shadowMap.enabled = true;
        const ambient = new THREE.AmbientLight(0xffffff, 0.5)
        this.view.threejs.add(ambient);

        this.light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        this.light.position.set(-80, 200, -80);
        this.light.target.position.set(0, 10, 0);
        this.light.shadow.camera.top = 200;
        this.light.shadow.camera.bottom = -200;
        this.light.shadow.camera.left = - 200;
        this.light.shadow.camera.right = 200;
        this.light.shadow.mapSize.width = 8192;
        this.light.shadow.mapSize.height = 8192;
        this.light.shadow.camera.near = 0.001;
        this.light.shadow.camera.far = 1000;
        this.light.castShadow = true; // default false
        this.view.threejs.add(this.light);
        this.view.threejs.add(this.light.target);

        // this.view.threejs.add(this.model.player.boundsHelper)
        this.view.threejs.add(this.model.physics.helpers)

        // this.view.threejs.add(new THREE.DirectionalLightHelper(light, 10));
        // this.view.threejs.add( new THREE.CameraHelper( light.shadow.camera ) );
    }

    initControlPanel() {
        const appState = GetAppState();
        appState.addSliderControl(MCTerrainModel.SEED, 0, 0, 1000, 1);
        appState.addSliderControl(MCTerrainModel.RENDER_DISTANCE, 8, 1, 12, 1);
        appState.addCheckboxControl(MCPlayerModel.ENABLE_COLLISION, true);
        appState.addCheckboxControl(MCPlayerModel.BOUNDS_DISPLAY, false);

        appState.addButton("Reset", ()=>{
            console.log("button pressed")
            this.model.terrain.restart();
            (this.interactionMode as PlayerControlInteractionMode).reset();
        })

        // appState.addButton("Helpers Display Toggle", ()=>{
        //     this.helpersDisplay = !this.helpersDisplay;
        //     console.log("button pressed")
        //     console.log("helpersDisplay: " + this.helpersDisplay);
        //
        //
        // })


        appState.addButton("click elsewhere to deselect button", ()=>{});
    }

    /**
     * Specifies what view classes to use for different model class.
     * If you create custom models and views, you will need to link them here by calling `addModelViewSpec` with the
     * model class as the first argument and the view class as the second.
     */
    initModelViewSpecs() {
        super.initModelViewSpecs();
        this.addModelViewSpec(CustomNode1Model, CustomNode1View);
        this.addModelViewSpec(TerrainModel, TerrainView);
        this.addModelViewSpec(MCTerrainModel, MCTerrainView);
        this.addModelViewSpec(MCPlayerModel, MCPlayerView);
        this.addModelViewSpec(MCPhysicModel, MCPhysicView);
    }

    onAnimationFrameCallback(context:AGLContext) {
        /**
         * let's update the model...
         */
        this.model.timeUpdate(this.model.clock.time);

        /**
         * and let's update the controller...
         * This will mostly update any interactions that depend on time.
         * Keep in mind that the model and controller run on separate clocks for this, since we may
         * want to pause our model's clock and continue interacting with the scene (e.g., moving the camera around).
         */
        this.timeUpdate();

        /**
         * Clear the rendering context.
         * you can also specify which buffers to clear: clear(color?: boolean, depth?: boolean, stencil?: boolean)
         * ``` this.renderer.clear(false, true); ```
         */
        context.renderer.clear();

        // render the scene view
        context.renderer.render(this.getThreeJSScene(), this.getThreeJSCamera());
    }

    initInteractions() {
        super.initInteractions();

        /**
         * Add an instance of our custom interaction mode
         */

        let playerControlInteractionMode = new PlayerControlInteractionMode(this);
        playerControlInteractionMode.setPlayer(this.model.player);
        this.defineInteractionMode("playerControl", playerControlInteractionMode);

        this.setCurrentInteractionMode("playerControl");
    }

}
