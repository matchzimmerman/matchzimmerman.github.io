const svgFiles = [
    'svg/1-1.svg',
   ' svg/1-2.svg',
   ' svg/1-3.svg',
    'svg/1-4.svg',
    'svg/1-5.svg',
    'svg/2-1.svg',
    'svg/2-2.svg',
    'svg/2-3.svg',
    'svg/2-4.svg',
    'svg/2-5.svg',
    'svg/3-1.svg',
    'svg/3-2.svg',
    'svg/3-3.svg',
    'svg/3-4.svg',
    'svg/3-5.svg',
    'svg/4-1.svg',
    'svg/4-2.svg',
    'svg/4-3.svg',
    'svg/4-4.svg',
    'svg/4-5.svg',
    'svg/5-1.svg',
    'svg/5-2.svg',
    'svg/5-3.svg',
    'svg/5-4.svg',
    'svg/5-5.svg',
    // ... add paths for all 25 SVG files
];

function getRandomSvg() {
    const randomIndex = Math.floor(Math.random() * svgFiles.length);
    return svgFiles[randomIndex];
}

function getRandomRotation() {
    const angles = [0, 90, 180, 270];
    const randomIndex = Math.floor(Math.random() * angles.length);
    return angles[randomIndex];
}

function fillContainer() {
    const container = document.getElementById('svg-container');
    for (let i = 0; i < 200; i++) {  // Adjust the number based on how many tiles you want
        const img = document.createElement('img');
        img.src = getRandomSvg();
        img.style.width = '100%';
        img.style.height = '100%';  // Ensures each tile stretches to fill its cell
        img.style.transform = `rotate(${getRandomRotation()}deg)`;  // Apply random rotation
        container.appendChild(img);
    }
}

fillContainer();
