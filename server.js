
/* Deps */
var express = require('express'),
jsonfile = require('jsonfile'),
//
uuid = require('node-uuid'),
Validator = require('jsonschema').Validator,
bodyParser = require('body-parser')

var SAVETO = 'JSONFILE' // or 'SQLITE'

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
		}
	}
}

var mapStateSchema = {
	"type":"object",
	"properties":{
		"map" : {"$ref": "/mapSchema"},
		"layers": {'type':"array", "items":{"$ref": "layerSchema"} },
		"shapes": {'type':'object'}
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

	if(SAVETO === 'JSONFILE'){
		_writeViewToJSONFile(req.body, function( msg){
			return res.status(200).end(msg)
		});
	} else {
		_writeViewToSQLiteDB(req.body, function(msg){
			return res.status(200).end(msg)
		})
	}

});

/* read views via get */
app.get('/view/:id*?', function (req, res) {

	res.header('Content-Type', 'application/javascript');

	if(!req.params.id){
		return res.status(400).end('{"status": "failure", "message":"Must provide an id for a view."}');
	}

	jsonfile.readFile('./data/'+req.params.id+'.json', function(err, obj){
		if(err){
			return res.status(400).end('{"status": "failure", "message":"View not found"}');
		} else {
			return res.send(obj);
		}
	})
});

app.get('/:id*?', function(req, res){

	//could do server side rendering here //

	//client side view acquisition here

	res.sendFile('index.html', {root: __dirname});
});

app.use(function(req,res){
	res.status(500).end('{"status": "failure", "message":"Please either POST data to the /view/ function or GET /view/ with a state id"}');
});

app.listen(4001, function () {
  console.log('Example app listening on port 3000!')
})

function _writeViewToJSONFile(jsonobj, cb){

	var id = uuid.v1().substr(0, 8); 

	jsonfile.writeFile('./data/'+id+'.json',jsonobj, function(err){
		if(err){
			cb('{"status": "error", "message":"'+err+'"}')
		} else {
			cb('{"status": "success", "message":"Saved view", "id":"'+id+'"}');
		}
	})
}

function _writeViewToSQLiteDB(jsonObj, cb){

	sqlite3 = require('sqlite3')

	var db = 'db/views.db';

	var id = uuid.v1().substr(0, 8); 

	db.exec("insert into views (id, view) values ('"+id+"', '" +JSON.stringify(jsonObj)+ "')", function(err, row) {

		if(err){
			cb('{"status" : "failure", "msg": "'+err+'"}');
		} else {
			cb('{"status" :"success", "msg":"Saved view '+id+'"}');
		}
	})
}

module.exports = app