var logger          = require('winston');

var Data_package    = require('../data_api/data_package.js');
var Game_state      = require('../data_api/game_state.js');
var Player          = require('../data_api/player.js');
var Action          = require('../data_api/action.js');
var Cards           = require('../data_api/cards.js');
var board_builder   = require('./board_builder.js');
var board           = require('../../public/data_api/board.js');

function Game(lobby) {

    // Reference to the game lobby
    this.lobby          = lobby;

    this.board          = board_builder.generate();

    this.max_players    = 2;
    this.players        = [];

    this.game_full      = false;
    this.round_num      = 1;

    this.player_colours = ['purple', 'red', 'blue', 'green'];

    this.setupComplete  = false;
    this.setupSequence = [0,1,1,0];
    this.setupPointer = 0;

    this.development_cards = [];
}

// Adds a player to the game
Game.prototype.add_player = function(player) {

    var _self = this;

    console.log('adding player');

    // Add player to the game
    this.players.push(player);

    // Store the player id
    player.id = this.players.indexOf(player);

    // Assign a color to this player
    player.colour = this.player_colours[player.id];

    //  Send the player details

    player.socket.emit('player_id', { name : player.name, id : player.id, colour : player.colour });

    // Listen for game updates from this socket
    player.socket.on('game_update', function(data) {
        _self.turn_update(data);
    });

    // Listen for a disconnect - if any player disconnects we'll need
    // to terminate the game
    player.socket.on('disconnect', function() {
        _self.broadcast('game_error', {
            message : player.name + ' has disconnected. Game Over.'
        });

        _self.lobby.remove_game(this);
    });

    // Start the game if we have all the players
    if (this.players.length === this.max_players) {

        this.game_full = true;

        // Begin the game
        this.broadcast('game_start', {});
        //this.broadcast_gamestate();

        //  Create the board and send it to the clients
        this.broadcast('build_board', this.buildBoard());
        this.broadcast_gamestate();

        logger.log('debug', 'start the placement sequence.');
        this.startSequence()
    }

    // Notify the other players that a new player has joined
    /*
    this.broadcast('player_joined', {
        player_count    : this.players.length,
        max_players     : this.max_players
    });
*/

    // Temporary events to mimic game flow
    player.socket.on('place_settlement', function() {
        this.turn_update();
    });

    
    console.log('Player number ' + (this.players.length) + ' has been added');
    return true;
};

/**
 *
 */

/**
 * Handles an update event from the game
 */
Game.prototype.turn_update = function(data) {
    this.players[data.player_id].turn_complete = true;
    this.players[data.player_id].turn_data = data;

    // Determine if the round is complete, ie. all players have 
    // indicated their round is complete
    var round_complete = this.players.every(function(player) {
        return player.turn_complete === true;
    });
    
    // setupComplete flag false so that one player can place a settlement per turn in setup phase
    if (round_complete || !this.setupComplete) {
        this.process_round();        
    }

    this.broadcast_gamestate();
    
    if(!this.setupComplete){
        logger.log('debug', 'Player '+data.player_id+' has tried to place a settlement.');

        //distribute resources from the second round settlement placement
        if(this.setupPointer > this.setupSequence / 2){
            this.second_round_resources(data);
        }
        

        //call start sequence again from here - startSequence will find the next player to have a turn
        this.startSequence();
    }
};

/**
 * Start Sequence
 */
Game.prototype.startSequence = function(setup_data){
    console.log('startSequence Called');
    logger.log('debug', 'startSequence function called.');

    //Create data package for setup phase
    var setup_data = new Data_package();
    setup_data.data_type = 'setup_phase';

    if(this.setupPointer < this.setupSequence.length){

        // send all players except one a wait command
        for (var i = 0; i < this.players.length; i++){

            if(i !== this.setupSequence[this.setupPointer]){
                
                //not this player's turn to place a settlement and road
                setup_data.player = 0; 
                logger.log('debug', 'Send data for player to wait');
                this.players[i].socket.emit('game_turn', setup_data);
            }else{

                //this player's turn to place a settlement and road (1=first place, 2 = 2nd placement)
                if(this.setupPointer < this.setupSequence.length / 2){
                    setup_data.player = 1;
                }else{
                    console.log("Set to 2");
                    setup_data.player = 2;
                }
                
                this.players[i].socket.emit('game_turn', setup_data);
                
            }
        }
    } else {
        this.setupComplete = true;
        console.log("Setup complete");
        logger.log('debug', 'Setup phase completed');
        setup_data.data_type = 'setup_complete';
        this.broadcast('game_turn', setup_data);
    }
    this.setupPointer++;
}
 
Game.prototype.second_round_resources = function (data) {

    //distribute cards from second round settlement placement
    return true;
}

/**
 * Game logic
 */
Game.prototype.process_round = function()
{
    // For now: increment round number and reset the player turn
    // completion status
    for(var i = 0;  i < this.players.length; i++){
        // In normal play, all players should return true, in setup phase only one will
        if(this.players[i].turn_complete){
            //add player data to player object
        }
    }
    
    this.players.forEach(function(player) {
        player.turn_complete = false;
    });

    if(!this.setupComplete){
        this.round_num = this.round_num + 1;
    }
}

/**
 * Gathers up the state of the game and sends the current gamestate
 * to all the players contains all data to render the current state
 * of the game in the browser
 */
Game.prototype.broadcast_gamestate = function() {

    var players = this.players.map(function(player, idx) {
        return {
            id              : idx,
            name            : player.name,
            colour          : player.colour,
            turn_complete   : player.turn_complete,
            points          : 0
        };
    });

    var game_data = {
        players     : players,
        board       : this.board,
        round_num   : this.round_num
    };

    var jsonData = JSON.stringify(game_data);

    this.broadcast('update_game', game_data);
};

/**
 * Messages all players in the game
 */
Game.prototype.broadcast = function(event_name, data) {

    console.log('Broadcasting event: ' + event_name);
    this.players.forEach(function(player) {
        player.socket.emit(event_name, data);
    });
};

/**
 * Creates the initial board data and sends it to each client
 */
Game.prototype.buildBoard = function () {
    jsonData = JSON.stringify(this.board);
    return jsonData;
}

/*
 * Rolling two dices, and return the sum of the two dices number.
 */
Game.prototype.rollingDice=function () {
    var dice1=Math.ceil(Math.random() * 6 );
    var dice2=Math.ceil(Math.random() * 6 );
    return dice1+dice2;
}

module.exports = Game;
