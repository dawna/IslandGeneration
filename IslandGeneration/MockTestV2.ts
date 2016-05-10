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
        voronoiId: number;

        constructor(voronoiId: number, center: Point) {
            this.neighbors = new Array<Tile>();
            this.corners = new Array<Corner>();
            this.edges = new Array<Edge>();

            this.center = center;
            this.voronoiId = voronoiId;
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

        public equals(corner: Corner) {
            return this.point.x === corner.point.x && this.point.y === corner.point.y;
        }
        public toString() {
            return this.point.x + "," + this.point.y;
        }
    }

    interface Point {
        x: number;
        y: number;

    }

    class Island {
        edges: Array<Edge>;
        lakes: Array<Lake>;
        vertices: Array<Point>;
        mountains: Array<Mountain>;

        constructor() {
            this.edges = new Array<Edge>();
            this.lakes = new Array<Lake>();
            this.vertices = new Array<Point>();
        }

        Draw(ctx) {

            ctx.beginPath();
            ctx.moveTo(this.edges[0].corner1.point.x, this.edges[0].corner1.point.y);

            var pts = new Array<number>();
            var inc = 1;
            if (this.edges.length > 10) {
                inc = 4;
            }


            for (var i = 0; i < this.edges.length; i += inc) {
                pts.push(this.edges[i].corner2.point.x);
                pts.push(this.edges[i].corner2.point.y);
            }

            ctx.curve(pts, 1, true);
            ctx.closePath();
            ctx.fillStyle = '#F7DC88';
            ctx.fill();
            ctx.lineWidth = 12;
            ctx.stroke();

            this.lakes.forEach(lake => {
                lake.Draw(ctx);
            });

            this.mountains.forEach(mountain => {
                mountain.Draw(ctx);
            });
        }
    }

    class Lake {
        edges: Array<Edge>;
        vertices: Array<Point>;

        constructor() {
            this.edges = new Array<Edge>();
            this.vertices = new Array<Point>();
        }

        Draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.edges[0].corner1.point.x, this.edges[0].corner1.point.y);

            var pts = new Array<number>();
            var inc = 1;
            if (this.edges.length > 10) {
                inc = 4;
            }


            for (var i = 0; i < this.edges.length; i += inc) {
                pts.push(this.edges[i].corner2.point.x);
                pts.push(this.edges[i].corner2.point.y);
            }

            ctx.curve(pts, 1, true);

            ctx.fillStyle = '#FAEAB9';
            ctx.fill();
            ctx.closePath();
            ctx.lineWidth = 12;
            ctx.stroke();
        }
    }

    class Mountain {
        center: Point;
        width: number;
        height: number;

        constructor(center) {
            this.center = center;
            this.width = 200;
            this.height = 250;
        }

        Draw(ctx) {

            ctx.beginPath();
            ctx.moveTo(this.center.x - this.width / 2, this.center.y);
            ctx.lineTo(this.center.x + this.width / 2, this.center.y);
            ctx.lineTo(this.center.x, this.center.y - this.height);
            ctx.lineTo(this.center.x - this.width / 2, this.center.y);
            ctx.closePath();

            ctx.fillStyle = '#000000'
            ctx.fill();
        }
    }

    class Tree {
        center: Point;
        width: number;
        height: number;

        constructor(center, width, height) {
            this.center = center;
            this.width = width;
            this.height = height;
        }

        Draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.center.x - this.width / 2, this.center.y);
            ctx.lineTo(this.center.x + this.width / 2, this.center.y);
            ctx.lineTo(this.center.x, this.center.y - this.height);
            ctx.lineTo(this.center.x - this.width / 2, this.center.y);
            ctx.closePath();

            ctx.fillStyle = '#000000'
            ctx.fill();

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

        InitializeMap(generatePointFunction: (point: Point) => Array<Point>) {
            var pointDictionary = new collections.Dictionary<string, Point>();
            var tileDictionary = new collections.Dictionary<number, Tile>();
            var cornerDictionary = new collections.Dictionary<string, Corner>();

            var queue = new collections.Queue<Point>();
            queue.enqueue(this.initialLocation);

            //Attempt to do voronoi generation
            for (var i = 0; i < 10000; i++) {
                var newX = Math.random() * SCREEN_WIDTH;
                var newY = Math.random() * SCREEN_HEIGHT;
                var getPt = pointDictionary.getValue(newX + "," + newY);
                var p = { x: newX, y: newY };
                if (typeof getPt === 'undefined') {
                    pointDictionary.setValue(p.x + "," + p.y, p);
                }
            }

            var sites = pointDictionary.values();
            var bbox = { xl: 0, xr: SCREEN_WIDTH, yt: 0, yb: SCREEN_HEIGHT }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
            var diagram = voronoi.compute(sites, bbox);
            var cells : Array<any> = diagram.cells;

            cells.forEach(cell => {

                var newTile = tileDictionary.getValue(cell.site.voronoiId);
                if (typeof newTile === 'undefined') {
                    var center = <Point>{ x: cell.site.x, y: cell.site.y };
                    newTile = new Tile(cell.site.voronoiId, center); //Create tile from cell
                }

                cell.getNeighborIds().forEach(n => {
                    var getNeighbor = tileDictionary.getValue(n);
                    if (typeof getNeighbor !== 'undefined') {
                        newTile.neighbors.push(getNeighbor);
                    } else {
                        var center = <Point>{ x: cells[n].site.x, y: cells[n].site.y };
                        getNeighbor = new Tile(cell.site.voronoiId, center);
                        tileDictionary.setValue(n, getNeighbor);
                        newTile.neighbors.push(getNeighbor);
                    }
                    
                });

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
                        } else {
                            //Get the dictionary's value.
                            newCorner = getCorner;
                        }

                        if (i === 0) {
                            newEdge.corner1 = newCorner;
                        } else{
                            newEdge.corner2 = newCorner;
                            newCorner.edges.push(newEdge);
                            newTile.corners.push(newCorner);

                        }
                    }

                    var id1 = halfEdge.edge.lSite;
                    var id2 = halfEdge.edge.rSite;

                    //Should be one of the neighbors.
                    if (id1 != null) {
                        newEdge.tile1 = tileDictionary.getValue(id1.voronoiId);
                    } else {
                        newEdge.tile1 = tileDictionary.getValue(id1.voronoiId);
                        
                        tileDictionary.setValue(cell.site.voronoiId, newTile);
                    }
                    if (id2 != null) {
                        newEdge.tile2 = tileDictionary.getValue(id2.voronoiId);
                    } else {
                        tileDictionary.setValue(cell.site.voronoiId, newTile);
                        tileDictionary.setValue(cell.site.voronoiId, newTile);
                    }

                    newTile.edges.push(newEdge);
                });

                tileDictionary.setValue(cell.site.voronoiId, newTile);
            });

            this.tiles = tileDictionary.values();            
        }
       
        //Where all of the island generation code happens.
        GenerateIslands() {

            var shoreDictionary = new collections.Dictionary<number, Tile>();

            var ran = Math.random();
            this.tiles.forEach(tile => {
                if (this.isLand(tile, ran)) {
                    tile.setType(TileType.Land);
                    this.landTiles.push(tile);
                    
                } else {
                    tile.setType(TileType.Water);
                }
                
            });

            this.landTiles.forEach(tile => {
                var add = true;
                tile.edges.forEach(e => {
                    if (typeof e.tile1 === 'undefined' || typeof e.tile2 === 'undefined') {
                        tile.setType(TileType.Water);
                        add = false;
                        return;
                    }
                });

                var neighborIsWater = false;
                if (add) {
                    tile.neighbors.forEach(n => {
                        if (n.tileType == TileType.Water) {
                            neighborIsWater = true;
                            return;
                        }
                    });
                }

                if (neighborIsWater && add) {
                    tile.setType(TileType.Shore);
                    shoreDictionary.setValue(tile.voronoiId, tile);
                }
            });

            //Actually creates the different islands.
            //var islandShapes = new Array<Array<Edge>>();
            var islandShapes = new Array<Island>();
            //Needed since we have to go through multiple islands/lakes.
            while (!shoreDictionary.isEmpty()) {
                var shoreLine = new Array<Edge>();
                var islandPoints = new Array<Point>();

                var startEdge: Edge;
                shoreDictionary.values()[0].edges.forEach(e => {
                    if (e.tile2.tileType === TileType.Water || e.tile1.tileType === TileType.Water) {
                        startEdge = e;

                    }
                });
                shoreDictionary.remove(shoreDictionary.values()[0].voronoiId);

                var nextEdge: Edge = startEdge;
                var nextCorner = nextEdge.corner2;
                
                //To keep track of each of the points that fall on the coast-line.
                islandPoints.push(nextEdge.corner2.point);
                //Each individual island or circuit.
                do {
                    shoreLine.push(nextEdge);

                    var nextEdges = nextCorner.edges;
                    var possibleEdge;

                    nextEdges.forEach(e => {

                        if (typeof e.tile1 !== 'undefined' && typeof e.tile2 !== 'undefined') {
                            if (e.tile1.tileType === TileType.Shore && e.tile2.tileType === TileType.Water ||
                                e.tile2.tileType === TileType.Shore && e.tile1.tileType === TileType.Water) {
                                if (e.tile1.tileType === TileType.Shore) {
                                    shoreDictionary.remove(e.tile1.voronoiId);
                                } else if (e.tile2.tileType === TileType.Shore) {
                                    shoreDictionary.remove(e.tile2.voronoiId);
                                }
                                //do something..
                                if (!(e.corner2.equals(nextEdge.corner2) && e.corner1.equals(nextEdge.corner1)) &&
                                    !(e.corner2.equals(nextEdge.corner1) && e.corner1.equals(nextEdge.corner2))) {
                                    possibleEdge = e;
                                }
                            }
                        }
                    });

                    if (typeof possibleEdge != 'undefined') {
                        if (!possibleEdge.corner2.equals(nextEdge.corner2) &&
                            !possibleEdge.corner2.equals(nextEdge.corner1)) {
                            nextCorner = possibleEdge.corner2;
                        } else {
                            var temp = possibleEdge.corner1;
                            possibleEdge.corner1 = possibleEdge.corner2;
                            possibleEdge.corner2 = temp;
                            nextCorner = possibleEdge.corner2;
                        }
                        nextEdge = possibleEdge;
                    }

                    islandPoints.push(nextEdge.corner1.point);

                } while (!nextEdge.corner1.equals(startEdge.corner1));

                //Lake generation.
                var isLake = false;
                islandShapes.forEach(island => {
                    if (this.isInPolygon(island.vertices, island.vertices.length, islandPoints[0])) {
                        isLake = true; 

                        var lake = new Lake();
                        lake.edges = shoreLine;
                        lake.vertices = islandPoints;
                        island.lakes.push(lake);
                        return;
                    }
                });


                if (!isLake) {
                    //Mountain generation.
                    //Get list of all edge points.

                    //5 is the number of regions that will be added.
                    var voronoiSites = new Array<Point>();
                    islandPoints.forEach(pt => {
                        voronoiSites.push(pt);
                    });

                    var mountainPts = new Array<Point>();
                    for (var i = 0; i < 5; i++) {
                        var randomTile = this.landTiles[Math.floor(Math.random() * this.landTiles.length) - 1];
                        var pt = randomTile.center;
                        //Contains all of the points including the ones along the coast.
                        voronoiSites.push(pt);
                        //Contains only points for potential mountains.
                        mountainPts.push(pt);
                    }

                    //Gets the new sites.
                    //var bbox = { xl: 0, xr: SCREEN_WIDTH, yt: 0, yb: SCREEN_HEIGHT }; 
                    //var diagram = voronoi.compute(voronoiSites, bbox);
                    //var cells: Array<any> = diagram.cells;

                    //var mountains = new Array<Mountain>();
                    //cells.forEach(cell => {
                    //    var x = cell.site.x;
                    //    var y = cell.site.y;

                    //    mountainPts.forEach(pt => {
                    //        if (pt.x == x && pt.y == y) {
                    //            var newMountain = new Mountain(cell.site);
                    //            mountains.push(newMountain);
                    //            return;
                    //        }
                    //    });
                    //});

                    var mountains = new Array<Mountain>();
                    var mountain = new Mountain(this.initialLocation);
                    mountains.push(mountain);
                
                    var newIsland = new Island();
                    newIsland.edges = shoreLine;
                    newIsland.vertices = islandPoints;
                    newIsland.mountains = mountains;
                    islandShapes.push(newIsland);
                }

                //Forest generation.
            }

            this.drawIsland(islandShapes);
        }

        isInPolygon(polygon: Array<Point>, N: number, p: Point) : boolean
        {
            var counter = 0;
            var i;
            var xinters;
            var p1, p2;

            p1 = polygon[0];
            for (i = 1; i <= N; i++) {
                p2 = polygon[i % N];
                if (p.y > Math.min(p1.y, p2.y)) {
                    if (p.y <= Math.max(p1.y, p2.y)) {
                        if (p.x <= Math.max(p1.x, p2.x)) {
                            if (p1.y != p2.y) {
                                xinters = (p.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                                if (p1.x == p2.x || p.x <= xinters)
                                    counter++;
                            }
                        }
                    }
                }
                p1 = p2;
            }

            if (counter % 2 == 0)
                return (false);
            else
                return (true);
        }

        //This needs be refactored.
        drawIsland(islandShapes : Array<Island>) {
            var c = <HTMLCanvasElement>document.getElementById("myCanvas");
            var ctx = c.getContext("2d");
            ctx.fillStyle = '#FAEAB9';
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            ctx.fill();

            islandShapes.forEach(island =>
            {
                island.Draw(ctx);

                var pts = new Array<Point>();
                island.lakes.forEach(lake => {
                    for (var i = 0; i < lake.vertices.length; i++) {
                        pts.push(lake.vertices[i]);
                    }
                });

            });

            var ranZ = Math.random();
            var perlinGenerator = new Perlin();
            var trees = new Array<Tree>();

            this.landTiles.forEach(t => {
                if (t.tileType === TileType.Land) {
                    var xScale = t.center.x / SCREEN_WIDTH;
                    var yScale = t.center.y / SCREEN_HEIGHT;

                    var c = perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 4, 4)
                    if (c > .54) {
                        var tree = new Tree(t.center, 40, 30);
                        trees.push(tree);

                    }
                }
            });

            trees.forEach(t => {
                t.Draw(ctx);
            });

            ctx.restore();

        }

        subDivideLines(ctx, edge: Edge) {
            var pt1 = edge.corner1.point;
            var pt2 = edge.corner2.point;

            var r1 = 2 * Math.random() - 4;
            var r2 = 2 * Math.random() - 4;

            var n = 4;

            var midX = (pt1.x + pt2.x) / 2  + r1;
            var midY = (pt1.y + pt2.y) / 2 + r1;

            ctx.lineTo(midX, midY);
            ctx.lineTo(pt2.x, pt2.y);
        }

        generateNoisyLineHelper(depth, pt1: Point, pt2: Point, ptArray): Array<Point> {

            if (depth == 0) return ptArray;
            var r1 = 2 * Math.random() - 4;
            var r2 = 2 * Math.random() - 4;

            var n = 4;

            var midX = (pt1.x + pt2.x) / 2 + r1;
            var midY = (pt1.y + pt2.y) / 2 + r1;

            var midPt = { x:midX, y:midY }

            ptArray.push(midPt);

            this.generateNoisyLineHelper(depth - 1, pt1, midPt, ptArray);
            this.generateNoisyLineHelper(depth - 1, midPt, pt2, ptArray);

        }

        isLand(tile: Tile, ranZ): boolean {
            //var xPoint = tile.center.x;
            //var yPoint = tile.center.y;

            //var perlinGenerator = new Perlin();
            //var xScale = xPoint / SCREEN_WIDTH;
            //var yScale = yPoint / SCREEN_HEIGHT;

            //var c = perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 4, 4)

            //var xDist = Math.abs(xPoint - this.initialLocation.x);
            //var yDist = Math.abs(yPoint - this.initialLocation.y);
            //var length = Math.sqrt(xDist * xDist + yDist * yDist);

            //var xEdgeDist = Math.abs(SCREEN_WIDTH - this.initialLocation.x);
            //var yEdgeDist = Math.abs(SCREEN_HEIGHT - this.initialLocation.y);

            //var radius = 1000;
            //var b = .4;
            //if (length > radius) b = .6;
            //var edgeLength = Math.sqrt(xEdgeDist * xEdgeDist + yEdgeDist * yEdgeDist);
            //return (c - (length / SCREEN_WIDTH) * length / SCREEN_WIDTH - b) > 0;

            var xPoint = tile.center.x;
            var yPoint = tile.center.y;

            var perlinGenerator = new Perlin();
            var xScale = xPoint / SCREEN_WIDTH;
            var yScale = yPoint / SCREEN_HEIGHT;

            var c = perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 4, 4)

            var xDist = Math.abs(xPoint - this.initialLocation.x);
            var yDist = Math.abs(yPoint - this.initialLocation.y);
            var length = Math.sqrt(xDist * xDist + yDist * yDist);

            var radius = 1500;
            var b = .2;
            //if (length > radius) b = .2;
            if (length < 100) return true;

            return (c - (length / radius) * (length / radius)) - b > 0;
        }
    }

    //Used to generate the edges of the tiles 
    export module HexTile {


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