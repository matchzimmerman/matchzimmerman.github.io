
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let dots = [];

document.addEventListener('click', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    dots.push({
        x: mouseX,
        y: mouseY,
    });
});

document.addEventListener('mousemove', (event) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    dots.forEach(dot => {
        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = '#000000';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
    });
});
