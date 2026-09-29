let tasks = [];
let filter = 'all';
let toastTimer;

const list = document.querySelector('#task-list');
const empty = document.querySelector('#empty-state');
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');

async function api(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {'Content-Type': 'application/json', ...(options.headers || {})},
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Something went wrong. Please try again.');
    }
    return response.status === 204 ? null : response.json();
}

function showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
}

async function loadTasks() {
    try {
        tasks = await api('/api/tasks');
        render();
    } catch (error) {
        showToast(error.message);
    }
}

function render() {
    const active = tasks.filter(task => !task.done).length;
    document.querySelector('#task-total').textContent = tasks.length;
    document.querySelector('#nav-count').textContent = active;
    document.querySelector('#all-count').textContent = tasks.length;
    document.querySelector('#active-count').textContent = active;
    document.querySelector('#section-subtitle').textContent = tasks.length ? `${active} ${active === 1 ? 'thing' : 'things'} left to do. You’ve got this.` : 'One thing at a time.';
    const visible = tasks.filter(task => filter === 'all' || (filter === 'active' ? !task.done : task.done));
    list.replaceChildren();
    visible.forEach(task => {
        const row = document.createElement('article');
        row.className = `task-row${task.done ? ' completed' : ''}`;
        const check = document.createElement('button');
        check.className = 'check';
        check.type = 'button';
        check.setAttribute('aria-label', task.done ? 'Mark task incomplete' : 'Mark task complete');
        check.textContent = task.done ? '✓' : '';
        check.addEventListener('click', async () => {
            try {
                const updated = await api(`/api/tasks/${task.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({done: !task.done})
                });
                tasks = tasks.map(item => item.id === task.id ? updated : item);
                render();
                if (updated.done) showToast('Nice work. One less thing on your mind.');
            } catch (error) {
                showToast(error.message);
            }
        });
        const name = document.createElement('span');
        name.className = 'task-name';
        name.textContent = task.text;
        const meta = document.createElement('span');
        meta.className = 'task-meta';
        meta.textContent = task.done ? 'Completed' : task.time;
        const remove = document.createElement('button');
        remove.className = 'delete-task';
        remove.type = 'button';
        remove.setAttribute('aria-label', `Delete ${task.text}`);
        remove.textContent = '×';
        remove.addEventListener('click', async () => {
            try {
                await api(`/api/tasks/${task.id}`, {method: 'DELETE'});
                tasks = tasks.filter(item => item.id !== task.id);
                render();
                showToast('Task removed');
            } catch (error) {
                showToast(error.message);
            }
        });
        row.append(check, name, meta, remove);
        list.append(row);
    });
    empty.hidden = visible.length > 0;
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
        input.focus();
        return;
    }
    try {
        const task = await api('/api/tasks', {method: 'POST', body: JSON.stringify({text})});
        tasks.unshift(task);
        render();
        form.reset();
        input.focus();
        showToast('Task added. You’ve got this.');
    } catch (error) {
        showToast(error.message);
    }
});

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
    render();
}));
document.querySelector('#new-list').addEventListener('click', () => showToast('Your personal list is ready for ideas.'));

const now = new Date();
document.querySelector('#today-date').textContent = new Intl.DateTimeFormat(undefined, {weekday: 'long'}).format(now);
document.querySelector('#date-sub').textContent = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
}).format(now);
loadTasks();
