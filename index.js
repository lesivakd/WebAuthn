import {
    generateAuthenticationOptions,
    generateRegistrationOptions, verifyAuthenticationResponse,
    verifyRegistrationResponse
} from "@simplewebauthn/server";

import "dotenv/config"

import * as http from "node:http";
import * as https from "node:https";
import * as fs from "node:fs";
import {initDB, closeDB, getPasskeyByUsername, insertPasskey, insertText, updateText} from "./src/server/database.js";
// подключение express
import express from 'express'
// создаем объект приложения

const db = initDB("database.db")
const app = express();

const users = new Map()
const credentials = new Map()
const ongoingRegOpts = new Map()
const ongoingAuthOpts = new Map()

const rpID = process.env.domen
const rpName = "webauthn"
const origin = `https://${rpID}`


let privateKey = fs.readFileSync(`${process.env.path}/apache-selfsigned.key`, 'utf8');
let certificate = fs.readFileSync(`${process.env.path}/apache-selfsigned.crt`, 'utf8');

let certs = {key: privateKey, cert: certificate};


app.use(express.static('public'));
app.use(express.json())
app.get("/api/test", function (r) {

    console.log("got request from client")
    console.log(r.query.username)
    console.log(r.query.password)
})

app.get("/authorize", function (request, response) {

    response.sendFile(`${process.env.path}/public/auth_page.html`)
});
app.get("/register", function (request, response) {

    response.sendFile(`${process.env.path}/public/register_page.html`)
});
app.get("/secret", function (request, response) {

    response.sendFile(`${process.env.path}/public/secret_page.html`)

});

app.get("/get_storage", function (request, response) {
    const username = request.query.name
    const sql = `SELECT text_content
                 FROM Users
                 WHERE username = ?`;
    db.get(sql, [username], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        if (row) {

            response.send(JSON.stringify(row.text_content))
        } else {
            console.log("nothin found in db")
        }
    });
});

app.get("/set_storage", function (request, response) {
    const username = request.query.name
    const text_c = request.query.text
    updateText(username, text_c, db)
});

app.get("/generate-registration-options", async function (request, response) {
    console.log("got reg opts request")
    const username = request.query.name
    console.log("username: ", username)

    const sql = `SELECT *
                 FROM Passkeys
                 WHERE username = ?`;
    db.get(sql, [username]
        , async function (err, row) {
            if (err) {
                console.error(err.message);
                return;
            }
            if (row) {
                response.status(409)
                response.send()
            } else {
                const options = await generateRegistrationOptions({
                    rpName,
                    rpID,
                    userName: username
                });
                console.log("made options: ", options)

                ongoingRegOpts.set(username, options)
                response.status(200)
                response.send(JSON.stringify(options))
                console.log("finished response")
            }
        })


});

app.post("/verify-registration", async function (request, response) {
    const username = request.query.name
    const body = request.body
    const currentOptions = ongoingRegOpts.get(username)

    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: currentOptions.challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
    } catch (error) {
        console.error(error);
        return response.status(400).send({error: error.message});
    }
    const {registrationInfo} = verification;
    const {
        credential,
        credentialDeviceType,
        credentialBackedUp,
    } = registrationInfo;

    const newPasskey = {
        username,
        webAuthnUserID: currentOptions.user.id,
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
    };


    const {verified} = verification;

    if (verified) {
        response.status(200)
        response.send()
        insertPasskey(db, newPasskey)
        insertText(username, '', db)
    } else {
        response.status(400)
        response.send()
    }

});


app.get("/generate-authentication-options", async function (request, response) {

    const username = request.query.name
    const sql = `SELECT *
                 FROM Passkeys
                 WHERE username = ?`;
    db.get(sql, [username]
        , async function (err, row) {
            if (err) {
                console.error(err.message);
                return;
            }
            if (!row) {
                response.status(409)
                response.send()
            } else {
                const options = await generateAuthenticationOptions({
                    rpID,
                });

                ongoingAuthOpts.set(username, options)
                response.status(200)
                response.send(JSON.stringify(options))
                console.log("finish response")

                return options;
            }
        }
    )

});
app.post("/verify-authentication", async function (request, response) {
    const username = request.query.name
    const body = request.body
    const currentOptions = ongoingAuthOpts.get(username)


    const sql = `SELECT *
                 FROM Passkeys
                 WHERE username = ?`;
    db.get(sql, [username]
        , async function (err, row) {
            if (err) {
                console.error(err.message);
                return;
            }
            if (row) {
                // Преобразуем строку из базы данных в объект newPasskey
                let passkey = {
                    username: row.username,
                    webAuthnUserID: row.webAuthnUserID,
                    id: row.credentialId,
                    publicKey: row.publicKey,
                    counter: row.counter,
                    transports: row.transports.split(','), // Преобразуем строку обратно в массив
                    deviceType: row.deviceType,
                    backedUp: row.backedUp === 1 // Преобразуем в булевый тип
                }

                console.log(passkey)
                if (passkey === undefined) {
                    console.log(`Could not find passkey ${body.id} for user ${username}`);
                } else {
                    console.log(passkey)
                    let verification;
                    try {
                        verification = await verifyAuthenticationResponse({
                            response: body,
                            expectedChallenge: currentOptions.challenge,
                            expectedOrigin: origin,
                            expectedRPID: rpID,
                            credential: {
                                id: passkey.id,
                                publicKey: passkey.publicKey,
                                counter: passkey.counter,
                                transports: passkey.transports,
                            },

                        });
                    } catch (error) {
                        console.log("catch error")
                        console.log(error)
                    }

                    const {verified} = verification;

                    if (verified) {
                        console.log("verified suc")
                        response.status(200)
                        response.send()
                    } else {
                        console.log("verified error")
                        response.status(400)
                        response.send()
                    }
                }


            } else {
                console.log("db error: nothing found")
                return undefined
            }
        });


});


let httpServer = http.createServer(app);
let httpsServer = https.createServer(certs, app);

httpServer.listen(8080);
httpsServer.listen(443);

//app.listen(3000);

