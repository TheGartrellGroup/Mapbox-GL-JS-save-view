var saveViewButton = document.getElementById('menu2')

var link = document.createElement('a');
link.href = '#';
link.textContent = 'Save View';

link.onclick = function(e) {
    saveView();
}

saveViewButton.appendChild(link)

function saveView(cb) {

    var shapes = draw.getAll();
    var labels = [];
    var layers = map.getStyle().layers.filter(function(lyr) {
        return (lyr.source && lyr.source !== 'composite' && lyr.source.indexOf('mapbox-gl-draw') == -1)
    })

    for (var i = layers.length - 1; i > -1; i--) {

        if (layers[i].source == 'markup') {

            var data = map.getSource('markup')._data;

            //drawings
            if (shapes) {
                shapes.features = shapes.features.concat(data.features);
            } else {
                shapes = map.getSource('markup')._data;
            }

            layers.splice(i, 1);
        }

        //custom text labels
        if(layers[i].id.indexOf('custom-text-label') > -1) {
            var customLabel = layers[i];
            var labelData = map.getSource(customLabel.source)._data;

            customLabel.data = labelData;

            labels.push(customLabel)
        }
    }

    //layer tree config layers
    var lyrConfigLayers = layers.filter(function(lyr) {

        //get non-grouped layers
        var ly = $.grep(map.lyrs, function(i) {
            return lyr.id === i.id;
        });

        if (!ly.length) {
            //get grouped layers
            var groupLyrs = map.lyrs.filter(function (o) {
              return o.hasOwnProperty('layerGroup')
            });

            if (groupLyrs.length) {
                var gLy = [];
                for (var i = groupLyrs.length - 1; i >= 0; i--) {
                    var sub = groupLyrs[i].layerGroup.filter(function (g) {
                        return lyr.id === g.id
                    })

                    if (sub.length) {
                        gLy = sub
                    }
                }
            }
        }

        //does this lyr.id exist in the LayerConfig?
        return (ly.length || gLy.length)
    }).map(function(ly) {
        var $directory = $('#' + ly.id).parent();

        if (!$directory.hasClass('layer-directory')) {
            $directory = $directory.parent();
        }

        var layerObj = {
            'id': ly.id,
            'visibility': (map.getLayoutProperty(ly.id, "visibility") || 'visible'),
            'directory': $directory.attr('id'),
            'directoryOpen': $('#' + ly.id).is(':visible')
        }

        if ($('#' + ly.id).parent().attr('childlayers')) {
            layerObj.groupLayer = $('#' + ly.id).parent().attr('id');
        }

        return layerObj;
    })

    var obj = {
        map: {
            zoom: map.getZoom(),
            center: [map.getCenter().lng, map.getCenter().lat],
            bearing: map.getBearing(),
            pitch: map.getPitch()
        },
        layers: lyrConfigLayers
    }

    if (shapes.features.length) {
        obj.shapes = shapes;
    }

    if (labels.length) {
        obj.labels = labels;
    }

    var oReq = new XMLHttpRequest();

    oReq.onload = function(e) {
        var obj = oReq.response;

        if (typeof(obj) === 'string') {
            obj = JSON.parse(obj)
        }
        location.hash = '#' + obj.id;

        if (cb) {
            cb(obj.id);
        }
    };

    var url = 'view/';

    if (location.pathname.substr(-1) !== '/') {
        window.history.pushState("object or string", "Title", location.pathname + '/');
    }

    oReq.open('POST', url, true);
    oReq.responseType = 'json';
    oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.send(JSON.stringify(obj));
}

function getView(viewID) {
    var oReq = new XMLHttpRequest();
    oReq.onload = function(e) {

        VIEW = oReq.response;

        if (typeof(VIEW) === 'string') {
            VIEW = JSON.parse(VIEW)
        }
        applyView()
    };
    oReq.open('GET', './view/' + viewID, true);
    oReq.responseType = 'json';
    oReq.send();
}

function applyView(viewObj) {
    map.setZoom(VIEW.map.zoom);
    map.setBearing(VIEW.map.bearing);
    map.setPitch(VIEW.map.pitch);
    map.setCenter(VIEW.map.center);
}

function applyViewShapes() {
    var i = 1;
    VIEW.shapes.features.forEach(function(shape) {
        setTimeout(function() {
            draw.add(shape)
        }, i * 1);
        i++
    })
}

function applyViewLabels() {
    var i = 1;
    VIEW.labels.forEach(function(label) {
        setTimeout(function() {
            map.addSource(label.source, { type: 'geojson', data: label.data});
            delete label.data
            map.addLayer(label)
        }, i * 1);
        i++
    })
}

function applyViewLayers() {
    $('.mapboxgl-ctrl.legend-container').on('show', function() {
        var $lyr, newDirOrder = [],
            newLyrOrder = [];

        VIEW.layers.forEach(function(lyr) {
            newLyrOrder.push(lyr.id);

            map.setLayoutProperty(lyr.id, 'visibility', lyr.visibility);
            if (LayerTree) {
                var sourceId = map.getLayer(lyr.id).source;
                var lyrSource = map.getSource(sourceId);
                if (lyr.groupLayer) {
                    document.getElementById(lyr.groupLayer).children[0].checked = lyr.visibility == 'visible';
                    checkSource(map, lyrSource, lyr.groupLayer, lyr.id,  lyr.visibility);
                } else if (document.getElementById(lyr.id)) {
                    document.getElementById(lyr.id).children[0].checked = lyr.visibility == 'visible';
                    checkSource(map, lyrSource, lyr.id, false,  lyr.visibility);
                }
            }

            if (!newDirOrder[lyr.directory]) {
                newDirOrder[lyr.directory] = [];
            }

            newDirOrder[lyr.directory].push(lyr.id);
        })

        // check if source has already been loaded on click
        function checkSource(map, lyrSource, lyrId, lgId, visibility) {
            if (onClickEnabled(map.onClickLoad, lyrSource, lgId)) {
                var ly = $.grep(map.lyrs, function(i) {
                    return lyrId === i.id;
                });

                if (ly.length) {
                    // layerGroup
                    if (lgId) {
                        var lgLy = $.grep(ly[0].layerGroup, function(i) {
                            return lgId === i.id;
                        });

                        var sourceData = visibility === 'visible' ? lgLy[0].path : emptyGJ
                        // non grouped layers
                    } else {
                        var sourceData = visibility === 'visible' ? ly[0].path : emptyGJ
                    }

                    map.getSource(lyrSource.id).setData(sourceData)
                }
            }
        }

        Object.keys(newDirOrder).reverse().forEach(function(dir) {
            $('#mapboxgl-legend').append($('#' + dir))
            newDirOrder[dir].reverse().forEach(function(lyr) {
                $lyr = $('#' + lyr);

                //check for group layers
                if ($lyr.hasClass('child-layer')) {
                    // if first child layer - move the parent(groupLayer) div
                    if ($lyr.parent().children('child-layer').first()) {
                        $('#' + dir).append($lyr.parent());
                    }
                } else {
                    $('#' + dir).append($lyr);
                }

            })
        })

        var orderArray = [];
        var layers = map.getStyle().layers;

        //this loop starts at the directory above the lowest indexed
        for (var i = newDirOrder.length - 2; i >= 0; i--) {
            var dir = newDirOrder[i];
            var layerArray = $('#' + dir).sortable('toArray');

            for (var j = layerArray.length - 1; j >= 0; j--) {
                map.moveLayer(layerArray[j]);
            };
        }

        // sort layers
        var orderArray = [];

        for (var nl = newLyrOrder.length - 1; nl >= 0; nl--) {
            if (nl !== 0) {
                map.moveLayer(newLyrOrder[nl - 1], newLyrOrder[nl])
            }
        };
    })
}

var viewID = location.hash.replace('#', '')

if (viewID) {
    getView(viewID)
}

// var showViewButton = document.getElementById('menu3')

// var link = document.createElement('a');
// link.className='click-button';
// link.textContent = 'Share View';

// link.onclick = function (e) {

//     function share(id){

//         var x = prompt('Please enter an email address to share this view:')

//         if(x){

//             var obj = {'id':id, 'recpt':x};

//             var oReq = new XMLHttpRequest();

//             oReq.onload = function (e) {
//                alert('your view has been shared')
//             };

//             if(location.pathname.substr(-1) !=='/'){
//                 window.history.pushState("object or string", "Title", location.pathname+'/');
//             }

//             oReq.open('POST', 'share/', true);
//             oReq.responseType = 'json';
//             oReq.setRequestHeader('Content-Type', 'application/json');

//             oReq.send(JSON.stringify(obj));
//         }
//     }

//     //do we have a view hash?
//     if(!location.hash){
//         saveView(share)
//     } else {
//         share(location.hash.replace('#',''))
//     }

// }

saveViewButton.appendChild(link)

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        }
    });
}