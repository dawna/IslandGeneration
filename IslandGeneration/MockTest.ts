/// <reference path="Scripts/collections.d.ts" />

var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;

var TILE_LENGTH = 20;

module Test {

    interface Edge {
        p1: Point;
        p2: Point; //polygon instead of pts - also corners
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

        public getSharedEdge(tile: Tile) {
            for (var i = 0; i < this.edges.length; i++) {
                if (Lines.doIntersect(this.edges[i].p1, this.edges[i].p2, tile.center, this.center)) {
                    return this.edges[i];
                }
            }
        }

        toString() {
            return this.center.x + "," + this.center.y;
        }
    }


    interface Point {
        x: number,
        y: number

    }

    interface Corner {
        corners: Array<Corner>; 
        edges: Array<Edge>;
        point: Point;
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

        GenerateMap(generateTilesFunction: (tile: Tile) => Array<Tile>, generateCornerFunction: (point:Point) => Array<Corner>) {
            var queue = new collections.Queue<Tile>();
            var tilesDictionary = new collections.Dictionary<string, Tile>();
            var cornerDictionary = new collections.Dictionary<string, Corner>();

            var root = new Tile(this.initialLocation);

            queue.enqueue(root);
            while (queue.size() !== 0) {

                var tile = queue.dequeue();
                this.tiles.push(tile);

                var corners = generateCornerFunction(tile.center);

                corners.forEach(corner => {
                    //set corner neighbors and edges.
                    var getCorner = cornerDictionary.getValue(corner.toString());
                    if (typeof getCorner === 'undefined') {
                        cornerDictionary.setValue(corner.toString(), corner);
                    } else {
                        getCorner.corners.forEach(newCorner => {
                            if (typeof cornerDictionary.getValue(newCorner.toString()) === 'undefined') {
                                //add new corner to dictionary too.
                                //add new corner to getCorner.
                            }
                        });
                    }
                });
                //add corner to dictionary


                //for generating neighbor centers.
                var neighbors = generateTilesFunction(tile);

                //This is where the edges and corners need to be created(no not until it becomes tile).
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



            //Ugly - remove when a better solution shows up.
            //this.shoreTiles.forEach(tile => {

            var queue = new collections.Queue<Tile>();
            queue.enqueue(this.shoreTiles[0]);

            var tilesDictionary = new collections.Dictionary<string, Tile>();

            tilesDictionary.setValue(this.shoreTiles[0].toString(), this.shoreTiles[0]);
            while (queue.size() !== 0) {
                var tile = queue.dequeue();
                for (var i = 0; i < tile.neighbors.length; i++) {

                    if (tile.neighbors[i].tileType === TileType.Water) {
                        this.shoreLine.push(tile.getSharedEdge(tile.neighbors[i]));
                    }

                    if (tile.neighbors[i].tileType === TileType.Shore) {
                        var getNeighbor = tilesDictionary.getValue(tile.neighbors[i].toString());
                        if (typeof getNeighbor === 'undefined') {
                            if (tile.neighbors[i].toString() !== this.shoreTiles[0].toString()) {
                                tilesDictionary.setValue(tile.neighbors[i].toString(), tile.neighbors[i]);
                                queue.enqueue(tile.neighbors[i]);
                            }
                        }
                    }
                }
            }
            //});

            //this.tiles.forEach(tile => {
            //    this.DrawTile(tile);
            //});

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

            

            for (var i = 0; i < this.shoreLine.length; i++) {

                ctx.beginPath();
                ctx.save();
                ctx.translate(0, 0);
                ctx.rotate(0);
                ctx.moveTo(this.shoreLine[i].p1.x, this.shoreLine[i].p1.y);
                ctx.lineTo(this.shoreLine[i].p2.x, this.shoreLine[i].p2.y);
                ctx.closePath();
                ctx.restore();

                ctx.stroke()

            }
            //ctx.lineTo(this.shoreLine[0].p1.x, this.shoreLine[0].p1.y);


            //ctx.fill();
        }
        DrawTile(tile: Tile) {

            var c = <HTMLCanvasElement>document.getElementById("myCanvas");
            var ctx = c.getContext("2d");

            if (tile.tileType === TileType.Land) {
                ctx.fillStyle = "#2DA82F";
            } else if (tile.tileType === TileType.Water) {
                ctx.fillStyle = "#2D69A8";
            } else if (tile.tileType == TileType.Shore) {
                ctx.fillStyle = "#FFFFFF";
            }

            ctx.beginPath();
            ctx.save();
            ctx.translate(0, 0);
            ctx.rotate(0);
            ctx.moveTo(tile.edges[0].p1.x, tile.edges[0].p1.y);

            for (var i = 0; i < tile.edges.length; i++) {

                ctx.lineTo(tile.edges[i].p2.x, tile.edges[i].p2.y);


            }
            ctx.lineTo(tile.edges[0].p1.x, tile.edges[0].p1.y);

            ctx.closePath();
            ctx.restore();

            ctx.stroke()
            ctx.fill();
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

            tile.edges = generateHexEdges(tile.center);
            //neighbors.forEach(neighbor => {



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

    module Lines {
        // Given three colinear points p, q, r, the function checks if
        // point q lies on line segment 'pr'
        function onSegment(p: Point, q: Point, r: Point) {
            if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
                q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
                return true;

            return false;
        }
 
        // To find orientation of ordered triplet (p, q, r).
        // The function returns following values
        // 0 --> p, q and r are colinear
        // 1 --> Clockwise
        // 2 --> Counterclockwise
        function orientation(p: Point, q: Point, r: Point): number {
            // See http://www.geeksforgeeks.org/orientation-3-ordered-points/
            // for details of below formula.
            var val = (q.y - p.y) * (r.x - q.x) -
                (q.x - p.x) * (r.y - q.y);

            if (val == 0) return 0;  // colinear
 
            return (val > 0) ? 1 : 2; // clock or counterclock wise
        }
 
        // The main function that returns true if line segment 'p1q1'
        // and 'p2q2' intersect.
        export function doIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
            // Find the four orientations needed for general and
            // special cases
            var o1 = orientation(p1, q1, p2);
            var o2 = orientation(p1, q1, q2);
            var o3 = orientation(p2, q2, p1);
            var o4 = orientation(p2, q2, q1);
 
            // General case
            if (o1 != o2 && o3 != o4)
                return true;
 
            // Special Cases
            // p1, q1 and p2 are colinear and p2 lies on segment p1q1
            if (o1 == 0 && onSegment(p1, p2, q1)) return true;
 
            // p1, q1 and p2 are colinear and q2 lies on segment p1q1
            if (o2 == 0 && onSegment(p1, q2, q1)) return true;
 
            // p2, q2 and p1 are colinear and p1 lies on segment p2q2
            if (o3 == 0 && onSegment(p2, p1, q2)) return true;
 
            // p2, q2 and q1 are colinear and q1 lies on segment p2q2
            if (o4 == 0 && onSegment(p2, q1, q2)) return true;

            return false; // Doesn't fall in any of the above cases
        }
    }

}



var world = new Test.World();
world.GenerateMap(Test.HexTile.generationFunction);
world.GenerateIslands();

