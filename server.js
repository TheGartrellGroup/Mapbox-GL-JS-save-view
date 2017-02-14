
/* Deps */
var express = require('express'),
jsonfile = require('jsonfile'),
//sqlite3 = require('sqlite3'),
uuid = require('node-uuid'),
Validator = require('jsonschema').Validator;

var v = new Validator();

var instance = 4;

var mapViewSchema = {
	"map": {
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
	},
	"layers": {
		"type": "array",
		"items": {
			"id": {
				"type": "string",
				"required": true
			},
			"visibility": {
				"type": "string",
				"pattern": /(visibility|none)/,
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
}

/* global */
var app = express()

app.get('/:id*?', function(req, res){

	//server side rendering here //

	//client side view acquisition here
	
	res.sendFile('index.html', {root: __dirname});
});

/* write views via post */
app.post('/view/', function (req, res) {
  
	//validate object
	if(!req.body.view){
		res.status(400).end('{"status": "failure", "message":"Must provide a view object."}');
	} 

	if(!isJSON(req.body.view)){
		res.status(400).end('{"status": "failure", "message":"Not a valid JSON object."}');
	}

	var view_object = JSON.parse(req.body.view)

	var valid = v.validate(req.body.view, mapViewSchema)

	if(valid.errors.length){
		var error_message = valid.errors.reduce(function(acc, err){acc += ' '+err.stack})
		res.status(400).end('{"status": "failure", "message":"'+error_message+'"}');
	}

	var id = uuid.v1().substr(0, 8);

	jsonfile.writeFile('/data/'+id+'.json', function(err){
		res.status(200).end('{"status": "success", "message":"Saved view"}');
	})
	
});

/* read views via get */
app.get('/view/:id', function (req, res) {
	res.send(__dirname + 'views/'+req.params.id)
});

app.use(function(req,res){
	res.status(500).end('{"status": "failure", "message":"Please either POST data to the /view/ function or GET /view/ with a state id"}');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

function isJSON(str){
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}