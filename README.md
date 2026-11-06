# Interactive Quiz App

A responsive, vanilla JavaScript quiz application featuring a dynamic question shuffler, an anti-cheat navigation blocker, a local storage leaderboard, a pause/resume timer, and a light/dark theme toggle.

## How to Run It
1. Download or clone this repository to your local machine.
2. Ensure all four files (`index.html`, `style.css`, `questions.js`, and `script.js`) are in the same folder.
3. Double-click **`index.html`** to open and run it directly in any modern web browser (Chrome, and Edge).

## What's Done
- **Core Architecture:** Built entirely with vanilla HTML, CSS, and modular JavaScript (no frameworks).
- **Dynamic Shuffling:** Randomizes question order and multiple-choice options every game.
- **Interactive Timer & Pause:** 15-second countdown per question with a Pause/Resume feature.
- **Anti-Cheat Navigation:** Locks attempted questions and blocks users from changing answers when clicking "Back".
- **Local Storage Leaderboard:** Persists top 5 high scores across sessions and filters out corrupted data.
- **Terminal Metrics Screen:** Shows final score, percentage, total time, and a red-bordered missed questions review.
- **Theme Toggle:** Supports seamless switching between Dark Mode and Light Mode using CSS variables.

## What Isn't Done (Future Enhancements)
- Category and difficulty selection filters on the start screen.
- Bonus points multiplier for quick answers.

## What I'd Change / Improve
If I had more time, I would add a sound effect library (using the Web Audio API) for correct and incorrect answers to make the Quiz feel even more engaging and show the confetti blowers on the screen after getting distinction and above.