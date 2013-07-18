(function( window ) {
	'use strict';

    var ENTER_KEY = 13;


    var TodoListView = function(){

        var self = this;
        this.todoListViewModel = undefined;

        this.setTodoListViewModel = function(value){
            self.todoListViewModel = value;
        }

        this.clearNewItemBox = function(){
            $("#new-todo").val('');
        }

        this.init = function(){
            self.initTodoItemsViews();
        }

        this.initTodoItemsViews = function(){
            $(".destroy").click(function(event){
                var id = event.srcElement.parentElement.getElementsByClassName('todoItemId')[0].innerText;
                self.todoListViewModel.deleteItem(id);
            });
        }
    }

    var view = new TodoListView();

    var todos = new TodoListViewModel(new TodosService(), view);

    var TodoItemView = function(viewModel){
        this.template = '#todoItemTemplate';
        this.init = function(viewModel){
            this.bind(viewModel.id).to('.todoItemId');
            this.bind(viewModel.text).to('.todoItemText');
            this.bind(viewModel.isSelected).to('.todoItemIsSelected');
        };
    };



    $("#new-todo").keydown(function(event) {
        if (event.which == ENTER_KEY){
            var text =  event.srcElement.value;
            todos.addNewTodoItem(text);

            view.initTodoItemsViews();
        }
    });

    js.bind(todos.todos).to("#todo-list", TodoItemView);

    view.setTodoListViewModel(todos);
    view.init();


})( window );
