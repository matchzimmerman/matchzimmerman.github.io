
function initializeCanvas() {
    const canvas = document.getElementById('artCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let dots = [];

    const numDotsX = Math.ceil(window.innerWidth / 20);
    const numDotsY = Math.ceil(window.innerHeight / 20);

    for (let i = 0; i < numDotsX; i++) {
        for (let j = 0; j < numDotsY; j++) {
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
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        });
    });
}

