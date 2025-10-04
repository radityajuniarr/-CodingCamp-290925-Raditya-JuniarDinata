const $ = (s, root=document) => root.querySelector(s);

const form = $("#todo-form");
const input = $("#todo-input");
const due = $("#todo-date");
const tbody = $("#todo-body");
const filterSel = $("#status-filter");
const deleteAllBtn = $("#delete-all");
const statTotal = $("#stat-total");
const statDone = $("#stat-done");
const statPending = $("#stat-pending");
const toastEl = $("#toast");

const LS_KEY = "todos.v2_glass";

/** @type {{id:string,text:string,due:string,done:boolean,created:number}[]} */
let todos = [];

(function init(){
  todos = readLS();
  render();
})();


form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  const dueDate = due.value; 
  if(!text){
    showToast("Isi dulu task-nya ya 😉");
    input.focus();
    return;
  }
  todos.push({
    id: crypto.randomUUID(),
    text,
    due: dueDate,
    done: false,
    created: Date.now(),
  });
  persist();
  form.reset();
  input.focus();
  render();
  showToast("Task ditambahkan ✅");
});

filterSel.addEventListener("change", render);

deleteAllBtn.addEventListener("click", () => {
  if(todos.length === 0) return;
  if(confirm("Hapus semua tugas?")){
    todos = [];
    persist();
    render();
    showToast("Semua task terhapus 🗑️");
  }
});


function readLS(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch{
    return [];
  }
}
function persist(){
  localStorage.setItem(LS_KEY, JSON.stringify(todos));
}

function fmtDate(yyyyMMdd){
  if(!yyyyMMdd) return "-";
  const [y,m,d] = yyyyMMdd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m-1, d));
  return dt.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}

function render(){
  // filter
  const mode = filterSel.value; 
  let data = todos.slice();
  if(mode === "pending") data = data.filter(t => !t.done);
  if(mode === "done")    data = data.filter(t => t.done);

  data.sort((a,b) => {
    const av = a.due || "9999-12-31";
    const bv = b.due || "9999-12-31";
    if(av === bv) return a.created - b.created;
    return av.localeCompare(bv);
  });

  // table body
  tbody.innerHTML = "";
  if(data.length === 0){
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    tr.innerHTML = `<td colspan="4">No task found</td>`;
    tbody.appendChild(tr);
  }else{
    for(const t of data){
      const tr = document.createElement("tr");

      // Task
      const tdTask = document.createElement("td");
      tdTask.textContent = t.text;
      tdTask.style.maxWidth = "480px";
      tdTask.style.wordBreak = "break-word";
      if(t.done) tdTask.style.textDecoration = "line-through";

      // Due
      const tdDue = document.createElement("td");
      tdDue.textContent = fmtDate(t.due);

      // Status
      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `badge ${t.done ? "done" : "pending"}`;
      badge.textContent = t.done ? "Completed" : "Pending";
      tdStatus.appendChild(badge);

      // Actions
      const tdAct = document.createElement("td");
      tdAct.append(
        actBtn(t.done ? "Uncomplete" : "Complete", t.done ? "ghost" : "primary", () => toggleDone(t.id), t.done ? "bx-undo" : "bx-check"),
        gap(),
        actBtn("Edit", "ghost", () => editTodo(t.id), "bx-edit"),
        gap(),
        actBtn("Delete", "danger", () => removeTodo(t.id), "bx-trash")
      );

      tr.append(tdTask, tdDue, tdStatus, tdAct);
      tbody.appendChild(tr);
    }
  }

  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const pending = total - done;
  statTotal.textContent = `${total} ${total === 1 ? "task" : "tasks"}`;
  statDone.textContent = `${done} done`;
  statPending.textContent = `${pending} pending`;
}

function gap(){ return document.createTextNode(" "); }

function actBtn(text, variant, onClick, icon=""){
  const b = document.createElement("button");
  b.className = `btn small ${variant}`;
  b.addEventListener("click", onClick);
  if(icon){
    const i = document.createElement("i");
    i.className = `bx ${icon}`;
    b.append(i);
  }
  const span = document.createElement("span");
  span.textContent = text;
  b.append(span);
  return b;
}

function toggleDone(id){
  const t = todos.find(x => x.id === id);
  if(!t) return;
  t.done = !t.done;
  persist();
  render();
  showToast(t.done ? "Mantap! Task completed 🎉" : "Task dikembalikan ke pending ↩️");
}

function editTodo(id){
  const t = todos.find(x => x.id === id);
  if(!t) return;
  const newText = prompt("Edit task:", t.text);
  if(newText === null) return; 
  const trim = newText.trim();
  if(trim){
    t.text = trim;
    persist();
    render();
    showToast("Task diupdate ✏️");
  }
}

function removeTodo(id){
  todos = todos.filter(x => x.id !== id);
  persist();
  render();
  showToast("Task dihapus 🗑️");
}

let toastTimer = null;
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove("show"), 1600);
}
