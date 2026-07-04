import fs from "fs"; 
import path from "path"; 
import { fileURLToPath } from "url"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "set",

    async execute(m, { sock }) {
        const chat = m.from;
        const file = path.join(__dirname, "../data.json");

        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify({}, null, 4));
        }

        const info = JSON.parse(fs.readFileSync(file, "utf8"));

        info.forward = chat;

        fs.writeFileSync(file, JSON.stringify(info, null, 4));
        m.reply("Chat configurado.")
    }
}