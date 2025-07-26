// server.js
const WebSocket = require('ws');

// Создаем WebSocket сервер на порту 8080
const wss = new WebSocket.Server({ port: 8080 });

let streamer = null; // Здесь будем хранить подключение стримера
const viewers = new Set(); // Здесь будем хранить всех зрителей

console.log('WebSocket сервер запущен на порту 8080...');
console.log('Ожидаем подключения стримера и зрителей...');

wss.on('connection', ws => {
    // Определяем, кто подключился: стример или зритель
    const connectionType = ws.protocol; // Мы будем использовать протокол для идентификации

    if (connectionType === 'streamer') {
        if (streamer) {
            console.log('Другой стример уже подключен. Отключаем нового.');
            ws.close();
            return;
        }
        console.log('✅ Стример подключился!');
        streamer = ws;

        ws.on('close', () => {
            console.log('❌ Стример отключился.');
            streamer = null;
            // Сообщаем всем зрителям, что трансляция закончилась
            viewers.forEach(viewer => viewer.send('stream_ended'));
        });

    } else { // Если это не стример, значит, это зритель
        console.log('✅ Зритель подключился!');
        viewers.add(ws);

        ws.on('close', () => {
            console.log('❌ Зритель отключился.');
            viewers.delete(ws);
        });
    }

    // Когда от стримера приходит сообщение (кадр видео)...
    ws.on('message', message => {
        // ...мы пересылаем его всем зрителям
        if (ws === streamer) {
            viewers.forEach(viewer => {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message);
                }
            });
        }
    });
});
