var TodosService = function(){

    this.getTodos = function(){
        return $.parseJSON(localStorage.getItem('todos-johnsmith')) || [];
    }

    this.saveTodos = function(models){
        localStorage.setItem('todos-johnsmith', JSON.stringify(models));
    }


}
