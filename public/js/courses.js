let semesters = [];
let currentSemesterId = null;

async function init() {
  await loadSemesters();

  document.getElementById("new-semester-toggle").addEventListener("click", () => {
    document.getElementById("new-semester-form").classList.toggle("hidden");
  });

  document.getElementById("save-semester-btn").addEventListener("click", createSemester);
  document.getElementById("close-new-semester-btn").addEventListener("click", closeNewSemesterForm);
  document.getElementById("semester-select").addEventListener("change", onSemesterChange);
  document.getElementById("add-course-btn").addEventListener("click", addCourse);
  document.getElementById("delete-semester-btn").addEventListener("click", deleteCurrentSemester);
}

function closeNewSemesterForm() {
  document.getElementById("new-semester-form").classList.add("hidden");
  document.getElementById("sem-level").value = "";
  document.getElementById("sem-session").value = "";
  document.getElementById("sem-term").selectedIndex = 0;
}

async function loadSemesters() {
  const data = await api("/api/semesters");
  semesters = data.semesters;
  const select = document.getElementById("semester-select");
  const prev = select.value;
  select.innerHTML = `<option value="">Select a semester…</option>`;
  semesters.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.level} Level — ${s.term} (${s.session})`;
    select.appendChild(opt);
  });
  if (prev) select.value = prev;
}

async function createSemester() {
  const level = document.getElementById("sem-level").value.trim();
  const session = document.getElementById("sem-session").value.trim();
  const term = document.getElementById("sem-term").value;
  if (!level || !session) return alert("Level and session are required.");

  try {
    const data = await api("/api/semesters", { method: "POST", body: { level, session, term } });
    document.getElementById("sem-level").value = "";
    document.getElementById("sem-session").value = "";
    document.getElementById("new-semester-form").classList.add("hidden");
    await loadSemesters();
    document.getElementById("semester-select").value = data.semester.id;
    onSemesterChange();
  } catch (err) {
    alert(err.message);
  }
}

function onSemesterChange() {
  const id = document.getElementById("semester-select").value;
  currentSemesterId = id || null;
  const courseSection = document.getElementById("course-section");
  const hint = document.getElementById("pick-semester-hint");
  const deleteButton = document.getElementById("delete-semester-btn");

  deleteButton.classList.toggle("hidden", !currentSemesterId);

  if (!currentSemesterId) {
    courseSection.classList.add("hidden");
    hint.classList.remove("hidden");
    return;
  }
  courseSection.classList.remove("hidden");
  hint.classList.add("hidden");
  renderCourseList();
}

async function deleteCurrentSemester() {
  const semester = semesters.find((s) => String(s.id) === String(currentSemesterId));
  if (!semester) return;

  const name = `${semester.level} Level — ${semester.term} (${semester.session})`;
  const courseWarning = semester.courses.length
    ? ` This will also permanently delete its ${semester.courses.length} course${semester.courses.length === 1 ? "" : "s"}.`
    : "";

  if (!window.confirm(`Delete ${name}?${courseWarning}`)) return;

  try {
    await api(`/api/semesters/${semester.id}`, { method: "DELETE" });
    currentSemesterId = null;
    await loadSemesters();
    document.getElementById("semester-select").value = "";
    onSemesterChange();
  } catch (err) {
    alert(err.message);
  }
}

function renderCourseList() {
  const sem = semesters.find((s) => String(s.id) === String(currentSemesterId));
  const list = document.getElementById("course-list");
  const empty = document.getElementById("course-empty");
  list.innerHTML = "";

  if (!sem || sem.courses.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  sem.courses.forEach((c) => {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between paper rounded px-3 py-2";
    li.innerHTML = `
      <span>${escapeHtml(c.title)} <span class="font-mono text-xs text-black/50">· ${c.credit_units} units</span></span>
      <button class="text-xs text-red-700/60 delete-course">✕</button>
    `;
    li.querySelector(".delete-course").addEventListener("click", async () => {
      try {
        await api(`/api/courses/${c.id}`, { method: "DELETE" });
        await loadSemesters();
        renderCourseList();
      } catch (err) {
        alert(err.message);
      }
    });
    list.appendChild(li);
  });
}

async function addCourse() {
  const title = document.getElementById("course-title").value.trim();
  const units = document.getElementById("course-units").value;
  if (!currentSemesterId) return alert("Select a semester first.");
  if (!title || !units) return alert("Course title and units are required.");

  try {
    await api("/api/courses", {
      method: "POST",
      body: { semester_id: currentSemesterId, title, credit_units: Number(units) },
    });
    document.getElementById("course-title").value = "";
    document.getElementById("course-units").value = "";
    await loadSemesters();
    renderCourseList();
  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

init();
