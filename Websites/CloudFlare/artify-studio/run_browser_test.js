import { spawn } from "child_process";

const child = spawn("node", ["scripts/creative-fabrica/generate-tags-browser.js"]);

child.stdout.on("data", (data) => {
    process.stdout.write(data);
    const text = data.toString();
    if (text.includes("Ваш выбор:")) {
        child.stdin.write("7\n"); 
    } else if (text.includes("Введите номера через запятую")) {
        child.stdin.write("1\n"); // index for christmas/3d-printing
    } else if (text.includes("Режим: [1] Только новые")) {
        child.stdin.write("1\n");
    } else if (text.includes("Начать? (y/N):")) {
        child.stdin.write("y\n");
    }
});

child.stderr.on("data", (data) => {
    process.stderr.write(data);
});

child.on("close", (code) => {
    console.log(`Process exited with code ${code}`);
});
