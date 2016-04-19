/// <reference path="Scripts/collections.d.ts" />
/// <reference path="Scripts/rhill-voronoi-core.d.ts" />
declare var Voronoi: any;

function render() {
    var c = <HTMLCanvasElement>document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    //var ctx = this.canvas.getContext('2d');
    // background
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(0, 0, 800, 800);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.stroke();
    // voronoi
    if (!this.diagram) { return; }
    // edges
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    var edges = this.diagram.edges,
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
class Point {
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function generateHexagon(size: number, seed: number): Function {
    return function (numPoints: number): Array<Point> {
        var points = new Array<Point>();
        var N: number = Math.sqrt(numPoints);
        for (var x: number = 0; x < N; x++) {
            for (var y: number = 0; y < N; y++) {
                points.push(new Point((0.5 + x) / N * size, (0.25 + 0.5 * x % 2 + y) / N * size));
            }
        }
        return points;
    }
}

var pts = generateHexagon(1000, 0);
var voronoi = new Voronoi();
var bbox = { xl: -100, xr: 800, yt: -100, yb: 600 }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
var sites = [{ x: 200, y: 200 }, { x: 50, y: 250 }, { x: 1000, y: 100 } /* , ... */];

var diagram = voronoi.compute(pts(1000), bbox);
render();