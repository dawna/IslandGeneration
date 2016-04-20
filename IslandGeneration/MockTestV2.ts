/// <reference path="Scripts/rhill-voronoi-core.d.ts" />

var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;

var TILE_LENGTH = 20;

declare var Voronoi: any;
var voronoi = new Voronoi();

module Test2 {
    class Edge {
        corner1: Point;
        corner2: Point; //polygon instead of pts - also corners

        tile1: Tile;
        tile2: Tile;
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

        constructor(center: Point) {
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

    class Corner {
        corners: Array<Corner>;
        edges: Array<Edge>;
        point: Point;

        constructor() {
            this.corners = new Array<Corner>();
            this.edges = new Array<Edge>();
        }

        public toString() {
            return this.point.x + "," + this.point.y;
        }
    }

    interface Point {
        x: number;
        y: number;

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

        InitializeMap(generatePointFunction: (point: Point) => Array<Point>) {
            var pointDictionary = new collections.Dictionary<string, Point>();
            var tileDictionary = new collections.Dictionary<number, Tile>();

            var queue = new collections.Queue<Point>();
            queue.enqueue(this.initialLocation);

            while (queue.size() !== 0) {
                var pt = queue.dequeue();

                var pts = generatePointFunction(pt);

                pts.forEach(p => {
                    var getPt = pointDictionary.getValue(p.x + "," + p.y);

                    if (typeof getPt === 'undefined') {
                        if (!this.OutOfBounds(p)) {
                            pointDictionary.setValue(p.x + "," + p.y, p);
                            queue.enqueue(p);
                        }
                    }
                });
            }

            var sites = pointDictionary.values();
            var bbox = { xl: 0, xr: SCREEN_WIDTH, yt: 0, yb: SCREEN_HEIGHT }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
            var diagram = voronoi.compute(sites, bbox);
            var cells : Array<any> = diagram.cells;

            cells.forEach(cell => {

                var newTile = tileDictionary.getValue(cell.voronoiId);
                if (typeof newTile === 'undefined') {
                    var center = <Point>{ x: cell.site.x, y: cell.site.y };
                    newTile = new Tile(center); //Create tile from cell
                }

                cell.halfedges.forEach(halfEdge => {

                    var edge = halfEdge.edge;

                    var newEdge = new Edge();
                    newEdge.corner1 = edge.va;
                    newEdge.corner2 = edge.vb;

                    //Neighbors - looks wrong.
                    var neighbor1 = edge.lSite;
                    var neighbor2 = edge.rSite;

                    var newNeighbor = neighbor1;

                    if (newNeighbor.voronoiId == cell.site.voronoiId) {
                        newNeighbor = neighbor2;
                    }

                    if (newNeighbor != null) {
                        var getNeighbor = tileDictionary.getValue(newNeighbor.voronoiId);

                        if (typeof getNeighbor !== 'undefined') {
                            newTile.neighbors.push(getNeighbor);
                        } else {
                            var center = <Point>{ x: newNeighbor.x, y: newNeighbor.y };
                            getNeighbor = new Tile(center);
                            tileDictionary.setValue(newNeighbor.voronoiId, getNeighbor);
                            newTile.neighbors.push(getNeighbor);
                        }
                        newEdge.tile1 = getNeighbor;

                    } else {
                        alert("TEST");
                    }


                    newEdge.tile2 = newTile;

                    newTile.edges.push(newEdge);
                });
                tileDictionary.setValue(cell.site.voronoiId, newTile);
            });

            this.tiles = tileDictionary.values();

            this.render(diagram);
        }

        render(diagram) {
        var c = <HTMLCanvasElement>document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        //var ctx = this.canvas.getContext('2d');
        // background
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
        // voronoi
        if (!diagram) { return; }
        // edges
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        var edges = diagram.edges,
            iEdge = edges.length,
            edge, v;
        while (iEdge--) {
            edge = edges[iEdge];
            v = edge.va;
            ctx.moveTo(v.x, v.y);
            v = edge.vb;
            ctx.lineTo(v.x, v.y);
        }
        ctx.stroke();

        }
        OutOfBounds(pt: Point): boolean {
            return (pt.x <= 0 || pt.x >= SCREEN_WIDTH) || (pt.y <= 0 || pt.y >= SCREEN_HEIGHT)
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

        export function generateHexPoints(pt: Point) {

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

        export function generateHexNeighborCenters(pt: IPoint) {
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

}
 
var world2 = new Test2.World();
//world.GenerateMap(Test.HexTile.generationFunction, Test.HexTile.generateHexPoints);
world2.InitializeMap(Test2.HexTile.generateHexNeighborCenters);