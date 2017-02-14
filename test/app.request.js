// test/app.request.js
it('responds with html', function (done) {
  request(app)
    .get('/')
    .expect('Content-Type', /html/)
    .expect(200, done);
});
it('responds with javascript', function (done) {
  request(app)
    .get('/scripts/index.js')
    .expect('Content-Type', /javascript/)
    .expect(200, done);
});
it('responds with json', function (done) {
  request(app)
    .get('/')
    .set('X-Requested-With', 'XMLHttpRequest')
    .expect('Content-Type', /json/)
    .expect(200, done);
});