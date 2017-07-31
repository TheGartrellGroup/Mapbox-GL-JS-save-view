
/* Deps */
var express = require('express'),
jsonfile = require('jsonfile'),
// nodemailer = require('nodemailer'),
uuid = require('node-uuid'),
Validator = require('jsonschema').Validator,
bodyParser = require('body-parser')

var SAVETO = 'JSONFILE';
//SAVETO = 'SQLITE';

var sqlite3, db;
var readView, writeView;

if(SAVETO === 'SQLITE'){
	sqlite3 = require('sqlite3')
	db = new sqlite3.Database('db/views.db');
	//db.run("PRAGMA journal_mode = WAL");
	readView = _readViewFromSQLiteDB;
	writeView = _writeViewToSQLiteDB;
} else {
	readView = _readViewFromJSONFile;
	writeView = _writeViewToJSONFile;
}

var v = new Validator();

var mapSchema = {
	"id":'/mapSchema',
	"type":"object",
	"properties":{
		"center": {
			"type": "array",
			"items": {
				"type": "number",
				"minItems": 2,
      			"maxItems": 2
			},
			"required": true
		},
		"zoom": {
			"type": "number",
			"required": true
		},
		"bearing": {
			"type": "number"
		},
		"pitch": {
			"type": "number"
		}
	}
}

var layerSchema  = {
	"type":"object",
	"properties":{
		"id": {
			"type": "string",
			"required": true
		},
		"visibility": {
			"type": "string",
			"pattern": /(visible|none)/,
			"required": true
		},
		"paint": {
			"type": "object"
		},
		"filter": {
			"type": "object"
		},
		"directory":{
			"type":"string"
		},
		"directoryOpen":{
			"type":"boolean"
		},
		"groupLayer":{
			"type":"string"
		},
		"icon":{
			"type":"string"
		}
	}
}

var mapStateSchema = {
	"type":"object",
	"properties":{
		"map" : {"$ref": "/mapSchema"},
		"layers": {'type':"array", "items":{"$ref": "layerSchema"} },
		"shapes": {'type':'object'},
		"labels": {'type':'array', "items":{'type':'object'}}
	},
	"required":["map", "layers"],
	"additionalProperties": false
}

v.addSchema(mapSchema, '/mapSchema');
v.addSchema(layerSchema, '/layerSchema');

/* global */
var app = express()

app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

/* write views via post */
app.post('/view/', function (req, res) {

  	fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

	res.header('Content-Type', 'application/javascript');

	//validate object
	if(!req.body){
		return res.status(400).end('{"status": "failure", "message":"Must provide a JSON view object."}');
	}

	if(typeof(req.body) !== 'object' || !Object.keys(req.body).length){
		return res.status(400).end('{"status": "failure", "message":"Must provide a JSON object."}');
	}

	var valid = v.validate(req.body, mapStateSchema)

	if(valid.errors.length){
		var error_message = valid.errors.reduce(function(acc, err){return acc += ', '+err.stack.replace('"','')})
		return res.status(400).end('{"status": "failure", "message":"'+error_message+'"}');
	}

	writeView(req.body, function(err, id){
		if(err){
			return res.status(400).end('{"status" : "failure", "msg": "' + err + '"}');
		} else {
			return res.status(200).end('{"status" :"success", "msg":"Saved view", "id":"'+id+'"}');
		}
	});

});

/* read views via get */
app.get('/view/:id*?', function (req, res) {

	res.header('Content-Type', 'application/javascript');

	if(!req.params.id){
		return res.status(400).end('{"status": "failure", "message":"Must provide an id for a view."}');
	}

	readView(req.params.id, function(err, obj){
		if(err){
			return res.status(400).end('{"status": "failure", "message":"View not found"}');
		} else {
			return res.status(200).send(obj);
		}
	});

});

// app.post('/share/', function (req, res){

// 	var sender = '', //your (gmail) email address here;
// 		pass = ''; //your password

// 	// Todo - scrub the contents of the message..
// 	//client/server side validation of email address
// 	var smtpConfig = {
//         host: 'smtp.gmail.com',
//         port: 587,
//         requiresAuth: true, // use SSL
//         domains: ["gmail.com", "googlemail.com"],
//         auth: {
//             user: sender,
//             pass: pass
//         }
//     };

//     var transporter = nodemailer.createTransport(smtpConfig);

//     var appLink = req.get('referer').replace('share/','')+'#'+req.body.id

//     var mailOptions = {
//         from: sender, // sender address
//         to: req.body.recpt, // list of receivers
//         subject: 'Website link', // Subject line
//         text: "Check out this web map! " + '\r\n\r\n'+appLink // plaintext body
//     };

//     // send mail with defined transport object
//     transporter.sendMail(mailOptions, function(error, info){
//     	res.writeHead(200, {
// 			'Content-type' : 'application/javascript'
// 		});

//         if(error){
//         	return res.status(200).end('{"status" : "failure", "message":"'+error+'" }');
//         } else {
// 			return res.status(200).end('{"status" :"success", "msg":"View shared with '+req.body.recpt+'", "id":"'+req.body.id+'"}');
// 		}
//     });
// })

app.get('/:id*?', function(req, res){

	//could do server side rendering here //

	//client side view acquisition here

	res.sendFile('index.html', {root: __dirname});
});

app.use(function(req,res){
	res.status(500).end('{"status": "failure", "url":"'+req.headers.host+'", "message":"Please either POST data to the /view/ function or GET /view/ with a state id"}');
});

app.listen(4005, function () {
  console.log('Example app listening on port 4005!')
})

function _writeViewToJSONFile(jsonobj, cb){

	var id = uuid.v1().substr(0, 8);

	jsonfile.writeFile('./data/'+id+'.json',jsonobj, function(err, msg){
		if(err){
			cb(err)
		} else {
			cb(null, id);
		}
	})
}

function _readViewFromJSONFile(id, cb){
	jsonfile.readFile('./data/'+id+'.json', function(err, obj){
		if(err){
			cb(err)
		} else {
			cb(null, obj)
		}
	})
}

function _writeViewToSQLiteDB(jsonObj, cb){

	var id = uuid.v1().substr(0, 8);

	db.exec("INSERT into views (id, view) values ('"+id+"', '" +JSON.stringify(jsonObj)+ "')", function(err, row) {

		if(err){
			cb(err);
		} else {
			cb(null, id);
		}
	});
}

function _readViewFromSQLiteDB(id, cb){

	db.get("SELECT view from views where id='"+id+"'", function(err, row){
		if(err || !row){
			cb(err)
		} else {
			cb(null, row.view)
		}
	});
}

module.exports = app