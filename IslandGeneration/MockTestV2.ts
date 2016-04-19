module Test2 {
    class Edge {
        corner1: Corner;
        corner2: Corner; //polygon instead of pts - also corners

        tiles: Array<Tile>;

        constructor() {
            this.tiles = new Array<Tile>();
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
        x: number,
        y: number

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
            var queue = new collections.Queue<Point>();
            queue.enqueue(this.initialLocation);

            while (queue.size() !== 0) {
                var pt = queue.dequeue();

                var pts = generatePointFunction(pt);

                pts.forEach(p => {
                    var getPt = pointDictionary.getValue(p.x + "," + p.y);

                    if (typeof getPt !== 'undefined') {

                    }
                });
            }

            var sites = pointDictionary.values;

            var diagram;
            var cells : Array<any>;
            var edges: Array<any>;
            var verts: Array<any>;
            
            //need to keep track of neighboring cells.. otherwise this is fine.
            //tile could contain cell data.
            //Could create neighbors by going through each edge.  each one should have one lSite and one rSite.
            //Otherwise I could create that relationship above.


        }

        //None of this will be needed.
        GenerateMap(generateTilesFunction: (tile: Tile) => Array<Tile>) {
            var queue = new collections.Queue<Tile>();
            var tilesDictionary = new collections.Dictionary<string, Tile>();
            var cornerDictionary = new collections.Dictionary<string, Corner>();

            var root = new Tile(this.initialLocation);

            queue.enqueue(root);
            while (queue.size() !== 0) {

                var tile = queue.dequeue();
                this.tiles.push(tile);



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

}
 