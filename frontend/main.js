var PULLEYDISTANCE = 500,
    PLOTHEIGHT = 400,
    PLOTAREATOP = 40,
    PULLEYINSET = 40,
    PULLEYRADIUS = 20,
    PLOTTERRADIUS = 40,
    BELTSTROKE = 2,
    STEPSPERREV = 200,
    PADDING = 20,
    PULLEYLINELENGTH = 10,
    PULLEYLINESTROKE = 2,
    COLOR = {
        BG: '#eee',
        PLOTAREA: '#ddd',
        PULLEY: '#999',
        PULLEYLINE: '#000',
        PLOTTER: 'yellow',
        BELT: '#000'
    };


// START MATH
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
}

function intersectCircle(R, d, r) {
    // http://mathworld.wolfram.com/Circle-CircleIntersection.html
    var x = (d*d - r*r + R*R)/(2*d);
    var a = (1/d)*Math.sqrt((-d + r - R) * (-d - r + R) * (-d + r + R) * (d + r + R));
    return [x, a/2];
}
// END MATH


// START DRAW
var svg = d3.select('body').append('svg')
    .attr('width', PULLEYDISTANCE + PULLEYINSET * 2 + PADDING * 2).attr('height', PLOTHEIGHT + PLOTAREATOP + PULLEYINSET * 2 + PADDING * 2);

var bg = svg.append('rect')
    .attr('x', PADDING).attr('y', PADDING)
    .attr('width', PULLEYDISTANCE + PULLEYINSET * 2).attr('height', PLOTHEIGHT + PLOTAREATOP + PULLEYINSET * 2)
    .attr('fill', COLOR.BG);


// BASIC, not counting swing-in angle
var plotArea = svg.append('rect')
    .attr('x', PADDING + PULLEYINSET)
    .attr('y', PADDING + PULLEYINSET + PLOTAREATOP)
    .attr('width', PULLEYDISTANCE)
    .attr('height', PLOTHEIGHT)
    .attr('fill', COLOR.PLOTAREA);


function drawPulley(cx) {
    var pulley = svg.append('g');

    pulley.append('circle')
        .attr('class', 'sprocket')
        .attr('cx', cx).attr('cy', PADDING + PULLEYINSET)
        .attr('r', PULLEYRADIUS)
        .attr('fill', COLOR.PULLEY);

    pulley.append('circle')
        .attr('class', 'debugLength')
        .attr('cx', cx).attr('cy', PADDING + PULLEYINSET)
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('stroke', 'red');

    pulley.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', PADDING + PULLEYINSET - PULLEYRADIUS - PULLEYLINELENGTH/2)
        .attr('y2', PADDING + PULLEYINSET - PULLEYRADIUS + PULLEYLINELENGTH/2)
        .attr('stroke-width', PULLEYLINESTROKE)
        .attr('stroke', COLOR.PULLEYLINE);

    return pulley;
}

var lPulley = drawPulley(PADDING + PULLEYINSET),
    rPulley = drawPulley(PADDING + PULLEYINSET + PULLEYDISTANCE);

var plotter = svg.append('g');

plotter.append('line')
    .attr('class', 'belt1')
    .attr('stroke-width', BELTSTROKE)
    .attr('stroke', COLOR.BELT);

plotter.append('line')
    .attr('class', 'belt2')
    .attr('stroke-width', BELTSTROKE)
    .attr('stroke', COLOR.BELT);

plotter.append('g')
    .attr('class', 'plotter-head')

    .append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', PLOTTERRADIUS)
    .attr('fill', COLOR.PLOTTER);

var hover = svg.append('rect')
    .attr('x', 0).attr('y', 0)
    .attr('width', svg.attr('width')).attr('height', svg.attr('height'))
    .attr('fill', 'none')
    .attr('pointer-events', 'visible');
// END DRAW

// START ATTACH
function pulleyControls(pulley, conf) {
    var circle = pulley.select('.sprocket'),
        dl = pulley.select('.debugLength'),
        cx = parseFloat(circle.attr('cx')),
        cy = parseFloat(circle.attr('cy'));

    var angle = 0;
    // Start in a right triangle
    var length = Math.SQRT2/2 * PULLEYDISTANCE;
    dl.attr('r', length);

    return {
        rotate: function (deg) {
            angle += deg;

            length += (deg * (Math.PI/180)) * PULLEYRADIUS * conf.dir;

            pulley.attr('transform', 'rotate(' + angle + ',' + cx + ',' + cy + ')');
            dl.attr('r', length);
        },
        distance: function (x, y) {
            return distance(cx, cy, x, y);
        },
        length: function() { return length; },
        x: function () { return cx; },
        y: function () { return cy; }
    }
}

function plotterControls(plotter, pulleyC1, pulleyC2) {
    var plotterHead = plotter.select('.plotter-head'),
        belt1 = plotter.select('.belt1'),
        belt2 = plotter.select('.belt2');

    belt1.attr('x1', pulleyC1.x()).attr('y1', pulleyC1.y());
    belt2.attr('x1', pulleyC2.x()).attr('y1', pulleyC2.y());

    function pulleyIntersection() {
        var i = intersectCircle(pulleyC1.length(), pulleyC2.x() - pulleyC1.x(), pulleyC2.length());
        return [i[0] + pulleyC1.x(), i[1] + pulleyC1.y()];
    }

    return {
        update: function() {
            var plotterPos = pulleyIntersection(),
                plotterX = plotterPos[0],
                plotterY = plotterPos[1];


            belt1.attr('x2', plotterX).attr('y2', plotterY);
            belt2.attr('x2', plotterX).attr('y2', plotterY);

            plotterHead.attr('transform', 'translate(' + plotterX + ',' + plotterY + ')');
        }
    }
}

var lPulleyControls = pulleyControls(lPulley, {dir:  1}),
    rPulleyControls = pulleyControls(rPulley, {dir: -1});

var mainPlotterControls = plotterControls(plotter, lPulleyControls, rPulleyControls);

var plotAreaX1 = parseFloat(plotArea.attr('x')),
    plotAreaX2 = parseFloat(plotArea.attr('width')) + plotAreaX1,
    plotAreaY1 = parseFloat(plotArea.attr('y')),
    plotAreaY2 = parseFloat(plotArea.attr('height')) + plotAreaY1;

var x = d3.scaleLinear().range([plotAreaX1, plotAreaX2]),
    y = d3.scaleLinear().range([plotAreaY1, plotAreaY2]);

hover.on("mousemove", function () {
    var mouseX = d3.mouse(this)[0],
        mouseY = d3.mouse(this)[1];
});
// END ATTACH

// START UI LOGIC
var Key = {
  _pressed: {},

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,

  isDown: function(keyCode) {
    return this._pressed[keyCode];
  },

  onKeydown: function(event) {
    this._pressed[event.keyCode] = true;
  },

  onKeyup: function(event) {
    delete this._pressed[event.keyCode];
  }
};

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
// END UI LOGIC

// START CONTROLLER LOGIC

mainPlotterControls.update();
function loop() {
    var speed = 20;

    if (Key.isDown(Key.UP)) {
        lPulleyControls.rotate(-speed);
        rPulleyControls.rotate(speed);
    }
    if (Key.isDown(Key.DOWN)) {
        lPulleyControls.rotate(speed);
        rPulleyControls.rotate(-speed);
    }
    if (Key.isDown(Key.LEFT)) {
        lPulleyControls.rotate(-speed);
        rPulleyControls.rotate(-speed);
    }
    if (Key.isDown(Key.RIGHT)) {
        lPulleyControls.rotate(speed);
        rPulleyControls.rotate(speed);
    }

    mainPlotterControls.update();
}

setInterval(loop, 100);

// END CONTROLLER LOGIC

// lPulleyControls.rotate(90);