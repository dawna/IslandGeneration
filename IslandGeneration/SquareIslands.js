var SquareIslands = (function () {
    function SquareIslands(w, h, centerX, centerY) {
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
                }
                else
                    heightScale = -1;
                var tileX = i * this.width;
                var tileY = j * this.height;
                this.tiles[j][i] = { x: tileX, y: tileY, z: heightScale, width: SquareIslands.tileWidth, height: SquareIslands.tileHeight };
            }
        }
    }
    SquareIslands.prototype.isLand = function (xPoint, yPoint, ranZ) {
        this.perlinGenerator = new Perlin();
        var xScale = xPoint / this.width;
        var yScale = yPoint / this.height;
        //var gen = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ,100,2)
        var c = this.perlinGenerator.OctavePerlin(xScale, yScale, ranZ, 3, 8);
        var xDist = Math.abs(xPoint - this.centerX);
        var yDist = Math.abs(yPoint - this.centerY);
        var length = Math.sqrt(xDist * xDist + yDist * yDist);
        //if (length > 100) return false;
        return (c - length / this.width - .1) > 0;
    };
    SquareIslands.prototype.drawIsland = function () {
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                if (this.tiles[j][i].z === 1) {
                    ctx.fillStyle = "#2DA82F";
                }
                if (this.tiles[j][i].z === -1) {
                    ctx.fillStyle = "#2D69A8";
                }
            }
        }
    };
    SquareIslands.tileWidth = 25;
    SquareIslands.tileHeight = 25;
    return SquareIslands;
})();
//Where 86 = r * sin(60)
//50 = r * cos(60) + r
drawHexagon(200, 200, 100);
for (var i = 0; i < 6; i++) {
}
//drawHexagon(200, 200 + 86.602540378 * 2, 100);
//drawHexagon(200 + 50 + 100, 200 + 86.602540378, 100);
//drawHexagon(200 + 50 + 100, 200 - 86.602540378, 100);
//drawHexagon(200, 200 - 86.602540378 * 2, 100);
//drawHexagon(200 - 50 - 100, 200 + 86.602540378, 100);
//drawHexagon(200 - 50 - 100, 200 - 86.602540378, 100);
//Takes in the hexagon and
function drawHexagon(x, y, r) {
    var c = document.getElementById("myCanvas");
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
    ctx.stroke();
}
//For setting up the graph.
var GraphNode = (function () {
    function GraphNode() {
    }
    GraphNode.prototype.setValue = function (val) {
        this.value = val;
    };
    GraphNode.prototype.isNeighbor = function (node) {
        return false;
    };
    return GraphNode;
})();
var islands = new SquareIslands(100, 100, 50, 50);
islands.drawIsland();
//var islands = new SquareIslands(40, 40, 10, 10);
//islands.drawIsland();
//var islands = new SquareIslands(40, 40, 10, 20);
//islands.drawIsland(); 
//# sourceMappingURL=SquareIslands.js.map