
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let dots = [];

// Create 50x50 grid dots
for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
        dots.push({
            x: i * 20,
            y: j * 20,
        });
    }
}

document.addEventListener('mousemove', (event) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    dots.forEach(dot => {
        // Draw line from static dot to mouse
        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = '#000000'; // Black line
        ctx.stroke();

        // Draw static dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000000'; // Black dot
        ctx.fill();
    });
});
