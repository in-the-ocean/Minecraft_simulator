import {
    AInteractionEvent,
    AObject3DModelWrapper,
    AppState,
    AShaderMaterial,
    NodeTransform3D,
    Quaternion,
    V3,
    Vec2
} from "../../../anigraph";
// import { ExampleLoadedCharacterModel, ExampleParticleSystemModel} from "../../StarterClasses/CustomNodes";
import { ExampleSceneModel} from "../../StarterCode/Scene/ExampleSceneModel";
import {ABlinnPhongShaderModel} from "../../../anigraph/rendering/shadermodels";
import {CharacterModel} from "../../../anigraph/starter/nodes/character";
import {ModelLoader} from "../../StarterCode";
import {ExampleLoadedCharacterModel} from "../../StarterCode/CustomNodes";

const ASSET_TO_LOAD = "car1"

export class Example3SceneModel extends ExampleSceneModel {
    initAppState(appState: AppState) {
        ABlinnPhongShaderModel.AddAppState();
    }

    async PreloadAssets() {
        await super.PreloadAssets();
        await super.LoadBasicShaders();
        await super.LoadExampleTextures();
        await super.LoadExampleModelClassShaders();
        await ModelLoader.LoadAsset(this, ASSET_TO_LOAD);
    }


    initCamera() {
        super.initCamera();
        // the ground is the xy plane
        this.camera.setPose(NodeTransform3D.LookAt(V3(0,0,1), V3(), V3(0,1,0)));
    }

    initCharacters(){
        let playerMaterial = CharacterModel.CreateMaterial();
        this.player = ModelLoader.CreateModelFromAsset(
            this,
            ASSET_TO_LOAD,
            ExampleLoadedCharacterModel,
            playerMaterial
        ) as ExampleLoadedCharacterModel;
        this.addChild(this.player)
        ABlinnPhongShaderModel.attachMaterialUniformsToAppState(this.player.material)
    }


    initScene() {
        this.addViewLight();
        this.initTerrain();
        this.initCharacters();
    }

    /**
     * We update the scene here
     * @param t
     * @param args
     */
    timeUpdate(t?: number, ...args:any[]) {
        t = t??this.clock.time;
        super.timeUpdateDescendants(t);

    }

    getCoordinatesForCursorEvent(event: AInteractionEvent){
        return event.ndcCursor??new Vec2();
    }
}


