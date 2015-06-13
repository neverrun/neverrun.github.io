/*global d3, google*/
/*jshint camelcase: false */
google.maps.Map.prototype.boundsAt = function (zoom, center, proj, div) {
  var p = proj || this.getProjection();
  if (!p) {
    return undefined;
  }
  //var d = $(div || this.getDiv());
  var d = div || this.getDiv();
  var zf = Math.pow(2, zoom) * 2;
  var dw = d.clientWidth  / zf;
  var dh = d.clientHeight / zf;
  var cpx = p.fromLatLngToPoint(center || this.getCenter());
  var llb = new google.maps.LatLngBounds(
      p.fromPointToLatLng(new google.maps.Point(cpx.x - dw, cpx.y + dh)),
      p.fromPointToLatLng(new google.maps.Point(cpx.x + dw, cpx.y - dh)));
  return {
    'from_long': llb.qa.j,
    'to_long': llb.qa.A,
    'from_lat': llb.za.A,
    'to_lat': llb.za.j
  };
};

// Create the Google Map…
var map = new google.maps.Map( d3.select('#map').node(), {
  zoom: 14,
  minZoom: 14,
  maxZoom: 21,
  center: new google.maps.LatLng( 50.075538, 14.437800 ),
  mapTypeId: google.maps.MapTypeId.ROADMAP
});

var buildQuery = function ( bounds, table ) {
  var url = 'http://ubuntu-bte.cloudapp.net/rest/v1/db.php?table=';
  url += table;
  url += '&limit=500';
  if ( bounds ) {
    Object.keys( bounds ).forEach( function ( key ) {
      url += '&' + key + '=' + bounds[key];
    } );
  }
  return url;
};

var padding = 0;

// Load the station data. When the data comes back, create an overlay.
var StopsLayer = function( initData ) {
  var _data = initData;
  var _layer = null;
  var _projection = null;
  var _dataKey = 'stop_id';

  var transform = function ( d ) {
    d = new google.maps.LatLng( d.stop_lat, d.stop_lon );
    d = _projection.fromLatLngToDivPixel( d );
    return d3.select( this )
      .style('left', ( d.x - padding ) + 'px')
      .style('top', ( d.y - padding ) + 'px');
  };

  var transformWithEase = function ( d ) {
    d = new google.maps.LatLng( d.stop_lat, d.stop_lon );
    d = _projection.fromLatLngToDivPixel( d );
    return d3.select( this )
      .transition().duration(300)
      .style('left', ( d.x - padding ) + 'px')
      .style('top', ( d.y - padding ) + 'px');
  };

  // Add the container when the overlay is added to the map.
  this.onAdd = function() {
    _layer = d3.select( this.getPanes().overlayLayer ).append('div')
    .attr('class', 'stations');
  };

  // Draw each marker as a separate SVG element.
  // We could use a single SVG, but what size would it have?
  this.draw = function() {
    _projection = this.getProjection(),
    padding = 100;

    var marker = _layer.selectAll('svg')
      .data( _data, function ( d ) {
        return d[_dataKey];
      } )
      .each( transform ) // update existing markers
      .enter().append('svg:svg')
      .each( transform )
      .attr('class', 'marker');

    // Add a circle.
    var getRadius = function() {
      return 10;
    };
    marker.append('svg:circle')
      .attr('r', getRadius )
      .attr('cx', 100 )
      .attr('cy', 100 );

    // Add a label.
    marker.append('svg:text')
      .classed( 'label', true )
      .attr('x', padding + 7 )
      .attr('y', padding )
      .attr('dy', '.31em')
      .text( function( d ) { return d.stop_name; } );

    _layer.selectAll( 'text.label' ).transition()
      .duration( 500 );
  };

  this.onRemove = function () {
    _layer.remove();
  };

  this.update = function ( data ) {
    //update internal data which drive redrawing on zoom_changed
    for (var i = 0; i < data.length; i++) {
      var found = false;
      for (var j = 0; j < _data.length; j++) {
        if (_data[j][_dataKey] === data[i][_dataKey]) {
          found = true;
          _data[j].stop_lat = data[i].stop_lat;
          _data[j].stop_lon = data[i].stop_lon;
        }
      }
      if ( !found ) {
        _data.push(data[i]);
      }
    }
    this.draw();
    _layer.selectAll("svg")
      .data(_data, function (d) { return d[_dataKey]; })
      .each(transformWithEase);
  };
};

StopsLayer.prototype = new google.maps.OverlayView();

var RoutesLayer = function( initData ) {
  var _data = initData;
  var _layer = null;
  var _projection = null;
  var _dataKeyFn = function ( d ) {
    return d.lat + d.lon;
  };

  var transform = function ( d ) {
    d = new google.maps.LatLng( d.lat, d.lon );
    d = _projection.fromLatLngToDivPixel( d );
    return d3.select( this )
      .style('left', ( d.x - padding ) + 'px')
      .style('top', ( d.y - padding ) + 'px');
  };

  var transformWithEase = function ( d ) {
    d = new google.maps.LatLng( d.lat, d.lon );
    d = _projection.fromLatLngToDivPixel( d );
    return d3.select( this )
      .transition().duration(300)
      .style('left', ( d.x - padding ) + 'px')
      .style('top', ( d.y - padding ) + 'px');
  };

  // Add the container when the overlay is added to the map.
  this.onAdd = function() {
    _layer = d3.select( this.getPanes().overlayLayer ).append('div')
    .attr('class', 'stations');
  };

  // Draw each marker as a separate SVG element.
  // We could use a single SVG, but what size would it have?
  this.draw = function() {
    _projection = this.getProjection(),
    padding = 100;

    var marker = _layer.selectAll('svg')
      .data( _data, _dataKeyFn )
      .each( transform ) // update existing markers
      .enter().append('svg:svg')
      .each( transform )
      .attr('class', 'marker');

    // Add a circle.
    var getRadius = function() {
      return 10;
    };
    marker.append('svg:circle')
      .attr('r', getRadius )
      .attr('cx', 100 )
      .attr('cy', 100 );

    // Add a label.
    marker.append('svg:text')
      .classed( 'label', true )
      .attr('x', padding + 7 )
      .attr('y', padding )
      .attr('dy', '.31em')
      .text( function( d ) { return d.stop_name; } );

    _layer.selectAll( 'text.label' ).transition()
      .duration( 500 );
  };

  this.onRemove = function () {
    _layer.remove();
  };

  this.update = function ( data ) {
    //update internal data which drive redrawing on zoom_changed
    for (var i = 0; i < data.length; i++) {
      var found = false;
      for (var j = 0; j < _data.length; j++) {
        if ( _dataKeyFn( _data[j] ) === _dataKeyFn( data[i] ) ) {
          found = true;
          _data[j].lat = data[i].lat;
          _data[j].lon = data[i].lon;
        }
      }
      if ( !found ) {
        _data.push(data[i]);
      }
    }
    this.draw();
    _layer.selectAll("svg")
      .data(_data, _dataKeyFn )
      .each(transformWithEase);
  };
};

RoutesLayer.prototype = new google.maps.OverlayView();

// Create layers and add to map
var stopsLayer= new StopsLayer( [] );
stopsLayer.setMap( map );

var routesLayer= new RoutesLayer( [] );
routesLayer.setMap( map );

// Listen for map changes
google.maps.event.addListener( map, 'idle', function() {
  var bounds = this.boundsAt( this.zoom );
  var query = buildQuery( bounds, 'stops' );
  //d3.json( query, function ( data ) {
  //  stopsLayer.update( data );
  //} );

  query = buildQuery( bounds, 'pid_routes' );
  d3.json( query, function ( data ) {
    routesLayer.update( data );
  } );
});
