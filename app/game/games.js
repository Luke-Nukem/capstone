var logger = require('winston');
var Player = require('../data_api/player.js');
var sm = require("./state_machine.js");

/********************************************************
* Games was Lobby - renamed to suit task
*
* The primary task here is to funnel players in to games,
* link socket requests, and to manage games
********************************************************/

function Games() {
    this.games = []; // array of StateMachine objects, each corrosponds to one started game
}

/**
 * Finds a game adds a user to it, create new game instances
 * as needed
 *
 * This is where the bulk of player setup will be, eg: sockets + game
 *
 * @param {obj} socket
 * @param {obj} data
 */
Games.prototype.assign_player = function(socket, data) {
    var self = this; // assign this object to a var so we can use it...
    var player = new Player(socket, data);

    // Create a new game instance if we dont have available to put this player into
    if (this.games.length === 0 || this.games[this.games.length - 1].game.game_full()) {
        console.log('Creating an new game');
        this.games.push(new sm.StateMachine());
    }
    var state_machine = this.games[this.games.length-1];

    console.log('Number of games = ' + this.games.length);
    this.games[this.games.length - 1].game.add_player(player);

    // Notify the other players that a new player has joined
    state_machine.broadcast('player_joined', {
        player_count    : state_machine.game.players.length,
        max_players     : state_machine.game.max_players
    });
    /**************************************************/
    /*    Create listeners on sockets for messages    */
    /**************************************************/
    /// Game update will parse the data and find the players action.
    /// From there the state_machine will parse the unpacked data
    // TODO: an alternative to "action" in the API, is to have the
    //       action be the message here
    player.socket.on('game_update', function(data) {
        // state_machine function to be called
        state_machine.tick(data);
    });

    player.socket.on('disconnect', function() {
        state_machine.broadcast('player_quit', {
            message : player.name + ' has disconnected. Game Over.'
        });

        self.remove_game(state_machine);
    });
    /**************************************************/
    /*           Listener creation ends               */
    /**************************************************/

    // Start the game if we have all the players
    if (state_machine.game.game_full()) {
        state_machine.broadcast('game_start', {});
        //  Create the board and send it to the clients
        state_machine.broadcast('build_board', state_machine.game.buildBoard());
        state_machine.broadcast_gamestate();
        state_machine.game_start_sequence();
    }
};


/// Removes a game instance from the active games
Games.prototype.remove_game = function(state_machine) {
    var idx = this.games.indexOf(state_machine);
    this.games.splice(idx, 1);
};

/// Resets all the games - use for debugging
Games.prototype.hard_reset = function() {
    this.games = [];
    console.log('Games have been reset.');
};

/********************************************************/
/* General purpose functions for Games and StateMachine */
/********************************************************/

/*
 * Rolling two dices, and return the sum of the two dices number.
 */
function rollingDice() {
    var dice1=Math.ceil(Math.random() * 6 );
    var dice2=Math.ceil(Math.random() * 6 );
    return dice1+dice2;
}

module.exports = { Games, rollingDice };