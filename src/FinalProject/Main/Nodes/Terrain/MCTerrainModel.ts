import {ANodeModel3D, ASerializable, GetAppState, SeededRandom, V3, Vec3} from "../../../../anigraph";
import {HeightGenerator} from "./HeightGenerator";
import {
    Block,
    BlockType,
    Chunk,
    getChunkKey,
    getKey,
    getPositionFromKey,
    removeHiddenFaces,
    VegetationType
} from "./Block";
import {Material} from "three";
import {MainSceneModel} from "../../MainSceneModel";
import {BiomeGenerator, BiomeType} from "./BiomeGenerator";
import {FractalNoise} from "../../Noise";


@ASerializable("MCTerrainModel")
export class MCTerrainModel extends ANodeModel3D {
    // control panel for the terrain
    static SEED = "Seed";
    static RENDER_DISTANCE = "Render Distance";

    static TERRAIN_UPDATED = "MC_terrain_updated";
    // [top, bottom, left, right, front, back]
    static SURROUNDING_BLOCKS = [V3(0, 1, 0), V3(0, -1, 0), V3(-1, 0, 0), V3(1, 0, 0), V3(0, 0, 1), V3(0, 0, -1)];
    CHUNK_SIZE = 16;
    BASE_LEVEL = 0;
    static SEA_LEVEL = 62;
    // RENDER_DISTANCE = 10;

    chunks: {[key: string]: Chunk} = {}; // [chunkX, chunkZ]
    materials: {[key: string]: Material};
    addedBlocks: {[key: string]: BlockType} = {};
    removedBlocks: Set<string> = new Set();

    seed: number = 0;
    continentalNoise!: FractalNoise;
    ridgesNoise!: FractalNoise;
    heightGenerator!: HeightGenerator;
    biomeGenerator!: BiomeGenerator;

    lastPlayerChunkX = Number.MAX_SAFE_INTEGER
    lastPlayerChunkZ = Number.MAX_SAFE_INTEGER
    lastRenderDistance = 8;

    get parent(): MainSceneModel {
        return this._parent as MainSceneModel;
    }

    constructor(blockMaterials: {[key: string]: Material}) {
        super();
        this.materials = blockMaterials;
        this.init();
    }

    init(seed = 0) {
        this.continentalNoise = new FractalNoise(true, 4, 0.001, 4, new SeededRandom(seed).rand, new SeededRandom(seed + 1).rand, new SeededRandom(seed + 2).rand, new SeededRandom(seed + 3).rand);
        this.ridgesNoise = new FractalNoise(true, 4, 0.002, 4, new SeededRandom(seed + 4).rand, new SeededRandom(seed + 5).rand, new SeededRandom(seed + 6).rand, new SeededRandom(seed + 7).rand);
        this.heightGenerator = new HeightGenerator(this.continentalNoise, this.ridgesNoise);
        this.biomeGenerator = new BiomeGenerator(this.heightGenerator, seed);
        this.chunks = {};
        let start = performance.now();
        // start with a 3x3 grid of chunks, then build the rest on idle callback
        for (let chunkX = -1; chunkX < 2; chunkX++) {
            for (let chunkZ = -1; chunkZ < 2; chunkZ++) {
                this.chunks[getChunkKey(chunkX, chunkZ)] = this.generateChunk(chunkX, chunkZ);
            }
        }
        console.log("init blocks ", performance.now() - start)
        console.log("chunks", Object.keys(this.chunks));
    }

    restart() {
        console.log("restart terrain");
        this.signalEvent(MCTerrainModel.TERRAIN_UPDATED, {toRemove: Object.keys(this.chunks), toAdd: []});
        const appState = GetAppState();
        this.seed = appState.getState(MCTerrainModel.SEED) || 0;
        this.init(this.seed);
        this.signalEvent(MCTerrainModel.TERRAIN_UPDATED, {toRemove: [], toAdd: Object.keys(this.chunks)});
    }

    generateChunk(idxX: number, idxZ: number) {
        let height = 0;
        let biomeType: BiomeType;
        let vegetation: VegetationType | undefined;
        let chunk: Chunk = {
            position: V3(idxX, this.BASE_LEVEL, idxZ),
            blocks: {},
            decors: {},
            meshes: {},
        }
        this.chunks[getChunkKey(idxX, idxZ)] = chunk;

        let heightMap: {[key: string]: number} = {};
        let biomeMap: {[key: string]: BiomeType} = {};
        let vegetationMap: {[key: string]: VegetationType | undefined} = {};
        for (let x = idxX * this.CHUNK_SIZE - 1; x < (idxX + 1) * this.CHUNK_SIZE + 1; x++) {
            for (let z = idxZ * this.CHUNK_SIZE - 1; z < (idxZ + 1) * this.CHUNK_SIZE + 1; z++) {
                let key = getChunkKey(x, z);
                height = this.heightGenerator.getHeightAt(x, z);
                heightMap[key] = Math.floor(height);
                biomeMap[key] = this.biomeGenerator.getBiomeType(x, z, heightMap);
                vegetationMap[key] = this.biomeGenerator.getVegetation(x, z, biomeMap[key]);
            }
        }

        // generate vegetation first to avoid trees cutting into mountains
        for (let x = idxX * this.CHUNK_SIZE; x < (idxX + 1) * this.CHUNK_SIZE; x++) {
            for (let z = idxZ * this.CHUNK_SIZE; z < (idxZ + 1) * this.CHUNK_SIZE; z++) {
                let mapKey = getChunkKey(x, z);
                biomeType = biomeMap[mapKey];
                height = heightMap[mapKey];
                vegetation = vegetationMap[mapKey];
                if (vegetation) {
                    switch (vegetation) {
                        case VegetationType.Tree:
                            this.generateTree(x, height, z, chunk, biomeType);
                            break;
                        default:
                            this.generateDecor(x, height, z, chunk, vegetation);
                    }
                }
            }
        }

        for (let x = idxX * this.CHUNK_SIZE; x < (idxX + 1) * this.CHUNK_SIZE; x++) {
            for (let z = idxZ * this.CHUNK_SIZE; z < (idxZ + 1) * this.CHUNK_SIZE; z++) {
                biomeType = biomeMap[getChunkKey(x, z)];
                height = heightMap[getChunkKey(x, z)];
                vegetation = vegetationMap[getChunkKey(x, z)];

                let leftHeight = heightMap[getChunkKey(x - 1, z)];
                let rightHeight = heightMap[getChunkKey(x + 1, z)];
                let frontHeight = heightMap[getChunkKey(x, z + 1)];
                let backHeight = heightMap[getChunkKey(x, z - 1)];
                let notVisible = false;
                for (let y = 0; y < height; y++) {
                    let k = getKey(x, y, z);
                    let renderFace = [y >= height - 1, y === 0, y >= leftHeight, y >= rightHeight, y >= frontHeight, y >= backHeight];
                    // only add visible blocks to save memory
                    notVisible = renderFace.every((val) => !val);
                    if (!notVisible) {
                        chunk.blocks[k] = {
                            position: new Vec3(x, y, z),
                            type: this.biomeGenerator.getBlockType(x, y, z, biomeType, heightMap, vegetation),
                            renderFace: renderFace,
                        }
                    }
                }
                // lake and ocean
                if (height < MCTerrainModel.SEA_LEVEL) {
                    let k = getKey(x, MCTerrainModel.SEA_LEVEL - 1, z);
                    chunk.blocks[k] = {
                        position: new Vec3(x, MCTerrainModel.SEA_LEVEL - 1, z),
                        type: BlockType.Water,
                        renderFace: [true, false, false, false, false, false]
                    }
                }
            }
        }

        // memorize previous modifications
        this.removedBlocks.forEach((key) => {
            if (key in chunk.blocks) {
                this.removeBlock(getPositionFromKey(key), true);
            }
        })
        for (let key in this.addedBlocks) {
            let pos = getPositionFromKey(key);
            this.placeBlock(pos, this.addedBlocks[key], true);
        }
        return chunk;
    }

    generateTree(x: number, y: number, z: number, chunk: Chunk, biomeType: BiomeType) {
        let treeHeight = this.biomeGenerator.getTreeHeight(x, z, biomeType);
        let treeWidth = 2;
        let blocks: {[key: string]: Block} = {};
        let treeType = this.biomeGenerator.getLeafType(biomeType);
        for (let btm = 0; btm < 2; btm++) {
            for (let i = -treeWidth; i < treeWidth + 1; i++) {
                for (let j = -treeWidth; j < treeWidth + 1; j++) {
                    let k = getKey(x + i, y + treeHeight - 3 + btm, z + j);
                    blocks[k] = {
                        position: new Vec3(x + i, y + treeHeight - 3 + btm, z + j),
                        type: treeType,
                        renderFace: [true, true, true, true, true, true]
                    }
                }
            }
        }

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let k = getKey(x + i, y + treeHeight - 1, z + j);
                blocks[k] = {
                    position: new Vec3(x + i, y + treeHeight - 1, z + j),
                    type: treeType,
                    renderFace: [true, true, true, true, true, true]
                }
                if (i === 0 || j === 0) {
                    let k = getKey(x + i, y + treeHeight, z + j);
                    blocks[k] = {
                        position: new Vec3(x + i, y + treeHeight, z + j),
                        type: treeType,
                        renderFace: [true, true, true, true, true, true]
                    }

                }
            }
        }

        removeHiddenFaces(blocks);

        for (let i = 0; i < treeHeight; i++) {
            let k = getKey(x, y + i, z);
            blocks[k] = {
                position: new Vec3(x, y + i, z),
                type: BlockType.Log,
                renderFace: [i === treeHeight - 1, false, true, true, true, true]
            }
        }

        for (let key in blocks) {
            chunk.blocks[key] = blocks[key];
        }
    }

    generateDecor(x: number, y: number, z: number, chunk: Chunk, vegetation: VegetationType) {
        chunk.decors[getKey(x, y, z)] = {
            position: new Vec3(x, y, z),
            type: vegetation,
            renderFace: [true, true, true, true, true, true],
        }
    }

    findBlockAt(x: number, y: number, z: number): {block: Block, chunk: string} | undefined {
        let chunkX = Math.floor(x / this.CHUNK_SIZE);
        let chunkZ = Math.floor(z / this.CHUNK_SIZE);
        let chunkKey = getChunkKey(chunkX, chunkZ);
        let blockKey = getKey(x, y, z);
        let chunk = this.chunks[chunkKey];
        if (!chunk) {
            return undefined;
        }
        if (blockKey in chunk.blocks) {
            return {block: chunk.blocks[blockKey], chunk: chunkKey};
        }

        // may be leaf from another chunk
        if (x % this.CHUNK_SIZE <= 1 || x % this.CHUNK_SIZE >= 14) {
            let neighborX = x % this.CHUNK_SIZE <= 1 ? chunkX - 1 : chunkX + 1;
            for (let neighborZ = chunkZ - 1; neighborZ < chunkZ + 2; neighborZ++) {
                const neighborChunkKey = getChunkKey(neighborX, neighborZ);
                const neighborChunk = this.chunks[neighborChunkKey];
                if (neighborChunk && blockKey in neighborChunk.blocks) {
                    return {block: neighborChunk.blocks[blockKey], chunk: neighborChunkKey};
                }
            }
        }
        if (z % this.CHUNK_SIZE <= 1 || z % this.CHUNK_SIZE >= 14) {
            let neighborZ = z % this.CHUNK_SIZE <= 1 ? chunkZ - 1 : chunkZ + 1;
            for (let neighborX = chunkX - 1; neighborX < chunkX + 2; neighborX++) {
                const neighborChunkKey = getChunkKey(neighborX, neighborZ);
                const neighborChunk = this.chunks[neighborChunkKey];
                if (neighborChunk && blockKey in neighborChunk.blocks) {
                    return {block: neighborChunk.blocks[blockKey], chunk: neighborChunkKey};
                }
            }
        }
        return undefined;
    }

    findIntersection(rayOrigin: Vec3, rayDirection: Vec3, maxDistance: number): {block: Block, side: Vec3} | undefined {
        let nearbyBlocks = this.findNearbyBlocks(rayOrigin, maxDistance);
        for (let {block} of nearbyBlocks) {
            let t = this.intersectBlock(rayOrigin, rayDirection, block);
            if (t >= 0 && t < maxDistance) {
                let hitPose = rayOrigin.plus(rayDirection.times(t));
                let diff = hitPose.minus(block.position);
                let side = new Vec3(diff.elements.map((val) => approxEqual(Math.abs(val), 0.5) ? (val > 0 ? 1 : -1) : 0));
                // console.log("intersect block", block.position.toString(), t, side.toString());
                return {block, side};
            }
        }
        return undefined;
    }

    findNearbyBlocks(position: Vec3, radius: number) {
        let blocks: {distance: number, block: Block}[] = []
        let roundedPos = position.getRounded();
        for (let x = roundedPos.x - radius; x < roundedPos.x + radius + 1; x++) {
            for (let y = roundedPos.y - radius; y < roundedPos.y + radius + 1; y++) {
                for (let z = roundedPos.z - radius; z < roundedPos.z + radius + 1; z++) {
                    let findBlock= this.findBlockAt(x, y, z);
                    if (findBlock) {
                        let block = findBlock.block;
                        blocks.push({distance: position.minus(block.position).L2(), block});
                    }
                }
            }
        }
        blocks.sort((a, b) => a.distance - b.distance);
        // console.log(roundedPos, blocks)
        return blocks;
    }

    // find the 6 blocks surrounding the position
    findSurroundingBlocks(position: Vec3) {
        let surrounding = []
        for (let dir of MCTerrainModel.SURROUNDING_BLOCKS) {
            let blockPos = new Vec3(position.x + dir.x, position.y + dir.y, position.z + dir.z);
            let chunkX = Math.floor(blockPos.x / this.CHUNK_SIZE);
            let chunkZ = Math.floor(blockPos.z / this.CHUNK_SIZE);
            surrounding.push({blockPos, chunkPos: {chunkX, chunkZ}});
        }
        return surrounding;
    }

    intersectBlock(rayOrigin: Vec3, rayDirection: Vec3, block: Block) {
        // TODO: fix inside block condition
        let t0 = 0;
        let t1 = Number.POSITIVE_INFINITY;
        let blockMin = block.position.minus(V3(0.5, 0.5, 0.5));
        let blockMax = block.position.plus(V3(0.5, 0.5, 0.5));
        // let blockMin = block.position.minus(V3(0, 0, 0));
        // let blockMax = block.position.plus(V3(1, 1, 1));

        for (let i = 0; i < 3; i++) {
            let tNear = rayDirection.elements[i] !== 0 ? (blockMin.elements[i] - rayOrigin.elements[i]) / rayDirection.elements[i] : Number.NEGATIVE_INFINITY;
            let tFar = rayDirection.elements[i] !== 0 ? (blockMax.elements[i] - rayOrigin.elements[i]) / rayDirection.elements[i] : Number.POSITIVE_INFINITY;
            if (tNear > tFar) {
                [tNear, tFar] = [tFar, tNear]
            }
            t0 = Math.max(tNear, t0)
            t1 = Math.min(tFar, t1)
            if (t0 > t1) {
                return -1
            }
        }

        return t0
    }

    placeBlock(position: Vec3, blockType: BlockType | undefined, generationStage: boolean = false) {
        if (!blockType) {
            return;
        }
        const chunkKey = this.getChunk(position);
        const chunk = this.chunks[chunkKey];
        if (!chunk) {
            return;
        }
        const key = getKey(position.x, position.y, position.z);
        if (key in chunk.blocks) {
            return;
        }
        chunk.blocks[key] = {
            position: position,
            type: blockType,
            renderFace: [true, true, true, true, true, true]
        }
        if (!generationStage) {
            this.addedBlocks[key] = blockType;
        }
        if (chunk.decors[key]) {
            delete chunk.decors[key];
        }

        // remove hidden faces
        const surrounding = this.findSurroundingBlocks(position);
        for (let i = 0; i < surrounding.length; i++) {
            const {blockPos, chunkPos} = surrounding[i];
            let findNeighbor = this.findBlockAt(blockPos.x, blockPos.y, blockPos.z);
            if (findNeighbor) {
                let neighborBlock = findNeighbor.block;
                chunk.blocks[key].renderFace[i] = false;
                neighborBlock.renderFace[i % 2 === 0 ? i + 1 : i - 1] = false;
            }
        }
        if (!generationStage) {
            this.signalEvent(MCTerrainModel.TERRAIN_UPDATED, {toRemove: [chunkKey], toAdd: [chunkKey]});
        }
        return [chunkKey]
    }

    removeBlock(position: Vec3, generationStage: boolean = false) {
        const findBlock = this.findBlockAt(position.x, position.y, position.z);
        if (!findBlock) {
            return;
        }
        const key = getKey(position.x, position.y, position.z);
        if (!generationStage) {
            if (key in this.addedBlocks) {
                delete this.addedBlocks[key];
            } else {
                this.removedBlocks.add(key);
            }
        }
        const chunkKey = findBlock.chunk;
        const chunk = this.chunks[chunkKey];
        if (!chunk) {
            return;
        }
        delete chunk.blocks[key];

        const posAbove = position.plus(V3(0, 1, 0));
        const aboveKey = getKey(posAbove.x, posAbove.y, posAbove.z);
        if (aboveKey in chunk.decors) {
            delete chunk.decors[aboveKey];
        }

        // add back hidden faces for neighbors
        let modifiedChunks = new Set<string>();
        modifiedChunks.add(chunkKey);
        const surrounding = this.findSurroundingBlocks(position);
        let tmpHeightMap: {[key: string]: number} = {};
        for (let i = 0; i < surrounding.length; i++) {
            const {blockPos: neighborBlockPos, chunkPos: neighborChunkPos} = surrounding[i];
            let findNeighbor = this.findBlockAt(neighborBlockPos.x, neighborBlockPos.y, neighborBlockPos.z);
            if (findNeighbor) {
                findNeighbor.block.renderFace[i % 2 === 0 ? i + 1 : i - 1] = true;
                modifiedChunks.add(findNeighbor.chunk);
            } else {
                let pos = neighborBlockPos;
                let neighborBlockKey = getKey(pos.x, pos.y, pos.z);
                let neighborChunkKey = getChunkKey(neighborChunkPos.chunkX, neighborChunkPos.chunkZ);
                let neighborChunk = this.chunks[neighborChunkKey];
                tmpHeightMap[getChunkKey(pos.x, pos.z)] = Math.floor(this.heightGenerator.getHeightAt(pos.x, pos.z));
                if (pos.y < tmpHeightMap[getChunkKey(pos.x, pos.z)] && !this.removedBlocks.has(neighborBlockKey)) {
                    // this block has not been generated, generate it here
                    let biomeType = this.biomeGenerator.getBiomeType(pos.x, pos.z, tmpHeightMap);
                    neighborChunk.blocks[neighborBlockKey] = {
                        position: pos,
                        type: this.biomeGenerator.getBlockType(pos.x, pos.y, pos.z, biomeType, tmpHeightMap),
                        renderFace: [false, false, false, false, false, false]
                    }
                    neighborChunk.blocks[neighborBlockKey].renderFace[i % 2 === 0 ? i + 1 : i - 1] = true;
                    modifiedChunks.add(neighborChunkKey);
                }
            }
        }
        let modifiedChunksArray = Array.from(modifiedChunks);
        if (!generationStage) {
            this.signalEvent(MCTerrainModel.TERRAIN_UPDATED, {toRemove: modifiedChunksArray, toAdd: modifiedChunksArray});
        }
        return modifiedChunksArray;
    }

    timeUpdate(t: number, ...args:any[]) {
        let appState = GetAppState();
        let renderDistance = appState.getState(MCTerrainModel.RENDER_DISTANCE);
        let playerPos = this.parent.player.transform.getPosition();
        let playerChunkX = Math.floor(playerPos.x / this.CHUNK_SIZE);
        let playerChunkZ = Math.floor(playerPos.z / this.CHUNK_SIZE);

        if (playerChunkX === this.lastPlayerChunkX && playerChunkZ === this.lastPlayerChunkZ && renderDistance === this.lastRenderDistance) {
            return;
        }

        let newChunks: {[key: string]: Vec3} = {}
        for (let chunkX = playerChunkX - renderDistance; chunkX < playerChunkX + renderDistance + 1; chunkX++) {
            for (let chunkZ = playerChunkZ - renderDistance; chunkZ < playerChunkZ + renderDistance + 1; chunkZ++) {
                newChunks[getChunkKey(chunkX, chunkZ)] = V3(chunkX, this.BASE_LEVEL, chunkZ);
            }
        }
        let toRemove = Object.keys(this.chunks).filter((key) => !(key in newChunks));
        let toAdd = Object.keys(newChunks).filter((key) => !(key in this.chunks));
        toAdd.sort((chunk1, chunk2) => playerPos.minus(newChunks[chunk1].times(this.CHUNK_SIZE)).L2() - playerPos.minus(newChunks[chunk2].times(this.CHUNK_SIZE)).L2());
        this.lastPlayerChunkX = playerChunkX;
        this.lastPlayerChunkZ = playerChunkZ;
        this.lastRenderDistance = renderDistance;

        this.signalEvent(MCTerrainModel.TERRAIN_UPDATED, {toRemove, toAdd: []});
        for (let key of toRemove) {
            delete this.chunks[key];
        }
        for (let key of toAdd) {
            // do this in idle callback to avoid blocking the main thread
            requestIdleCallback(() => {
                if (key in this.chunks) {
                    return;
                }
                let start = performance.now();
                this.chunks[key] = this.generateChunk(newChunks[key].x, newChunks[key].z);
                // console.log("generate chunk ", performance.now() - start);
                this.signalEvent(MCTerrainModel.TERRAIN_UPDATED, {toRemove: [], toAdd: [key]});
            }, {timeout: 1500})
        }
    }

    // get the chunk key for the given block position
    getChunk(position: Vec3) {
        const chunkX = Math.floor(position.x / this.CHUNK_SIZE);
        const chunkZ = Math.floor(position.z / this.CHUNK_SIZE);
        return getChunkKey(chunkX, chunkZ);
    }

}

const approxEqual = (a: number, b: number, tol: number = 1e-6) => Math.abs(a - b) < tol;