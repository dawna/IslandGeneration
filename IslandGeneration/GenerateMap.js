/// <reference path="Scripts/collections.d.ts" />
var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;
var TILE_LENGTH = 42;
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
    }
    Tile.prototype.setType = function (tileType) {
        this.type = tileType;
    };
    return Tile;
})();
var TileType;
(function (TileType) {
    TileType[TileType["Water"] = 0] = "Water";
    TileType[TileType["Land"] = 1] = "Land";
    TileType[TileType["Shore"] = 2] = "Shore";
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
        this.map = new GenerateMap(1400, 1400);
        this.map.generateMap(PointGenerationFunctions.genHexPoints);
        this.map.applyFunction(this.generateShoreLine.bind(this));
        this.map.applyFunction(this.GenerateShores.bind(this));
        this.map.applyFunction(this.DrawIsland.bind(this));
    }
    IslandGenerator.prototype.generateShoreLine = function (node) {
        var tile = node.value;
        if (!this.isLand(tile.point.x, tile.point.y, this.ranZ)) {
            tile.setType(TileType.Water);
        }
        else {
            tile.setType(TileType.Land);
        }
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
    IslandGenerator.prototype.DrawIsland = function (node) {
        var tile = node.value;
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        if (tile.type === TileType.Land) {
            ctx.fillStyle = "#2DA82F";
        }
        else if (tile.type === TileType.Water) {
            ctx.fillStyle = "#2D69A8";
        }
        else {
            ctx.fillStyle = "#ffeb99";
        }
        DrawFunctions.drawHexagon(ctx, tile.point.x, tile.point.y, TILE_LENGTH);
    };
    return IslandGenerator;
})();
var MountainGenerator = (function () {
    function MountainGenerator() {
        this.perlinGenerator = new Perlin();
        this.ranZ = Math.random();
        this.map = new GenerateMap(1400, 1400);
        this.map.generateMap(PointGenerationFunctions.genHexPoints);
        this.map.applyFunction(this.DrawMountains.bind(this));
    }
    MountainGenerator.prototype.DrawMountains = function (node) {
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(node.point.x - 10, node.point.y - 10, 20, 20);
    };
    return MountainGenerator;
})();
var island = new IslandGenerator({ x: 1400, y: 1400 });
var mountains = new MountainGenerator();
//# sourceMappingURL=GenerateMap.js.map