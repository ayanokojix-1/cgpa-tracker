if (!localStorage.getItem("token")) window.location.href = "/index.html";

let allSemesters = [];

async function loadAll() {
  await loadCGPA();
  await loadSemesterSummary();
}

async function loadCGPA() {
  const data = await api("/api/semesters/summary/cgpa");
  const valueEl = document.getElementById("cgpa-value");
  const classEl = document.getElementById("cgpa-classification");
  const creditsEl = document.getElementById("credits-completed");
  const markerEl = document.querySelector("#cgpa-marker > div");

  if (data.cgpa === null) {
    valueEl.textContent = "—";
    classEl.textContent = "No grades recorded yet";
    creditsEl.textContent = "";
    markerEl.style.left = "0%";
  } else {
    valueEl.textContent = data.cgpa.toFixed(2);
    classEl.textContent = data.classification;
    creditsEl.textContent = `${data.creditsCompleted} credits completed`;
    markerEl.style.left = `${Math.min((data.cgpa / 5) * 100, 100)}%`;
  }
}

async function loadSemesterSummary() {
  const data = await api("/api/semesters");
  allSemesters = data.semesters;
  const wrap = document.getElementById("semester-summary");
  const empty = document.getElementById("empty-state");
  wrap.innerHTML = "";

  if (allSemesters.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  allSemesters.forEach((sem) => {
    const totalUnits = sem.courses.reduce((s, c) => s + c.credit_units, 0);
    const row = document.createElement("div");
    row.className = "paper rounded-lg px-4 py-3 flex items-center justify-between";
    row.innerHTML = `
      <div>
        <p class="font-display font-semibold">${escapeHtml(sem.level)} Level — ${escapeHtml(sem.term)}</p>
        <p class="text-xs text-black/50">${escapeHtml(sem.session)} · ${sem.courses.length} course${sem.courses.length === 1 ? "" : "s"} · ${totalUnits} units</p>
      </div>
      <div class="text-right">
        <p class="font-mono text-lg font-semibold">${sem.gpa !== null ? sem.gpa.toFixed(2) : "—"}</p>
        <p class="text-[10px] uppercase tracking-wide text-black/40">GPA</p>
      </div>
      <button type="button" class="delete-semester ml-4 text-xs font-medium text-red-700/70 hover:text-red-800" aria-label="Delete ${escapeHtml(sem.level)} Level ${escapeHtml(sem.term)}">
        Delete
      </button>
    `;

    row.querySelector(".delete-semester").addEventListener("click", () => deleteSemester(sem));
    wrap.appendChild(row);
  });
}

async function deleteSemester(semester) {
  const name = `${semester.level} Level — ${semester.term} (${semester.session})`;
  const courseWarning = semester.courses.length
    ? ` This will also permanently delete its ${semester.courses.length} course${semester.courses.length === 1 ? "" : "s"}.`
    : "";

  if (!window.confirm(`Delete ${name}?${courseWarning}`)) return;

  try {
    await api(`/api/semesters/${semester.id}`, { method: "DELETE" });
    await loadAll();
  } catch (err) {
    alert(err.message);
  }
}

// ---- Calculate CGPA modal ----
const modal = document.getElementById("calc-modal");

function openModal() {
  const body = document.getElementById("modal-body");
  body.innerHTML = "";

  if (allSemesters.length === 0) {
    body.innerHTML = `<p class="text-sm text-black/50">No courses yet — head to "Add Courses" first.</p>`;
  } else {
    allSemesters.forEach((sem) => {
      const group = document.createElement("div");
      group.innerHTML = `<p class="text-xs uppercase tracking-wide text-black/40 mb-2">${escapeHtml(sem.level)} Level — ${escapeHtml(sem.term)} (${escapeHtml(sem.session)})</p>`;
      const list = document.createElement("div");
      list.className = "space-y-2";

      sem.courses.forEach((c) => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-3";
        row.innerHTML = `
          <span class="text-sm">${escapeHtml(c.title)} <span class="font-mono text-xs text-black/40">(${c.credit_units}u)</span></span>
          <input type="number" min="0" max="100" value="${c.score ?? ""}" placeholder="Score"
            data-course-id="${c.id}"
            class="score-field w-24 !bg-black/5 !text-[--ink-text] !border-black/20 rounded px-2 py-1.5 text-sm font-mono" />
        `;
        list.appendChild(row);
      });

      group.appendChild(list);
      body.appendChild(group);
    });
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

document.getElementById("open-calculate-btn").addEventListener("click", openModal);
document.getElementById("close-modal-btn").addEventListener("click", closeModal);
document.getElementById("cancel-modal-btn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.getElementById("save-scores-btn").addEventListener("click", async () => {
  const fields = document.querySelectorAll(".score-field");
  const updates = [];

  fields.forEach((input) => {
    const courseId = input.dataset.courseId;
    const value = input.value;
    updates.push({ courseId, score: value === "" ? null : Number(value) });
  });

  try {
    await Promise.all(
      updates.map((u) => {
        // find the course's current title/units to preserve them (PUT requires full record)
        let course = null;
        for (const sem of allSemesters) {
          course = sem.courses.find((c) => String(c.id) === String(u.courseId));
          if (course) break;
        }
        if (!course) return Promise.resolve();
        return api(`/api/courses/${u.courseId}`, {
          method: "PUT",
          body: { title: course.title, code: course.code, credit_units: course.credit_units, score: u.score },
        });
      })
    );
    closeModal();
    await loadAll();
  } catch (err) {
    alert(err.message);
  }
});

// ---- Planner ----
document.getElementById("planner-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const targetCGPA = Number(document.getElementById("planner-target").value);
  const creditsRemaining = Number(document.getElementById("planner-credits").value);
  const resultEl = document.getElementById("planner-result");

  try {
    const data = await api("/api/planner", { method: "POST", body: { targetCGPA, creditsRemaining } });
    let msg;
    if (!data.possible) {
      msg = `<p class="font-semibold" style="color:#a85450;">Not mathematically possible.</p>
             <p class="text-black/60 mt-1">You'd need a ${data.neededGPA.toFixed(2)} GPA across your remaining ${data.creditsRemaining} credits — above the 5.00 ceiling.</p>`;
    } else {
      msg = `<p class="font-semibold" style="color:#4f6e54;">You need a ${data.neededGPA.toFixed(2)} GPA${data.requiresAllAs ? " (essentially all A's)" : ""} across your remaining ${data.creditsRemaining} credits.</p>
             <p class="text-black/60 mt-1">Currently at ${data.currentCGPA.toFixed(2)} CGPA over ${data.creditsCompleted} credits, aiming for ${data.targetCGPA.toFixed(2)} (${data.targetClassification}).</p>`;
    }
    resultEl.innerHTML = msg;
    resultEl.classList.remove("hidden");
  } catch (err) {
    resultEl.innerHTML = `<p style="color:#a85450;">${err.message}</p>`;
    resultEl.classList.remove("hidden");
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadAll();
