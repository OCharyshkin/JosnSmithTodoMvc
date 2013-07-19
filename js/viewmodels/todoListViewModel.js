
var TodoListViewModel = function(todosService, todoListView){

    var self = this;

    this.todos = js.bindableList();
    this.todos.setValue(getTodosViewModel(todosService.getTodos()));

    this.init = function(){
        self.todos._value.forEach(function(viewModel){
            todoListView.markItem(viewModel.id, viewModel.isCompleted._value);
        });
    }

    this.addNewTodoItem = function(text){
        if (text || text.trim()){

            var model = new TodoItem();
            model.text = text;
            this.todos.add(getTodoViewModel(model));

            todoListView.clearNewItemBox();

            saveTodos();
        }
    }

    this.markItem = function (id, selected){
        var vm = getTodoItemById(id);
        vm.isCompleted.setValue(selected);

        todoListView.markItem(id, selected);

        saveTodos();
    }

    this.deleteItem = function(id){

        var vm = getTodoItemById(id);
        self.todos.remove(vm);

        saveTodos();
    }

    this.completeAll = function (completed){

        self.todos._value.forEach(function(viewModel){
            viewModel.isCompleted.setValue(completed);
            todoListView.markItem(viewModel.id, viewModel.isCompleted._value);
        });

        saveTodos();
    }

    function getTodoItemById(id){
        for(var i = 0; i < self.todos._value.length; i++){
            if (self.todos._value[i].id == id){
                return self.todos._value[i];
            }
        }
    }

    function saveTodos(){
        var todosModel = getTodosModel();
        todosService.saveTodos(todosModel);
    }


    function getTodosModel(){
        var result = [];

        self.todos._value.forEach(function(viewModel){

            var model = new TodoItem();

            model.id  = viewModel.id;
            model.text = viewModel.text._value;
            model.isCompleted = viewModel.isCompleted._value;

            result.push(model);
        });

        return result;
    }


    function getTodoViewModel(model){
        var vm = new TodoItemViewModel(model.text);

        vm.id = model.id;
        vm.isCompleted.setValue(model.isCompleted);

        return vm;
    }


    function getTodosViewModel(todosModel){

        var result = [];

        todosModel.forEach(function(model){
            result.push(getTodoViewModel(model));
        });

        return result;
    }
}