const http = require('http');
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const session = require('express-session');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dbConnection = require('./connection/database');
const uploadFile = require('./middlewares/uploadFile');
const { release } = require('os');
const isLogin = false;

app.set('view engine', 'hbs');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
  session(
    {
      cookie: {
        maxAge: 1000 * 60 * 60 * 2,
      },
      store: new session.MemoryStore(),
      resave: false,
      saveUninitialized: true,
      secret: 'SangatRahasia',
    }
  )
);

app.use(function(req,res,next){
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

hbs.registerPartials(__dirname + '/views/partials');

var pathFile = 'http://localhost:3000/uploads/';


app.get('/', function(request,response) {

    const title = 'Artis';

    const query = `SELECT * FROM tb_artis`;
  
    dbConnection.getConnection(function (err,conn) {
      if (err) throw err;
      conn.query(query, function (err, results) {
        if (err) throw err;
        const artis = [];

          for (var result of results) {
            artis.push({
              id: result.id,
              name: result.name,
              start_career: result.start_career,
              photo: pathFile + result.photo,
              about: result.about,
            });
          }
  
        response.render('index', {
          title,
          isLogin: request.session.isLogin,
          artis,
        });
      });
    });
});

app.get('/register', function(request,response) {
  const title = 'Register';
  response.render('register', {
    title,
    isLogin,
  });
});

app.post('/register', function(request,response) {
  // const {id} = request.session.id; 
  const { email, password, status } = request.body;

  if(email == '' || password == '' || status == ''){
    request.session.message = {
      type: 'danger',
      message: 'Please insert all field!',
    };

    return response.redirect('/register');
  }

  const query = `INSERT INTO tb_user ( email, password, status) VALUES("${email}","${password}","${status}");`;
  dbConnection.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query,function(err,results) {
      if (err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Register Success',
      };
      response.redirect('/register');
    });
    conn.release();
  });
});

app.get('/login', function(request,response) {
  const title = 'Login';
  response.render('login', {
    title,
    isLogin,
  });
});

app.post('/login', function(request,response) {
  const { email, password } = request.body;

  if(email == '' || password == ''){
    request.session.message = {
      type: 'danger',
      message: 'Please insert all field!',
    };

    return response.redirect('/login');
  }

  const query = `SELECT * FROM tb_user WHERE email = "${email}" AND password = "${password}"`;
  dbConnection.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query,function(err,results) {
      if (err) throw err;

      if (results.length == 0) {
        request.session.message = {
          type: 'danger',
          message: 'Email and password dont match!',
        };

      } else {
        //   request.session.message = {
        //   type: 'success',
        //   message: 'Login Success',
        // };

        request.session.isLogin = true;

        request.session.user = {
          id: results[0].id,
          email: results[0].email,
        };
        response.redirect('/');
      }

    });
    conn.release();
  });
});

app.get('/logout', function(request,response) {
  request.session.destroy();
  response.redirect('/');
});

app.get('/music', function(request,response) {
  const title = 'Music';

  const query = `SELECT * FROM tb_music`;

  dbConnection.getConnection(function (err,conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;
      const music = [];

      for (var result of results) {
        music.push({
          id: result.id,
          title: result.title,
          music: result.music,
          // music: pathFile + result.music,
          cover_music: pathFile + result.cover_music,
        });
      }

      response.render('music', {
        title,
        isLogin: request.session.isLogin,
        music,
      });
    });
    conn.release();
  });

});

app.get('/addMusic', function(request,response) {
  const query = `SELECT id, name from tb_artis`;
  dbConnection.getConnection(function (err,conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;
      const artis = [];

      for (var result of results) {
        artis.push({
          id: result.id,
          name: result.name,
        });
      }
    
  const title = 'Add Music';
  response.render('addMusic', {
    title,
    isLogin: request.session.isLogin,
    artis,
  });
});
});
});

app.post('/addMusic', uploadFile('image'),function(request,response) {
  var {title, music, artis} = request.body;
  // var music = '';
  var image = '';


  if (request.file){
    image = request.file.filename;
    // music = request.file.mimetype;
  }

  if (title == '' || music == '' || image == '' || artis == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please insert all field!',
    };
    return response.redirect('/addMusic');
  }
  
    const query = `INSERT INTO tb_music (title, music, cover_music, artis_id) VALUES ("${title}","${music}","${image}","${artis}")`;
    dbConnection.getConnection(function(err,conn){
      if(err) throw err;
        conn.query(query,function(err,result) {
          if (err) throw err;

          request.session.message = {
            type: 'success',
            message: 'Add music has success',
          };

          response.redirect('/addMusic');
        });

        conn.release();
     });

});

app.get('/addArtis', function(request,response) {
  const title = 'Add Artis';
  response.render('addArtis', {
    title,
    isLogin: request.session.isLogin,
  });
});

app.post('/addArtis', uploadFile('image') ,function(request,response) {
  var {name, career, about} = request.body;
  var image = '';

  if (request.file){
    image = request.file.filename;
  }

  if (name == '' || career == '' || image == ''  || about == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please insert all field!',
    };
    return response.redirect('/addArtis');
  }
    const query = `INSERT INTO tb_artis (name, start_career, photo, about) VALUES ("${name}","${career}", "${image}","${about}")`;
    dbConnection.getConnection(function(err,conn){
      if(err) throw err;
        conn.query(query,function(err,result) {
          if (err) throw err;

          request.session.message = {
            type: 'success',
            message: 'Add artis has success',
          };

          response.redirect('/addArtis');
        });

        conn.release();
     });
});

app.get('/deleteMusic/:id', function(request,response) {
  const id = request.params.id;

  const query = `DELETE FROM tb_music WHERE id = ${id}`;

  dbConnection.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query,function(err,result) {
      if (err) throw err;

      response.redirect('/music');
    });

    conn.release();
  });
  
});

app.get('/editMusic/:id', function(request,response) {
  const title = 'Edit Music';
  const id = request.params.id;

  const query = `SELECT * FROM tb_music WHERE id = ${id}`;

  dbConnection.getConnection(function(err,conn){
    if(err) throw err;
      conn.query(query,function(err,results) {
        if (err) throw err;

        const music = {
          ...results[0],
          cover_music: pathFile + results[0].cover_music,
        };

        response.render('editMusic', {
          title,
          isLogin: request.session.isLogin,
          music,
        });
      });

      conn.release();
   });
});

app.post('/editMusic', uploadFile('image'), function(request,response) {
  const {id, title, music, oldCover} = request.body;

  var image = oldCover.replace(pathFile, '');
  if (request.file) {
    image = request.file.filename;
  }

  const query = `UPDATE tb_music SET cover_music = "${image}", title = "${title}", music = "${music}" WHERE id = ${id}`;

  dbConnection.getConnection(function(err,conn){
    if(err) throw err;
      conn.query(query,function(err,results) {
        if (err) throw err;

        response.redirect(`/detailMusic/${id}`);
      });

      conn.release();
   });
});

app.get('/detailMusic/:id', function(request,response) {
  const title = 'Detail Music';
  const id = request.params.id;

  const query = `SELECT * FROM tb_music WHERE id = ${id}`;

  dbConnection.getConnection(function (err,conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;
      const music = {
        id: results[0].id,
        title: results[0].title,
        music: results[0].music,
        cover_music: pathFile + results[0].cover_music,
        artis_id: results[0].artis_id,
      };

      response.render('detailMusic', {
        title,
        isLogin: request.session.isLogin,
        music,
      });
    });
  });

});

const port = 3000;
const server = http.createServer(app);
server.listen(port);
console.debug(`Server listening on port ${port}`);
