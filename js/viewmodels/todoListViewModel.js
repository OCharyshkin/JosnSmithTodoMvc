
var TodoListViewModel = function(todosService, todoListView){

    var self = this;

    this.todos = js.bindableList();
    this.todos.setValue(getTodosViewModel(todosService.getTodos()));
    this.allCompleted =  js.bindableValue();

    this.init = function(){
        self.todos._value.forEach(function(viewModel){
            todoListView.markItem(viewModel.id, viewModel.isCompleted._value);
        });

        initAllCompleted();
    }

    this.addNewTodoItem = function(text){
        if (text || text.trim()){

            var model = new TodoItem();
            model.text = text.trim();
            this.todos.add(getTodoViewModel(model));

            todoListView.clearNewItemBox();

            initAllCompleted();

            saveTodos();
        }
    }

    this.toogleItem = function (id){
        var vm = getTodoItemById(id);
        vm.isCompleted.setValue(!vm.isCompleted._value);

        todoListView.markItem(id, vm.isCompleted._value);

        initAllCompleted();

        saveTodos();
    }

    this.editItem = function(id){

        var vm = getTodoItemById(id);

        todoListView.editItem(vm.id, vm.text._value);
    }

    this.deleteItem = function(id){

        var vm = getTodoItemById(id);
        self.todos.remove(vm);

        initAllCompleted();

        saveTodos();
    }

    this.completeAll = function (){

        var newAllCompletedValue = !self.allCompleted._value;

        self.todos._value.forEach(function(viewModel){
            viewModel.isCompleted.setValue(newAllCompletedValue);
            todoListView.markItem(viewModel.id, viewModel.isCompleted._value);
        });

        initAllCompleted();
        saveTodos();
    }

    this.completeItemEditing = function(id, text){
        if (text || text.trim()){
            var vm = getTodoItemById(id);
            vm.text.setValue(text.trim());
            saveTodos();

            todoListView.completeItemEditing(id);
        }else{
            self.deleteItem(id);
        }
    }

    function initAllCompleted(){

        if (self.todos._value.length == 0){
            self.allCompleted.setValue(false);
        }else{
            for(var i = 0; i < self.todos._value.length; i++){
                if (!self.todos._value[i].isCompleted._value){
                    self.allCompleted.setValue(false);
                    return;
                }
            }
            self.allCompleted.setValue(true);
        }
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