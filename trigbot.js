'use strict';

/*
    trigbot.js  -  Don Cross  -  15 November 2017.

    A quiz to help learn to recognize which trig function to use
    for a randomly-generated triangle.
*/

window.onload = function() {
    var canvas = document.getElementById('GameCanvas');
    var PixelsBelowGraph = 0;
    var ProblemBox;
    var Triangle;

    function getRandomIntInclusive(min, max) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
    }

    function Rotate(point, angle) {
        // Given a point of the form {x:real, y:real} and an angle,
        // return another point with those coordinates rotated by the angle.
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        return { x:(point.x*cos - point.y*sin), y:(point.y*cos + point.x*sin) };
    }

    function MakeRandomTriangle() {
        // This function creates a normalized but random right triangle.
        // That means a triangle that includes a right angle but
        // whose legs have random length, and with a random rotation.
        // Normalized means the triangle exactly fits a 1x1 box with
        // (0,0) as the lower left corner and (1,1) as the upper right 
        // corner of the box.

        // Create random legs (a, b) that are in the range 0.2 to 1.0.
        // That way they are never more than a factor of 5 apart.
        var aLen = 0.2 + (0.8 * Math.random());
        var bLen = 0.2 + (0.8 * Math.random());
        var cLen = Math.sqrt(a*a + b*b);

        // Calculate unrotated coordinates for the triangle's vertices.
        var a = { x:aLen, y:0 };
        var b = { x:0, y:bLen };
        var c = { x:0, y:0 };

        // Rotate the triangle by a random angle 0..2pi.
        var angle = 2.0 * Math.PI * Math.random();
        a = Rotate(a, angle);
        b = Rotate(b, angle);
        c = Rotate(c, angle);

        // Translate the triangle so that its minimum x and y coordinates are both 0.

        var xmin = Math.min(a.x, b.x, c.x);
        a.x -= xmin;
        b.x -= xmin;
        c.x -= xmin;        

        var ymin = Math.min(a.y, b.y, c.y);
        a.y -= ymin;
        b.y -= ymin;
        c.y -= ymin;

        // Dilate the triangle such that the maximum x or y coordinates is 1

        var coordmax = Math.max(a.x, b.x, c.x, a.y, b.y, c.y);
        a.x /= coordmax;
        a.y /= coordmax;
        b.x /= coordmax;
        b.y /= coordmax;
        c.x /= coordmax;
        c.y /= coordmax;

        // The points (a, b, c) are still always in counterclockwise order.
        // Half of the time, swap a pair of points so they are in clockwise order.
        if (Math.random() < 0.5) {
            var t = a;
            a = b;
            b = t;
        }

        // Pick random variable names for angles and sides.
        var angleName;
        var sideName;
        switch (getRandomIntInclusive(0, 2)) {
            case 0:
                angleName = { a:'P', b:'Q' };
                sideName = { a:'r', b:'s', c:'t' };
                break;

            case 1:
                angleName = { a:'A', b:'B' };
                sideName = { a:'t', b:'u', c:'v' };
                break;

            default:
                angleName = { a:'\u03b1', b:'\u03b2' };
                sideName = { a:'w', b:'h', c:'r' };
                break;
        }
        
        return { a:a, b:b, c:c, angleName:angleName, sideName:sideName };
    }

    function ProbX(x) {
        return ProblemBox.x1 + (ProblemBox.width * x);
    }

    function ProbY(y) {
        return ProblemBox.y2 - (ProblemBox.width * y);
    }

    function Distance(a, b) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    function PointInDir(a, b, len) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var denom = Math.sqrt(dx*dx + dy*dy);
        dx /= denom;
        dy /= denom;
        return { x: a.x + len*dx, y: a.y + len*dy };
    }

    function UnitVector(a, b) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var denom = Math.sqrt(dx*dx + dy*dy);
        return { x: dx/denom, y: dy/denom };
    }

    function Midpoint(a, b) {
        return { x: (a.x + b.x)/2, y: (a.y + b.y)/2 };
    }

    function Perpendicular(a, b) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var denom = Math.sqrt(dx*dx + dy*dy);
        return { x: -dy/denom, y: dx/denom };     // perpendicular unit vector
    }

    function DrawSideVarName(context, a, b, c, name) {
        // Find midpoint between b and c.
        var m = Midpoint(b, c);

        // Find perpendicular unit vector between b and c.
        var perp = Perpendicular(b, c);

        // Offset the text in the perpendicular direction from the midpoint.
        // Choose the direction away from a.
        // Find vector from a to m.
        var am = { x: m.x - a.x, y: m.y - a.y };

        // Take dot product of perp with that vector.
        var dot = am.x*perp.x + am.y*perp.y;

        // If positive, then perp is pointing in correct direction 
        // (away from center of triangle).
        // Otherwise, we need to toggle the direction of perp.
        if (dot < 0) {
            perp.x *= -1;
            perp.y *= -1;
        }

        var textDist = 24;//Math.max(0.03 * ProblemBox.width, 12);
        var t = { x: m.x + textDist*perp.x, y: m.y + textDist*perp.y };

        // Draw the text.
        context.fillStyle = 'rgb(0,0,255)';
        context.font = 'italic 24px serif';
        context.textBaseline = 'middle';
        context.fillText(name, t.x - 6, t.y);

        //DrawTestMarker(context, t);
    }

    function BisectVector(a, b, c, distance) {
        // Find a vector whose angle is halfway between the rays ab and ac.
        var bAngle = Math.atan2(b.y - a.y, b.x - a.x);
        var cAngle = Math.atan2(c.y - a.y, c.x - a.x);
        var midAngle = (bAngle + cAngle)/2;
        var ux = Math.cos(midAngle);
        var uy = Math.sin(midAngle);
        // Correct (ux, uy) to point in correct direction as needed.
        // Dot product with midpoint vector should be positive.
        // If not, toggle unit vector.
        var m = Midpoint(b, c);
        var dx = m.x - a.x;
        var dy = m.y - a.y;
        var dot = dx*ux + dy*uy;
        if (dot < 0) {
            ux *= -1;
            uy *= -1;
        }
        return { x: a.x + distance*ux, y: a.y + distance*uy };
    }

    function DrawTestMarker(context, point) {
        var delta = 5;
        context.beginPath();
        context.strokeStyle = 'rgb(0,0,0)'
        context.lineWidth = 1;
        context.moveTo(point.x - delta, point.y);
        context.lineTo(point.x + delta, point.y);
        context.moveTo(point.x, point.y - delta);
        context.lineTo(point.x, point.y + delta);
        context.stroke();
    }

    function DrawAngleVarName(context, a, b, c, name) {
        // Draw the variable name for an angle.
        // It is inside the vertex 'a', using 'b' and 'c' as direction hints.
        var t = BisectVector(a, b, c, 48);

        context.fillStyle = 'rgb(64,0,255)';
        context.font = 'italic 24px serif';
        context.textBaseline = 'middle';
        context.fillText(name, t.x - 6, t.y);
        //DrawTestMarker(context, t);
    }

    function DrawTriangle(context, triangle) {
        // Calculate the display coordinates of the triangle's vertices.
        var a = { x: ProbX(triangle.a.x), y: ProbY(triangle.a.y) };
        var b = { x: ProbX(triangle.b.x), y: ProbY(triangle.b.y) };
        var c = { x: ProbX(triangle.c.x), y: ProbY(triangle.c.y) };

        // Draw the "right angle" indicator.
        // This is a pair of line segments framing the C point.
        var raLen = ProblemBox.width * 0.05;
        var Q = PointInDir(c, a, raLen);
        var P = PointInDir(c, b, raLen);
        var R = { x:Q.x + (P.x - c.x), y:Q.y + (P.y - c.y) };
        
        context.beginPath();
        context.strokeStyle = 'rgb(0,128,0)';
        context.lineWidth = 1;
        context.moveTo(Q.x, Q.y);
        context.lineTo(R.x, R.y);
        context.lineTo(P.x, P.y);
        context.stroke();
        
        // Draw the boundary of the triangle.
        context.beginPath();
        context.strokeStyle = 'rgb(0,0,0)';
        context.lineWidth = 1;
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.lineTo(c.x, c.y);
        context.lineTo(a.x, a.y);
        context.stroke();

        // Write the letters a, b, c opposite each like-named vertex.
        // These are side length variables.
        // Tricky: need to write the variable names outside the triangle.
        DrawSideVarName(context, a, b, c, triangle.sideName.a);
        DrawSideVarName(context, b, c, a, triangle.sideName.b);
        DrawSideVarName(context, c, a, b, triangle.sideName.c);

        // Write non-right angle names inside each vertex.
        DrawAngleVarName(context, a, b, c, triangle.angleName.a);
        DrawAngleVarName(context, b, c, a, triangle.angleName.b);
    }

    function UpdateDisplay() {
        var context = canvas.getContext('2d');

        // Erase previous contents
        context.clearRect(0, 0, canvas.width, canvas.height);

        DrawTriangle(context, Triangle);
    }

    function ResizeGraph() {
        // Calculate "ideal" graph dimensions as a function of the window dimensions.
        var gwidth = window.innerWidth;
        var gheight = window.innerHeight - PixelsBelowGraph;

        // If window height is too small, stop displaying text below graph.
        var gMinAllowedHeight = 200;
        if (gheight < gMinAllowedHeight) {
            // Try omitting extra stuff below the graph.
            gheight = window.innerHeight;
            if (gheight < gMinAllowedHeight) {
                // Still too small, so we just won't show the whole graph.
                gheight = gMinAllowedHeight;
            }
        }

        // Resize the graph canvas if needed.
        if (canvas.width !== gwidth || canvas.height !== gheight) {
            canvas.width = gwidth;
            canvas.height = gheight;
        }

        // (Re)calculate the problem box within the current canvas size.
        // The problem box is a square that is centered inside the canvas.
        // Pick the minimum dimension (width or height) as the size of the box.
        var boxSize = 0.9 * Math.min(canvas.width, canvas.height);
        var x1 = Math.round((canvas.width - boxSize) / 2);
        var x2 = x1 + boxSize;
        var y1 = Math.round((canvas.height - boxSize) / 2);
        var y2 = y1 + boxSize;

        ProblemBox = {
            width: boxSize,
            x1: x1,
            x2: x2,
            y1: y1,
            y2: y2
        };
    }

    function OnResize() {
        ResizeGraph();
        UpdateDisplay();
    }

    function Init() {
        Triangle = MakeRandomTriangle();
        OnResize();
        window.addEventListener('resize', OnResize);
    }

    Init();
}