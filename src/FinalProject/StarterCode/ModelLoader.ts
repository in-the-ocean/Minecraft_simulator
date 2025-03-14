import {
    AShaderMaterial,
    ClassInterface,
    GetAppState,
    Mat4,
    NodeTransform3D, Quaternion,
    TransformationInterface, V3, V4, Vec3
} from "../../anigraph";
import {ABasicSceneModel} from "../../anigraph/starter";
import {ALoadedModel} from "../../anigraph/scene/nodes/loaded/ALoadedModel";


function GetTextureName(assetName:string, textureName:string){
    return `${assetName}_${textureName}`;
}

/**
 * An interface describing the details you should define for new assets in the MeshAssets dictionary
 * For textures, the key for each texture should match the corresponding uniform in your shader.
 * More specifically, if you want to include a texture "myTex", the key should be "myTex" and the sampler name
 * in your shader should be "myTexMap"
 */
interface ModelDetails {
    path: string, // path to the 3D model
    textures: {[name:string]:string} | undefined, // a dictionary with textures and their paths
    vertexColors?:boolean, // whether vertex colors are used
    modelTransform?:TransformationInterface|undefined // a transformation to apply to the loaded asset before importing it into AniGraph
}

/**
 * You can add your own assets to the ModelLoader by putting their information in the dictionary below. Then you should be able to use them with ModelLoader.LoadAsset and ModelLoader.CreateModelFromAsset.
 */
export const MeshAssets: {[name:string]:ModelDetails}= {
    /**
     * Dragon has colors stored in vertices instead of a texture
     */
    dragon: {
        path:"./models/ply/dragon.ply",
        textures:undefined,
        vertexColors: true,
        modelTransform: NodeTransform3D.RotationX(Math.PI*0.5)
    },
    /**
     * Cat model. Has a texture map and a bump map.
     */
    cat: {
        path: "./models/gltf/cat.glb",
        textures: {
            diffuse: "./models/gltf/Cat_diffuse.jpg",
            bump: "./models/gltf/Cat_bump.jpg"
        },
        modelTransform: NodeTransform3D.FromPositionZUpAndScale(V3(), Vec3.UnitZ().times(1), Vec3.UnitY().times(-1), 0.02)
    },
    /**
     * Duck model. [Good with baths](https://youtu.be/Mh85R-S-dh8?si=rzUyiVH9m94gh2Mi&t=22).
     */
    duck: {
        path:"./models/obj/duck/10602_Rubber_Duck_v1_L3.obj",
        textures: {
            diffuse: "./models/obj/duck/10602_Rubber_Duck_v1_diffuse.jpg"
        },
        modelTransform: new NodeTransform3D(V3(), Quaternion.RotationZ(Math.PI), 0.05)
    },
    /**
     * Red car. This one was exported from blender and has the flipped texture coordinates.
     */
    car1GLTF: {
        path:"./models/gltf/car1/car.gltf",
        textures: {
            diffuse: "./models/gltf/car1/10604_slot_car_red_SG_v1_diffuse.jpg"
        },
        modelTransform: Mat4.Scale3D(0.2)
    },

    /**
     * Original red car model. This one renders the windshield and the texture y coordinates are not flipped.
     */
    car1: {
        path:"./models/obj/car1/10604_slot_car_red_SG_v1_iterations-2.obj",
        textures: {
            diffuse: "./models/obj/car1/10604_slot_car_red_SG_v1_diffuse.jpg"
        },
        modelTransform: Mat4.Scale3D(0.2)
    },
    /**
     * Lab Cat likes to help. He is probably the best model. Definitely more handsome than that other Cat.
     */
    LabCat: {
        path: "models/obj/LabCat1/LabCat1.obj",
        textures: {
            diffuse: "models/obj/LabCat1/LabCat1.png",
        },
        modelTransform:Mat4.FromColumns(
            V4(-1,0,0,0),
            V4(0,0,1,0),
            V4(0,1,0,0),
            V4(0,0,0,1)
        ),
    },
    /**
     * Lab Cat is very flexible and can flip his texture. Check the model loading part of the assignment docs for an explanation...
     */
    LabCatGLTFlipped: {
        path: "models/gltf/LabCat/LabCatGLTF.gltf",
        textures: {
            diffuse: "models/gltf/LabCat/LabCatNov17_2024_V1_BaseColor.png",
        },
        modelTransform:Mat4.FromColumns(
            V4(-1,0,0,0),
            V4(0,0,1,0),
            V4(0,1,0,0),
            V4(0,0,0,1)
        ),
    }
}

export class ModelLoader{
    static MeshAssets = MeshAssets;

    /**
     * Loads a 3D model asset into the provided scene model.
     * @param sceneModel - The scene model
     * @param name - The name of the asset. Should match with its details in MeshAssets dictionary above.
     * @returns {Promise<void>}
     * @constructor
     */
    static async LoadAsset(sceneModel:ABasicSceneModel, name:string){
        let modelTransform = ('modelTransform' in this.MeshAssets[name])?this.MeshAssets[name].modelTransform:undefined;
        await sceneModel.load3DModel(this.MeshAssets[name].path, name, modelTransform);
        let texturePaths = this.MeshAssets[name].textures
        if(texturePaths !== undefined){
            for(let tname in texturePaths) {
                await sceneModel.loadTexture(texturePaths[tname], GetTextureName(name, tname));
            }
        }
    }

    /**
     * Create a node model from an asset. Assumes that the asset has already been loaded by the sceneModel.
     * @param sceneModel - The scene model with the asset loaded.
     * @param assetName - The name of the asset. Should match with its details in MeshAssets dictionary.
     * @param modelClass - The class of node model you want to create. Should inherit from ALoadedModel class
     * @param material - The material to use.
     * @param args - any other args for the modelClass.Create function
     * @returns {ALoadedModel}
     * @constructor
     */
    static CreateModelFromAsset(
        sceneModel:ABasicSceneModel,
        assetName:string,
        modelClass:ClassInterface<ALoadedModel>,
        material:AShaderMaterial,
        ...args:any[]){

        /**
         * If the SceneModel hasn't loaded an asset with the given name, throw an error.
         */
        if(!sceneModel.get3DModel(assetName)){
            throw new Error(`You need to load ${assetName} assets in PreloadAssets!`)
        }

        /**
         * Get an Object3D wrapper for the loaded asset.
         * @type {AObject3DModelWrapper}
         */
        let object3D = sceneModel.get3DModel(assetName);

        function checkObjTextures(){
            if (sceneModel.getTexture(assetName)) {
                material.setTexture('diffuse', sceneModel.getTexture(assetName));
            } else {
                let textures = object3D.getTextures();
                material.setTexture('diffuse', textures['diffuse']);
                if ('normal' in textures) {
                    material.setTexture('normal', textures['normal']);
                }
            }
        }

        if(assetName in MeshAssets){
            let texturePaths = this.MeshAssets[assetName].textures
            if(texturePaths !== undefined){
                for(let tname in texturePaths) {
                    material.setTexture(tname, sceneModel.getTexture(GetTextureName(assetName, tname)));
                }
            }else{
                checkObjTextures();
            }
            if("vertexColors" in this.MeshAssets[assetName] && this.MeshAssets[assetName]["vertexColors"]){
                material.usesVertexColors = true;
            }
        }else {
            checkObjTextures();
        }

        let loadedmodel:ALoadedModel;
        if(modelClass !== undefined) {
            // @ts-ignore
            loadedmodel = modelClass.Create(
                object3D,
                ...args
            )
        }else{
            loadedmodel = ALoadedModel.Create(
                object3D,
                ...args
            )
        }
        loadedmodel.setMaterial(material);
        return loadedmodel;
    }
}


