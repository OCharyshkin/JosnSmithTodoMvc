(function( window ) {
	'use strict';


    var todos = js.bindableList();


    var TodoItemView = function(){
        this.template = '#todoItemTemplate';
        this.init = function(viewModel){

            this.bind(viewModel.text).to('.todoItemText');
            this.bind(viewModel.isSelected).to('.todoItemIsSelected');
        };
    };

    js.bind(todos).to("#todo-list", TodoItemView);
    todos.setValue([new TodoItemViewModel("Hello, world!!!")]);



})( window );
