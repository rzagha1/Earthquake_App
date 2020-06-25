var mapref=null;
function our_layers(map,options){
    map.setView([41.00,-73.80], 5);
    mapref=this;
    var pts= null;
    var buffs=null;
    this.renderPoints=function(jsdata)
        {
            try{
                pts=new L.GeoJSON.AJAX('http:url:8000/static/media/'+jsdata+'_points.geojson',{
                    onEachFeature: function(feature,layer){
                        layer.bindPopup('<b>Magnitude</b>= '+feature.properties.Magnitude+'<br>'+
                                         '<b>Bearing</b>= ' +feature.properties.Bearing+'<br>'+
                                         '<b>Place</b>= '+feature.properties.Place+'<br>'+
                                         '<b>KM</b>= ' +feature.properties.KM)
                    }
                });
                pts.addTo(map);
            }
            catch(e)
            {
                alert(e);
            }
        };
    this.bailPoints=function(jsdata)
        {
            map.removeLayer(pts);
        }
    this.renderBuffers=function(jsdata)
        {
            try{
                buffs=new L.GeoJSON.AJAX('http:url:8000/static/media/'+jsdata+'_buffers.geojson',{
                    style: function colors(feature){
                        if (feature.properties.Magnitude < 2){
                            return{
                                color: "#ffa07a",
                                fillOpacity: 0.5
                            }
                        }
                        else if (feature.properties.Magnitude <5 && feature.properties.Magnitude >=2){
                            return{
                                color: "#4da767",
                                fillOpacity: 0.5
                            }
                        }
                        else if (feature.properties.Magnitude >=5){
                            return{
                                color: 'Orange',
                                fillOpacity: 0.5
                                }
                            }
                        else return{
                                    color: 'Green',
                                    fillOpacity: 0.5
                                };                        
                    }
                });
                buffs.addTo(map);
            }
            catch(e)
            {
                alert(e)
            }
        };    
    this.bailBuffs=function(jsdata)
        {
            map.removeLayer(buffs);
        };

    var options= {
    position: 'topleft',         // Leaflet control position option
    circleMarker: {               // Leaflet circle marker options for points used in this plugin
        color: 'red',
        radius: 2
    },
    lineStyle: {                  // Leaflet polyline options for lines used in this plugin
        color: 'red',
        dashArray: '1,6'
    },
    lengthUnit: {                 // You can use custom length units. Default unit is kilometers.
        display: 'km',              // This is the display value will be shown on the screen. Example: 'meters'
        decimal: 2,                 // Distance result will be fixed to this value. 
        factor: null,               // This value will be used to convert from kilometers. Example: 1000 (from kilometers to meters)  
        label: 'Distance:'           
    },
    angleUnit: {
        display: '&deg;',           // This is the display value will be shown on the screen. Example: 'Gradian'
        decimal: 2,                 // Bearing result will be fixed to this value.
        factor: null,                // This option is required to customize angle unit. Specify solid angle value for angle unit. Example: 400 (for gradian).
        label: 'Bearing:'
    }
    }
    L.control.ruler(options).addTo(map);

    var info = L.control();   

    var selected_geom={};

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); 
        this._div.style.backgroundColor = 'white';
        this._div.type="button";
        var n=0;
        this._div.onclick=function(){
            try{
                info.update(layer_selection[Object.keys(layer_selection)[n]]);
                var geom=layer_selection[Object.keys(layer_selection)[n]]['geometry'];
                if (selected_geom != undefined) {
                    map.removeLayer(selected_geom);
                };
                selected_geom=L.geoJSON(geom,{
                    style: {"color": "#ff00bf",
                            "weight": 10,
                            "opacity": 1
                            }
                    }).addTo(map);
                n=(n+1);
            }
            catch(e){
                layer_selection={};
                n=0;
                map.eachLayer(function(layer) {
                    if (layer instanceof L.GeoJSON) {
                        layer.eachLayer(function(l){layer.resetStyle(l)})
                    }
                });
                    if (selected_geom != undefined) {
                        map.removeLayer(selected_geom);
                };
            }
          };
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = '<h5>Earthquake Info</h5>' +  (props ? '<b>Magnitude: '+ props.Magnitude +'<br>Bearing: '+props.Bearing+'<br>Place: '+props.Place: '');
    };
    info.addTo(map);

    pineapple_icon=L.icon({
        iconUrl: 'https://i.ibb.co/YhZ9xr1/pineapple.png',
        iconSize:     [15, 15],
        iconAnchor:   [10, 10],
    });

    function ProcessClick(lat,lng,ls={}){
        if (theMarker != undefined) {
            map.removeLayer(theMarker);
        };
        theMarker=L.marker([lat,lng],{icon: pineapple_icon}).addTo(map);
        var i = 0;
        map.eachLayer(function(layer) {
            if (layer instanceof L.GeoJSON) {
                layer.eachLayer(function(layer2) {
                    var click_intersection = turf.booleanPointInPolygon(theMarker.toGeoJSON(), layer2.toGeoJSON());
                    if (click_intersection) {
                        layer2.setStyle({fillColor: '#ffff00', opacity: 0.8});
                        i++;
                        props=layer2.feature.properties;
                        props['geometry']=layer2.toGeoJSON();
                        ls[i]=props;
                    };
                });
            }
            
        });
    };

    var theMarker={};
    layer_selection={};
    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        ProcessClick(lat,lng,layer_selection);
    });

var customControl =  L.Control.extend({
    options: {
      position: 'topright'
    },
    onAdd: function (map) {
      var container = L.DomUtil.create('input');
      container.type="button";
      container.value = "Clear Selected";
      container.style.backgroundColor = 'white';     
      container.style.backgroundSize = "30px 30px";
      container.style.width = '100px';
      container.style.height = '30px';
     
      container.onmouseover = function(){
        container.style.backgroundColor = 'pink'; 
      }
      container.onmouseout = function(){
        container.style.backgroundColor = 'white'; 
      }  
      container.onclick = function(){
        map.removeLayer(selected_geom);
        layer_selection={};
        n=0;
        info.update();
        map.eachLayer(function(layer) {
            if (layer instanceof L.GeoJSON) {
                layer.eachLayer(function(l){layer.resetStyle(l)})
            }
        });
      }  
      return container;
    }
  });

    map.addControl(new customControl());
    
    L.control.sidebar('side-bar').addTo(map);

    var featureGroup = L.featureGroup().addTo(map);

    new L.Control.Draw({
        edit: {
            featureGroup: featureGroup
        }
    }).addTo(map);

    map.on('draw:created', function(e) {
        featureGroup.addLayer(e.layer);
    });

    lyrOSM = L.tileLayer.provider('OpenStreetMap.Mapnik');
    lyrESRIWSM = L.tileLayer.provider('Esri.WorldStreetMap');
    lyrESRITopo = L.tileLayer.provider('Esri.WorldTopoMap');
    lyrESRIImagery = L.tileLayer.provider('Esri.WorldImagery').addTo(map);
    lyrHereHybrid = L.tileLayer.provider('HERE.hybridDay');

    objBaseMaps = {
        "Street - OSM":lyrOSM,
        "Street - ESRI":lyrESRIWSM,
        "Imagery - ESRI Imagery":lyrESRIImagery,
        "Topo - ESRI Topo":lyrESRITopo,
        "Imagery - HERE Hybrid":lyrHereHybrid,
    };
    ctlLayers = L.control.layers(objBaseMaps,{}, {sortLayers:true}).addTo(map);
};
