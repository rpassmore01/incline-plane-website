//Calculates the center of mass of any right angled triangle
function getCenterOfMass (height, width){
    return {x: (1/3)*width, y: (1/3)*height}
}

//Turns degrees into radians
function degreesToRadians(degrees){
    return degrees*Math.PI/180
}

function roundToDecimal(num, decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}
