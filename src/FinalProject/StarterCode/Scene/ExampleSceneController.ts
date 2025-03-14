import {
    BillboardParticleSystemModel, BillboardParticleSystemView,
    BotModel,
    BotView, ExampleLoadedCharacterModel, ExampleLoadedView, ExampleParticleSystemModel, ExampleParticleSystemView,
    ExampleThreeJSNodeModel,
    ExampleThreeJSNodeView,
    PlayerModel,
    PlayerView,
    TerrainModel,
    TerrainView, TriangleMeshCharacterModel, TriangleMeshCharacterView
} from "../CustomNodes";
import {ExamplePlayerInteractionMode, ExamplePointerLockInteractionMode} from "../InteractionModes";
import {AGLContext, ANodeModel, ANodeView, GetAppState, Quaternion} from "../../../anigraph";
import {ExampleSceneModel} from "./ExampleSceneModel";
import {ABasicSceneController} from "../../../anigraph/starter";
import {LoadedCharacterModel, LoadedCharacterView} from "../../../anigraph/starter/nodes/character";

export class ExampleSceneController extends ABasicSceneController{
    get model():ExampleSceneModel{
        return this._model as ExampleSceneModel;
    }

    /**
     * So that interaction modes know how to access the model's player
     * @returns {CharacterModel}
     */
    get player(){
        return this.model.player;
    }

    createViewForNodeModel(nodeModel: ANodeModel, ...args:any[]): ANodeView {
        return super.createViewForNodeModel(nodeModel, ...args);
    }

    /**
     * add the example model view specs
     */
    addExampleModelViewSpecs(): void {
        this.addModelViewSpec(TriangleMeshCharacterModel, TriangleMeshCharacterView);
        this.addModelViewSpec(TerrainModel, TerrainView);
        this.addModelViewSpec(PlayerModel, PlayerView);
        this.addModelViewSpec(BotModel, BotView);
        this.addModelViewSpec(ExampleThreeJSNodeModel, ExampleThreeJSNodeView);
        this.addModelViewSpec(ExampleParticleSystemModel, ExampleParticleSystemView);
        this.addModelViewSpec(BillboardParticleSystemModel, BillboardParticleSystemView);
        this.addModelViewSpec(ExampleLoadedCharacterModel, ExampleLoadedView)
        this.addModelViewSpec(LoadedCharacterModel, LoadedCharacterView)
    }

    /**
     * Sometimes we may want to load a shader model in our scene controller, e.g., for multipass renderin effects
     * @param shaderName
     * @param useVertexColors
     * @returns {Promise<void>}
     * @constructor
     */
    async LoadShaderModel(shaderName:string, useVertexColors:boolean=true){
        let appState=GetAppState();
        /**
         * Now let's load a shader model, which we will use to create a custom shader material.
         * The argument to `loadShaderMaterialModel` is the name used in the shader folder and glsl files.
         * So if you your shader files have names likes:
         * `public/shaders/__NAME__/__NAME__.__type__.glsl`
         * then __NAME__ is what you want to pass in here.
         *
         * We're using an enum for the string because it's less prone to typos with multiple typings.
         */
        await appState.loadShaderMaterialModel(shaderName);

        // We could alternative load it ourselves and add the model by name:
        // appState.addShaderMaterialModel(loadedmodel)

        /**
         * If we want to use vertex colors in our shader, we need to set useVertexColors to true.
         * This will turn vertex colors on by default for materials created with this model.
         * Each time you create a material, you can turn off vertex colors for that material if you want.
         */
        if(useVertexColors) {
            appState.getShaderMaterialModel(shaderName).usesVertexColors = true;
        }
    }

    /**
     * Initialize / add example interaction modes
     */
    initExampleInteractions() {
        /**
         * This code adds the ExamplePlayer interaction mode and sets it as the current active mode
         */
        let playerInteractionMode = new ExamplePlayerInteractionMode(this);
        playerInteractionMode.cameraTarget = this.model.player;
        this.defineInteractionMode("ExamplePlayer", playerInteractionMode);


        let pointerLockInteractionMode = new ExamplePointerLockInteractionMode(this);
        pointerLockInteractionMode.setPlayer(this.model.player);
        this.defineInteractionMode("ExamplePointerLock", pointerLockInteractionMode);

        /**
         * If we want to start out in debug interaction mode we have a convenience method for switching to it
         */
        this.switchToDebugInteractionMode()

        /**
         * if we want to switch to one of the others we can do that like this
         */
        // this.setCurrentInteractionMode("ExamplePlayer");

    }

    loadSpaceSkymap(){
        /**
         * Set up the skybox background
         */
        // let urls = [];
        // for(let i=0;i<6; i++) {
        //     urls.push("./images/cube/spaceface/spaceface.jpg")
        // }
        this.initSkyBoxCubeMap(
            undefined, undefined,
            // Quaternion.RotationX(Math.PI*0.5)
        );
    }

    initInteractions() {
        /**
         * We will define the debug interaction mode here.
         * The debug mode is offered mainly to provide camera controls for developing and debugging non-control-related
         * features. It may also be useful as an example for you to look at if you like.
         */
        super.initInteractions();
    }

    /**
     * This is what gets called every time the browser grabs a new frame to render
     * @param context
     */
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



}



