/// <reference path="Scripts/collections.d.ts" />

var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;

var TILE_LENGTH = 20;

module Test {

    interface Edge {
        p1: Point;
        p2: Point;
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
        center: Point;
        edges: Array<Edge>;
        tileType: TileType;

        constructor(center : Point) {
            this.neighbors = new Array<Tile>();
            this.edges = new Array<Edge>();

            this.center = center;

        }

        public setType(tileType: TileType) {
            this.tileType = tileType;
        }
        
        public SetEdges(edges: Array<Edge>) {
            this.edges = edges;
        }

        toString() {
            return this.center.x + "," + this.center.y;
        }
    }


    interface Point {
        x: number,
        y: number
    }


    export class World {
        tiles: Array<Tile>;
        landTiles: Array<Tile>;
        shoreTiles: Array<Tile>;

        initialLocation: Point = { x: 1400, y: 1400 };

        constructor() {
            this.tiles = new Array<Tile>();
            this.landTiles = new Array<Tile>();
        }

        GenerateMap(generateTilesFunction: (tile: Tile) => Array<Tile>) {
            var queue = new collections.Queue<Tile>();
            var tilesDictionary = new collections.Dictionary<string, Tile>();

            var root = new Tile(this.initialLocation);

            queue.enqueue(root);
            while (queue.size() !== 0) {

                var tile = queue.dequeue();
                this.tiles.push(tile);

                var neighbors = generateTilesFunction(tile);

                neighbors.forEach(n => {
                    if (!this.OutOfBounds(n)) {
                        if (typeof tilesDictionary.getValue(n.toString()) === 'undefined') {
                            //Adds node to dictionary.
                            tilesDictionary.setValue(n.toString(), n); 
                            tile.neighbors.push(n);
                            queue.enqueue(n);
                        }
                    }
                });
            }
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
                this.DrawTile(tile);
            });
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


        DrawTile(tile: Tile) {

            var c = <HTMLCanvasElement>document.getElementById("myCanvas");
            var ctx = c.getContext("2d");

            if (tile.tileType === TileType.Land) {
                ctx.fillStyle = "#2DA82F";
            } else if (tile.tileType === TileType.Water) {
                ctx.fillStyle = "#2D69A8";
            }

            DrawFunctions.drawHexagon(ctx, tile.center.x, tile.center.y, TILE_LENGTH);
        }
    }

    //Used to generate the edges of the tiles 
    export module HexTile {
        export function generationFunction(tile: Tile): Array<Tile> {
            var neighbors = new Array<Tile>();
            var edges;

            if (typeof tile.edges === 'undefined') {
                edges = generateHexEdges(tile.center);
            }

            var pts = generateHexNeighborCenters(tile.center);

            pts.forEach(p => {
                neighbors.push(new Tile(p));
            });
            //neighbors.forEach(neighbor => {

            //    //get line between tile and neighbor center.
            //    var intersectedEdge;

            //    //go through neighbor's edges.  If the edge already exists and the current
            //    //tile intersects it then add it to the neighbor's edge
            //    var addNewEdge = true;

            //    for (var i = 0; i < tile.edges.length; i++) {
            //        //Get intersected edge.
            //        //Set edge to that
            //    }
            //    for (var i = 0; i < neighbor.edges.length; i++) {
            //        //Get intersected edge set neighbor edge to this.
            //    }

            //});

            return neighbors;
        }

        function intersects() {
        }

        function generateHexEdges(pt : Point) {

            var edges = new Array<Edge>();

            var r = TILE_LENGTH;
            for (var i = 0; i <= 5; i++) {
                var angle = Math.PI / 3;
                var edgeX = pt.x + Math.floor(r * Math.cos(i * angle));
                var edgeY = pt.y + Math.floor(r * Math.sin(i * angle));
                var v1 = { x: edgeX, y: edgeY };

                var edgeX2 = pt.x + Math.floor(r * Math.cos((i + 1) * angle));
                var edgeY2 = pt.y + Math.floor(r * Math.sin((i + 1) * angle));
                var v2 = { x: edgeX2, y: edgeY2 };

                edges.push({ p1: v1, p2: v2 });
            }

            return edges;
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
world.GenerateMap(Test.HexTile.generationFunction);
world.GenerateIslands();

