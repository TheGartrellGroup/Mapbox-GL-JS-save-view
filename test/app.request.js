var request = require('supertest'),
  app = require('../server.js');

describe('GET app', function () {
  

/*
_  _ _ ____ _ _ _    ___  ____ ____ ___ 
|  | | |___ | | |    |__] |  | [__   |  
 \/  | |___ |_|_|    |    |__| ___]  |  
                                        */

  it('400 JSON error if I post to views without anything', function (done) {
    request(app)
      .post('/view/')
      .expect('Content-Type', /javascript/)
      .expect(400)
      .end(function(err, res){
        console.log(res.error.text)
        done()
      });
  });

   it('400 JSON error if I post to views with bad data', function (done) {
    request(app)
      .post('/view/')
      .send('yiuppessdfsdf;lksjdflskdjflksdfj')
      .expect('Content-Type', /javascript/)
       .expect(400)
      .end(function(err, res){
        console.log(res.error.text)
        done()
      });
  });


  it('400 JSON error if I post a completely invalid object to view', function (done) {
    request(app)
      .post('/view/')
      .send({"foo":"bar"})
      .expect('Content-Type', /javascript/)
      .expect(400)
      .end(function(err, res){
        console.log(res.error.text)
        done()
      });

  });

  var mapStateBad = {
      "map":{
          "center": [-123.543667, 43.76544],
          "zoom": "yay",
          "bearing" : -21.5,
          "pitch": 15
      },
      "layers": [{
          "id": "state-boundaries",
          "visibility": "none",
          "paint": {},
          "filter": {}
      }]
  }

  it('400 JSON error if I post a partially invalid object to view', function (done) {
    request(app)
      .post('/view/')
      .send(mapStateBad)
      .expect('Content-Type', /javascript/)
      .expect(400)
      .end(function(err, res){
        console.log(res.error.text)
        done()
      });
  });


 var mapStateGood = {
      "map":{
          "center": [-123.543667, 43.76544],
          "zoom": 12,
          "bearing" : -21.5,
          "pitch": 15
      },
      "layers": [{
          "id": "state-boundaries",
          "visibility": "none",
          "paint": {},
          "filter": {}
      }]
  }

    it('should 200 when posting valid mapState object', function (done) {
    request(app)
      .post('/view/')
      .send(mapStateGood)
      .expect('Content-Type', /javascript/)
      .expect(400)
      .end(function(err, res){
        console.log(res.text)
        done()
      });
    });


/*
_  _ _ ____ _ _ _    ____ ____ ___ 
|  | | |___ | | |    | __ |___  |  
 \/  | |___ |_|_|    |__] |___  |  
                                  */


    it('should 400 when getting unspecified id', function (done) {
    request(app)
      .get('/view/')
      .expect('Content-Type', /javascript/)
      .expect(400)
      .end(function(err, res){
        console.log(res.text)
        done()
      });
    });

     it('should 400 when getting bad id', function (done) {
    request(app)
      .get('/view/1234567')
      .expect('Content-Type', /javascript/)
      .expect(400)
      .end(function(err, res){
        console.log(res.text)
        done()
      });
    });

  it('should 200 when getting valid id', function (done) {
    request(app)
      .get('/view/cf024e80')
      .expect('Content-Type', /javascript/)
      .expect(200)
      .end(function(err, res){
        console.log(res.text)
        done()
      });
    });
});