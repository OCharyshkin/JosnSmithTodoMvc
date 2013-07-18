/**
 * Created with JetBrains WebStorm.
 * User: Oleg Charyshkin
 * Date: 5/30/13
 * Time: 3:54 PM
 * To change this template use File | Settings | File Templates.
 */

var TodoListViewModel = function(){

    this.todos = js.bindableList();
    this.todos.add(new TodoItemViewModel("Hello, world!!!"));
}