import {AShaderMaterial, ATexture, AThreeJSMeshGraphic, Vec3} from "../../../../anigraph";
import * as THREE from "three";

export enum SolidBlockType {
    Stone = "stone",
    Grass = "grass",
    SnowyGrass = "snowy_grass",
    ColdGrass = "cold_grass",
    WarmGrass = "warm_grass",
    Water = "water",
    Dirt = "dirt",
    Sand = "sand",
    Log = "log",
    Leaves = "leaves",
    WarmLeaves = "warm_leaves",
    ColdLeaves = "cold_leaves",
    Snow = "snow",
    Ice = "ice",
    SnowyLeaves = "snowy_leaves",
}

export enum VegetationType {
    Tree = "tree",
    ShortGrass = "short_grass",
    ColdShortGrass = "cold_short_grass",
    WarmShortGrass = "warm_short_grass",
    HotShortGrass = "hot_short_grass",
    Dandelion = "dandelion",
    Poppy = "poppy",
    Daisy = "daisy",
}

export const BlockType = {...SolidBlockType, ...VegetationType};
export type BlockType = SolidBlockType | VegetationType;

export type Block = {
    // key: string; // "x y z"
    position: Vec3;
    type: BlockType | undefined;
    renderFace: Boolean[]; // [top, bottom, left, right, front, back]
}

// a chunk is 16x16 blocks on x-z, and -inf to inf on y
export type Chunk = {
    position: Vec3; // [x, z]
    blocks: {[key: string]: Block}; // [x, y, z] as key
    decors: {[key: string]: Block};
    meshes: {[key: string]: AThreeJSMeshGraphic}; // key is texture name
}

export const BLOCK_TEXTURE_LIST = [
    "stone",
    "grass_block_top",
    "grass_block_side",
    "dirt",
    "water",
    "sand",
    "oak_log",
    "oak_log_top",
    "leaves",
    "powder_snow",
    "grass_block_snow",
    "ice",
    "short_grass",
    "dandelion",
    "poppy",
    "oxeye_daisy",
]

export const TRANSPARENT_TEXTURES = new Set([
    "water",
    "short_grass",
    "dandelion",
    "poppy",
    "oxeye_daisy",
])

export const NO_SHADOW_TEXTURES = new Set([
    ...Array.from(TRANSPARENT_TEXTURES),
    "warm_short_grass",
    "cold_short_grass",
    "hot_short_grass",
]);

export const DECOR_TEXTURES = new Set([
    "short_grass",
    "dandelion",
    "poppy",
    "oxeye_daisy",
    "warm_short_grass",
    "cold_short_grass",
    "hot_short_grass",
])

export const MATERIAL_MAPPING: Record<BlockType, string | string[]> = {
    stone: "stone",
    grass: ["grass_block_top", "grass_block_side", "dirt"],
    cold_grass: ["cold_grass_block_top", "grass_block_side", "dirt"],
    water: "water",
    dirt: "dirt",
    sand: "sand",
    log: ["oak_log_top", "oak_log", "oak_log_top"],
    leaves: "leaves",
    snowy_leaves: ["powder_snow", "cold_leaves", "cold_leaves"],
    warm_leaves: "warm_leaves",
    cold_leaves: "cold_leaves",
    snowy_grass: ["powder_snow", "grass_block_snow", "dirt"],
    warm_grass: ["warm_grass_block_top", "grass_block_side", "dirt"],
    snow: "powder_snow",
    ice: "ice",
    short_grass: "short_grass",
    cold_short_grass: "cold_short_grass",
    warm_short_grass: "warm_short_grass",
    hot_short_grass: "hot_short_grass",
    dandelion: "dandelion",
    tree: "oak_log", // this shouldn't be used
    poppy: "poppy",
    daisy: "oxeye_daisy",
}

export const getTopMaterial = (type: BlockType): string => {
    let res;
    if (typeof MATERIAL_MAPPING[type] === "string") {
        res = MATERIAL_MAPPING[type];
    } else {
        res = MATERIAL_MAPPING[type][0];
    }
    return res as string;
}

export const getSideMaterial = (type: BlockType): string => {
    let res;
    if (typeof MATERIAL_MAPPING[type] === "string") {
        res = MATERIAL_MAPPING[type];
    } else {
        res = MATERIAL_MAPPING[type][1];
    }
    return res as string;
}

export const getBottomMaterial = (type: BlockType): string => {
    let res;
    if (typeof MATERIAL_MAPPING[type] === "string") {
        res = MATERIAL_MAPPING[type];
    } else {
        res = MATERIAL_MAPPING[type][2];
    }
    return res as string;
}

export const getKey = (x: number, y: number, z:number) => {
    return x + " " + y + " " + z;
}

export const getChunkKey = (x: number, z: number) => {
    return x + " " + z;
}

export const getPositionFromKey = (key: string) => {
    let arr = key.split(" ");
    return new Vec3(Number(arr[0]), Number(arr[1]), Number(arr[2]));
}

export const pushToArray = (obj: any, key: any, value: any) => {
    if (key in obj) {
        obj[key].push(value);
    } else {
        obj[key] = [value];
    }
}

export const removeHiddenFaces = (blocks: {[key: string]: Block}) => {
    Object.values(blocks).forEach((block: Block) => {
        let pos = block.position;
        // top
        if (getKey(pos.x, pos.y + 1, pos.z) in blocks) {
            block.renderFace[0] = false;
        }

        // bottom
        if (getKey(pos.x, pos.y - 1, pos.z) in blocks) {
            block.renderFace[1] = false;
        }

        // left
        if (getKey(pos.x - 1, pos.y , pos.z) in blocks) {
            block.renderFace[2] = false;
        }

        // right
        if (getKey(pos.x + 1, pos.y , pos.z) in blocks) {
            block.renderFace[3] = false;
        }

        // front
        if (getKey(pos.x, pos.y , pos.z + 1) in blocks) {
            block.renderFace[4] = false;
        }

        // back
        if (getKey(pos.x, pos.y , pos.z - 1) in blocks) {
            block.renderFace[5] = false;
        }
    })
}
