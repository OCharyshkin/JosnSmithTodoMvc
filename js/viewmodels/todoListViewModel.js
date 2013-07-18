
var TodoListViewModel = function(todosService, todoListView){

    var self = this;

    this.todos = js.bindableList();
    this.todos.setValue(getTodosViewModel(todosService.getTodos()));

    this.addNewTodoItem = function(text){
        if (text || text.trim()){

            var model = new TodoItem();
            model.text = text;
            this.todos.add(getTodoViewModel(model));

            todoListView.clearNewItemBox();

            saveTodos();
        }
    }

    this.deleteItem = function(id){

        var vm = getTodoItemById(id);
        self.todos.remove(vm);

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
            model.text = viewModel.text;
            model.isCompleted = viewModel.isCompleted;

            result.push(model);
        });

        return result;
    }


    function getTodoViewModel(model){
        var vm = new TodoItemViewModel(model.text);
        vm.isCompleted = model.isCompleted;

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