﻿//set turn actions here so they are available in client.js
var turn_actions    = [];

function setupDragDrop() {
    //  Allow the house to be put back
    $(".housebox").droppable({
        hoverClass: "hover",
        accept: function (d) {
            if (d.hasClass("house")) { return true; }
        },
        drop: function (event, ui) {
            return_object_on_drop(event, ui);
        }
    });

    //  Allow the city to be put back
    $(".citybox").droppable({
        hoverClass: "hover",
        accept: function (d) {
            if (d.hasClass("city")) { return true; }
        },
        drop: function (event, ui) {
            return_object_on_drop(event, ui);
        }
    });

    //  Allow the road to be put back
    $(".roadbox").droppable({
        hoverClass: "hover",
        accept: function (d) {
            if (d.hasClass("road")) { return true; }
        },
        drop: function (event, ui) {
            return_object_on_drop(event, ui);
        }
    });

    //  Setup house drag/drop
    $(".house:not(.locked)").draggable({
        revert: 'invalid',
        start: function (event, ui) {
            show_open_spots("house", event.target.id);
        },
        drag: function () {
        },
        stop: function (event, ui) {
            hide_open_spots("house");
        }
    });
    $(".buildspot:not(.disabled)").droppable({
        greedy: true,
        accept: function (d) {
            if (d.hasClass("house") || d.hasClass("city")) {
                return true;
            }
        },
        drop: function (event, ui) {
            set_object_on_canvas(event, ui);
        }
    });

    //  Setup city drag/drop
    $(".city").draggable({
        revert: 'invalid',
        start: function (event, ui) {
            show_open_spots("city", event.target.id);
        },
        drag: function () {
        },
        stop: function (event, ui) {
            hide_open_spots("city");
        }
    });

    //  Setup road drag/drop
    $(".road:not(.roadspot, .locked)").draggable({
        revert: 'invalid',
        start: function (event, ui) {
            show_open_spots("road", event.target.id);
        },
        drag: function () {
        },
        stop: function (event, ui) {
            hide_open_spots("road");
        }
    });
    $(".roadspot:not(.disabled)").droppable({
        greedy: true,
        accept: function (d) {
            if (d.hasClass("road")) {
                return true;
            }
        },
        drop: function (event, ui) {
            set_object_on_canvas(event, ui);
        }
    });

}

//  Method to show the ghost images for any valid nodes that this object
//  can be built on
function show_open_spots(object_type, ignore_id) {
    //  The very first task is to see if we have the resources
    if (has_resources(object_type)) {
        //  Local reference to nodes object
        var nodes = current_game.nodes;
        if (object_type == "road") {
            nodes = current_game.roads;
        }

        //  If object is on the canvas, ignore the associated node
        var node_to_ignore = null;
        if (ignore_id.indexOf("_pending_") > -1) {
            ignore_id = parseInt(ignore_id.replace(object_type + "_" + current_game.player.colour + "_pending_", ""));
            node_to_ignore = nodes[ignore_id];
            
            //  Does this object have dependents (i.e. If we remove this object, does it orphan other objects?)
            return_dependents(object_type, node_to_ignore);
        }

        //  During setup, we can only place 1 house and 1 road
        if (current_game.round_num < 3 && node_to_ignore == null && turn_actions.length == 2) {
            return false;
        }

        //  Now manage specific object types
        if (object_type == "house") {
            if (current_game.round_num < 3) { // TODO: remove magic number
                if (turn_actions.length == 0 || node_to_ignore == turn_actions[0].action_data) {
                    //  Setup mode: Show all valid build spots on the board
                    $(".buildspot:not(.locked)").hide();
                    $(".buildspot:not(.locked)").each(function () {
                        //  Find the node in the nodes object based on the id of this object
                        var node_id = parseInt($(this).attr('id').replace("node_", ""));

                        //  Now check to see if we can build here
                        if (can_build(nodes[node_id], node_to_ignore)) {
                            $(this).show();
                        }
                    });
                }
            } else {
                //  Normal mode: Show build spots this user can reach
                if (can_build(nodes[node_id], node_to_ignore)) {
                    $(this).show();
                }
            }
        }
        if (object_type == "road") {
            //  During setup, we can only place a road on the house from this round
            var node_to_enforce = null;

            //  Is this a setup round?
            if (current_game.round_num < 3) {
                //  If no house has been placed yet, nothing to do
                if (turn_actions.length == 0) { return false; }

                //  If we have a house, then it is the only house we can use
                if (turn_actions.length > 0) {
                    node_to_enforce = turn_actions[0].action_data;
                }
            }

            //  All modes: show road spots user is connected to
            $(".roadspot:not(locked)").each(function () {
                //  Find the road in the roads object based on the id of this object
                var road_id = parseInt($(this).attr('id').replace("road_", ""));
                if (can_build_road(nodes[road_id], node_to_ignore, node_to_enforce)) {
                    $(this).show();
                }
            });
        }

        if (object_type == "city") {
            //  Not allowed in setup mode, all other modes
            if (current_game.round_num > 2) {
                $(".node.house.locked." + current_player.colour).each(function () {
                    $(this).addClass("expand");
                });
            }
        }
    }
}
function hide_open_spots(type) {
    $(".buildspot:not(locked)").hide();
    $(".roadspot:not(locked)").hide();
    $(".node.house.locked." + current_player.colour).each(function () {
        $(this).removeClass("expand");
    });
}

//  When a building it dropped on the board
function set_object_on_canvas(event, ui) {
    //  From the canvas, get the node and object being dragged
    var object_dragged_id = ui.draggable[0].id;
    var object_dragged = $("#" + object_dragged_id);
    var node_on_canvas = $("#" + event.target.id);

    //  Get the type of structure
    var object_type = (object_dragged_id.indexOf("house") > -1 ? "house" : (object_dragged_id.indexOf("road") > -1 ? "road" : "city"));
    //  Nodes vs Roads reference
    var nodes = current_game.nodes;
    if (object_type == "road") {
        nodes = current_game.roads;
    }

    //  Grab the node/road based on the drop target
    var node_id = parseInt(node_on_canvas.attr("id").replace("road_", "").replace("node_", ""));
    var node = nodes[node_id];

    //  Update game data node/road
    if (node.building) { node.building = object_type; }
    node.status = "pending";
    node.owner = current_player.id;

    //  If the object came from another node, clear that node
    if (object_dragged_id.indexOf("_pending_") > -1) {
        var last_node_id = parseInt(object_dragged_id.replace(object_type + "_" + current_player.colour + "_pending_", ""));
        var last_node = nodes[last_node_id];
        if (node.building) { last_node.building = ""; }
        last_node.owner = -1;

        //  Remove it from the turn_actions array
        remove_action_from_list(object_type, last_node_id);
    }

    //  Adjust top/left to match node and put it in the body
    object_dragged.css("top", node_on_canvas.css("top"));
    object_dragged.css("left", node_on_canvas.css("left"));
    object_dragged.appendTo($("body"));

    //  Finally, adjust the class of this object to point to this node
    $("#" + object_dragged_id).attr("id", object_type + "_" + current_player.colour + "_pending_" + node_id);

    //  If this is a road, we might need to adjust the angle
    if (object_type == "road") {
        var classes = node_on_canvas.attr('class').split(' ');
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].indexOf("angle") > -1) {
                var object_class = object_dragged.attr('class').replace("angle30", "").replace("angle90", "").replace("angle330", "");
                object_dragged.attr("class", object_class);
                object_dragged.addClass(classes[i]);
                break;
            }
        }
    }

    //  Create our action
    create_player_action(object_type, node, null);
    if (current_game.round_num > 2) {
        //  Prompt the user for more cards
        start_build_popup(object_type);
    }
    update_object_counts();
}

function create_player_action(object_type, node, boost_cards){
    var action = new Action();
    action.action_type = (object_type == "road" ? "build_road" : "build_settlement");
    action.action_data = node;
    action.boost_cards = boost_cards;
    turn_actions.push(action);
}

//  If returning an object to the pile, reset position and class
function return_object_on_drop(event, ui) {
    var object_dragged_id = ui.draggable[0].id;
    var object_dragged = $("#" + object_dragged_id);
    var node_id = -1;

    //  Do we have an associated node already on the canvas?
    if (object_dragged_id.indexOf("_pending_") > -1) {
        var object_diced = object_dragged_id.split('_');
        node_id = parseInt(object_diced[object_diced.length-1]);
    }

    return_object(object_dragged, object_dragged_id, node_id);
}

function return_object(object_to_return, object_to_return_id, last_node_id) {
    //  First check to see if this is coming from something already on the canvas
    if (last_node_id > -1) {
        //  Get the type of structure
        var object_type = (object_to_return_id.indexOf("house") > -1 ? "house" : (object_to_return_id.indexOf("road") > -1 ? "road" : "city"));

        //  Nodes vs Roads reference
        var nodes = current_game.nodes;
        if (object_type == "road") {
            nodes = current_game.roads;
        }

        //  Need node id to remove or modify turn_action currently splitting div name
        var split_div_name = object_to_return_id.split('_');
        var node_id = parseInt(split_div_name[split_div_name.length - 1]);

        //  Find corresponding Action in actions array to modify or remove
        remove_action_from_list(object_type, node_id);

        //  Clear the node it was dropped on
        var last_node = nodes[last_node_id];
        if (last_node.building) { last_node.building = ""; }
        last_node.owner = -1;

        //  Reset class
        object_to_return.attr('class', object_type + ' ' + current_player.colour + ' ' + (object_type == "road" ? "angle30 " : "") + 'ui-draggable ui-draggable-handle');
        object_to_return.attr('style', '');

        //  Append to appropriate pile and clear positioning
        object_to_return.appendTo($("." + object_type + "box"));

        //  Reset ID
        var original_class = object_type + '_' + current_player.colour + '_open_';
        object_to_return.attr('id', original_class + find_next_object_id(original_class));

        //  Update counts
        update_object_counts();
    } else {
        object_to_return.attr('style', '');
    }

}

//  A recursive method to see if any "pending" nodes/roads on the canvas
//  no longer have a valid path when this node/road is removed
function return_dependents(object_type, node) {
    //  Are we using nodes or roads?
    var nodes = current_game.nodes;
    if (object_type == "road") { nodes = current_game.roads; }
    
    //  Temporarily remove this node from the game_state nodes/roads
    var tempNode = new BuildNode();
    stash_node(object_type, tempNode, node);

    //  Now check all pending items in turn_actions to see if they can reach a locked node/road
    for (var i = 1; i < turn_actions.length; i++) {
        var next_object_type = (turn_actions[i].action_type == "build_road" ? "road" : "house");
        var next_object_node = turn_actions[i].action_data;
        if (node.id != next_object_node.id) {
            if (!has_valid_path(next_object_type, next_object_node, "")) {
                //  No path found, so we need to return it to the pile and remove it from the canvas
                var object_to_return = $("#" + next_object_type + "_" + current_player.colour + "_pending_" + next_object_node.id);
                return_object(object_to_return, object_to_return.attr("id"), next_object_node.id);
            }
        }
    }

    //  Restore the original node
    restore_node(object_type, tempNode, node);
}

//  A recursive method to find a locked node or road for this player
function has_valid_path(object_type, node, checked) {
    var has_path = false;

    //  Make sure we have not already checked this node/road
    if (checked.indexOf(object_type + ":" + node.id) > -1) {
        return has_path;
    }
    checked += object_type + ":" + node.id + ",";

    //  No reason to be here if there is no owner
    if (node.owner == -1) {
        return false;
    }

    //  If this spot holds a locked node/road
    if (node.owner == current_player.id && node.status != "pending") {
        return true;
    }

    //  Otherwise we keep going
    if (object_type == "house") {
        for (var i = 0; i < node.n_roads.length; i++) {
            has_path = has_path & has_valid_path("road", current_game.roads[node.n_roads[i]], checked);
            if (has_path) { break; }
        }
        if (!_has_path) {
            for (var i = 0; i < node.n_nodes.length; i++) {
                has_path = has_path & has_valid_path("house", current_game.nodes[node.n_nodes[i]], checked);
                if (has_path) { break; }
            }
        }
    } else {
        for (var i = 0; i < node.connects.length; i++) {
            has_path = has_path & has_valid_path("road", current_game.nodes[node.connects[i]], checked);
            if (has_path) { break; }
        }
    }
    return has_path;
}

function update_object_counts() {
    //  Count the number of remaining settlements
    var count = 0;
    $(".housebox > div").each(function () {
        count ++;
    });
    $(".housecount").html(count);

    //  Count the number of remaining cities
    count = 0;
    $(".citybox > div").each(function () {
        count ++;
    });
    $(".citycount").html(count);

    //  Count the number of remaining roads
    count = 0;
    $(".roadbox > div").each(function () {
        count ++;
    });
    $(".roadcount").html(count);
}

function rotateRoad(event) {
    var ids = event.target.id.split('.');

    //  Buildings have no need to be rotated, so set default to 0
    //  Others are based on 0 being horizontal
    var angle = 0;
    if (ids[1] == 1 || ids[1] == 7) { angle = 30; }
    if (ids[1] == 3 || ids[1] == 9) { angle = 90; }
    if (ids[1] == 5 || ids[1] == 11) { angle = 330; }

    //  Swap out class
    event.toElement.className = event.toElement.className.replace("angle0", "angle" + angle).replace("angle30", "angle" + angle).replace("angle90", "angle" + angle).replace("angle330", "angle" + angle)

    //  Add new class
}

function find_next_object_id(class_name) {
    var next_id = 0;
    for (next_id = 0; next_id < 20; next_id++) {
        var next = $("#" + class_name + next_id);
        if (next.length == 0) { break; }
    }
    return next_id;
}

function remove_action_from_list(object_type, node_id){
    for ( var i = 0; i < turn_actions.length; i++ ) {
        var action_object_type = (turn_actions[i].action_type == "build_road" ? "road" : "house");
        if ( ( turn_actions[i].action_data.id === node_id ) && ( object_type === action_object_type ) ) {
            //  remove the action from the list
            turn_actions.splice(i,1);
            break;
        }
    }
}

function stash_node(object_type, new_node, old_node) {
    new_node.id = old_node.id;
    new_node.owner = old_node.owner;
    new_node.status = old_node.status;
    if (object_type == "house") { new_node.building = old_node.building;  }

    current_game.nodes[old_node.id].owner = -1;
    current_game.nodes[old_node.id].status = "";
    if (object_type == "house") { current_game.nodes[old_node.id].building = "";  }
}
function restore_node(object_type, new_node, old_node) {
    current_game.nodes[new_node.id].owner = new_node.owner;
    current_game.nodes[new_node.id].status = new_node.status;
    if (object_type == "house") { current_game.nodes[new_node.id].building = new_node.building;  }
}