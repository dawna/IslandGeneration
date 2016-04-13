module Test {

    class Edge {
        p1: Point;
        p2: Point;
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
    }


    interface Point {
        x: number,
        y: number
    }


    class World {
        tiles: Array<Tile>;
        landTiles: Array<Tile>;
        shoreTiles: Array<Tile>;

        initialLocation: Point = { x: 500, y: 500 };

        constructor() {
        }

        GenerateMap(generationFunction: (tile: Tile) => Array<Tile>): Array<Tile> {
            var tiles = new Array<Tile>();

            return tiles;
        }

        InBounds() {
        }

        DrawTiles() {
        }

    }


    //Used to generate the edges of the tiles 
    module HexTile {
        function generationFunction(tile: Tile): Array<Tile> {
            var neighbors = new Array<Tile>();

            if (typeof tile.edges === 'undefined') {
                tile.edges = generateHexEdges(tile.center);
            }

            neighbors.forEach(neighbor => {
                var edges = generateHexEdges(neighbor.center);
                neighbor.edges = edges;

                //get line between tile and neighbor center.
                var intersectedEdge;
                tile.edges.forEach(edge => {
                    var intersectionLine: number = 0;
                    

                });

                for (var i = 0; i < neighbor.edges.length; i++) {
                    if (neighbor.edges[0]) {
                        neighbor.edges[0] = intersectedEdge;
                    }
                }
            });

            return neighbors;
        }

        function intersects() {
        }

        function generateHexEdges(location: Point): Array<Edge> {
            var edges = new Array<Edge>();

            return edges;
        }
    }

}