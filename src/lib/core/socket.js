    /*
        **socket.js** PORPUSE: Creates an improved baileys socket by adding extra
                            configuration to the socket such as a cache based system of storing
        


    */

    import {
        isPnUser, // Generic phone number user?
        isLidUser, // ID based user?
        jidNormalizedUser, // JID normalizer for Baileys 
        makeWASocket, 
    } from "baileys";

    import { NodeCache } from "@cacheable/node-cache";

    // Initialize NodeCache object where stdTTL(seconds) stands for Standard Time To Live
    // In this case we define our cache entries will be cleaned up every 10 minutes
    const msgCache = new NodeCache({ stdTTL: 60 * 10 });


    //Future socket creation export function.
    export default (options) => { //START DEFAULT SCOPE
        const sock = makeWASocket({
            ...options, // Gets standard makeWASocket options
            msgRetryCounterCache: new NodeCache(),

            //getMessage MUST be async only because Baileys expects a promise.
            // Implementation of Baileys getMessage function
            getMessage: async (key) => {
                const cached = msgCache.get(key.id); //Consults a msg in cache by key.id
                if (cached) return cached; // If msg still exists in cache, we return it
                //If not, we return an empty conversation object
                return { conversation: "" };
            },

        });

        //sock.ev is an event emmiter provided by Baileys lib
        //messages.upsert triggers this event when a new Whatsapp message is received
        sock.ev.on("messages.upsert", ({ messages }) => { // Retrieve messages array from upsert event emition
            for (const msg of messages) {
                if (!msg.message) continue; // If we get an undefined message (No conversation attribute) we continue to avoid errors
                msgCache.set(msg.key.id, msg.message); 
            }
        });

        sock.msgCache = msgCache;

        sock.getPNForLID = async (lid) => {
            try {
                return await sock.signalRepository.lidMapping.getPNForLID(lid);
            } catch {
                const normalized = jidNormalizedUser(lid);
                return isPnUser(normalized) ? normalized : null;
            }
        };

        sock.getLIDForPN = async (pn) => {
            try {
                return await sock.signalRepository.lidMapping.getLIDForPN(pn);
            } catch {
                const normalized = jidNormalizedUser(pn);
                return isLidUser(normalized) ? normalized : null;
            }
        };

        return sock;
    }; // END DEFAULT SCOPE

    /* Code by https://github.com/DavidModzz */