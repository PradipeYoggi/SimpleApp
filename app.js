// set up event handlers and load data
$(document).ready(() => {
    $('#add').click(addClicked);
    $('#delete').click(deleteClicked);
    $('#update').click(updateClicked);
    $('#task-list').click(tableClicked);
    DOMManager.getAllTodos();
});

// event handler for the Add button
// Adds a new Todo to the server and refreshes the list of Todos
function addClicked(e) {

    let newTodo = new Todo($('#task-title').val(), $('#task-details').val(), $('#start-date').val(), $('#end-date').val());

    TodoService.createTodo(newTodo)
        .then(() => DOMManager.getAllTodos())
        .catch((error) => alert(`Error encountered: ${error}`));
}

// event handler for the Delete button
// Removes a Todo from the server and refreshes the list of Todos
function deleteClicked(e) {
    TodoService.deleteTodo(DOMManager.activeTodo._id)
        .then(() => DOMManager.getAllTodos())
        .catch((error) => alert(`Error encountered: ${error}`));
}

// event handler for the Update button
// updates the provided Todo on the server and refreshes the list of Todos
function updateClicked(e) {

    // get values from the fields into the object that will be used for the update
    DOMManager.activeTodo.title = $('#task-title').val();
    DOMManager.activeTodo.notes = $('#task-details').val();
    DOMManager.activeTodo.when = $('#start-date').val();
    DOMManager.activeTodo.dueBy = $('#end-date').val();

    // do the update
    TodoService.updateTodo(DOMManager.activeTodo)
        .then(() => DOMManager.getAllTodos())
        .catch((error) => {
            //NOTE: CrudCrud succeeds but the catch callback is called, 
            //so refreshing here as a workaround until Crudcrud's behavior is understood and fixed
            console.log(error);
            DOMManager.getAllTodos(); 
        });
}

// event handler when the table is clicked
function tableClicked(e) {
    let tableRow = $(e.target).closest('tr');
    DOMManager.setActiveTodo(tableRow);
}

// Class that represents the Todo task
class Todo {
    constructor(title, notes, when, dueBy) {
        this.title = title;
        this.notes = notes;
        this.when = when;
        this.dueBy = dueBy;
    }

    getFormattedWhen() {
        return this.formatDate(this.when);
    }

    getFormattedDueBy() {
        return this.formatDate(this.dueBy);
    }

    // some minor format management of the date.
    // data saved via Postman seemed to have a T suffix, which date input type doesn't like
    // this method helps handle that
    formatDate(date) {
        if (date.at(date.length-1) == 'T') {
            return date.substring(0,date.length-1);
        }
        return date;
    }
}

// The service object that manages CRUD operations for the Todo object
class TodoService {
    //proxy server used when crudcrud was failing due to CORS (even with live-server)
    //static url = 'https://cors-anywhere.herokuapp.com/https://crudcrud.com/api/53a11b87e5b24e1fa532bab6a4868133/Todos';

    static url = 'https://crudcrud.com/api/53a11b87e5b24e1fa532bab6a4868133/Todos';

    // fetches all the Todos from the server
    static getAllTodos() {
        return $.get(this.url);
    }

    // fetches a given Todo identified by the id
    static getTodo(id) {
        return $.get(this.url + '/${id}');
    }

    // creates a new Todo on the server
    static createTodo(todo) {
        return $.ajax({
            url: this.url,
            type: 'POST',
            dataType: 'JSON',
            crossDomain: true,
            data: JSON.stringify(todo),
            contentType: 'application/json'
        });
    }

    // updates the given todo object on the server
    static updateTodo(todo) {
        let id = todo._id;
        delete todo._id; //removing _id from the body as CrudCrud doesn't like it

        return $.ajax({
            url: this.url + `/${id}`,
            type: 'PUT',            
            dataType: 'JSON',
            crossDomain: true,
            data: JSON.stringify(todo),
            contentType: 'application/json'
        });
    }

    // deletes the Todo identified by the id from the server
    static deleteTodo(id) {
        return $.ajax({
            url: this.url + `/${id}`,
            type: 'DELETE'
        });
    }
}

// Manages the DOM
class DOMManager {
    static todos;
    static selectedRow;
    static activeTodo;

    // gets all the Todos from the server 
    // and refreshes the table and resets the input fields
    static getAllTodos() {
        TodoService.getAllTodos()
            .then(todos => this.render(todos))
            .then(() => this.resetFormFields());
    }

    // refreshes the Todos list table
    static render(todos) {
        this.todos = todos;
        $('#task-list tbody').empty();
        for (let todo of todos) {
            let newRow = 
            "<tr>"+
            `<td style="display:none;">${todo._id}</td>`+
            `<td>${todo.title}</td>`+ 
            `<td>${todo.notes}</td>` +
            `<td>${todo.when}</td>` +
            `<td>${todo.dueBy}</td></tr>`;
            $('#task-list tbody').append(newRow);     
        }        
    }

    // resets the input fields on the form for good UX
    static resetFormFields() {
        $('#task-title').val('');
        $('#task-details').val('');
        $('#start-date').val('');
        $('#end-date').val('');        
    }

    // manages the active todo by showing a left/right border on the selected todo
    // updates the selected todo to the form input fields, so the user can add/update/delete
    // using that data
    static setActiveTodo(tableRow) {

        // if we had selected a row, unselect it
        if (this.selectedRow != null) {
            this.selectedRow.css('border', 'hidden');
        }

        // change the selectedRow to the new one
        this.selectedRow = tableRow;

        // show that row as selected in the table
        tableRow.css('border-left','solid 2px brown');
        tableRow.css('border-right','solid 2px brown');
    
        // get the colums of the given (selected) row
        let rowColumns = tableRow.children();
        let column = rowColumns[0];

        // set the active Todo object from the columns
        this.activeTodo = new Todo(rowColumns[1].innerHTML, rowColumns[2].innerHTML, rowColumns[3].innerHTML, rowColumns[4].innerHTML);
        this.activeTodo._id = rowColumns[0].innerHTML;

        // update the form input fields with the new active Todo
        $('#task-title').val(this.activeTodo.title);
        $('#task-details').val(this.activeTodo.notes);
        $('#start-date').val(this.activeTodo.getFormattedWhen());
        $('#end-date').val(this.activeTodo.getFormattedDueBy());
    }
}