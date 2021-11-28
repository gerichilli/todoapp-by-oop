"use strict";
class Todo {
    id = (Date.now() + "").slice(-9);
    done = false;

    constructor(title, description, tags) {
        this.title = title;
        this.description = description;
        this.tags = tags;
    }
}

const changeThemeBtn = document.getElementById("themeBtn");
const logo = document.querySelector(".logo");
const openAddTodoModalBtn = document.querySelector(".addTodo");
const closeModalBtns = document.querySelectorAll(".closeModal");
const createTodoForm = document.getElementById("addForm");
const editTodoForm = document.getElementById("editForm");
const appInitNote = document.querySelector(".todos__init");
const todoList = document.querySelector(".todos__list");
const toggleDoneTask = document.getElementById("toggleDone");
const navList = document.querySelector(".nav__list");
const navItems = document.querySelectorAll(".nav__item");

class App {
    #theme = "light";
    #hideDone = false;
    #todos = [];

    // Current todo
    #todo;
    #todoID;
    #filteredTodos = [];
    #filteredTag = "all";

    constructor() {
        this._appInit();

        // Theme change
        changeThemeBtn.addEventListener("click", this._changeTheme.bind(this));

        // Open modal/Close modal
        openAddTodoModalBtn.addEventListener("click", this._openModal.bind(this));

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

        // Toggle done tasks
        toggleDoneTask.addEventListener("change", this._handleDoneTasks.bind(this));

        // Filter todo by categories
        navList.addEventListener("click", this._filterTodos.bind(this));
    }

    _createTodo(e) {
        e.preventDefault();

        const [title, description, tags] = this._getTodoInputs(createTodoForm);

        // Creating todo object
        const todo = new Todo(title, description, tags);
         
        // Add new todo to data array
        this.#todos.push(todo);

        // Render todo if not filtering or todo categories contain filtered tag
        if(this.#filteredTag === "all" || todo.tags.includes(this.#filteredTag)) {
            this._renderTodo(todo);
        }

        // Remove app init effect
        appInitNote.classList.add("disN");
        openAddTodoModalBtn.classList.remove("add-btn--first");

        // Reset modal
        this._resetModal(createTodoForm, e);
    }

    _editTodo(e) {
        e.preventDefault();

        // Update data array
        const [title, description, tags] = this._getTodoInputs(editTodoForm);
        const todoIndex = this.#todos.findIndex(todo => todo.id === this.#todoID);
        this.#todos[todoIndex] = {
            ...this.#todos[todoIndex],
            title: title,
            description: description,
            tags: tags
        }

        // Update html
        const updatedHtml = this._generateTodoHtml(this.#todos[todoIndex]);
        this.#todo.innerHTML =  updatedHtml;

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
        description = inputDescription.value || "";

        if(inputTags) {
            tags = [...inputTags].filter(tag => tag.checked === true).map(tag => tag.value);
        }
        
        return [title, description, tags];
    }

    _renderTodo(todo) {
        const html = `
            <li class="todo${todo.done ? " todo--done" : ""}" data-id=${todo.id}>
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

    _handleDoneTasks() {
        this.#hideDone = toggleDoneTask.checked;
        localStorage.setItem("hideDone", JSON.stringify(this.#hideDone));
        this._toggleDoneTasks();
    }

    _toggleDoneTasks() {
        // Get list of todos that are done
        const todosDone = Array.from(document.querySelectorAll(".todo"))
        .filter(todo => todo.classList.contains("todo--done"));

        // Hide or reveal done todos
        const displayValue = this.#hideDone ? "none" : "flex";
        todosDone.forEach(todo => todo.style.display = displayValue);
    }

    _markDone(e) {
        if(!e.target.classList.contains("markDone")) return;

        const checkmark = e.target.previousElementSibling;
        this._setCurrentTodo(e);
        const todoIndex = this.#todos.findIndex(todo => todo.id === this.#todoID);

        if(checkmark.checked === false) {
            this.#todo.classList.add("todo--done");
            this.#todos[todoIndex].done = true;
        } else {
            this.#todo.classList.remove("todo--done");
            this.#todos[todoIndex].done = false;
        }     
        
        this._setLocalStorage();
        this._toggleDoneTasks();
    }

    _filterTodos(e) {
        const categoryEl = e.target.closest(".nav__item");
        if(!categoryEl) return;

        // Add/Remove Active Class
        navItems.forEach(item => item.classList.remove("tag--active"));
        categoryEl.classList.add("tag--active");

        // Read Selected Category
        const selectedCategory = categoryEl.getAttribute("data-category");
        if(!selectedCategory) return;

        if(selectedCategory === "all") {
            this.#filteredTodos = this.#todos;
            this.#filteredTag = "all";
        } else {
            this.#filteredTodos = this.#todos.filter(todo => todo.tags.includes(selectedCategory));
            this.#filteredTag = selectedCategory;
        }

        // Render filtered todos
        todoList.innerHTML = "";
        if(!this.#filteredTodos) return;
        this.#filteredTodos.forEach(todo => this._renderTodo(todo));

        // Reveal/hide done tasks
        this._toggleDoneTasks();
    }

    _deleteTodo(e) {
        if(!e.target.closest(".deleteTodo")) return;

        this._setCurrentTodo(e);
        
        this.#todos = this.#todos.filter(todo => todo.id !== this.#todoID);
        this.#todo.remove();

        this._setLocalStorage();
    }

    _setCurrentTodo(e) {
        this.#todo = e.target.closest(".todo");
        this.#todoID = this.#todo.getAttribute("data-id");
    }

    _changeTheme() {
        this.#theme = this.#theme === "light" ? "dark" : "light";
        this._themeInit();
        localStorage.setItem("theme", JSON.stringify(this.#theme));
    }

    _themeInit() {
        changeThemeBtn.setAttribute("data-mode", this.#theme);
        document.documentElement.setAttribute("data-theme", this.#theme);
        logo.src = `./img/logo-${this.#theme}.svg`;
    }

    _openEditModal(e) {
        if(!e.target.closest(".modal-btn")) return;
        this._setCurrentTodo(e);

        // Set value to form
        const todoData = this.#todos.filter(todo => todo.id === this.#todoID)[0];

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

    _setLocalStorage() {
        localStorage.setItem("todos", JSON.stringify(this.#todos));
    }

    _getLocalStorage() {
        const dataTodos = JSON.parse(localStorage.getItem("todos"));
        const dataTheme = JSON.parse(localStorage.getItem("theme"));
        const dataHideDone = JSON.parse(localStorage.getItem("hideDone"));

        if(dataTodos) {
            this.#todos = dataTodos;

            this.#todos.forEach(todo => {
                this._renderTodo(todo);
            })
        }

        if(dataTheme) {
            this.#theme = dataTheme;
            this._themeInit();
        }

        if(dataHideDone) {
            this.#hideDone = dataHideDone;
            toggleDoneTask.checked = this.#hideDone;
            this._toggleDoneTasks();
        }
    }

    _appInit() {
        this._getLocalStorage();
        if(this.#todos.length) return;
        appInitNote.classList.remove("disN");
        openAddTodoModalBtn.classList.add("add-btn--first");
    }
}

const app = new App;
