import { startSock } from "../index.js";
import { delay, DisconnectReason } from "baileys";
import { Boom } from "@hapi/boom";
import { ask, deleteAuthFolder } from "#lib/utils.js";
import { setSock, clearSock } from "#lib/botState.js";

let pairingRequested = false;

export default async (sock, update) => {
    try {
        const { connection, lastDisconnect, qr } = update;

        const isRegistered = sock?.authState?.creds?.registered;

        if ((connection === "connecting" || !!qr) && !isRegistered && !pairingRequested) {
            pairingRequested = true;
            await delay(1500);
            const phone = await ask("Ingresa tu número de WhatsApp con el código de país, sin el signo +:\nEjemplo: 59891234567\n");

            const code = await sock.requestPairingCode(phone, "4GU5AVOB");
            console.log("Codigo de emparejamiento:", code);
            return;
        }

        if (connection === "open") {
            pairingRequested = false;
            setSock(sock);
            console.log("Conexión abierta — Bot leyendo mensajes y reenvia View Once's.");
            return;
        }

        if (connection === "close") {
            pairingRequested = false;
            clearSock();

            const error      = lastDisconnect?.error;
            const boom       = new Boom(error);
            const statusCode = boom.output?.statusCode;

            const shouldReconnect = ![
                DisconnectReason.loggedOut,
                DisconnectReason.forbidden,
            ].includes(statusCode);

            console.log(
                `Conexión cerrada. Código: ${statusCode}. ${
                shouldReconnect ? "Reconectando..." : "No se reconectará."
                }`
            );

            // Deletes the session.
            if (!shouldReconnect) {
                deleteAuthFolder(() => {
                    console.error(`Conexión cerrada permanentemente. Empareja nuevamente`);
                    process.exit(1);
                })
            }

            await startSock();
            return;
        }
    } catch (err) {
        console.error("Error en connection.update:", err);
    }
};