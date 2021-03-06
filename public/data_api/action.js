/**
 * Action object describes a specific action for a player or
 *     a specific result from the server
 */
function Action() {
  /**
   * Action types
   *   build_settlement
   *   build_road
   *   build_city
   *   year_of_plenty
   *   monopoly
   *   soldier_knight
   *   road_building
   *   new turn
   */
  this.action_type = '';

  //action_result set to true if player action succeeds
  //  0 = win, 1 = tie, 2 = lost
  this.action_result = 2;

  //action_data will vary based on action_type
  this.action_data = [];

  //boost cards kept seperate so easy to count and to return : changed to [] as null kept failing length test
  this.boost_cards = [];
}

Action.prototype.set_action_type = function(returned_action_type) {
  this.action_type = returned_action_type;
}

Action.prototype.set_action_result = function(result) {
  this.action_result = result;
}

Action.prototype.set_boost_cards = function(cards) {
  this.boost_cards = cards;
}

Action.prototype.set_action_data = function(action_data) {
  this.action_data = action_data;
}

Action.prototype.clear_data = function() {
  this.action_type = '';
  this.action_result = false;
  this.action_data = [];
  this.boost_cards = null;
}

// TODO: Move action object inside data_package, 'action function' only required when Data_package is created
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Action;
}