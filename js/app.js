(function( window ) {
	'use strict';

    var ENTER_KEY = 13;


    var TodoListView = function(){
        this.clearNewItemBox = function(){
            $("#new-todo").val('');
        }
    }

    var todos = new TodoListViewModel(new TodosService(), new TodoListView());

    var TodoItemView = function(viewModel){
        this.template = '#todoItemTemplate';
        this.init = function(viewModel){
            this.bind(viewModel.text).to('.todoItemText');
            this.bind(viewModel.isSelected).to('.todoItemIsSelected');
        };
    };

    $("#new-todo").keydown(function(event) {
        if (event.which == ENTER_KEY){
            var text =  event.srcElement.value;
            todos.addNewTodoItem(text);
        }
    });

    js.bind(todos.todos).to("#todo-list", TodoItemView);


})( window );
