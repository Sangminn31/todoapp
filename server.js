const express = require('express');
const app = express();
const { MongoClient,ObjectId } = require('mongodb')
const methodOverride = require('method-override')

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// 몽고DB 연결


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

app.get('/write', function(req, res){
    res.render('write.ejs')
});

// 글추가 기능
app.post('/add', async (req, res) => {
    console.log(req.body)

    try {
        if(req.body.title == '' || req.body.content ==''){
            res.send('You need to write the title or content.')
        } else {
            db.collection('post').insertOne({title : req.body.title, content : req.body.content})
            res.redirect('/list')
        }
    } catch(e) {
        console.log(e)
        res.status(500).send('server problem')
    }
})


app.get('/detail/:id', async (req,res) => {

    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id)})
         res.render('detail.ejs', {result : result})
        if (result == null) {
            res.status(404).send('wrong URL!')
        }
    } catch (e) {
        console.log(e)
        res.status(404).send('wrong URL')
    }

})


app.get('/edit/:id', async (req, res) => {

    // db.collection('post').updateOne({ _id: new ObjectId(req.params.id) },
    //     {$set : { title: ''}}
    // );

    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id)})
        if (result) {
            res.render('edit.ejs', { result: result });
        } else {
            res.send('No post found with that ID');
        }
    } catch (error) {
        res.status(500).send('Error accessing the database');
    }
});


app.put('/edit', async (req, res) => {

    try {
       if (req.body.title != '' && req.body.content != '')
       { 
         await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) },
            {$set : { title: req.body.title, content : req.body.content}}
        )
        res.redirect('/list')
    }   else {
        res.send('Type something to update.')
    }
    } catch (error) {
        res.status(500).send('Error accessing the id')
    }


});

app.put('/edit', async (req, res) => {

    await db.collection('post').updateOne({ _id : 1}, {$inc : {like : 1}})

});


app.delete('/delete', async (req, res) => {
    try {
        let result = await db.collection('post').deleteOne({ _id: new ObjectId(req.query.docid) });
        if (result.deletedCount === 1) { 
            res.send('Delete successful');
        } else {
            res.send('No post found with that ID');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error accessing the database');
    }
});

app.get('/list/:id', async (req, res) => {
    const page = parseInt(req.params.id, 10) || 1; // Current page
    const pageSize = 5; // Posts per page
    const skip = (page - 1) * pageSize;

    // Get the total number of posts
    const totalPosts = await db.collection('post').countDocuments();
    const totalPages = Math.ceil(totalPosts / pageSize);

    let posts = await db.collection('post').find().skip(skip).limit(pageSize).toArray();
    res.render('list.ejs', {
        posts: posts,
        totalPages: totalPages,
        currentPage: page
    });
});

