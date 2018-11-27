(function(window) {
    'use strict';
    const DOMSTRING = (function() {
        let queryDOM = function(DOMString) {
            return document.querySelector(DOMString);
        };

        return {
            todoInputArea: queryDOM('.new-todo'),
            main: queryDOM('.main'),
            footer: queryDOM('.footer'),
            header: queryDOM('.header'),
            todoList: queryDOM('.todo-list'),
            todoApp: queryDOM('.todoapp')
        };
    })();

    // model
    const MODEL = (function(DOM) {
        let storage = function(localStorageKey) {
            let storedList = [];
            // save storage
            let save = function() {
                let todoDataInfo;
                let message;
                let id;
                let completed;

                DOM.todoList.querySelectorAll('li').forEach((node) => {
                    message = node.querySelector('label').textContent;
                    id = parseInt(node.getAttribute('data-id'));
                    completed = node.classList.contains('completed');
                    todoDataInfo = {
                        id: id,
                        completed: completed,
                        title: message
                    };
                    storedList.push(todoDataInfo);
                });
                localStorage.setItem(localStorageKey, JSON.stringify(storedList));
            };

            return {
                save: save
            };
        };

        return {
            storage: storage
        };
    })(DOMSTRING);

    // view
    // switch display all, active, completed.
    const VIEW = (function(DOM) {
        let manage = function(toggle) {
            DOM.main.style.display = toggle;
            DOM.footer.style.display = toggle;
        };

        let display = function(target) {
            let id;
            if (DOM.todoList.querySelectorAll('li').length > 0) {
                id = parseInt(DOM.todoList.querySelector('li:first-child').getAttribute('data-id'), 10);
            } else {
                id = 0
            }

            let appendChild = function(todoInputValue) {
                let template;
                let todoTitle;

                if (todoInputValue !== '') {
                    todoTitle = todoInputValue;
                } else {
                    return;
                }

                id++;

                template = `
					<li data-id=${id}>
						<div class="view">
							<input class="toggle" type="checkbox">
							<label>${todoTitle}</label>
							<button class="destroy"></button>
						</div>
					</li>`;

                target.insertAdjacentHTML('afterbegin', template);
            };

            let repaint = function(dataSource) {
                let template;
                target.innerHTML = '';
                if (dataSource !== null) {
                    dataSource.forEach(function(list) {
                        template = `
							<li data-id=${list.id} class="${list.completed ? 'completed' : ''}">
								<div class="view">
									<input class="toggle" type="checkbox">
									<label>${list.title}</label>
									<button class="destroy"></button>
								</div>
							</li>`;
                        target.insertAdjacentHTML('beforeend', template);
                    });
                } else {
                    return;
                }
            };

            let reset = function() {
                target.value = ''
            };

            let calculateActiveItem = function() {
                let activeItem = DOM.todoList.querySelectorAll('li:not(.completed)').length;
                target.textContent = activeItem;
            };

            return {
                appendChild: appendChild,
                reset: reset,
                repaint: repaint,
                calculateActiveItem: calculateActiveItem
            };
        };

        return {
            display: display,
            manage: manage
        };
    })(DOMSTRING);

    // controller
    const CONTROLLER = (function(DOM, MODEL, VIEW) {
        const localStorageKey = 'todo-[pureJavaScript]';
        const todoDataList = JSON.parse(localStorage.getItem(localStorageKey));

        let init = function() {
            // initializing the view
            document.addEventListener('DOMContentLoaded', () => {
                VIEW.display(DOM.todoList).repaint(todoDataList);
                VIEW.manage('none');
            });

            DOM.header.addEventListener('keypress', (event) => {
                if (event.code.toLowerCase() === 'enter') {
                    // new todo
                    if (event.target.classList.contains('new-todo')) {
                        VIEW.display(DOM.todoList).appendChild(DOM.todoInputArea.value);
                        VIEW.display(DOM.todoInputArea).reset();
                    }
                }
            });

            DOM.main.addEventListener('click', (event) => {
                // destroy todo
                if (event.target.classList.contains('destroy')) {
                    event.target.parentElement.parentElement.remove();
                }

                // toggle completed class
                if (event.target.classList.contains('toggle')) {
                    event.target.parentElement.parentElement.classList.toggle('completed');
                }

                // toggle whole item completed class
                if (event.target.classList.contains('toggle-all')) {
                    if (Array.from(DOM.todoList.querySelectorAll('li')).every((node) => node.classList.contains('completed'))) {
                        DOM.todoList.querySelectorAll('li').forEach((node) => {
                            node.classList.remove('completed');
                        });
                    } else {
                        DOM.todoList.querySelectorAll('li').forEach((node) => {
                            node.classList.add('completed');
                        });
                    }
                }
            });

            DOM.footer.addEventListener('click', (event) => {
                // clear the completed todoList item
                if (event.target.classList.contains('clear-completed')) {
                    DOM.todoList.querySelectorAll('li').forEach((node) => {
                        if (node.classList.contains('completed')) {
                            node.remove();
                        }
                    });
                }

                // switch all, active, completed
                DOM.footer.querySelectorAll('.filters li a').forEach((node) => {
                    node === event.target ? node.classList.add('selected') : node.classList.remove('selected');
                });
            });

            // observer:
            const OBSERVER = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // saving localStorage
                    MODEL.storage(localStorageKey).save();

                    // monitoring the main block and footer block of todoApp should display or not.
                    DOM.todoList.querySelectorAll('li').length > 0 ? VIEW.manage('block') : VIEW.manage('none');

                    // checked the input when todo is completed
                    DOM.todoList.querySelectorAll('li').forEach((node) => {
                        if (node.classList.contains('completed')) {
                            node.querySelector('input').checked = true;
                        } else {
                            node.querySelector('input').checked = false;
                        }
                    });

                    // toggle whole completed "V" light on or off
                    if (Array.from(DOM.todoList.querySelectorAll('li')).every((node) => node.classList.contains('completed'))) {
                        DOM.main.querySelector('.toggle-all').checked = true;
                    } else {
                        DOM.main.querySelector('.toggle-all').checked = false;
                    }

                    // clear completed button switch on or off
                    if (Array.from(DOM.todoList.querySelectorAll('li')).some((node) => node.classList.contains('completed'))) {
                        DOM.footer.querySelector('.clear-completed').style.display = 'block';
                    } else {
                        DOM.footer.querySelector('.clear-completed').style.display = 'none';
                    }

                    // calculate item left
                    VIEW.display(DOM.footer.querySelector('.todo-count strong')).calculateActiveItem();

                    // switch the display with "all", "active" and "completed" on or off
                    switch (DOM.footer.querySelector('.filters li a.selected').textContent.toLowerCase()) {
                        case 'all':
                            DOM.todoList.querySelectorAll('li').forEach((node) => {
                                node.style.display = 'block';
                            });
                            break;
                        case 'active':
                            DOM.todoList.querySelectorAll('li:not(.completed)').forEach((node) => {
                                node.style.display = 'block';
                            });
                            DOM.todoList.querySelectorAll('li.completed').forEach((node) => {
                                node.style.display = 'none';
                            });
                            break;
                        case 'completed':
                            DOM.todoList.querySelectorAll('li:not(.completed)').forEach((node) => {
                                node.style.display = 'none';
                            });
                            DOM.todoList.querySelectorAll('li.completed').forEach((node) => {
                                node.style.display = 'block';
                            });
                            break;
                        default:
                            break;
                    }
                });
            });

            const config = {
                childList: true,
                subtree: true,
                attributes: true
            };

            const target = DOM.todoApp;
            OBSERVER.observe(target, config);
        };

        return {
            init: init
        };
    })(DOMSTRING, MODEL, VIEW);

    CONTROLLER.init();
})(window);