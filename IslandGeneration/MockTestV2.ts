/// <reference path="Scripts/rhill-voronoi-core.d.ts" />

var SCREEN_WIDTH = 2800;
var SCREEN_HEIGHT = 2800;

var TILE_LENGTH = 20;

declare var Voronoi: any;
var voronoi = new Voronoi();

module Test2 {
    class Edge {
        corner1: Corner;
        corner2: Corner; //polygon instead of pts - also corners

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

        constructor(pt: Point) {
            this.corners = new Array<Corner>();
            this.edges = new Array<Edge>();
            this.point = pt;
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
            var cornerDictionary = new collections.Dictionary<string, Corner>();

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

                var newTile = tileDictionary.getValue(cell.site.voronoiId);
                if (typeof newTile === 'undefined') {
                    var center = <Point>{ x: cell.site.x, y: cell.site.y };
                    newTile = new Tile(center); //Create tile from cell
                }

                cell.halfedges.forEach(halfEdge => {

                    var edge = halfEdge.edge;

                    var newEdge = new Edge();

                    var newCornerPts = []
                    newCornerPts[0] = { x: halfEdge.getStartpoint().x, y: halfEdge.getStartpoint().y };
                    newCornerPts[1] = { x: halfEdge.getEndpoint().x, y: halfEdge.getEndpoint().y };

                    for (var i = 0; i < newCornerPts.length; i++) {
                        var newCornerPt = newCornerPts[i];
                        var getCorner = cornerDictionary.getValue(newCornerPt.x + "," + newCornerPt.y);

                        if (typeof getCorner === 'undefined') {
                            var newCorner = new Corner(newCornerPt);
                            cornerDictionary.setValue(newCornerPt.x + "," + newCornerPt.y, newCorner);
                            newCorner.edges.push(newEdge);
                        } else {
                            //Get the dictionary's value.
                            newCorner = getCorner;
                        }

                        newCorner.edges.push(newEdge);

                        if (i === 0) {
                            newEdge.corner1 = newCorner;
                        } else{
                            newEdge.corner2 = newCorner;
                            newTile.corners.push(newCorner);

                        }
                    }

                    if (typeof newEdge.tile1 !== 'undefined') {
                        newEdge.tile2 = newTile;
                    } else {
                        newEdge.tile1 = newTile;
                    }

                    newTile.edges.push(newEdge);
                });
                cell.getNeighborIds().forEach(n => {
                    var getNeighbor = tileDictionary.getValue(n);
                    if (typeof getNeighbor !== 'undefined') {
                        newTile.neighbors.push(getNeighbor);
                    } else {
                        var center = <Point>{ x: cells[n].site.x, y: cells[n].site.y };
                        getNeighbor = new Tile(center);
                        tileDictionary.setValue(n, getNeighbor);
                        newTile.neighbors.push(getNeighbor);
                    }
                    
                    //newTile.neighbors.push(n);
                });
                tileDictionary.setValue(cell.site.voronoiId, newTile);
            });

            this.tiles = tileDictionary.values();            
        }

        render() {
            var c = <HTMLCanvasElement>document.getElementById("myCanvas");
            var ctx = c.getContext("2d");

            this.tiles.forEach(tile => {
                ctx.beginPath();

                ctx.moveTo(tile.corners[0].point.x, tile.corners[0].point.y);
                for (var i = 1; i < tile.corners.length; i++) {
                    ctx.lineTo(tile.corners[i].point.x, tile.corners[i].point.y);
                }

                ctx.lineTo(tile.corners[0].point.x, tile.corners[0].point.y);

                ctx.strokeStyle = '#888';
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
                if (tile.tileType === TileType.Land) {
                    ctx.fillStyle = "#2DA82F";
                } else if (tile.tileType === TileType.Water) {
                    ctx.fillStyle = "#2D69A8";
                } else if (tile.tileType == TileType.Shore) {
                    ctx.fillStyle = "#FFFFFF";
                }
                ctx.fill();
            });

        }

        OutOfBounds(pt: Point): boolean {
            return (pt.x <= 0 || pt.x >= SCREEN_WIDTH) || (pt.y <= 0 || pt.y >= SCREEN_HEIGHT)
        }

        GenerateIslands() {
            var ran = Math.random();
            this.tiles.forEach(tile => {
                if (this.isLand(tile, ran) && tile.neighbors.length == 6) {
                    tile.setType(TileType.Land);
                    this.landTiles.push(tile);
                    
                } else {
                    tile.setType(TileType.Water);
                }
                
            });
            this.landTiles.forEach(tile => {
                tile.neighbors.forEach(n => {
                    if (n.tileType == TileType.Water) {
                        tile.setType(TileType.Shore);
                        this.shoreTiles.push(tile);
                    }
                });
            });

            var startEdge:Edge;
            this.shoreTiles[0].edges.forEach(e => {
                if (e.tile2.tileType === TileType.Water || e.tile1.tileType === TileType.Water) {
                    startEdge = e;
                }
            });

            var nextEdge:Edge = startEdge;
            do {
                var nextEdges = nextEdge.corner2.edges;
                nextEdges.forEach(e => {
                    if (e.tile1.tileType === TileType.Shore && e.tile2.tileType === TileType.Water ||
                        e.tile2.tileType === TileType.Shore && e.tile1.tileType === TileType.Water) {
                        //do something..
                        nextEdge = e;
                    }
                });
            } while (nextEdge !== startEdge);

            this.render();

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
world2.GenerateIslands();