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
            $('.destroy').click(function(event){
                var id = event.srcElement.parentElement.getElementsByClassName('todoItemId')[0].innerText;
                self.todoListViewModel.deleteItem(id);
            });

            $('.todoItemIsSelected').click(function(event){
                var id = event.srcElement.parentElement.getElementsByClassName('todoItemId')[0].innerText;
                var selected = event.srcElement.checked;

                self.todoListViewModel.markItem(id, selected);
            });

            $('#toggle-all').click(function(){

                var selected = event.srcElement.checked;
                self.todoListViewModel.completeAll(selected);
            });
        }

        this.markItem = function(id, selected){

            var itemId = $('.todoItemId:contains("' + id + '")')[0];
            var itemCheckBox = itemId.parentElement.getElementsByClassName('todoItemIsSelected')[0];
            itemCheckBox.checked = selected;
            if (selected){
                itemId.parentElement.parentElement.classList.add('completed');
            }else{
                itemId.parentElement.parentElement.classList.remove('completed');
            }
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
    todos.init();


})( window );
