
const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let dots = [];

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
    const red = Math.floor((mouseX / canvas.width) * 255);
    const blue = Math.floor((mouseY / canvas.height) * 255);
    const color = `rgb(${red}, 0, ${blue})`;

    dots.forEach(dot => {
        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    });
});
