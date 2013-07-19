(function( window ) {
	'use strict';

    var ENTER_KEY = 13;
    var ESCAPE_KEY = 27;


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

            var TodoItemView = function(viewModel){
                this.template = '#todoItemTemplate';
                this.init = function(viewModel){
                    this.bind(viewModel.id).to('.todoItemId', { bidirectional: false });
                    this.bind(viewModel.text).to('.todoItemText', { bidirectional: false });
                    this.bind(viewModel.isCompleted).to('.todoItemIsSelected', { bidirectional: false });
                };
            };

            $('#new-todo').keydown(function(event) {
                if (event.which == ENTER_KEY){
                    var text =  event.srcElement.value;
                    todos.addNewTodoItem(text);
                    view.initTodoItemsViews();
                }
            });

            js.bind(todos.todos).to('#todo-list', TodoItemView);
            js.bind(todos.allCompleted).to('#toggle-all', { bidirectional: false });

            self.initTodoItemsViews();
        }

        this.initTodoItemsViews = function(){
            $('.destroy').click(function(event){
                self.todoListViewModel.deleteItem(getItemId(event));
            });

            $('.todoItemIsSelected').click(function(event){
                self.todoListViewModel.toogleItem(getItemId(event));
            });

            $('#toggle-all').click(function(){
                self.todoListViewModel.completeAll();
            });

            $('.todoItemText').dblclick(function(event){
                self.todoListViewModel.editItem(getItemId(event));
            });

            $('.edit').blur(function(event){
                notifyCompleteEditingItem(getItemId(event), event);
            });

            $('.edit').keydown(function(event){
                var id = getItemId(event);

                if (event.which == ENTER_KEY){
                    notifyCompleteEditingItem(id, event);
                }else{
                    if (event.which == ESCAPE_KEY){
                        self.todoListViewModel.cancelEditingItem(id);
                    }
                }
            });
        }

        this.editItem = function(id, text){
            var itemId = $('.todoItemId:contains("' + id + '")')[0];

            var editBox = itemId.parentElement.parentElement.getElementsByClassName('edit')[0];
            itemId.parentElement.parentElement.classList.add('editing');
            editBox.value = text;
            editBox.focus();
        }

        this.markItem = function(id, selected){
            var itemId = $('.todoItemId:contains("' + id + '")')[0];
            if (selected){
                itemId.parentElement.parentElement.classList.add('completed');
            }else{
                itemId.parentElement.parentElement.classList.remove('completed');
            }
        }

        this.completeItemEditing = function(id){
            var itemId = $('.todoItemId:contains("' + id + '")')[0];
            itemId.parentElement.parentElement.classList.remove('editing');
        }

        function getItemId(event){
            return event.srcElement.parentElement.getElementsByClassName('todoItemId')[0].innerText;
        }

        function notifyCompleteEditingItem(id, event){
            var text = event.srcElement.parentElement.getElementsByClassName('edit')[0].value;
            self.todoListViewModel.completeItemEditing(id, text);
        }
    }

    var view = new TodoListView();

    var todos = new TodoListViewModel(new TodosService(), view);

    view.setTodoListViewModel(todos);
    view.init();
    todos.init();


})( window );
