'use strict';

/*
    trigbot.js  -  Don Cross  -  15 November 2017.

    A quiz to help learn to recognize which trig function to use
    for a randomly-generated triangle.
*/

window.onload = function() {
    var canvas = document.getElementById('GameCanvas');
    var DiagramBox;     // a box holding the diagram of the triangle
    var ChoiceBox;      // a box holding the question and multiple choice answers
    var Triangle;       // a randomly generated triangle problem

    function GetRandomInt(min, max) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
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
        var angleNameTable = [
            { a:'P', b:'Q' },
            { a:'A', b:'B' },
            { a:'\u03b1' /*alpha*/, b:'\u03b2' /*beta*/ }
        ];

        var sideNameTable = [
            { a:'r', b:'s', c:'t' },
            { a:'t', b:'u', c:'v' },
            { a:'w', b:'h', c:'r' }
        ];

        var angleName = angleNameTable[GetRandomInt(0, angleNameTable.length)];
        var sideName = sideNameTable[GetRandomInt(0, sideNameTable.length)];

        // Generate a random problem by picking a random trig function
        // (sin, cos, tan) and a random angle for it to operate on.
        // Then the ratio of sides is determined by the function and angle.
        var trigFunctions = ['sin', 'cos', 'tan'];
        var funcIndex = GetRandomInt(0, trigFunctions.length);
        var funcName = trigFunctions[funcIndex];
        var angleNameList = [angleName.a, angleName.b];
        var sideNameList = [sideName.a, sideName.b, sideName.c];
        var knownAngleIndex = GetRandomInt(0, angleNameList.length);
        var knownAngleName = angleNameList[knownAngleIndex];
        var sideIndexList;

        // Determine the correct answer.
        switch (funcName) {
        case 'sin':
            sideIndexList = knownAngleIndex ? [1, 2] : [0, 2];
            break;

        case 'cos':
            sideIndexList = knownAngleIndex ? [0, 2] : [1, 2];
            break;

        case 'tan':
            sideIndexList = knownAngleIndex ? [1, 0] : [0, 1];
            break;

        default:
            throw 'Unknown trig function ' + funcName;
        }

        var wantedIndex = GetRandomInt(0, 2);
        var wantedSideName = sideNameList[sideIndexList[wantedIndex]];
        var knownSideName = sideNameList[sideIndexList[1-wantedIndex]];
        var correctAnswer = funcName + ' ' + knownAngleName + ' = ' + sideNameList[sideIndexList[0]] + '/' + sideNameList[sideIndexList[1]];

        var problem = {
            wantedSideName: wantedSideName,
            knownSideName: knownSideName,
            knownAngleName: knownAngleName,
            correctAnswer: correctAnswer
        };
        //console.log(problem);

        return { 
            a: a, 
            b: b, 
            c: c, 
            angleName: angleName,
            sideName: sideName,
            problem: problem
        };
    }

    function DiagramX(x) {
        return DiagramBox.x1 + (DiagramBox.width * x);
    }

    function DiagramY(y) {
        return DiagramBox.y2 - (DiagramBox.width * y);
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

        var textDist = 24;
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
        var t = BisectVector(a, b, c, 60);

        context.fillStyle = 'rgb(64,0,255)';
        context.font = 'italic 24px serif';
        context.textBaseline = 'middle';
        context.fillText(name, t.x - 6, t.y);
        //DrawTestMarker(context, t);
    }

    function DrawTriangle(context, triangle) {
        // Calculate the display coordinates of the triangle's vertices.
        var a = { x: DiagramX(triangle.a.x), y: DiagramY(triangle.a.y) };
        var b = { x: DiagramX(triangle.b.x), y: DiagramY(triangle.b.y) };
        var c = { x: DiagramX(triangle.c.x), y: DiagramY(triangle.c.y) };

        // Draw the "right angle" indicator.
        // This is a pair of line segments framing the C point.
        var raLen = DiagramBox.width * 0.05;
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

    function DrawChoices(context, triangle) {
        // Draw a rectangle for now just so I can see where the choice box is.
        context.strokeStyle = 'rgb(128,128,128)';
        context.lineWidth = 1;
        context.strokeRect(ChoiceBox.x1, ChoiceBox.y1, ChoiceBox.width, ChoiceBox.height);

        // Allocate regions for the problem statement and the answer options.
    }

    function UpdateDisplay() {
        var context = canvas.getContext('2d');

        // Erase previous contents
        context.clearRect(0, 0, canvas.width, canvas.height);

        DrawTriangle(context, Triangle);
        DrawChoices(context, Triangle);
    }

    function ResizeGraph() {
        // Calculate "ideal" graph dimensions as a function of the window dimensions.
        var gwidth  = Math.max(window.innerWidth,  200);
        var gheight = Math.max(window.innerHeight, 200);
        var divide, diagBoxSize, dx1, dy1;
        var choiceBoxWidth, choiceBoxHeight, cx1, cy1;
        var choiceBorder = 20;

        // Resize the graph canvas if needed.
        if (canvas.width !== gwidth || canvas.height !== gheight) {
            canvas.width = gwidth;
            canvas.height = gheight;
        }

        // Calculate layout.
        // If the canvas is wider than it is high, we split it into
        // a diagram box on the left and a choice box on the right.
        // Otherwise we split into a diagram box on the top and
        // a choice box on the bottom.
        if (canvas.width > canvas.height) {
            // Split left/right: diagram on left, choices on right.
            divide = Math.floor(canvas.width / 2);

            // calculate diagram box on the left
            diagBoxSize = 0.9 * Math.min(divide, canvas.height);
            dx1 = Math.round((divide - diagBoxSize) / 2);
            dy1 = Math.round((canvas.height - diagBoxSize) / 2);

            // calculate choice box on the right
            choiceBoxWidth = (canvas.width - divide) - 2*choiceBorder;
            choiceBoxHeight = canvas.height - 2*choiceBorder;
            cx1 = divide + choiceBorder;
            cy1 = choiceBorder;
        } else {
            // Split top/bottom: diagram on top, choices on bottom.
            divide = Math.floor(canvas.height / 2);

            // calculate diagram box on the top
            diagBoxSize = 0.9 * Math.min(canvas.width, divide);
            dx1 = Math.round((canvas.width - diagBoxSize) / 2);
            dy1 = Math.round((divide - diagBoxSize) / 2);

            // calculate choice box on the bottom
            choiceBoxWidth = canvas.width - 2*choiceBorder;
            choiceBoxHeight = (canvas.height - divide) - 2*choiceBorder;
            cx1 = choiceBorder;
            cy1 = divide + choiceBorder;
        }

        DiagramBox = {
            width: diagBoxSize,
            x1: dx1,
            x2: dx1 + diagBoxSize,
            y1: dy1,
            y2: dy1 + diagBoxSize
        };

        ChoiceBox = {
            width: choiceBoxWidth,
            height: choiceBoxHeight,
            x1: cx1,
            x2: cx1 + choiceBoxWidth,
            y1: cy1,
            y2: cy1 + choiceBoxHeight
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