'use strict';

/*
    trigbot.js  -  Don Cross  -  15 November 2017.

    A quiz to help learn to recognize which trig function to use
    for a randomly-generated triangle.
*/

window.onload = function() {
    var canvas = document.getElementById('GameCanvas');

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

    function GraphX(x) {
        return x * canvas.width;
    }

    function GraphY(y) {
        return (1-y) * canvas.height;
    }

    function DrawTriangle(context, triangle) {
        context.beginPath();
        context.strokeStyle = 'rgb(0,0,0)';
        context.lineWidth = 1;
        context.moveTo(GraphX(triangle.a.x), GraphY(triangle.a.y));
        context.lineTo(GraphX(triangle.b.x), GraphY(triangle.b.y));
        context.lineTo(GraphX(triangle.c.x), GraphY(triangle.c.y));
        context.lineTo(GraphX(triangle.a.x), GraphY(triangle.a.y));
        context.stroke();
    }

    function UpdateDisplay(triangle) {
        var context = canvas.getContext('2d');
        DrawTriangle(context, triangle);
    }

    function Init() {
        var triangle = MakeRandomTriangle();
        UpdateDisplay(triangle);
    }

    Init();
}