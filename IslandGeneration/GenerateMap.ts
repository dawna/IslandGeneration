 /// <reference path="Scripts/collections.d.ts" />

var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;

var TILE_LENGTH = 20;

class GenerateMap {
    private root: MapNode
    public nodesDictionary: collections.Dictionary<string, MapNode>;

    constructor(x: number, y: number) {
        this.root = new MapNode({ x, y });
    }

    public generateMap(ptFunction: (pt: IPoint) => Array<IPoint>) {
        this.nodesDictionary = new collections.Dictionary<string, MapNode>();
        this.nodesDictionary.setValue(this.root.toString(), this.root);
        this.iterativeDepth(this.root, ptFunction);
    }


    public iterativeDepth(root: MapNode, ptFunction: (pt: IPoint) => Array<IPoint>) {
        var queue = new collections.Queue<MapNode>();

        queue.enqueue(root);
        while (queue.size() !== 0) {

            var node = queue.dequeue();

            var pts = ptFunction(node.point);

            pts.forEach(p => {
                var newNode = new MapNode(p);

                var dictVal = this.nodesDictionary.getValue(newNode.toString());
                if (dictVal !== undefined) {
                    node.neighbors.push(dictVal);
                    dictVal.neighbors.push(node);
                }
                else if (!this.outOfBounds(newNode)) {
                    node.neighbors.push(newNode); //Adds node to neighbor set.
                }
            });

            node.neighbors.forEach(n => {
                if (this.nodesDictionary.getValue(n.toString()) === undefined) {
                    this.nodesDictionary.setValue(n.toString(), n); //Adds node to dictionary.
                    queue.enqueue(n);
                }
            });
        }
    }

    //Applies a function on all of the values of each node in the graph.  Better if this was a node.
    public applyFunction(fun: (n: any) => void) {
        this.nodesDictionary = new collections.Dictionary<string, MapNode>();
        this.nodesDictionary.setValue(this.root.toString(), this.root);
        this.iterateGraph(this.root, fun);

    }

    public iterateGraph(currentNode: MapNode, fun: (n: any) => void) {

        var queue = new collections.Queue<MapNode>();

        queue.enqueue(currentNode);
        while (queue.size() !== 0) {

            var node = queue.dequeue();
            fun(node);

            node.neighbors.forEach(n => {
                if (this.nodesDictionary.getValue(n.toString()) === undefined) {
                    this.nodesDictionary.setValue(n.toString(), n); //Adds node to dictionary.
                    queue.enqueue(n);
                }
            });
        }
    }

    public outOfBounds(node: MapNode): boolean {
        return (node.point.x <= 0 || node.point.x >= SCREEN_WIDTH) || (node.point.y <= 0 || node.point.y >= SCREEN_HEIGHT)
    }

}

interface IPoint {
    x: number;
    y: number;
}

class MapNode {
    public neighbors: Array<MapNode>;
    public point; 
    public value: Tile

    constructor(pt: IPoint) {

        this.point = pt;
        this.neighbors = new Array<MapNode>();
        this.value = new Tile(pt);

    }

    toString() {
        return "(" + this.point.x + "," + this.point.y + ")";
    }
}

class Tile {
    public point: IPoint;
    public type: TileType;

    public edges: Array<IPoint>;
    constructor(pt: IPoint) {
        this.point = pt;
        this.edges = new Array<IPoint>();

        var r = TILE_LENGTH;
        for (var i = 1; i <= 6; i++) {
            var angle = Math.PI / 3;
            var edgeX = pt.x + Math.floor(r * Math.cos(i * angle));
            var edgeY = pt.y + Math.floor(r * Math.sin(i * angle));
            this.edges.push({x:edgeX, y:edgeY });
        }
    }

    setType(tileType: TileType) {
        this.type = tileType;
    }
}

class Edge {
    public n1: MapNode;
    public n2: MapNode;
    
    constructor(n1, n2) {
        this.n1 = n1;
        this.n2 = n2;
    }
}

enum TileType {
    Water = 0,
    Land = 1,
    Shore = 2,
    Mountain = 3
}

module DrawFunctions {
    //Draws a hexagon.
    export function drawHexagon(ctx, x: number, y: number, r: number) {

        ctx.beginPath();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0);
        ctx.moveTo(r, 0);

        for (var i = 1; i <= 6; i++) {
            var angle = Math.PI / 3;

            ctx.lineTo(r * Math.cos(i * angle), r * Math.sin(i * angle));
        }

        ctx.closePath();
        ctx.restore();

        ctx.stroke()
        ctx.fill();
    }

}

module PointGenerationFunctions {
    export var genHexPoints = function (pt: IPoint) {
        var r = TILE_LENGTH;
        var valY = Math.floor(r * Math.sin(Math.PI / 3));
        var valX = Math.floor(r * Math.cos(Math.PI / 3) + r);

        var pts = [];
        pts[0] = { x: pt.x, y: pt.y + valY * 2 };
        pts[1] = { x: pt.x + valX, y: pt.y + valY };
        pts[2] = { x: pt.x + valX, y: pt.y - valY };
        pts[3] = { x: pt.x, y: pt.y - valY * 2 };
        pts[4] = { x: pt.x - valX, y: pt.y + valY };
        pts[5] = { x: pt.x - valX, y: pt.y - valY };

        return pts
    }

    export var genGridPoints = function (pt: IPoint) {
        var w = 20;

        var pts = [];
        pts[0] = { x: pt.x + w, y: pt.y };
        pts[1] = { x: pt.x - w, y: pt.y };
        pts[2] = { x: pt.x, y: pt.y + w };
        pts[3] = { x: pt.x, y: pt.y - w };

        return pts
    }
}

class IslandGenerator {
    public tiles: Array<Tile>;

    private perlinGenerator: Perlin;
    private center: IPoint;
    private ranZ: number;

    private map: GenerateMap;

    constructor(c: IPoint) {
        this.perlinGenerator = new Perlin();
        this.ranZ = Math.random();
        this.center = c;

        this.tiles = new Array<Tile>();

        this.map = new GenerateMap(0, 0);
        this.map.generateMap(PointGenerationFunctions.genHexPoints);

        this.map.applyFunction(this.generateShoreLine.bind(this));
        this.map.applyFunction(this.GenerateShores.bind(this));

        this.tiles.sort((t1, t2) => {
            if (t1.point.y > t2.point.y) return 1;
            else if (t1.point.y < t2.point.y) return -1
            return 0;
        }); 
    }


    generateShoreLine(node: MapNode) {
        var tile = <Tile>node.value;

        if (!this.isLand(tile.point.x, tile.point.y, this.ranZ)) {
            tile.setType(TileType.Water);
        } else {
            var xScale = tile.point.x / SCREEN_WIDTH;
            var yScale = tile.point.y / SCREEN_HEIGHT;
            var c = this.perlinGenerator.OctavePerlin(xScale, yScale, this.ranZ, 5, 3)
            if (c > .6)
                tile.setType(TileType.Mountain);
            else
                tile.setType(TileType.Land);
        }  

        this.tiles.push(tile);

    }

    isLand(xPoint: number, yPoint: number, ranZ): boolean {
        this.perlinGenerator = new Perlin();
        var xScale = xPoint / SCREEN_WIDTH;
        var yScale = yPoint / SCREEN_HEIGHT;

        //var gen = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ,100,2)
        var c = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 4, 4)

        var xDist = Math.abs(xPoint - this.center.x);
        var yDist = Math.abs(yPoint - this.center.y);
        var length = Math.sqrt(xDist * xDist + yDist * yDist);
        //if (length > 100) return false;
        var xEdgeDist = Math.abs(SCREEN_WIDTH - this.center.x);
        var yEdgeDist = Math.abs(SCREEN_HEIGHT - this.center.y);

        var radius = 500;

        var edgeLength = Math.sqrt(xEdgeDist * xEdgeDist + yEdgeDist * yEdgeDist);
        return (c - (length / SCREEN_WIDTH) * length / SCREEN_WIDTH - .4) > 0;
        //return (c - length * length / radius - .4) > 0;
    }


    GenerateShores (node: MapNode) {
        var shore = false;
        if (node.value.type === TileType.Land) {
            for (var i = 0; i < node.neighbors.length; i++) {
                if (node.neighbors[i].value.type === TileType.Water) {
                    shore = true;
                    break;
                }
            }
        }

        if (shore) {
            node.value.type = TileType.Shore;
        }

    }



}

function DrawIsland(tiles : Array<Tile>) {

    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];

        var c = <HTMLCanvasElement>document.getElementById("myCanvas");
        var ctx = c.getContext("2d");

        if (tile.type === TileType.Land || tile.type === TileType.Mountain) {
            ctx.fillStyle = "#2DA82F";
        } else if (tile.type === TileType.Water) {
            ctx.fillStyle = "#2D69A8";
        } else if (tile.type === TileType.Shore) {
            ctx.fillStyle = "#ffeb99";
        }
        DrawFunctions.drawHexagon(ctx, tile.point.x, tile.point.y, TILE_LENGTH);

        if (tile.type === TileType.Mountain) {
            ctx.beginPath();

            var pt1 = tile.edges[5];
            var pt2 = tile.edges[2];

            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.lineTo((pt1.x + pt2.x) / 2, pt1.y - 50);
            ctx.lineTo(pt1.x, pt1.y);
            ctx.closePath();
            ctx.fillStyle = "#ffffff";
            ctx.stroke()
            ctx.fill();
        }
    }
}

//class MountainGenerator {
//    private perlinGenerator: Perlin;
//    private ranZ: number;

//    private map: GenerateMap;

//    constructor() {
//        this.perlinGenerator = new Perlin();
//        this.ranZ = Math.random();

//        this.map = new GenerateMap(1400, 1400);
//        this.map.generateMap(PointGenerationFunctions.genHexPoints);
//        this.map.applyFunction(this.DrawMountains.bind(this));
//    }

//    DrawMountains(node: MapNode) {

//        var c = <HTMLCanvasElement>document.getElementById("myCanvas");
//        var ctx = c.getContext("2d");
//        ctx.fillStyle = "#000000";

//        ctx.fillRect(node.point.x - 10, node.point.y - 10, 20, 20);
//    }

//}

var island = new IslandGenerator(<IPoint>{ x: 1400, y: 1400 });

DrawIsland(island.tiles);
//var mountains = new MountainGenerator();



