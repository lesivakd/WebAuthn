import sqlite3 from "sqlite3"


function initDB(dbPath) {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Connected to the passwords database.');
        }
    });

// Создание таблицы, если она не существует
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS Passkeys
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY
                    AUTOINCREMENT,
                    username TEXT,
                    credentialId TEXT,
                    publicKey
                    BLOB,
                    webauthnUserID
                    TEXT,
                    counter
                    INTEGER,
                    deviceType
                    TEXT,
                    backedUp
                    INTEGER,
                    transports
                    TEXT
                )`);


    })
    db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS Users
                    (
                        username
                        TEXT
                        PRIMARY
                        KEY,
                        text_content
                        TEXT
                    )`);
        }
    );

    return db
}

// Создаем или открываем базу данных


// Функция для вставки новой записи
function insertPasskey(db, newPasskey) {
    const sql = `INSERT INTO Passkeys (username, webAuthnUserID, credentialId, publicKey, counter, transports,
                                       deviceType, backedUp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [newPasskey.username, newPasskey.webAuthnUserID, newPasskey.id, newPasskey.publicKey, newPasskey.counter, newPasskey.transports.join(','), // Преобразование массива в строку
        newPasskey.deviceType, newPasskey.backedUp], function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`A new passkey has been inserted with row id ${this.lastID}`);
        }
    });
}

function getPasskeyByUsername(db, username) {

    console.log("пояснительная бригада")
    console.log(cred)
    return cred
}

function closeDB(db) {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
}

function insertText(username, textContent, db) {
    const sql = `INSERT INTO Users (username, text_content)
                 VALUES (?, ?)`;
    db.run(sql, [username, textContent], function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Текст успешно добавлен для пользователя ${username}`);
        }
    });
}

function getTextByUsername(username, db, callback) {
    const sql = `SELECT text_content
                 FROM Users
                 WHERE username = ?`;
    db.get(sql, [username], (err, row) => {
        if (err) {
            console.error(err.message);
        } else {
            callback(row ? row.text_content : null);
        }
    });
}

function updateText(username, newTextContent, db) {
    const sql = `UPDATE Users
                 SET text_content = ?
                 WHERE username = ?`;
    db.run(sql, [newTextContent, username], function (err) {
        if (err) {
            console.error(err.message);
        } else if (this.changes === 0) {
            console.log(`Пользователь ${username} не найден.`);
        } else {
            console.log(`Текст успешно обновлен для пользователя ${username}`);
        }
    });
}

// Закрытие базы данных

export {initDB, insertPasskey, getPasskeyByUsername, insertText, getTextByUsername, updateText, closeDB}