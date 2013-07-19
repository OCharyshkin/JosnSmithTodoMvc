
var TodoListViewModel = function(todosService, todoListView){

    var self = this;
    var filters = [new Filter('', filterAll), new Filter('active', filterActive), new Filter('completed', filterCompleted)]
    var currentFilter = {};

    this.todos = js.bindableList();
    this.todos.setValue(getTodosViewModel(todosService.getTodos()));

    this.filteredTodos = js.bindableList();

    this.allCompleted =  js.bindableValue();
    this.completedCount = js.bindableValue();
    this.itemLeftCount = js.bindableValue();


    this.init = function(){
        currentFilter = getFilterByName('');

        todoListView.setFilter(currentFilter.name);
        listChanged();
    }

    this.initView = function(){
        self.filteredTodos._value.forEach(function(viewModel){
            todoListView.markItem(viewModel.id, viewModel.isCompleted._value);
        });
    }

    this.addNewTodoItem = function(text){
        if (text || text.trim()){

            var model = new TodoItem();
            model.text = text.trim();
            this.todos.add(getTodoViewModel(model));

            todoListView.clearNewItemBox();

            listChanged();

            saveTodos();
        }
    }

    this.toogleItem = function (id){
        var vm = getTodoItemById(id);
        vm.isCompleted.setValue(!vm.isCompleted._value);

        todoListView.markItem(id, vm.isCompleted._value);

        listChanged();

        saveTodos();
    }

    this.editItem = function(id){

        var vm = getTodoItemById(id);
        vm.editing = true;

        todoListView.editItem(vm.id, vm.text._value);
    }

    this.deleteItem = function(id){

        var vm = getTodoItemById(id);
        self.todos.remove(vm);

        listChanged();

        saveTodos();
    }

    this.completeAll = function (){

        var newAllCompletedValue = !self.allCompleted._value;

        self.todos._value.forEach(function(viewModel){
            viewModel.isCompleted.setValue(newAllCompletedValue);
            todoListView.markItem(viewModel.id, viewModel.isCompleted._value);
        });

        listChanged();
        saveTodos();
    }

    this.completeItemEditing = function(id, text){

        var vm = getTodoItemById(id);

        if (!vm.editing){
            return;
        }

        vm.editing = false;

        if (text || text.trim()){

            vm.text.setValue(text.trim());

            saveTodos();

            todoListView.completeItemEditing(id);
        }else{
            self.deleteItem(id);
        }
    }

    this.clearCompleted = function(){
        var completed = [];

        self.todos._value.forEach(function(viewModel){
            if (viewModel.isCompleted._value){
                completed.push(viewModel);
            }
        });

        if (completed.length > 0){
            completed.forEach(function(item){
                self.todos.remove(item);
            });
        }

        listChanged();
        saveTodos();
    }

    this.filter = function(value){
        setCurrentFilter(value);
        todoListView.setFilter(value);
    }

    this.cancelEditingItem = function(id){

        var vm = getTodoItemById(id);
        vm.editing = false;
        todoListView.completeItemEditing(id);
    }

    function setCurrentFilter(filterName){
        currentFilter = getFilterByName(filterName);
        filterItems();
    }

    function getFilterByName(name){

        for(var i = 0; i < filters.length; i++){
            if (filters[i].name == name){
                return  filters[i];
            }
        }
    }

    function filterAll(viewModel){
        return true;
    }

    function filterActive(viewModel){
        return !viewModel.isCompleted._value;
    }

    function filterCompleted(viewModel){
        return viewModel.isCompleted._value;
    }

    function listChanged(){

        initAllCompleted();

        var completedCount = 0;
        self.todos._value.forEach(function(viewModel){
            if (viewModel.isCompleted._value){
                completedCount++;
            }
        });

        self.completedCount.setValue(completedCount);
        self.itemLeftCount.setValue(self.todos._value.length - completedCount);

        todoListView.hasCompleted(completedCount > 0);

        filterItems();
    }

    function filterItems(){
        var items = [];

        self.todos._value.forEach(function (viewModel){
            if (currentFilter.isAllowed(viewModel)){
                items.push(viewModel);
            }
        });

        self.filteredTodos.setValue(items);

        todoListView.initTodoItemsViews();
        self.initView();
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