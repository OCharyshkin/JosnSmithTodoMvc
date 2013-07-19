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
                }
            });

            js.bind(todos.filteredTodos).to('#todo-list', TodoItemView);
            js.bind(todos.allCompleted).to('#toggle-all', { bidirectional: false });
            js.bind(todos.completedCount).to('#completedCount', { bidirectional: false });
            js.bind(todos.itemLeftCount).to('#todo-count strong', { bidirectional: false });

            $('#toggle-all').click(function(event){
                self.todoListViewModel.completeAll();
            });

            $('#clear-completed').click(function(){
                self.todoListViewModel.clearCompleted();
            });
        }

        this.initTodoItemsViews = function(){
            $('.destroy').click(function(event){
                self.todoListViewModel.deleteItem(getItemId(event));
            });

            $('.todoItemIsSelected').click(function(event){
                self.todoListViewModel.toogleItem(getItemId(event));
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

            var $itemId = $('.todoItemId:contains("' + id + '")');
            $itemId.parent().parent().addClass('editing');

            var $editBox = $itemId.parent().parent().find('.edit');
            $editBox.value = text;
            $editBox.focus();
        }

        this.markItem = function(id, selected){
            var $itemId = $('.todoItemId:contains("' + id + '")');

            if (selected){
                $itemId.parent().parent().addClass('completed');
            }else{
                $itemId.parent().parent().removeClass('completed');
            }
        }

        this.completeItemEditing = function(id){
            var $itemId = $('.todoItemId:contains("' + id + '")');
            $itemId.parent().parent().removeClass('editing');
        }

        this.setFilter = function(filterName){

            $('#filters li a').removeClass('selected');
            $('#filters li a[href="#/' + filterName + '"]').addClass('selected');
        }

        this.hasCompleted = function(value){
            if (value){
                $('#clear-completed').show();
            } else {
                $('#clear-completed').hide();
            }
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

    Router({ '#/(.*)': {
        on: function(filter){ todos.filter(filter) }
    } }).init();


})( window );
