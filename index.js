
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const { setTimeout: delay } = require("node:timers/promises");

const rl = readline.createInterface({ input, output });

// Store quiz questions in an array of objects.
const questions = [
    {
        question: "Which language runs directly in a web browser?",
        options: ["1. Python", "2. JavaScript", "3. C++", "4. Java"],
        answer: "2"
    },
    {
        question: "Which keyword declares a variable that cannot be reassigned?",
        options: ["1. let", "2. var", "3. const", "4. static"],
        answer: "3"
    },
    {
        question: "Which method adds an item to the end of an array?",
        options: ["1. pop()", "2. push()", "3. shift()", "4. map()"],
        answer: "2"
    },
    {
        question: "What does === check in JavaScript?",
        options: [
            "1. Value only",
            "2. Type only",
            "3. Value and type",
            "4. Nothing"
        ],
        answer: "3"
    },
    {
        question: "Which function displays a message in the terminal?",
        options: [
            "1. console.log()",
            "2. console.read()",
            "3. print.line()",
            "4. terminal.show()"
        ],
        answer: "1"
    }
];

const GAME_TIME = 60;
const QUESTION_TIME = 15;

let score = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let timedOutAnswers = 0;

// Displays a countdown and stops when the timer expires or is cancelled.
async function showCountdown(seconds, controller) {
    for (let remaining = seconds; remaining > 0; remaining--) {
        output.write(`\rTime remaining: ${remaining}s  `);

        try {
            await delay(1000, undefined, {
                signal: controller.signal
            });
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            throw error;
        }
    }

    // Corrected: cancel the pending input when the countdown finishes.
    controller.abort();
}

// Gets an answer while enforcing the question's time limit.
async function getTimedAnswer(question, seconds) {
    const controller = new AbortController();

    const countdown = showCountdown(seconds, controller);

    try {
        const answer = await rl.question(
            "\nYour answer (enter the option number): ",
            { signal: controller.signal }
        );

        // Stop the countdown as soon as the user answers.
        controller.abort();
        await countdown;

        return answer.trim();
    } catch (error) {
        if (error.name === "AbortError") {
            output.write("\nTime is up!\n");
            return null;
        }

        throw error;
    } finally {
        controller.abort();
    }
}

// Displays a question and checks the player's answer.
async function askQuestion(item, index, deadline) {
    console.log(`\nQuestion ${index + 1}: ${item.question}`);

    // Use map() to display each answer option.
    item.options.map(option => console.log(option));

    const remainingGameTime = Math.ceil(
        (deadline - Date.now()) / 1000
    );

    const allowedTime = Math.min(
        QUESTION_TIME,
        remainingGameTime
    );

    const answer = await getTimedAnswer(item, allowedTime);

    if (answer === null) {
        timedOutAnswers++;
        console.log(`Correct answer: ${item.answer}`);
        return;
    }

    // Validate the selected option.
    if (!["1", "2", "3", "4"].includes(answer)) {
        incorrectAnswers++;
        console.log("Invalid option! This answer counts as incorrect.");
    } else if (answer === item.answer) {
        score += 10;
        correctAnswers++;
        console.log("Correct! Well done. +10 points");
    } else {
        incorrectAnswers++;
        console.log(`Incorrect. The correct answer is ${item.answer}.`);
    }
}

// Displays the final quiz results.
function showResults() {
    console.log("\n========== QUIZ RESULTS ==========");
    console.log(`Total questions: ${questions.length}`);
    console.log(`Correct answers: ${correctAnswers}`);
    console.log(`Incorrect answers: ${incorrectAnswers}`);
    console.log(`Timed-out questions: ${timedOutAnswers}`);
    console.log(`Final score: ${score}/${questions.length * 10}`);

    const percentage = Math.round(
        (score / (questions.length * 10)) * 100
    );

    console.log(`Percentage: ${percentage}%`);

    if (percentage >= 80) {
        console.log("Excellent work! You really know your JavaScript.");
    } else if (percentage >= 50) {
        console.log("Good effort! Keep practising.");
    } else {
        console.log("Keep learning. You can improve with practice!");
    }

    console.log("==================================");
}

// Starts the game and manages the overall time limit.
async function startGame() {
    console.log("\n==================================");
    console.log("       JAVASCRIPT TRIVIA GAME");
    console.log("==================================");
    console.log(`You have ${GAME_TIME} seconds to complete the quiz.`);
    console.log(`Each question has a ${QUESTION_TIME}-second limit.`);
    console.log("Each correct answer earns 10 points.");

    const start = await rl.question(
        "\nType START to begin the quiz: "
    );

    if (start.trim().toUpperCase() !== "START") {
        console.log("Game cancelled. Run the program again when ready.");
        return;
    }

    // Reset scores for a fresh game.
    score = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    timedOutAnswers = 0;

    const deadline = Date.now() + GAME_TIME * 1000;

    console.log("\nThe quiz has started! Good luck.");

    for (let i = 0; i < questions.length; i++) {
        if (Date.now() >= deadline) {
            console.log("\nThe overall game time has expired!");
            break;
        }

        await askQuestion(questions[i], i, deadline);
    }

    if (Date.now() >= deadline) {
        console.log("\nGame over! You reached the time limit.");
    } else {
        console.log("\nYou have completed all the questions!");
    }

    showResults();
}

// Run the game and handle unexpected errors.
startGame()
    .catch(error => {
        console.error("\nAn unexpected error occurred:", error.message);
    })
    .finally(() => {
        rl.close();
    });
