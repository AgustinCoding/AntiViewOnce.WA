import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { extractMessageContent, getContentType } from "baileys";
import fs from "fs/promises";
import fss from "fs";
import path from "path";

async function ask(question) {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
};

// v7: usa extractMessageContent de Baileys para cubrir todos los tipos de
// mensaje (editedMessage, ephemeralMessage, viewOnce wrappers, etc.)
function getMessageContent(msg) {
    const extracted = extractMessageContent(msg?.message);
    if (!extracted) return null;

    const type = getContentType(extracted);
    const inner = extracted[type];

    return inner?.text          // extendedTextMessage
        ?? inner?.caption       // imageMessage, videoMessage, documentMessage
        ?? (type === "conversation" ? extracted.conversation : null);
};

const getGroupAdmins = (participants) => {
    const admins = [];
    for (const p of participants) {
      if (p.admin === "admin" || p.admin === "superadmin") {
          admins.push(p.id);
      }
    }
    return admins;
};


// Utilitary function: deletes auth folder.
// Why?: When connection is fully lost, user has to manually delete auth folder to login again..
async function deleteAuthFolder(callback){
    const folder = path.join(process.cwd(), 'src', 'auth');

    if(!fss.existsSync(folder)){
        return;
    }

    await fs.rm(folder, {recursive : true, force : true}, err =>{
        if(err){
            throw err;
        }
    })

};
  
export { ask, getMessageContent, getGroupAdmins, deleteAuthFolder };
/* Code by https://github.com/DavidModzz */