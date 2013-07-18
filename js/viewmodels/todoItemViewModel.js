/**
 * Created with JetBrains WebStorm.
 * User: Oleg Charyshkin
 * Date: 5/30/13
 * Time: 3:55 PM
 * To change this template use File | Settings | File Templates.
 */

var TodoItemViewModel = function(text){

    this.id = (new Date()).getTime();
    this.text = text;
    this.isCompleted = false;

}