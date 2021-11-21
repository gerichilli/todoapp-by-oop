"use strict";
class Todo {
    id = (Date.now() + '').slice(-9);
    done = false;

    constructor(title, description, tags) {
        this.title = title;
        this.description = description;
        this.tags = tags;
    }
}

const changeThemeBtn = document.getElementById("themeBtn");
const logo = document.querySelector(".logo");
const openAddTodoModalBtns = document.querySelectorAll(".addTodo");
const closeModalBtns = document.querySelectorAll(".closeModal");
const createTodoForm = document.getElementById("addForm");
const editTodoForm = document.getElementById("editForm");
const todoList = document.querySelector(".todos__list");

class App {
    #todos = [];
    todo;
    todoID;

    constructor() {
        this._getLocalStorage();
        // Theme change
        changeThemeBtn.addEventListener("click", this._changeTheme.bind(this));

        // Open modal/Close modal
        openAddTodoModalBtns.forEach(btn => {
            btn.addEventListener("click", this._openModal.bind(this));
        })
        closeModalBtns.forEach(btn => {
            btn.addEventListener("click", this._closeModal.bind(this));
        })

        // Add a new todo
        createTodoForm.addEventListener("submit", this._createTodo.bind(this));

        todoList.addEventListener("click", (e) => {
            this._markDone.call(this, e);
            this._deleteTodo.call(this, e);
            this._openEditModal.call(this, e);
        });

        // Edit todo
        editTodoForm.addEventListener("submit", this._editTodo.bind(this));
    }

    _createTodo(e) {
        e.preventDefault();

        const [title, description, tags] = this._getTodoInputs(createTodoForm);

        // Creating todo object
        const todo = new Todo(title, description, tags);
         
        // Add new todo to data array
        this.#todos.push(todo);

        // Render todo
        this._renderTodo(todo);

        // Reset modal
        this._resetModal(createTodoForm, e);
    }

    _editTodo(e) {
        e.preventDefault();

        // Update data array
        const [title, description, tags] = this._getTodoInputs(editTodoForm);
        const todoIndex = this.#todos.findIndex(todo => todo.id === this.todoID);
        this.#todos[todoIndex] = {
            ...this.#todos[todoIndex],
            title: title,
            description: description,
            tags: tags
        }

        // Update html
        const updatedHtml = this._generateTodoHtml(this.#todos[todoIndex]);
        this.todo.innerHTML =  updatedHtml;

        // Reset modal
        this._resetModal(createTodoForm, e)
    }

    _getTodoInputs(formEl) {
        let title, description, tags;
        // Select form elements
        const inputTitle = formEl.elements["todoTitle"];
        const inputDescription = formEl.elements["todoDescription"];
        const inputTags = formEl.elements["todoTags"];

        if(!inputTitle.value) return;

        // Get data from form
        title = inputTitle.value;
        description = inputDescription.value || '';

        if(inputTags) {
            tags = [...inputTags].filter(tag => tag.checked === true).map(tag => tag.value);
        }
        
        return [title, description, tags];
    }

    _renderTodo(todo) {
        const html = `
            <li class="todo ${todo.done ? "todo--done" : ""}" data-id=${todo.id}>
                ${this._generateTodoHtml(todo)}
            </li>
        `;
        todoList.insertAdjacentHTML("afterbegin", html);
    }

    _generateTodoHtml(todo) {
        return `
            <div class="todo__header">
                <h2 class="todo__title">${todo.title}</h2>
                <div class="todo__actions">
                    <button class="todo__btn modal-btn" data-target="#editTodoModal"><i class="bi bi-pencil-square"></i></button>
                    <button class="todo__btn deleteTodo"><i class="bi bi-x-square"></i></button>
                </div>
            </div>
            <div class="todo__body">
                <p class="todo__txt">
                    ${todo.description}
                </p>
            </div>
            <div class="todo__footer">
                <ul class="todo__tags tags">
                    ${
                        todo.tags ? 
                        todo.tags.map(tag => `<li class="tag tag--${tag}"></li>`) 
                        : ''
                    }
                </ul>
                <div class="form-check">
                    <input type="checkbox" id="doneMark-${todo.id}" ${todo.done ? "checked" : ""}>
                    <label for="doneMark-${todo.id}" class="markDone">Done</label>
                </div>
            </div>
        
        `
    }

    _markDone(e) {
        if(!e.target.classList.contains("markDone")) return;

        const checkmark = e.target.previousElementSibling;
        this._setTodoID(e);
        const todoIndex = this.#todos.findIndex(todo => todo.id === this.todoID);

        if(checkmark.checked === false) {
            this.todo.classList.add("todo--done");
            this.#todos[todoIndex].done = true;
        } else {
            this.todo.classList.remove("todo--done");
            this.#todos[todoIndex].done = false;
        }     
        
        this._setLocalStorage();
    }

    _deleteTodo(e) {
        if(!e.target.closest(".deleteTodo")) return;

        this._setTodoID(e);
        
        this.#todos = this.#todos.filter(todo => todo.id !== this.todoID);
        this.todo.remove();

        this._setLocalStorage();
    }

    _openEditModal(e) {
        if(!e.target.closest(".modal-btn")) return;
        this._setTodoID(e);

        // Set value to form
        const todoData = this.#todos.filter(todo => todo.id === this.todoID)[0];

        const inputTitle = editTodoForm.elements["todoTitle"];
        const inputDescription = editTodoForm.elements["todoDescription"];
        const inputTags = editTodoForm.elements["todoTags"];

        inputTitle.value = todoData.title;
        inputDescription.value = todoData.description;
        inputTags.forEach(input => {
            if(todoData.tags.includes(input.value)) {
                input.checked = true;
            }
        })

        // Open modal
        this._openModal(e);
    }

    _setTodoID(e) {
        this.todo = e.target.closest(".todo");
        this.todoID = this.todo.getAttribute("data-id");
    }

    _setLocalStorage() {
        localStorage.setItem("todos", JSON.stringify(this.#todos));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("todos"));

        if(!data) return;

        this.#todos = data;

        this.#todos.forEach(todo => {
            this._renderTodo(todo);
        })
    }

    _changeTheme() {
        const currentMode = changeThemeBtn.getAttribute("data-mode");
        if(!currentMode) return;

        const changeMode = currentMode === "light" ? "dark" : "light";
        changeThemeBtn.setAttribute("data-mode", changeMode);
        document.documentElement.setAttribute("data-theme", changeMode);
        logo.src = `./img/logo-${changeMode}.svg`
    }

    _openModal(e) {
        const btn = e.target.closest(".modal-btn");
        if(!btn) return;
        const modalSelector = btn.getAttribute("data-target");
        const modal = document.querySelector(modalSelector);
        modal.classList.remove("disN");
    }

    _closeModal(e) {
        const modal = e.target.closest(".modal");
        modal.classList.add("disN");
    }

    _resetModal(formEl, e) {
        // Reset form
        formEl.reset();

        // Close modal
        this._closeModal(e);

        // Save data
        this._setLocalStorage();
    }
}

const app = new App;
