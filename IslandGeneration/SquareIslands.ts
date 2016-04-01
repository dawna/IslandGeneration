
class SquareIslands {
    
    public tiles: ITile[][];
    private perlinGenerator: Perlin;

    private static tileWidth = 25;
    private static tileHeight = 25;

    public width: number;
    public height: number;

    public centerX: number;
    public centerY: number;

    constructor(w: number, h: number, centerX: number, centerY: number) {
        
        this.width = w;
        this.height = h;

        this.centerX = centerX;
        this.centerY = centerY;

        this.tiles = [[]];

        var ranZ = Math.random();
        this.perlinGenerator = new Perlin();

        for (var j = 0; j < this.height; j++) {
            this.tiles[j] = [];
            for (var i = 0; i < this.width; i++) {
                
                var xScale = i / this.width;
                var yScale = j / this.height;
                //var heightScale = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 2, 2);// - this.getDistance(i, j); //+ this.getDistance(i, j);
                //var heightScale = this.perlinGenerator.perlin(xScale, yScale, ranZ);

                var heightScale = 1;

                if (this.isLand(i, j, ranZ)) {
                    heightScale = 1;
                } else
                    heightScale = -1;

                var tileX = i * this.width;
                var tileY = j * this.height;
                
                this.tiles[j][i] = <ITile>{ x: tileX, y: tileY, z: heightScale, width: SquareIslands.tileWidth, height: SquareIslands.tileHeight };
            }
        }
    }

    private isLand(xPoint: number, yPoint: number, ranZ): boolean {
        this.perlinGenerator = new Perlin();
        var xScale = xPoint / this.width;
        var yScale = yPoint / this.height;

        //var gen = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ,100,2)
        var c = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 3, 8)

        var xDist = Math.abs(xPoint - this.centerX);
        var yDist = Math.abs(yPoint - this.centerY);
        var length = Math.sqrt(xDist * xDist + yDist * yDist);
        //if (length > 100) return false;
        return (c - length / this.width - .1) > 0;
    }

    drawIsland() {

        var c = <HTMLCanvasElement>document.getElementById("myCanvas");
        var ctx = c.getContext("2d");

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {

                if (this.tiles[j][i].z === 1) {
                    ctx.fillStyle = "#2DA82F";
                }
                if (this.tiles[j][i].z === -1) {
                    ctx.fillStyle = "#2D69A8";
                } 
                
                //drawHexagon(i * SquareIslands.tileWidth*2, j * SquareIslands.tileHeight*2, SquareIslands.tileWidth);
                //ctx.fillRect(i * SquareIslands.tileWidth, j * SquareIslands.tileHeight, SquareIslands.tileWidth, SquareIslands.tileHeight);
            }
        }
    }
}
//Where 86 = r * sin(60)
//50 = r * cos(60) + r
drawHexagon(200, 200, 100);
for (var i = 0; i < 6; i++) {
    //var newX = 100 * Math.cos(i * Math.PI / 3);
    //var newY = 100 * Math.sin(i * Math.PI / 3);
    //drawHexagon(200 + newX, 200 + newY, 100);
}
//drawHexagon(200, 200 + 86.602540378 * 2, 100);
//drawHexagon(200 + 50 + 100, 200 + 86.602540378, 100);
//drawHexagon(200 + 50 + 100, 200 - 86.602540378, 100);
//drawHexagon(200, 200 - 86.602540378 * 2, 100);
//drawHexagon(200 - 50 - 100, 200 + 86.602540378, 100);
//drawHexagon(200 - 50 - 100, 200 - 86.602540378, 100);
//Takes in the hexagon and
function drawHexagon(x: number, y: number, r: number) {

    var c = <HTMLCanvasElement>document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    
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
}


//For setting up the graph.
class GraphNode {

    public neighbors: Array<GraphNode>;
    public value: any;

    constructor() {
    }

    setValue(val: any): void {
        this.value = val;
    }

    isNeighbor(node: GraphNode) : boolean {
        return false;
    }
}

interface ITile {
    x: number,
    y: number,
    z: number,
    width: number,
    height: number
}

var islands = new SquareIslands(100, 100, 50, 50);
islands.drawIsland();

//var islands = new SquareIslands(40, 40, 10, 10);
//islands.drawIsland();

//var islands = new SquareIslands(40, 40, 10, 20);
//islands.drawIsland();