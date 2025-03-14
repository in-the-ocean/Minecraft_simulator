/**
  @file Main scene model
 */

import {
    AMaterialManager,
    AppState,
    GetAppState,
    NodeTransform3D,
    V3,
    Color,
    Mat4,
    DefaultMaterials,
    ClassInterface,
    ShaderManager,
    ATexture,
    AMaterial,
    AShaderMaterial,
    APointLightModel,
    AInteractionEvent, APlaneGraphic
} from "../../anigraph";
import {CustomNode1Model} from "./Nodes/CustomNode1";
import {UpdateGUIJSX, UpdateGUIJSXWithCameraPosition} from "./MainSceneReactGUI";
import {ALoadedModel} from "../../anigraph/scene/nodes/loaded/ALoadedModel";
import {ABasicSceneModel} from "../../anigraph/starter";
import {ModelLoader} from "../StarterCode";
import {ABlinnPhongShaderModel} from "../../anigraph/rendering/shadermodels";
import {
    BillboardParticleSystemModel,
    ExampleParticleSystemModel,
    TerrainModel
} from "../StarterCode/CustomNodes";
import {MCTerrainModel} from "./Nodes/Terrain/MCTerrainModel";
import {BLOCK_TEXTURE_LIST, BlockType, TRANSPARENT_TEXTURES} from "./Nodes/Terrain/Block";
import * as THREE from "three";
import {MCPlayerModel} from "./Nodes/Player/MCPlayerModel";
import {MCPhysicModel} from "./Nodes/Physic/MCPhysicModel";

// Main Model class. It is the root for a hierarchy of models.
export class MainSceneModel extends ABasicSceneModel{

    terrain!:MCTerrainModel;
    player!: MCPlayerModel;
    terrain1!:TerrainModel;
    physics!:MCPhysicModel;

    async LoadExampleModelClassShaders() {
        await TerrainModel.LoadShaderModel();
    }

    async PreloadAssets(): Promise<void> {
        let appState = GetAppState();

        //Load some shaders
        await appState.loadShaderMaterialModel(AMaterialManager.DefaultMaterials.RGBA_SHADER);
        await appState.loadShaderMaterialModel(AMaterialManager.DefaultMaterials.TEXTURED_SHADER);
        await appState.loadShaderMaterialModel(AMaterialManager.DefaultMaterials.TEXTURED2D_SHADER);
        await appState.loadShaderMaterialModel(AMaterialManager.DefaultMaterials.BLINNPHONG);
        await this.loadTexture( "./images/terrain/ground01.jpeg", "ground01")
        await this.PreloadBlockTextures();
        await this.LoadExampleModelClassShaders();
    }

    async PreloadBlockTextures(): Promise<void> {
        for (let texture of BLOCK_TEXTURE_LIST) {
            await this.loadTexture( "./images/blocks/" + texture + ".png", texture);
        }
    }


    initAppState(appState:AppState){
        /**
         * The function below shows exampled of very general ways to use app state and the control panel.
         */
        // AddExampleControlPanelSpecs(this);

        /**
         * Optionally, you can add functions that will tell what should be displayed in the React portion of the GUI. Note that the functions must return JSX code, which means they need to be written in a .tsx file. That's why we've put them in a separate file.
         */
        // appState.setReactGUIContentFunction(UpdateGUIJSX);
        // appState.setReactGUIBottomContentFunction(UpdateGUIJSXWithCameraPosition);

    }

    initCamera(...args: any[]) {
        const appState = GetAppState();

        // You can change your camera parameters here
        this.initPerspectiveCameraFOV(Math.PI/2, 1.0, 0.001, 3000)

        // You can set its initial pose as well
        this.camera.setPose(NodeTransform3D.LookAt(V3(0,100,0), V3(0, 100, -1), V3(0,1,0)))
    }

    initScene(){
        let appState = GetAppState();
        // this.addViewLight();
        let blockTextures = this.initBlockTextures(appState);
        this.terrain = new MCTerrainModel(blockTextures);
        this.addChild(this.terrain)
        // let custommodel = CustomNode1Model.CreateTriangle();
        // let mat = appState.CreateShaderMaterial("rgba");
        // custommodel.setMaterial(mat);
        // this.addChild(custommodel);

        this.player = new MCPlayerModel();
        this.addChild(this.player);



        this.physics = new MCPhysicModel();
        this.addChild(this.physics)

    }

    addViewLight(){
        this.viewLight = new APointLightModel(this.camera.pose, Color.FromString("#ffffff"),20, 50, 1);
        this.addChild(this.viewLight)
        this._attachViewLightToCamera();
    }

    initBlockTextures(appState: AppState) {
        let materials: {[key: string]: THREE.MeshLambertMaterial | THREE.MeshBasicMaterial} = {};
        for (let texture of BLOCK_TEXTURE_LIST) {
            this.getTexture(texture)._threejs.magFilter = THREE.NearestFilter
            if (TRANSPARENT_TEXTURES.has(texture)) {
                materials[texture] = new THREE.MeshBasicMaterial({
                    map: this.getTexture(texture)._threejs,
                })
            } else {
                materials[texture] = new THREE.MeshLambertMaterial({
                    map: this.getTexture(texture)._threejs,
                })
            }
        }
        TRANSPARENT_TEXTURES.forEach((texture) => {
            materials[texture].transparent = true;
            materials[texture].side = THREE.DoubleSide;
        })

        materials["water"].opacity = 0.8;
        materials["grass_block_top"].color = new THREE.Color(0x91bd59);
        materials["short_grass"].color = new THREE.Color(0x91bd59);

        materials["cold_grass_block_top"] = materials["grass_block_top"].clone();
        materials["cold_grass_block_top"].color = new THREE.Color(0x86b87f);
        materials["cold_short_grass"] = materials["short_grass"].clone();
        materials["cold_short_grass"].color = new THREE.Color(0x86b87f);
        materials["warm_grass_block_top"] = materials["grass_block_top"].clone();
        materials["warm_grass_block_top"].color = new THREE.Color(0x59c93c);
        materials["warm_short_grass"] = materials["short_grass"].clone();
        materials["warm_short_grass"].color = new THREE.Color(0x59c93c);
        materials["hot_short_grass"] = materials["short_grass"].clone();
        materials["hot_short_grass"].color = new THREE.Color(0xbfb755);

        materials["leaves"].color = new THREE.Color(0x87bb3f);
        materials["cold_leaves"] = materials["leaves"].clone();
        materials["cold_leaves"].color = new THREE.Color(0x70b18b);
        materials["warm_leaves"] = materials["leaves"].clone();
        materials["warm_leaves"].color = new THREE.Color(0x69c93c);
        // materials["leaves"].transparent = true;
        return materials;
    }

    onLeftClick(event: AInteractionEvent) {
       const rayOrigin = this.player.transform.getPosition();
       const rayDirection = this.camera.forward;
       const intersection = this.terrain.findIntersection(rayOrigin, rayDirection, 4);
       if (intersection === undefined) {
          return;
       }
       const {block, side} = intersection;
       let target = block.position.plus(side);
       if (target.isEqualTo(rayOrigin.getRounded()) || target.plus(V3(0, 1, 0)).isEqualTo(rayOrigin.getRounded())) {
           console.log("cannot add block at player position");
          return;
       }
       this.terrain.placeBlock(target, this.player.holdedBlock);
    }

    onRightClick(event: AInteractionEvent) {
       const rayOrigin = this.player.transform.getPosition();
       const rayDirection = this.camera.forward;
       const intersection = this.terrain.findIntersection(rayOrigin, rayDirection, 4);
       if (intersection === undefined) {
          return;
       }
       const {block, side} = intersection;
       this.terrain.removeBlock(block.position);
    }


    /**
     * Update the model with time here.
     * If no t is provided, use the model's time.
     * If t is provided, use that time.
     * You can decide whether to couple the controller's clock and the model's. It's usually good practice to have the model run on a separate clock.
     * @param t
     */
    timeUpdate(t?: number):void;
    timeUpdate(...args:any[])
    {
        let t = this.clock.time;
        if(args != undefined && args.length>0){
            t = args[0];
        }

        for(let c of this.getDescendantList()){
            c.timeUpdate(t);
        }
        this.physics.timeUpdate(t, this.player, this.terrain);
    }
};
