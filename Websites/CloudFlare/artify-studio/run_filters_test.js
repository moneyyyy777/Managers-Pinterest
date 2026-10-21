import { spawn } from "child_process";

const child = spawn("node", ["scripts/creative-fabrica/generate-semantic-tags.js"]);

child.stdout.on("data", (data) => {
    process.stdout.write(data);
    const text = data.toString();
    if (text.includes("Ваш выбор:")) {
        child.stdin.write("5\n"); // 5 - Умные ФИЛЬТРЫ через ИИ — выбрать подборки
    } else if (text.includes("Введите номера через запятую")) {
        child.stdin.write("6\n"); // 6 - cliparts/baby
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
