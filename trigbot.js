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
        
        return { a:a, b:b, c:c };
    }

    function ProbX(x) {
        return ProblemBox.x1 + (ProblemBox.width * x);
    }

    function ProbY(y) {
        return ProblemBox.y2 - (ProblemBox.width * y);
    }

    function DrawTriangle(context, triangle) {
        context.beginPath();
        context.strokeStyle = 'rgb(0,0,0)';
        context.lineWidth = 1;
        context.moveTo(ProbX(triangle.a.x), ProbY(triangle.a.y));
        context.lineTo(ProbX(triangle.b.x), ProbY(triangle.b.y));
        context.lineTo(ProbX(triangle.c.x), ProbY(triangle.c.y));
        context.lineTo(ProbX(triangle.a.x), ProbY(triangle.a.y));
        context.stroke();
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
        ResizeGraph();
        window.addEventListener('resize', OnResize);
        Triangle = MakeRandomTriangle();
        UpdateDisplay();
    }

    Init();
}