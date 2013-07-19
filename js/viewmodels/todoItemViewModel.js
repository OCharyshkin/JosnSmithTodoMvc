/**
 * Created with JetBrains WebStorm.
 * User: Oleg Charyshkin
 * Date: 5/30/13
 * Time: 3:55 PM
 * To change this template use File | Settings | File Templates.
 */

var TodoItemViewModel = function(text){

    this.id = 0;
    this.text = js.bindableValue();
    this.isCompleted = js.bindableValue();

    this.text.setValue(text);
    this.isCompleted.setValue(false);

    this.editing = false;

}