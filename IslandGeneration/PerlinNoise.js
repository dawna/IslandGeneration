var Perlin = (function () {
    function Perlin(repeat) {
        if (repeat === void 0) { repeat = -1; }
        this.repeat = repeat;
        Perlin.p = new Array(512);
        for (var x = 0; x < 512; x++) {
            Perlin.p[x] = Perlin.permutation[x % 256];
        }
    }
    Perlin.prototype.OctavePerlin = function (x, y, z, octaves, persistence) {
        var total = 0;
        var frequency = 1;
        var amplitude = 1;
        var maxValue = 0;
        // Used for normalizing result to 0.0 - 1.0
        for (var i = 0; i < octaves; i++) {
            total += this.perlin(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return total / maxValue;
    };
    Perlin.prototype.perlin = function (x, y, z) {
        if (this.repeat > 0) {
            x = x % this.repeat;
            y = y % this.repeat;
            z = z % this.repeat;
        }
        var xi = Math.floor(x & 255); // Calculate the "unit cube" that the point asked will be located in
        var yi = Math.floor(y & 255); // The left bound is ( |_x_|,|_y_|,|_z_| ) and the right bound is that
        var zi = Math.floor(z & 255); // plus 1.  Next we calculate the location (from 0.0 to 1.0) in that cube.
        var xf = x - Math.floor(x); // We also fade the location to smooth the result.
        var yf = y - Math.floor(y);
        var zf = z - Math.floor(z);
        var u = Perlin.fade(xf);
        var v = Perlin.fade(yf);
        var w = Perlin.fade(zf);
        var aaa, aba, aab, abb, baa, bba, bab, bbb;
        aaa = Perlin.p[Perlin.p[Perlin.p[xi] + yi] + zi];
        aba = Perlin.p[Perlin.p[Perlin.p[xi] + this.inc(yi)] + zi];
        aab = Perlin.p[Perlin.p[Perlin.p[xi] + yi] + this.inc(zi)];
        abb = Perlin.p[Perlin.p[Perlin.p[xi] + this.inc(yi)] + this.inc(zi)];
        baa = Perlin.p[Perlin.p[Perlin.p[this.inc(xi)] + yi] + zi];
        bba = Perlin.p[Perlin.p[Perlin.p[this.inc(xi)] + this.inc(yi)] + zi];
        bab = Perlin.p[Perlin.p[Perlin.p[this.inc(xi)] + yi] + this.inc(zi)];
        bbb = Perlin.p[Perlin.p[Perlin.p[this.inc(xi)] + this.inc(yi)] + this.inc(zi)];
        var x1, x2, y1, y2;
        x1 = Perlin.lerp(Perlin.grad(aaa, xf, yf, zf), Perlin.grad(baa, xf - 1, yf, zf), u); // surrounding points in its unit cube.
        x2 = Perlin.lerp(Perlin.grad(aba, xf, yf - 1, zf), Perlin.grad(bba, xf - 1, yf - 1, zf), u);
        y1 = Perlin.lerp(x1, x2, v);
        x1 = Perlin.lerp(Perlin.grad(aab, xf, yf, zf - 1), Perlin.grad(bab, xf - 1, yf, zf - 1), u);
        x2 = Perlin.lerp(Perlin.grad(abb, xf, yf - 1, zf - 1), Perlin.grad(bbb, xf - 1, yf - 1, zf - 1), u);
        y2 = Perlin.lerp(x1, x2, v);
        return (Perlin.lerp(y1, y2, w) + 1) / 2; // For convenience we bound it to 0 - 1 (theoretical min/max before is -1 - 1)
    };
    Perlin.prototype.inc = function (num) {
        num++;
        if (this.repeat > 0)
            num %= this.repeat;
        return num;
    };
    Perlin.grad = function (hash, x, y, z) {
        switch (hash & 0xF) {
            case 0x0: return x + y;
            case 0x1: return -x + y;
            case 0x2: return x - y;
            case 0x3: return -x - y;
            case 0x4: return x + z;
            case 0x5: return -x + z;
            case 0x6: return x - z;
            case 0x7: return -x - z;
            case 0x8: return y + z;
            case 0x9: return -y + z;
            case 0xA: return y - z;
            case 0xB: return -y - z;
            case 0xC: return y + x;
            case 0xD: return -y + z;
            case 0xE: return y - x;
            case 0xF: return -y - z;
            default: return 0; // never happens
        }
    };
    Perlin.fade = function (t) {
        // Fade function as defined by Ken Perlin.  This eases coordinate values
        // so that they will "ease" towards integral values.  This ends up smoothing
        // the final output.
        return t * t * t * (t * (t * 6 - 15) + 10); // 6t^5 - 15t^4 + 10t^3
    };
    Perlin.lerp = function (a, b, x) {
        return a + x * (b - a);
    };
    Perlin.permutation = [
        151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];
    return Perlin;
})();
//var perlin = new Perlin();
//alert(perlin.perlin(1, .1, .1));
//alert(perlin.perlin(1, .1, .2));
//alert(perlin.perlin(1, .1, .3));
//alert(perlin.perlin(1, .1, .4));
//alert(perlin.perlin(1, .1, .5));
//alert(perlin.perlin(1, .1, .6));
//alert(perlin.perlin(1, .1, .7));
//alert(perlin.OctavePerlin(1, 1, .1, 3, 100));
//alert(perlin.OctavePerlin(1, 1, .2, 3, 100));
//alert(perlin.OctavePerlin(1, 1, .3, 3, 100));
//alert(perlin.OctavePerlin(1, 1, .4, 3, 100));
//alert(perlin.OctavePerlin(.5, .33, .5, 4, 2));
//alert(perlin.OctavePerlin(.6, .2, .345, 4, 2));
//alert(perlin.OctavePerlin(.7, .276, .74, 4, 2));
//# sourceMappingURL=PerlinNoise.js.map