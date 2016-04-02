/// <reference path="Scripts/collections.d.ts" />
var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;
var TILE_LENGTH = 20;
var GenerateMap = (function () {
    function GenerateMap(x, y) {
        this.root = new MapNode({ x: x, y: y });
    }
    GenerateMap.prototype.generateMap = function (ptFunction) {
        this.nodesDictionary = new collections.Dictionary();
        this.nodesDictionary.setValue(this.root.toString(), this.root);
        this.iterativeDepth(this.root, ptFunction);
    };
    GenerateMap.prototype.iterativeDepth = function (root, ptFunction) {
        var _this = this;
        var queue = new collections.Queue();
        queue.enqueue(root);
        while (queue.size() !== 0) {
            var node = queue.dequeue();
            var pts = ptFunction(node.point);
            pts.forEach(function (p) {
                var newNode = new MapNode(p);
                var dictVal = _this.nodesDictionary.getValue(newNode.toString());
                if (dictVal !== undefined) {
                    node.neighbors.push(dictVal);
                    dictVal.neighbors.push(node);
                }
                else if (!_this.outOfBounds(newNode)) {
                    node.neighbors.push(newNode); //Adds node to neighbor set.
                }
            });
            node.neighbors.forEach(function (n) {
                if (_this.nodesDictionary.getValue(n.toString()) === undefined) {
                    _this.nodesDictionary.setValue(n.toString(), n); //Adds node to dictionary.
                    queue.enqueue(n);
                }
            });
        }
    };
    //Applies a function on all of the values of each node in the graph.  Better if this was a node.
    GenerateMap.prototype.applyFunction = function (fun) {
        this.nodesDictionary = new collections.Dictionary();
        this.nodesDictionary.setValue(this.root.toString(), this.root);
        this.iterateGraph(this.root, fun);
    };
    GenerateMap.prototype.iterateGraph = function (currentNode, fun) {
        var _this = this;
        var queue = new collections.Queue();
        queue.enqueue(currentNode);
        while (queue.size() !== 0) {
            var node = queue.dequeue();
            fun(node);
            node.neighbors.forEach(function (n) {
                if (_this.nodesDictionary.getValue(n.toString()) === undefined) {
                    _this.nodesDictionary.setValue(n.toString(), n); //Adds node to dictionary.
                    queue.enqueue(n);
                }
            });
        }
    };
    GenerateMap.prototype.outOfBounds = function (node) {
        return (node.point.x <= 0 || node.point.x >= SCREEN_WIDTH) || (node.point.y <= 0 || node.point.y >= SCREEN_HEIGHT);
    };
    return GenerateMap;
})();
var MapNode = (function () {
    function MapNode(pt) {
        this.point = pt;
        this.neighbors = new Array();
        this.value = new Tile(pt);
    }
    MapNode.prototype.toString = function () {
        return "(" + this.point.x + "," + this.point.y + ")";
    };
    return MapNode;
})();
var Tile = (function () {
    function Tile(pt) {
        this.point = pt;
        this.edges = new Array();
        var r = TILE_LENGTH;
        for (var i = 1; i <= 6; i++) {
            var angle = Math.PI / 3;
            var edgeX = pt.x + Math.floor(r * Math.cos(i * angle));
            var edgeY = pt.y + Math.floor(r * Math.sin(i * angle));
            this.edges.push({ x: edgeX, y: edgeY });
        }
    }
    Tile.prototype.setType = function (tileType) {
        this.type = tileType;
    };
    return Tile;
})();
var Edge = (function () {
    function Edge(n1, n2) {
        this.n1 = n1;
        this.n2 = n2;
    }
    return Edge;
})();
var TileType;
(function (TileType) {
    TileType[TileType["Water"] = 0] = "Water";
    TileType[TileType["Land"] = 1] = "Land";
    TileType[TileType["Shore"] = 2] = "Shore";
    TileType[TileType["Mountain"] = 3] = "Mountain";
})(TileType || (TileType = {}));
var DrawFunctions;
(function (DrawFunctions) {
    //Draws a hexagon.
    function drawHexagon(ctx, x, y, r) {
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
        ctx.stroke();
        ctx.fill();
    }
    DrawFunctions.drawHexagon = drawHexagon;
})(DrawFunctions || (DrawFunctions = {}));
var PointGenerationFunctions;
(function (PointGenerationFunctions) {
    PointGenerationFunctions.genHexPoints = function (pt) {
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
        return pts;
    };
    PointGenerationFunctions.genGridPoints = function (pt) {
        var w = 20;
        var pts = [];
        pts[0] = { x: pt.x + w, y: pt.y };
        pts[1] = { x: pt.x - w, y: pt.y };
        pts[2] = { x: pt.x, y: pt.y + w };
        pts[3] = { x: pt.x, y: pt.y - w };
        return pts;
    };
})(PointGenerationFunctions || (PointGenerationFunctions = {}));
var IslandGenerator = (function () {
    function IslandGenerator(c) {
        this.perlinGenerator = new Perlin();
        this.ranZ = Math.random();
        this.center = c;
        this.tiles = new Array();
        this.map = new GenerateMap(0, 0);
        this.map.generateMap(PointGenerationFunctions.genHexPoints);
        this.map.applyFunction(this.generateShoreLine.bind(this));
        this.map.applyFunction(this.GenerateShores.bind(this));
        this.tiles.sort(function (t1, t2) {
            if (t1.point.y > t2.point.y)
                return 1;
            else if (t1.point.y < t2.point.y)
                return -1;
            return 0;
        });
    }
    IslandGenerator.prototype.generateShoreLine = function (node) {
        var tile = node.value;
        if (!this.isLand(tile.point.x, tile.point.y, this.ranZ)) {
            tile.setType(TileType.Water);
        }
        else {
            var xScale = tile.point.x / SCREEN_WIDTH;
            var yScale = tile.point.y / SCREEN_HEIGHT;
            var c = this.perlinGenerator.OctavePerlin(xScale, yScale, this.ranZ, 5, 3);
            if (c > .6)
                tile.setType(TileType.Mountain);
            else
                tile.setType(TileType.Land);
        }
        this.tiles.push(tile);
    };
    IslandGenerator.prototype.isLand = function (xPoint, yPoint, ranZ) {
        this.perlinGenerator = new Perlin();
        var xScale = xPoint / SCREEN_WIDTH;
        var yScale = yPoint / SCREEN_HEIGHT;
        //var gen = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ,100,2)
        var c = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 4, 4);
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
    };
    IslandGenerator.prototype.GenerateShores = function (node) {
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
    };
    return IslandGenerator;
})();
function DrawIsland(tiles) {
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        if (tile.type === TileType.Land || tile.type === TileType.Mountain) {
            ctx.fillStyle = "#2DA82F";
        }
        else if (tile.type === TileType.Water) {
            ctx.fillStyle = "#2D69A8";
        }
        else if (tile.type === TileType.Shore) {
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
            ctx.stroke();
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
var island = new IslandGenerator({ x: 1400, y: 1400 });
DrawIsland(island.tiles);
//var mountains = new MountainGenerator();
//# sourceMappingURL=GenerateMap.js.map