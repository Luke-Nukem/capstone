/********************************************
*  Basic getters for board elements
*********************************************/
function Board() {
    this.nodes = [];
    this.roads = [];
    this.tiles = [];
    this.node_tree;
}

/********************************************
*  Basic getters for board elements
*********************************************/
/// returns road object
Board.prototype.get_road = function (index) {
  return this.roads[index];
}

/// returns node object
Board.prototype.get_node = function (index) {
  return this.nodes[index];
}

/// returns tile object
Board.prototype.get_tile = function (point) {
  return this.tiles[point.y][point.x];
};

/// returns resource type string
Board.prototype.get_tile_resource_type = function (point) {
  return this.tiles[point.y][point.x].type;
};

/********************************************
*  More advanced getters for board elements
*********************************************/
/// returns the index numbers for nodes
Board.prototype.get_node_indexes_from_road = function (index) {
  return [this.nodes[this.roads[index].connects[0]],
          this.nodes[this.roads[index].connects[1]]];
}

/// returns an array of tile objects
Board.prototype.get_tiles_with_resource = function (resource) {
  var array = [];
  for (var y=0; y< this.tiles.length; y++) {
    for (var x=0; x< this.tiles.length; x++) {
      var tile = this.tiles[y][x];
      if (tile.type === resource)
        array.push(tile);
    }
  }
  return array;
};

/// returns an array of player names
Board.prototype.get_players_with_resource = function (resource) {
  var players = [];
  var tiles = this.get_tiles_of_resource(resource);
  for (var t=0; t<this.tiles.length; t++) {
    if (this.tiles[t].owner)
      players.push(this.tiles[t].owner);
  }
  return players;
};

/// returns an array of indexes for Board.nodes
Board.prototype.get_shore_node_indexes = function() {
  var nodes = [];
  for (var n=0; n<this.nodes.length; n++) {
    var count = 0;
    for (var t=0; t<this.nodes[n].tiles.length; t++) {
      var tile = this.nodes[n].tiles[t];
      if (tile.type === 'water') {
        count +=1;
      }
    }
    if ((count === 1 || count === 2) && count !== 3) {
      nodes.push(n);
    }
  }
  return nodes;
}

/// returns an array of indexes for Board.nodes
Board.prototype.get_shore_road_indexes = function() {
  var roads = [];
  var nodes = this.get_shore_node_indexes();
  for (var r=0; r<this.roads.length; r++) {
    if (nodes.indexOf(this.roads[r].connects[0]) && nodes.indexOf(this.roads[r].connects[0]))
    roads.push(r);
  }
  return roads;
}

// TODO: should build a binary tree at some point for this.
// Board.prototype.is_path_to_owned_by(start_node, end_node, owner)

/********************************************
*  Misc
*********************************************/

/*
*  A Points object for storing coordinates - forces integer
*/
function Point(x,y) {
    this.x = parseInt(x);
    this.y = parseInt(y);
};

function RoadNode(connects) {
    this.connects = connects; // nodes that are neighbours of this node
    this.owner = "";
};

function BuildNode(n_tiles) {
    this.n_tiles = n_tiles; // tiles this node intersects
    this.n_nodes = []; // nodes that are neighbours of this node
    this.building = "";//
    this.owner = "";
};

function TileNode(type, robber, token, asso) {
    this.type = type;
    this.robber = robber;
    this.token = token;
    this.associated_nodes = asso;
};

TileNode.prototype.get_node_by_corner_num = function(corner_number) {
  return this.associated_nodes[corner_number];
};

TileNode.prototype.get_node_by_dir = function(direction) {
  if (direction === "bottom_right") {
    return this.associated_nodes[0];
  } else if (direction === "bottom_mid") {
    return this.associated_nodes[1];
  } else if (direction === "bottom_left") {
    return this.associated_nodes[2];
  } else if (direction === "top_left") {
    return this.associated_nodes[3];
  } else if (direction === "top_mid") {
    return this.associated_nodes[4];
  } else if (direction === "top_right") {
    return this.associated_nodes[5];
  }
};

// function is_connected_to?

/*
*  Takes the center point of tile, the tile height, and corner number to find (0..5)
* Corner #0 is top-right corner, rotating through clockwise
*
*  Returns a pixel coordinate which is the corner, and center of node hotspot

function hex_corner(center, tile_height, i) {
  var angle_deg = 60 * i   + 30;
  var angle_rad = PI / 180 * angle_deg;
  return Point(center.x + tile_height * cos(angle_rad), center.y + tile_height * sin(angle_rad));
};
*/
module.exports = { Board, Point, TileNode, RoadNode, BuildNode };
