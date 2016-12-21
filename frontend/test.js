function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (isFloat(this[i]) && isFloat(array[i])) {
            return Math.abs(this[i] - array[i]) < Number.EPSILON;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function assert(...args) {
    var v = arguments[0];
    var cl = [];
    for (var i=1; i<arguments.length; i++) {
        cl[i-1] = arguments[i];
    }
    if (!v) {
        console.error(...cl);
    }
}

tests = {
    'horizontal centered line': function() {
        var ps = intersect(1, -2, 0, 2, 0);
        var tv = [[1, 0], [-1, 0]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'vertical centered line': function() {
        var ps = intersect(1, 0, -2, 0, 2);
        var tv = [[0, 1], [0, -1]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'inverse horizontal centered line': function() {
        var ps = intersect(1, 2, 0, -2, 0);
        var tv = [[-1, 0], [1, 0]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'inverse vertical centered line': function() {
        var ps = intersect(1, 0, 2, 0, -2);
        var tv = [[0, 1], [0, -1]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'positive tangent vertical line': function() {
        var ps = intersect(1, 1, 2, 1, -2);
        var tv = [[1, 0]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'positive tangent horizontal line': function() {
        var ps = intersect(1, -2, 1, 2, 1);
        var tv = [[0, 1]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'shifted horizontal line': function() {
        // Shift the line up such that it intersects the circle at 45deg
        var v45 = Math.cos(45 * (Math.PI/180));
        var ps = intersect(1, -2, v45, 2, v45);
        var tv = [[v45, v45], [-v45, v45]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'negative shifted horizontal line': function() {
        // Shift the line down such that it intersects the circle at 45deg
        var v45 = Math.cos(45 * (Math.PI/180));
        var ps = intersect(1, -2, -v45, 2, -v45);
        var tv = [[v45, -v45], [-v45, -v45]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'negative shifted horizontal line': function() {
        // Shift the line down such that it intersects the circle at 45deg
        var v45 = Math.cos(45 * (Math.PI/180));
        var ps = intersect(1, -2, -v45, 2, -v45);
        var tv = [[v45, -v45], [-v45, -v45]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'negative shifted horizontal line': function() {
        // Shift the line down such that it intersects the circle at 45deg
        var v45 = Math.cos(45 * (Math.PI/180));
        var ps = intersect(1, -2, -v45, 2, -v45);
        var tv = [[v45, -v45], [-v45, -v45]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'downward 45': function() {
        // -, + to +, -
        var v45 = Math.cos(45 * (Math.PI/180));
        var ps = intersect(1, -2, 2, 2, -2);
        var tv = [[-v45, v45], [v45, -v45]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
    'upward 45': function() {
        // -, - to +, +
        var v45 = Math.cos(45 * (Math.PI/180));
        var ps = intersect(1, -2, -2, 2, 2);
        var tv = [[v45, v45], [-v45, -v45]];
        assert(ps.equals(tv), ps, " DNE ", tv);
    },
}

for (var key in tests) {
   if (tests.hasOwnProperty(key)) {
       console.log("Running", key);
       tests[key]();
   }
}
