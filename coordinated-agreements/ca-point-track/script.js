
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const drawDot = (x, y, color = 'black') => {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
};

const drawLine = (x1, y1, x2, y2, color = 'black') => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
};

const drawGrid = (offsetX = 0, offsetY = 0, color = 'black') => {
    const gridSize = 30;
    for (let x = -canvas.width/2; x <= canvas.width/2; x += gridSize) {
        for (let y = -canvas.height/2; y <= canvas.height/2; y += gridSize) {
            drawDot(x + offsetX, y + offsetY, color);
        }
    }
};

const clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

drawGrid(canvas.width / 2, canvas.height / 2);

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    clearCanvas();
    drawGrid(canvas.width / 2, canvas.height / 2, 'black');
    drawGrid(x, y, 'black');
    
    const gridSize = 30;
    for (let dotX = -canvas.width/2; dotX <= canvas.width/2; dotX += gridSize) {
        for (let dotY = -canvas.height/2; dotY <= canvas.height/2; dotY += gridSize) {
            drawLine(dotX + canvas.width / 2, dotY + canvas.height / 2, dotX + x, dotY + y, 'black');
        }
    }
});
