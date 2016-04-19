/// <reference path="Scripts/collections.d.ts" />

var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;

var TILE_LENGTH = 20;

module Test {

    class Edge {
        corner1: Corner;
        corner2: Corner; //polygon instead of pts - also corners

        tiles: Array<Tile>;

        constructor() {
            this.tiles = new Array<Tile>();
        }

        public equals(edge: Edge) {
            return this.corner1.equals(edge.corner1) && this.corner2.equals(edge.corner2);
            //Or vice-versa
        }
    }

    enum TileType {
        Water = 0,
        Land = 1,
        Shore = 2,
        MountainTall = 3,
        MountainMedium = 4,
        MountainSmall = 5,
    }

    class Tile {
        neighbors: Array<Tile>;
        corners: Array<Corner>;
        edges: Array<Edge>;

        center: Point;
        tileType: TileType;

        constructor(center : Point) {
            this.neighbors = new Array<Tile>();
            this.corners = new Array<Corner>();
            this.edges = new Array<Edge>();

            this.center = center;

        }

        public setType(tileType: TileType) {
            this.tileType = tileType;
        }

        toString() {
            return this.center.x + "," + this.center.y;
        }
    }


    interface Point {
        x: number,
        y: number

    }

    class Corner {
        corners: Array<Corner>; 
        edges: Array<Edge>;
        point: Point;

        constructor() {
            this.corners = new Array<Corner>(); 
            this.edges = new Array<Edge>();
        }

        public equals(corner: Corner) {
            return corner.point.x == this.point.x && corner.point.y == this.point.y;
        }

        addCorner(val: Corner) {
            if (this.equals(val)) {
                return;
            }

            var alreadyExists = false;
            this.corners.forEach(c => {
                if (c.point.x === val.point.x && c.point.y === val.point.y) {
                    alreadyExists = true;
                }
            });

            if (!alreadyExists) {
                this.corners.push(val);
                var newEdge = new Edge();
                newEdge.corner1 = this;
                newEdge.corner2 = val;
                this.edges.push(newEdge);
            }

        }

        public merge(corner: Corner) {
        }

        public toString() {
            return this.point.x + "," + this.point.y;
        }
    }


    export class World {
        tiles: Array<Tile>;
        landTiles: Array<Tile>;
        shoreTiles: Array<Tile>;
        shoreLine: Array<Edge>;

        initialLocation: Point = { x: 1400, y: 1400 };

        constructor() {
            this.tiles = new Array<Tile>();
            this.landTiles = new Array<Tile>();
            this.shoreTiles = new Array<Tile>();
            this.shoreLine = new Array<Edge>();
        }

        GenerateMap(generateTilesFunction: (tile: Tile) => Array<Tile>, generatePointFunction: (point:Point) => Array<Point>) {
            var queue = new collections.Queue<Tile>();
            var tilesDictionary = new collections.Dictionary<string, Tile>();
            var cornerDictionary = new collections.Dictionary<string, Corner>();

            var root = new Tile(this.initialLocation);

            queue.enqueue(root);
            while (queue.size() !== 0) {

                var tile = queue.dequeue();
                this.tiles.push(tile);

                //Gets points and creates the corners.
                var pts = generatePointFunction(tile.center);

                //Generates the corners form the point function.
                var corners = this.GenerateCornersFromPoints(cornerDictionary, pts);

                corners.forEach(corner => {

                    //set corner neighbors and edges.
                    tile.corners.push(corner);
                    corner.edges.forEach(e => e.tiles.push(tile));

                    cornerDictionary.setValue(corner.toString(), corner);

                });

                //for generating neighbor centers.
                var neighbors = generateTilesFunction(tile);

                neighbors.forEach(n => {
                    if (!this.OutOfBounds(n)) {
                        var getNeighbor = tilesDictionary.getValue(n.toString());
                        if (typeof getNeighbor === 'undefined') {
                            //Adds node to dictionary.
                            tilesDictionary.setValue(n.toString(), n);
                            tile.neighbors.push(n);
                            queue.enqueue(n);

                        } else {
                            tile.neighbors.push(getNeighbor);
                        }
                    }
                });

                //Calculate edge tile neighbors.
            }
        }

        GenerateCornersFromPoints(cornerDictionary: collections.Dictionary<string, Corner>, pts: Array<Point>) {
            var corners = new Array<Corner>();

            for (var i = 0; i < pts.length; i++) {

                var newCorner = new Corner();
                newCorner.point = pts[i];

                //I should do this here.
                var getCorner = cornerDictionary.getValue(newCorner.toString());
                if (typeof getCorner !== 'undefined') {
                    newCorner = getCorner;
                }

                corners.push(newCorner);
            }

            for (var i = 0; i < corners.length; i++) {
                var adjCorner1;
                var adjCorner2;

                //If end of the array.
                if (i == corners.length - 1) {
                    adjCorner1 = corners[i - 1];
                    adjCorner2 = corners[0];
                }
                //If beginning of the array.
                else if (i == 0) {
                    adjCorner1 = corners[corners.length - 1];
                    adjCorner2 = corners[i + 1];
                }
                //In the middle.
                else {
                    adjCorner1 = corners[i - 1];
                    adjCorner2 = corners[i + 1];
                }

                corners[i].addCorner(adjCorner1);
                corners[i].addCorner(adjCorner2);

            }

            return corners;
        }

        OutOfBounds(tile: Tile): boolean {
            return (tile.center.x <= 0 || tile.center.x >= SCREEN_WIDTH) || (tile.center.y <= 0 || tile.center.y >= SCREEN_HEIGHT)
        }

        GenerateIslands() {
            var ran = Math.random();
            this.tiles.forEach(tile => {
                if (this.isLand(tile, ran)) {
                    tile.setType(TileType.Land);
                    this.landTiles.push(tile);
                } else {
                    tile.setType(TileType.Water);
                }

                //Edge tile.
                if (tile.neighbors.length < 6) {
                    tile.setType(TileType.Water);
                }
                this.DrawTile(tile);
            });

            this.landTiles.forEach(tile => {
                for (var i = 0; i < tile.neighbors.length; i++) {
                    if (tile.neighbors[i].tileType === TileType.Water) {

                        tile.tileType = TileType.Shore;
                        this.shoreTiles.push(tile);
                        break;
                    }
                };
            });

            //Gets the initial shore-line.
            this.shoreTiles[0].corners.forEach(c => {
                c.edges.forEach(e => {
                    e.tiles.forEach(t => {
                        if (t.tileType === TileType.Water) {
                            this.shoreLine.push(e);
                            return;
                        }
                    });

                    if (this.shoreLine.length > 0) return;
                });
                if (this.shoreLine.length > 0) return;
            });


            //Loops through the entire shore-line.
            var startValue = this.shoreLine[0].corner1;
            var nextValue = this.shoreLine[0].corner2;
            var prevVal = this.shoreLine[0];

            while (!nextValue.equals(startValue)) {
                var nextEdge : Edge;
                nextValue.edges.forEach(e => {
                    var landCount = 0;
                    var waterCount = 0;
                    e.tiles.forEach(t => {
                        if (t.tileType === TileType.Water) waterCount++
                        else landCount++;
                    });
                    if (landCount == 1 && waterCount == 1) {
                        if (!e.equals(prevVal)) {
                            nextEdge = e;
                        }
                    }
                });

                prevVal = nextEdge;
                nextValue = nextEdge.corner2;
            }

            this.DrawLand();
        }

        isLand(tile: Tile, ranZ): boolean {
            var xPoint = tile.center.x;
            var yPoint = tile.center.y;

            var perlinGenerator = new Perlin();
            var xScale = xPoint / SCREEN_WIDTH;
            var yScale = yPoint / SCREEN_HEIGHT;

            var c = perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 4, 4)

            var xDist = Math.abs(xPoint - this.initialLocation.x);
            var yDist = Math.abs(yPoint - this.initialLocation.y);
            var length = Math.sqrt(xDist * xDist + yDist * yDist);

            var xEdgeDist = Math.abs(SCREEN_WIDTH - this.initialLocation.x);
            var yEdgeDist = Math.abs(SCREEN_HEIGHT - this.initialLocation.y);

            var radius = 500;

            var edgeLength = Math.sqrt(xEdgeDist * xEdgeDist + yEdgeDist * yEdgeDist);
            return (c - (length / SCREEN_WIDTH) * length / SCREEN_WIDTH - .4) > 0;
        }

        DrawLand() {
            var c = <HTMLCanvasElement>document.getElementById("myCanvas");
            var ctx = c.getContext("2d");

            ctx.fillStyle = "#2DA82F";

            

            //for (var i = 0; i < this.shoreLine.length; i++) {

            //    ctx.beginPath();
            //    ctx.save();
            //    ctx.translate(0, 0);
            //    ctx.rotate(0);
            //    ctx.moveTo(this.shoreLine[i].p1.x, this.shoreLine[i].p1.y);
            //    ctx.lineTo(this.shoreLine[i].p2.x, this.shoreLine[i].p2.y);
            //    ctx.closePath();
            //    ctx.restore();

            //    ctx.stroke()

            //}
            //ctx.lineTo(this.shoreLine[0].p1.x, this.shoreLine[0].p1.y);


            //ctx.fill();
        }
        DrawTile(tile: Tile) {

            //var c = <HTMLCanvasElement>document.getElementById("myCanvas");
            //var ctx = c.getContext("2d");

            //if (tile.tileType === TileType.Land) {
            //    ctx.fillStyle = "#2DA82F";
            //} else if (tile.tileType === TileType.Water) {
            //    ctx.fillStyle = "#2D69A8";
            //} else if (tile.tileType == TileType.Shore) {
            //    ctx.fillStyle = "#FFFFFF";
            //}

            //ctx.beginPath();
            //ctx.save();
            //ctx.translate(0, 0);
            //ctx.rotate(0);
            //ctx.moveTo(tile.edges[0].p1.x, tile.edges[0].p1.y);

            //for (var i = 0; i < tile.edges.length; i++) {

            //    ctx.lineTo(tile.edges[i].p2.x, tile.edges[i].p2.y);


            //}
            //ctx.lineTo(tile.edges[0].p1.x, tile.edges[0].p1.y);

            //ctx.closePath();
            //ctx.restore();

            //ctx.stroke()
            //ctx.fill();
            //DrawFunctions.drawHexagon(ctx, tile.center.x, tile.center.y, TILE_LENGTH);
        }
    }

    //Used to generate the edges of the tiles 
    export module HexTile {
        export function generationFunction(tile: Tile): Array<Tile> {
            var neighbors = new Array<Tile>();
            

            var pts = generateHexNeighborCenters(tile.center);

            pts.forEach(p => {
                neighbors.push(new Tile(p));
            });

            return neighbors;
        }

        function intersects() {
        }

        export function generateHexPoints(pt : Point) {

            var points = new Array<Point>();

            var r = TILE_LENGTH;
            for (var i = 0; i <= 5; i++) {
                var angle = Math.PI / 3;
                var edgeX = pt.x + Math.floor(r * Math.cos(i * angle));
                var edgeY = pt.y + Math.floor(r * Math.sin(i * angle));
                var v1 = { x: edgeX, y: edgeY };

                points.push(v1);
            }

            return points;
        }

        function generateHexNeighborCenters(pt: IPoint) {
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
        }
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

}



var world = new Test.World();
world.GenerateMap(Test.HexTile.generationFunction, Test.HexTile.generateHexPoints);
world.GenerateIslands();

