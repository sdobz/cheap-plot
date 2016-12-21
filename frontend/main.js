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
    DEBUGLINESTROKE = 3,
    INTERSECTIONRADIUS = 5,
    COLOR = {
        BG: '#eee',
        PLOTAREA: '#ddd',
        PULLEY: '#999',
        PULLEYLINE: '#000',
        PLOTTER: 'yellow',
        BELT: '#000',
        DEBUGLINE: '#f00',
        INTERSECTION: '#f0f',
    };


// START MATH
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function intersectCircle(R, d, r) {
    // http://mathworld.wolfram.com/Circle-CircleIntersection.html
    var x = (d * d - r * r + R * R) / (2 * d);
    var a = (1 / d) * Math.sqrt((-d + r - R) * (-d - r + R) * (-d + r + R) * (d + r + R));
    return [x, a / 2];
}

function sgn(n) {
    return n < 0 ? -1 : 1;
}

function intersect(r, x1, y1, x2, y2) {
    // http://mathworld.wolfram.com/Circle-LineIntersection.html
    var dx = x2 - x1,
        dy = y2 - y1,
        dr = Math.sqrt(dx * dx + dy * dy),
        D = x1 * y2 - x2 * y1,
        dis = r * r * dr * dr - D * D;

    if (dis < 0) {
        // no intersections
        return [];
    } else if (dis == 0) {
        // simplified case, tangent
        return [
            [(D * dy) / (dr * dr),
                (-D * dx) / (dr * dr)
            ]
        ];
    } else {
        // two intersections
        return [
            [(D * dy + sgn(dy) * dx * Math.sqrt(dis)) / (dr * dr),
                (-D * dx + Math.abs(dy) * Math.sqrt(dis)) / (dr * dr)
            ],

            [(D * dy - sgn(dy) * dx * Math.sqrt(dis)) / (dr * dr),
                (-D * dx - Math.abs(dy) * Math.sqrt(dis)) / (dr * dr)
            ]
        ];
    }
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
        .attr('y1', PADDING + PULLEYINSET - PULLEYRADIUS - PULLEYLINELENGTH / 2)
        .attr('y2', PADDING + PULLEYINSET - PULLEYRADIUS + PULLEYLINELENGTH / 2)
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

var dragLine = plotter.append('line')
    .attr('class', 'dragline')
    .attr('stroke-width', DEBUGLINESTROKE)
    .attr('stroke', COLOR.DEBUGLINE)
    .attr('opacity', 0);

plotter.append('g')
    .attr('class', 'plotter-head')
    .append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', PLOTTERRADIUS)
    .attr('fill', COLOR.PLOTTER);

function points(c, r) {
    var pointCloud = svg.append('g');

    return {
        render: function (points) {
            pointCloud.selectAll('*').remove();

            for (var i = 0; i < points.length; i++) {
                pointCloud.append('circle')
                    .attr('class', 'points')
                    .attr('cx', points[i][0])
                    .attr('cy', points[i][1])
                    .attr('r', r)
                    .attr('fill', c);
            }
        }
    }
}

var intersectPoints = points(COLOR.INTERSECTION, INTERSECTIONRADIUS)

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
    var length = Math.SQRT2 / 2 * PULLEYDISTANCE;
    dl.attr('r', length);

    return {
        rotate: function (deg) {
            angle += deg;

            length += (deg * (Math.PI / 180)) * PULLEYRADIUS * conf.dir;

            pulley.attr('transform', 'rotate(' + angle + ',' + cx + ',' + cy + ')');
            dl.attr('r', length);
        },
        distance: function (x, y) {
            return distance(cx, cy, x, y);
        },
        intersect: function (start, end) {
            var relStart = [start[0] - cx, start[1] - cy];
            var relEnd = [end[0] - cx, end[1] - cy];

            var intersections = intersect(length, relStart[0], relStart[1], relEnd[0], relEnd[1]);
            for (var i = 0; i < intersections.length; i++) {
                var p = intersections[i];
                p[0] += cx;
                p[1] += cy;
            }
            return intersections;
        },
        length: function () {
            return length;
        },
        x: function () {
            return cx;
        },
        y: function () {
            return cy;
        }
    }
}

function plotterControls(plotter, pulleyC1, pulleyC2) {
    var plotterHead = plotter.select('.plotter-head'),
        belt1 = plotter.select('.belt1'),
        belt2 = plotter.select('.belt2');

    belt1.attr('x1', pulleyC1.x()).attr('y1', pulleyC1.y());
    belt2.attr('x1', pulleyC2.x()).attr('y1', pulleyC2.y());

    var plotterX, plotterY;

    function pulleyIntersection() {
        var i = intersectCircle(pulleyC1.length(), pulleyC2.x() - pulleyC1.x(), pulleyC2.length());
        return [i[0] + pulleyC1.x(), i[1] + pulleyC1.y()];
    }

    return {
        update: function () {
            var plotterPos = pulleyIntersection();
            plotterX = plotterPos[0];
            plotterY = plotterPos[1];

            belt1.attr('x2', plotterX).attr('y2', plotterY);
            belt2.attr('x2', plotterX).attr('y2', plotterY);

            plotterHead.attr('transform', 'translate(' + plotterX + ',' + plotterY + ')');
        },
        pos: function () {
            return [plotterX, plotterY];
        }
    }
}

function lineControl(line) {
    return {
        hide: function () {
            line.attr('opacity', 0)
        },
        show: function (start, end) {
            line.attr('opacity', 1)
                .attr('x1', start[0])
                .attr('y1', start[1])
                .attr('x2', end[0])
                .attr('y2', end[1]);
        }
    }
}

var lPulleyControls = pulleyControls(lPulley, {
        dir: 1
    }),
    rPulleyControls = pulleyControls(rPulley, {
        dir: -1
    });

var mainPlotterControls = plotterControls(plotter, lPulleyControls, rPulleyControls);

var dragLineControls = lineControl(dragLine);

var plotAreaX1 = parseFloat(plotArea.attr('x')),
    plotAreaX2 = parseFloat(plotArea.attr('width')) + plotAreaX1,
    plotAreaY1 = parseFloat(plotArea.attr('y')),
    plotAreaY2 = parseFloat(plotArea.attr('height')) + plotAreaY1;

var x = d3.scaleLinear().range([plotAreaX1, plotAreaX2]),
    y = d3.scaleLinear().range([plotAreaY1, plotAreaY2]);
// END ATTACH

// START UI LOGIC
var Key = {
    _pressed: {},

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },

    onKeydown: function (event) {
        this._pressed[event.keyCode] = true;
    },

    onKeyup: function (event) {
        delete this._pressed[event.keyCode];
    }
};

window.addEventListener('keyup', function (event) {
    Key.onKeyup(event);
}, false);
window.addEventListener('keydown', function (event) {
    Key.onKeydown(event);
}, false);

var startDrag;
var endDrag;
hover.on('mousedown', function (event) {
    startDrag = d3.mouse(this);
    endDrag = undefined;
    d3.event.stopPropagation();
});

hover.on('mousemove', function (event) {
    if (startDrag == undefined || endDrag != undefined)
        return;

    var curDrag = d3.mouse(this);
    intersectPoints.render(lPulleyControls.intersect(startDrag, curDrag).concat(rPulleyControls.intersect(startDrag, curDrag)));
    dragLineControls.show(startDrag, curDrag);

    d3.event.stopPropagation();
});

hover.on('mouseup', function (event) {
    endDrag = d3.mouse(this);

    intersectPoints.render(lPulleyControls.intersect(startDrag, endDrag).concat(rPulleyControls.intersect(startDrag, endDrag)));
    dragLineControls.show(startDrag, endDrag);

    d3.event.stopPropagation();
});
// END UI LOGIC

// START MOTION PLANNER
/*
Have position
Have direction

Intersect 4 circles, each stepper each direction
pick least positive
determine delay
sleep
step

 */
// END MOTION PLANNER

// START CONTROLLER LOGIC
mainPlotterControls.update();

function loop() {
    var speed = 10;

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

setInterval(loop, 50);
// END CONTROLLER LOGIC

// lPulleyControls.rotate(90);
