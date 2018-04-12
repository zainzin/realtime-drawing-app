const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const r = require('rethinkdb');
const port = 8000;
const db = 'awesome_whiteboard';
const drawingsTable = 'drawings';
const linesTable = 'lines';

function createDrawings({connection, name}) {
    console.log(drawingsTable);
    r.db(db).table(drawingsTable).insert({
        name,
        timestamp: new Date()
    }).run(connection).then(() => {
        console.log("Created a drawings")
    })
}

function handleLinePublish({connection, line}) {
    console.log('saving line to the db');
    r.db(db).table(linesTable).insert(Object.assign(line, {timestamp: new Date()}))
    .run(connection);
}

function subscribeToDrawings({client, connection}) {
    r.db(db).table(drawingsTable)
    .changes({includeInitial: true})
    .run(connection)
    .then(cursor => {
        cursor.each((err, row) => {
            client.emit('drawing', row.new_val);
        })
    })
}

function subscribeToDrawingLine({client, connection, drawingId}) {
    r.db(db).table(linesTable)
    .filter(r.row('drawingId').eq(drawingId))
    .changes({includeInitial: true})
    .run(connection)
    .then(cursor => {
        cursor.each((err, row) => {
            client.emit(`drawingLine:${drawingId}`, row.new_val);
        })
    });
}

app.use(express.static(__dirname + '/build'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/build/index.html');
});

r.connect({
    host: 'localhost',
    port: 28015
}).then(connection => {
    r.dbList().contains(db)
  .do(function(databaseExists) {
    return r.branch(
      databaseExists,
      { dbs_created: 0 },
      r.dbCreate(db)
    );
  }).run(connection).then(() => {
    r.db(db).tableList().contains(drawingsTable)
  .do(function(tableExists) {
    return r.branch(
      tableExists,
      { table_created: 0 },
      r.db(db).tableCreate(drawingsTable)
    );
}).run(connection);

      r.db(db).tableList().contains(linesTable)
  .do(function(tableExists) {
    return r.branch(
      tableExists,
      { table_created: 0 },
      r.db(db).tableCreate(linesTable)
    );
}).run(connection);

  }).then(() => {
    io.on('connection', client => {
        client.on('createDrawing', ({name}) => {
            console.log('here');
            createDrawings({connection, name});
        });

        client.on('subscribeToDrawings', () => subscribeToDrawings({client, connection}));

        client.on('publishLine', (line) => handleLinePublish({line, connection}));

        client.on('subscribeToDrawingLines', drawingId => {
            subscribeToDrawingLine({client, connection, drawingId})
        });
    });
  });  
});

http.listen(port, function(){
  console.log(`Listening on port ${port}`);
});