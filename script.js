const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");
const tabs = document.querySelectorAll(".tab_btn");
const taskContainer = document.querySelector(".task-container");
const errorMessage = document.getElementById("error-message");
const clearAllBtn = document.getElementById("clearAllBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const progressBar = document.getElementById("progress");
const numbers = document.getElementById("numbers");
const errorModal = document.getElementById("errorModal");
const modalText = document.getElementById("modal-text");
const confirmBtn = document.getElementById("modal-btn-okay");
const cancelBtn = document.getElementById("modal-btn-cancel");

const toastAlert = document.getElementById("toastAlert");

let tasks = [];
if (localStorage.getItem("tasks")) {
  tasks = JSON.parse(localStorage.getItem("tasks"));
} else {
  tasks = [];
}

let editTaskId = null;

displayTasks("All Tasks"); // Initially displaying with 'All Tasks' tab selected
updateStats();
setActiveTab("All Tasks");

addBtn.addEventListener("click", function() {
  console.log("Add button clicked");
  addTask();
});
saveBtn.addEventListener("click", saveTask);
tabs.forEach((tab) => tab.addEventListener("click", switchTab));
clearAllBtn.addEventListener("click", () => showModal("all"));
clearCompletedBtn.addEventListener("click",() => showModal("completed"));
confirmBtn.addEventListener("click", handleModalConfirm);
cancelBtn.addEventListener("click", hideModal);
taskInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    if (saveBtn.style.display === "none") {
      addTask(); // Add task if save button is not displayed (adding new task)
    } else {
      saveTask(); // Save task if save button is displayed (editing existing task)
    }
  }
});

function addTask() {
  const taskName = taskInput.value.trim();
  if (taskName === "") {
    displayError();
    return;
  }
  let nextTaskId = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
  tasks.push({
    id: nextTaskId,
    name: taskName,
    status: "assigned",
  });
  taskInput.value = ""; // Clear input after adding task
  saveTasks();
  displayTasks("All Tasks");
  setActiveTab("All Tasks");
  updateStats();
  displayNoTasksMessage();
  showToast("Task added successfully", "success");
}

function editTask(taskId) {
  const taskToUpdate = tasks.find((task) => task.id === taskId);
  if (taskToUpdate) {
    taskInput.value = taskToUpdate.name;
    editTaskId = taskId;
    addBtn.style.display = "none"; // Hide add button
    saveBtn.style.display = "inline"; // Show save button
    disableTaskContainer(true);
    clearAllBtn.style.display = "none"; // Hide clear all button
    clearCompletedBtn.style.display = "none";
    updateStats(); // Update progress after editing task
    displayNoTasksMessage();
    
  }
}

function saveTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") {
    displayError();
    return;
  }
  const taskToUpdate = tasks.find((task) => task.id === editTaskId);
  if (taskToUpdate) {
    taskToUpdate.name = taskText; // Update task name
    editTaskId = null; // Reset editTaskId
    taskInput.value = ""; // Clear task input
    addBtn.style.display = "inline"; // Show add button
    saveBtn.style.display = "none"; // Hide save button
    disableTaskContainer(false);
    clearAllBtn.style.display = "inline-block"; // Show clear all button
    clearCompletedBtn.style.display = "inline-block";
    saveTasks(); // Save tasks to local storage
    displayTasks(getActiveTab());
    updateStats();
    displayNoTasksMessage();
    showToast("Task edited successfully", "success")
    
    //Automatic scrolling to edited Task
    const taskElement = document.getElementById(`task-${taskToUpdate.id}`);
    if (taskElement) {
      setTimeout(() => {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        taskElement.classList.add('highlight'); 
         setTimeout(() => {
          taskElement.classList.remove('highlight'); 
        }, 2000);
      }, 700); 
    }
  }
}

//disabling task container when editing
function disableTaskContainer(disabled) {
  if (disabled) {
    taskContainer.classList.add("disabled");
  } else {
    taskContainer.classList.remove("disabled");
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  displayTasks(getActiveTab());
  updateStats();
  displayNoTasksMessage();
  showToast("Task deleted successfully", "success");
}

function toggleTaskStatus(taskId) {
  const taskToUpdate = tasks.find((task) => task.id === taskId);
  if (taskToUpdate) {
    taskToUpdate.status =
      taskToUpdate.status === "completed" ? "assigned" : "completed";
    saveTasks();
    displayTasks(getActiveTab());
    updateStats();
  }
}

function switchTab(event) {
  const tabName = event.target.innerText.trim();
  setActiveTab(tabName); // Set the active tab
  displayTasks(tabName);
}

function getActiveTab() {
  const activeTabElement = document.querySelector(".tab_btn.active");
  if (activeTabElement) {
    return activeTabElement.innerText.trim();
  }
  return ""; // Or handle appropriately when no active tab is found
}

function setActiveTab(tabName) {
  tabs.forEach((tab) => {
    if (tab.innerText.trim() === tabName) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

//saving to local storage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

//display tasks by creating element
function displayTasks(tabName = "All Tasks") {
  taskContainer.innerHTML = "";
  tasks.forEach((task) => {
    if (
      tabName === "All Tasks" ||
      (tabName === "Assigned" && task.status === "assigned") ||
      (tabName === "Completed" && task.status === "completed")
    ) {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task");
      taskElement.id = `task-${task.id}`;
      taskElement.innerHTML = `
        <p ${task.status === "completed" ? 'class="completed"' : ""}>${task.name}</p>
        <button onclick="toggleTaskStatus(${task.id})" title="Done"><img src="images/${task.status === "completed" ? "doneicon-green.png" : "doneicon.png"}" class="done-img"></button>
        <button onclick="editTask(${task.id})" title="Edit"><img src="images/edit.png" class="edit-img"></button>
        <button onclick="showDeleteConfirmation(${task.id})" title="Delete"><img src="images/deleteicon.png" class="delete-img"></button>`;
      taskContainer.appendChild(taskElement);
    }
  });
  updateClearCompletedButton();
  updateStats();
  displayNoTasksMessage();
}

//clear all Tasks
function clearAllTasks() {
  tasks = [];
  saveTasks();
  displayTasks(getActiveTab());
  updateStats();
  displayNoTasksMessage();
  showToast("All tasks deleted successfully", "success");
}

//clear completed tasks
function clearCompletedTasks() {
  tasks = tasks.filter((task) => task.status !== "completed");
  saveTasks();
  displayTasks(getActiveTab()); // display tasks for the active tab
  updateStats();
  displayNoTasksMessage();
  showToast("Completed tasks deleted successfully", "success");
  
}

//display clear completed button only if completed task are present
function updateClearCompletedButton() {
  const completedTasksCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  clearCompletedBtn.style.display =
    completedTasksCount > 0 ? "inline-block" : "none";
}

//count and progress bar
function updateStats() {
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const totalTasks = tasks.length;
  const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
  progressBar.style.width = `${progress}%`;
  numbers.innerText = `${completedTasks}/${totalTasks}`;
  const completionMessage = document.querySelector(".completion-message");
  if (progress === 100) {
    completionMessage.style.visibility = "visible";
  } else {
    completionMessage.style.visibility = "hidden";
  }
}

//handling of task deletion
function showModal(type) {
  if (type === "all") {
    modalText.textContent = "Are you sure you want to delete all tasks?";
  } else if (type === "completed") {
    modalText.textContent = "Are you sure you want to delete completed tasks?";
  } else if (type === "delete") {
    modalText.textContent = "Are you sure you want to delete this task?";
  }
  errorModal.classList.add("show");
}

function hideModal() {
  errorModal.classList.remove("show");
}

function handleModalConfirm() {
  if (modalText.textContent.includes("all")) {
    clearAllTasks();
  } else if (modalText.textContent.includes("completed")) {
    clearCompletedTasks();
  }
  hideModal();
}

function showDeleteConfirmation(taskId) {
  showModal("delete");
  confirmBtn.addEventListener("click", () => {
    deleteTask(taskId);
    hideModal();
  });
}

//input error validation
function displayError() {
  errorMessage.innerHTML =
    ' <img src="images/exclamation.png" class="error-img"> <span>Please enter a valid task</span>';
  setTimeout(() => {
    errorMessage.textContent = "";
  }, 3000);
}

//displaying No Tasks Message
function displayNoTasksMessage() {
  const tabName = getActiveTab();
  const assignedTasksCount = tasks.filter(task => task.status === "assigned").length;
  const completedTasksCount = tasks.filter(task => task.status === "completed").length;

  if (tasks.length === 0) {
    taskContainer.innerHTML = '<p class="no-tasks">No tasks available</p>';
  } else if (tabName === "Assigned" && assignedTasksCount === 0) {
    taskContainer.innerHTML = '<p class="no-tasks">No assigned tasks</p>';
  } else if (tabName === "Completed" && completedTasksCount === 0) {
    taskContainer.innerHTML = '<p class="no-tasks">No completed tasks</p>';
  }
}


//Alert toast
function showToast(message, type) {
  toastAlert.textContent = message;
  toastAlert.className = "toast-alert show";
  if (type === "success") {
    toastAlert.classList.add("success");
  } else if (type === "error") {
    toastAlert.classList.add("error");
  }

  setTimeout(() => {
    toastAlert.className = toastAlert.className.replace("show", "");
  }, 3000);
}