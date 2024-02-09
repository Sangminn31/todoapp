const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs')


const { MongoClient } = require('mongodb')

let db
const url = 'mongodb+srv://sangminhwang0301:kffJRDKnXFaXlgVR@cluster0.gnkodwz.mongodb.net/?retryWrites=true&w=majority'
new MongoClient(url).connect().then((client)=>{
  console.log('successfully connected to the DB.')
  db = client.db('forum')
  app.listen(8080, function(){
    console.log('listening on 8080')
});
}).catch((err)=>{
  console.log(err)
})

app.get('/news', function(req, res){
    db.collection('post').insertOne({title: 'first try'})
});

app.get('/list', async(req, res) => {
    let result = await db.collection('post').find().toArray()
    res.render('list.ejs',{ posts : result })
})

app.get('/time', (req, res) => {
    res.render('time.ejs', {data : new Date() })
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html')
});


app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html')
});

