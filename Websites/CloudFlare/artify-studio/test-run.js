import fs from "fs/promises";
import { spawn } from "child_process";

const child = spawn("node", ["scripts/creative-fabrica/generate-semantic-tags.js"]);

child.stdout.on("data", (data) => {
    process.stdout.write(data);
    const text = data.toString();
    if (text.includes("Ваш выбор (1/2/3/4):")) {
        child.stdin.write("3\n");
    } else if (text.includes("Введите номера через запятую")) {
        child.stdin.write("6\n");
    } else if (text.includes("Режим: [1] Только новые  [2] Пересобрать всё:")) {
        child.stdin.write("2\n");
    } else if (text.includes("Начать генерацию? (y/N):")) {
        child.stdin.write("y\n");
    }
});

child.stderr.on("data", (data) => {
    process.stderr.write(data);
});

child.on("close", (code) => {
    console.log(`Process exited with code ${code}`);
});
