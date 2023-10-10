
const poemLines = ['My mind never stops mining ',
    'Never slows down',
    'Never mind how many times',
    'I lie to myself ',
    'Try to hide from myself',
    'Take the trauma ',
    'Hide it up on top of a dusty shelf',
    'For my health',
    'Coverage requires wealth',
    'Stealth bandits',
    'Landed in the fabric',
    'Of synapses and cross sectioned cosmos diagrams',
    "It's time I started winding down",
    "Finding now I'll never know how"];

let currentLineIndex = 0;
const poemDiv = document.getElementById("poem-line");

function displayNextLine() {
    // Get the current line and split it into characters
    const line = poemLines[currentLineIndex];
    const chars = [...line];
    
    // Apply a random transformation to each character
    const transformedChars = chars.map(char => {
        const randomOffset = (Math.random() - 0.5) * 5; // -2.5 to +2.5 pixels (reduced range)
        const randomRotation = (Math.random() - 0.5) * 6; // -3 to +3 degrees
        return `<span style="position:relative; top:${randomOffset}px; transform:rotate(${randomRotation}deg);">${char}</span>`;
    });
    
    poemDiv.innerHTML = transformedChars.join("");
    
    // Move to the next line
    currentLineIndex = (currentLineIndex + 1) % poemLines.length;
}

// Start the loop
setInterval(displayNextLine, 2000);
