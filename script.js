let tasks = JSON.parse(localStorage.getItem('myCryptoTasks')) || [];
let currentCategory = 'All';
const categories = ['All', 'Airdrop', 'Micro Job', 'Daily Task', 'Red pack'];

// Theme styling for category tags
const colors = {
    'Airdrop': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
    'Micro Job': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    'Daily Task': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', dot: 'bg-indigo-400' },
    'Red pack': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' }
};

window.onload = () => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    document.getElementById('currentDateText').innerText = new Date().toLocaleDateString('en-US', options);
    
    renderCategories();
    renderTasks();
    requestNotificationPermission();

    // Check reminders every 10 seconds
    setInterval(checkReminders, 1000 * 10);
};

// Request Notification Permission
function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            const badge = document.getElementById('notifBadge');
            if (permission !== 'granted' && badge) {
                badge.classList.remove('hidden');
            } else if (badge) {
                badge.classList.add('hidden');
            }
        });
    }
}

function renderCategories() {
    const container = document.getElementById('categoryTabs');
    container.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat}')" class="px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border
            ${currentCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'}" >
            ${cat}
        </button>
    `).join('');
}

function setCategory(cat) {
    currentCategory = cat;
    renderCategories();
    renderTasks();
}

function toggleReminderFields() {
    const hasReminder = document.getElementById('reminderToggle').checked;
    const optionsDiv = document.getElementById('reminderOptions');
    const timeInput = document.getElementById('taskTime');
    
    if (hasReminder) {
        optionsDiv.classList.remove('hidden');
        timeInput.required = true;
        toggleReminderType();
    } else {
        optionsDiv.classList.add('hidden');
        timeInput.required = false;
        document.getElementById('taskDate').required = false;
    }
}

function toggleReminderType() {
    const type = document.getElementById('reminderType').value;
    const dateField = document.getElementById('dateField');
    const dateInput = document.getElementById('taskDate');

    if (type === 'specific') {
        dateField.classList.remove('hidden');
        dateInput.required = true;
    } else {
        dateField.classList.add('hidden');
        dateInput.required = false;
        dateInput.value = '';
    }
}

function renderTasks() {
    const listContainer = document.getElementById('taskList');
    const filteredTasks = currentCategory === 'All' ? tasks : tasks.filter(t => t.category === currentCategory);

    if (filteredTasks.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-20 text-slate-500 text-sm font-medium">
                <i class="fa-solid fa-boxes-packing text-4xl mb-3 text-slate-700 block"></i>
                No tasks available in this category!
            </div>`;
        return;
    }

    listContainer.innerHTML = filteredTasks.map(task => {
        const theme = colors[task.category] || { bg: 'bg-slate-800/40', text: 'text-slate-400', border: 'border-slate-800', dot: 'bg-slate-500' };
        
        let reminderText = 'No reminder';
        if (task.hasReminder && task.time) {
            if (task.reminderType === 'daily') {
                reminderText = `<i class="fa-solid fa-rotate mr-1 text-[10px]"></i>Daily at ${formatTime(task.time)}`;
            } else if (task.reminderType === 'specific' && task.date) {
                reminderText = `<i class="fa-regular fa-calendar mr-1 text-[10px]"></i>${task.date} at ${formatTime(task.time)}`;
            }
        }

        const isCompleted = task.completed || false;

        return `
            <div class="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800/80 rounded-2xl hover:border-slate-700/80 hover:bg-slate-800/60 transition-all cursor-pointer group ${isCompleted ? 'opacity-50' : ''}" onclick="viewDetails(${task.id})">
                <div class="flex items-center gap-3.5 min-w-0 pr-2">
                    <button onclick="toggleTaskStatus(event, ${task.id})" class="w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${isCompleted ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 hover:border-indigo-400'}">
                        ${isCompleted ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                    </button>
                    
                    <div class="min-w-0">
                        <h4 class="text-sm font-semibold text-slate-200 truncate ${isCompleted ? 'line-through text-slate-500' : ''}">${task.title}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border ${theme.bg} ${theme.text} ${theme.border}">${task.category}</span>
                            <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1">${reminderText}</span>
                        </div>
                    </div>
                </div>
                
                <button onclick="deleteTask(event, ${task.id})" class="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer shrink-0">
                    <i class="fa-regular fa-trash-can text-sm"></i>
                </button>
            </div>
        `;
    }).join('');
}

function toggleTaskStatus(e, id) {
    e.stopPropagation();
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    localStorage.setItem('myCryptoTasks', JSON.stringify(tasks));
    renderTasks();
}

function saveTask(e) {
    e.preventDefault();
    const hasReminder = document.getElementById('reminderToggle').checked;
    
    const newTask = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        desc: document.getElementById('taskDesc').value || 'No additional details.',
        category: document.getElementById('taskCategory').value,
        completed: false,
        hasReminder: hasReminder,
        reminderType: hasReminder ? document.getElementById('reminderType').value : null,
        time: hasReminder ? document.getElementById('taskTime').value : null,
        date: (hasReminder && document.getElementById('reminderType').value === 'specific') ? document.getElementById('taskDate').value : null,
        notified: false // Track if notification was sent
    };
    
    tasks.push(newTask);
    localStorage.setItem('myCryptoTasks', JSON.stringify(tasks)); 

    document.getElementById('taskForm').reset();
    document.getElementById('reminderOptions').classList.add('hidden');
    closeModal('addTaskModal');
    renderTasks();
}

function deleteTask(e, id) {
    e.stopPropagation();
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('myCryptoTasks', JSON.stringify(tasks)); 
    renderTasks();
}

function viewDetails(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('detailTitle').innerText = task.title;
    document.getElementById('detailDesc').innerText = task.desc;
    
    let infoTimeStr = 'No reminder set for this task.';
    if(task.hasReminder && task.time) {
        if(task.reminderType === 'daily') {
            infoTimeStr = `<i class="fa-solid fa-rotate"></i> Repeating Daily at ${formatTime(task.time)}`;
        } else {
            infoTimeStr = `<i class="fa-regular fa-calendar-check"></i> One-time: ${task.date} at ${formatTime(task.time)}`;
        }
    }
    document.getElementById('detailTime').innerHTML = infoTimeStr;
    
    const badge = document.getElementById('detailBadge');
    const theme = colors[task.category] || { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
    badge.innerText = task.category;
    badge.className = `text-[11px] font-bold px-3 py-1 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`;

    openModal('detailsModal');
}

// Notification & Vibration Check Logic
function checkReminders() {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayDateStr = now.toISOString().split('T')[0];

    tasks.forEach(task => {
        if (!task.hasReminder || task.time !== currentTimeStr || task.completed) return;

        const isTimeMatch = (task.reminderType === 'daily') || (task.reminderType === 'specific' && task.date === todayDateStr);

        if (isTimeMatch && !task.notified) {
            // Push Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`⏰ CryptoTask: ${task.title}`, {
                    body: `Category: ${task.category}\n${task.desc}`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png'
                });
            } else {
                alert(`⏰ Task Reminder: ${task.title} (${task.category})`);
            }

            // Mobile Vibration
            if ("vibrate" in navigator) {
                navigator.vibrate([500, 250, 500]);
            }

            // Flag as notified to avoid duplicate alerts within the same minute
            task.notified = true;
            localStorage.setItem('myCryptoTasks', JSON.stringify(tasks));
        }

        // Reset notified flag after time passes
        if (task.time !== currentTimeStr && task.notified) {
            task.notified = false;
            localStorage.setItem('myCryptoTasks', JSON.stringify(tasks));
        }
    });
}

function openModal(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    el.classList.add('flex');
}

function closeModal(id) {
    const el = document.getElementById(id);
    el.classList.remove('flex');
    el.classList.add('hidden');
    document.getElementById('taskForm').reset();
    document.getElementById('reminderOptions').classList.add('hidden');
}

function formatTime(timeStr) {
    if(!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${minutes} ${ampm}`;
}
