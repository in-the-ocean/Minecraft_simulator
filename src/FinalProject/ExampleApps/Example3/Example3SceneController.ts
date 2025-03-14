import { ACameraElement} from "../../../anigraph/rendering/ACameraElement";
import {ExampleSceneController} from "../../StarterCode/Scene/ExampleSceneController";
import {
    AGLContext,
    AGraphicElement,
    ASceneElement,
    AShaderMaterial,
    AShaderModel,
    GetAppState,
    Mat4,
    ShaderManager,
    V2,
    V3, VertexArray3D
} from "../../../anigraph";

import * as THREE from "three";
import { Example3SceneModel } from "./Example3SceneModel";
import {ARenderTarget} from "../../../anigraph/rendering/multipass/ARenderTarget";

const enum RENDER_TARGET_KEYS{
    RT1="target1",
    RT2="target2"
}

const RenderTargetWidth:number=512;
const RenderTargetHeight:number=512;
export class Example3SceneController extends ExampleSceneController{
    postProcessingCamera!:ACameraElement;
    postProcessingScene!:ASceneElement;
    fullScreenQuad!:AGraphicElement;
    postProcessingMaterial!:AShaderMaterial;
    textureRenderTarget!:ARenderTarget

    currentFrameTextureIndex:number=0;


    get model():Example3SceneModel{
        return this._model as Example3SceneModel;
    }

    async initPostProcessingEffects(){
        let appState = GetAppState();
        /**
         * We create a separate scene which we we use for render passes that don't involve our usual scene graph
         * @type {ASceneElement}
         */
        this.postProcessingScene = new ASceneElement();

        /**
         * A camera for our post processing effect scene
         * @type {ACameraElement}
         */
        this.postProcessingCamera = ACameraElement.CreateOrthographic(-1,1,-1,1,-1,1);

        /**
         * Let's create a render target. This is a texture / buffer that we can render to
         * Note that we could create more than one of these if we wanted
         * @type {ARenderTarget}
         */
        this.textureRenderTarget = ARenderTarget.CreateFloatRGBATarget(this.renderWindow.container.clientWidth, this.renderWindow.container.clientHeight);

        /**
         * Load the shader code. If your shader name and location follow the conventions of public/shaders,
         * then this might get done automatically when you load the shader material model later.
         * However, the code below shows how you would load shader code with custom names and paths.
         */
        await ShaderManager.LoadShader(
            "postprocessing",
            "./postprocessing/postprocessing.vert.glsl",
            "./postprocessing/postprocessing.frag.glsl"
        )

        /**
         * Load a custom shader. We will use this when we render our texture to the screen
         */
        await appState.loadShaderMaterialModel("postprocessing");
        this.postProcessingMaterial = appState.CreateShaderMaterial("postprocessing");

        /**
         * Let's set the "input" sampler uniform in our post processing shader to be our textureRenderTarget's texture
         */
        this.postProcessingMaterial.setTexture("input", this.textureRenderTarget.targetTexture);

        /**
         * We will create a full screen quad to be the geometry that we actually render
         */

        let fullScreenQuadGeometry = VertexArray3D.CreateForRendering(false, true);
        // Add a vertex for each corner of a square
        fullScreenQuadGeometry.addVertex(V3(-1,-1,0),undefined, V2(0,0))
        fullScreenQuadGeometry.addVertex(V3(1,-1,0),undefined, V2(1,0))
        fullScreenQuadGeometry.addVertex(V3(1,1,0),undefined, V2(1,1))
        fullScreenQuadGeometry.addVertex(V3(-1,1,0),undefined, V2(0,1))

        //make two triangles by connecting corners 012 and corners 230
        fullScreenQuadGeometry.addTriangleIndices(0,1,2);
        fullScreenQuadGeometry.addTriangleIndices(2,3,0);

        this.fullScreenQuad = AGraphicElement.Create(fullScreenQuadGeometry, this.postProcessingMaterial);
        let fullScreenQuadScale = 0.9;
        this.fullScreenQuad.setTransform(Mat4.Scale3D(V3(fullScreenQuadScale,fullScreenQuadScale,1.0)));
        this.postProcessingScene.add(this.fullScreenQuad);

        /**
         * Add a slider to control one of our uniforms
         */
        appState.addSliderIfMissing("sliderValue", 0,-1,1,0.01);
        this.postProcessingMaterial.attachUniformToAppState("sliderValue", "sliderValue")

        this.setCurrentRenderTarget(null);
    }

    /**
     * This is where you specify the mapping from model classes to view classes.
     */
    initModelViewSpecs(): void {
       super.initModelViewSpecs();
       this.addExampleModelViewSpecs();
    }

    async initRendering(): Promise<void> {
        await super.initRendering();
        await this.initPostProcessingEffects();
    }

    async initScene(): Promise<void> {
        await super.initScene();
        this.loadSpaceSkymap();
    }

    initInteractions() {
        super.initInteractions();
    }

    onAnimationFrameCallback(context: AGLContext) {
        // super.onAnimationFrameCallback(context);
        this.multiPassOnAnimationFrameCallback(context)
    }

    multiPassOnAnimationFrameCallback(context:AGLContext) {
        this.model.timeUpdate()
        this.timeUpdate();

        /**
         * Set the render target to our texture target and clear it
         */
        this.setCurrentRenderTarget(this.textureRenderTarget);
        context.renderer.clear();

        /**
         * Render the scene to the texture
         */
        context.renderer.render(this.getThreeJSScene(), this.getThreeJSCamera())

        /**
         * Setting the render target to null will make the screen our render target again
         */
        this.setCurrentRenderTarget(null);

        /**
         * Clear the screen buffer and render to it with:
         * - Our full screen quad using the post processing shader
         * - the inputMap sampler set to the texture we rendered in the previous pass
         */
        context.renderer.clear();
        context.renderer.render(this.postProcessingScene.getThreeJSScene(), this.postProcessingCamera.getThreeJSCamera());
    }

}
