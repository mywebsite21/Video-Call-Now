import { initializeApp } from "https://www.gstaticgstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAwS7AZewx0L8KRGeFXB7Jq4BJEbSB0xO0",
  authDomain: "fxgroup-5dd7c.firebaseapp.com",
  projectId: "fxgroup-5dd7c",
  storageBucket: "fxgroup-5dd7c.firebasestorage.app",
  messagingSenderId: "982128077012",
  appId: "1:982128077012:web:e5088b7be662cecf20f341",
  measurementId: "G-9FRXZNCJQJ",
};

let app, db, auth, analytics;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    analytics = getAnalytics(app);
    isFirebaseConfigured = true;
    console.log("🔥 Firebase is successfully connected!");
  } else {
    console.warn(
      "⚠️ Firebase is not configured. Running with mock data for demonstration.",
    );
}

// ==========================================
// 2. MOCK DATA (Fallback if Firebase not setup)
// ==========================================
const defaultPermissions = {
  allowCustomURL: false,
  allowTelegramEdit: false,
  allowMemberMgmt: false,
  allowExcelDownload: false,
  allowSearch: false,
};
pepermissionDefinitionsprmissionDefinitions
const pepermissionDefinitionsppepermissionDefinitionsprmissionDefinitionsrmissionDefinitions = [
  {
    id: "allowCustomURL",
    name: "Custom URL Creation",
    desc: "Allow admin to generate deep links",
  },
  {
    id: "allowSearch",
    name: "Search Bar Access",
    desc: "Enable search functionality for members",
  },
  {
    id: "allowExport",
    name: "Data Export System",
    desc: "Enable CSV and Excel downloads",
  },
  {
    id: "allowTelegramEdit",
    name: "Telegram Integration",
    desc: "Modify group settings & bot links",
  },
  {
    id: "allowMemberMgmt",
    name: "Direct Member Edit",
    desc: "Full member profile overrides",
  },
  {
    id: "allowExcelDownload",
    name: "Excel Download",
    desc: "Download data directly to Excel",
  },
];

let mockAdmins = [
  {
    id: "ADM-001",
    username: "FxTraderX",
    email: "fxtraderx@example.com",
    status: "active",
    permissions: {
      ...defaultPermissions,
      allowCustomURL: true,
      allowTelegramEdit: true,
    },
  },
  {
    id: "ADM-002",
    username: "PipsMaster",
    email: "pips@example.com",
    status: "pending",
    permissions: { ...defaultPermissions },
  },
  {
    id: "ADM-003",
    username: "GoldBull",
    email: "gold@example.com",
    status: "blocked",
    permissions: { ...defaultPermissions },
  },
];

let mockMembers = [
  {
    id: "MEM-101",
    name: "John Doe",
    telegram: "@johnd",
    whatsapp: "+1234567890",
    joinedDate: "2026-06-01",
  },
  {
    id: "MEM-102",
    name: "Sarah Smith",
    telegram: "@sarahs",
    whatsapp: "+0987654321",
    joinedDate: "2026-06-05",
  },
  {
    id: "MEM-103",
    name: "Mike Chen",
    telegram: "@mikec",
    whatsapp: "+1122334455",
    joinedDate: "2026-06-08",
  },
];

// Global permissions have been migrated to per-admin basis

// ==========================================
// 3. UI logic & Navigation
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initAnimatedBackground();

  if (isFirebaseConfigured) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Admin panel authenticated as:", user.uid);
        document.getElementById("login-overlay")?.classList.remove("active");
        setupFirebaseListeners();
      } else {
        console.log("Admin requires login.");
        document.getElementById("login-overlay")?.classList.add("active");
        if (unsubAdmins) unsubAdmins();
        if (unsubMembers) unsubMembers();
      }
    });

    document.getElementById("auth-login-btn")?.addEventListener("click", () => {
      const email = document.getElementById("auth-email").value;
      const pass = document.getElementById("auth-password").value;
      const errEl = document.getElementById("auth-error-msg");

      if (!email || !pass) {
        errEl.innerText = "Email and password are required!";
        return;
      }

      errEl.innerText = "Authenticating...";
      signInWithEmailAndPassword(auth, email, pass).catch((err) => {
        console.warn("Login failed:", err);
        errEl.innerText = err.message;
      });
    });
  } else {
    document.getElementById("login-overlay")?.classList.remove("active");
    // Initial Render with Mock Data
    renderDashboard();
    renderAdmins();
    renderMembers();
  }

  // Setup Listeners
  document
    .getElementById("admin-search-btn")
    .addEventListener("click", handleAdminSearch);
  document
    .getElementById("member-search-btn")
    .addEventListener("click", handleMemberSearch);
  document
    .getElementById("export-members-btn")
    .addEventListener("click", exportMembersCSV);
  document.getElementById("logout-btn").addEventListener("click", handleLogout);

  document
    .getElementById("confirm-delete-btn")
    ?.addEventListener("click", async () => {
      if (!memberToDelete) return;

      const btn = document.getElementById("confirm-delete-btn");
      btn.innerText = "Deleting...";
      btn.disabled = true;

      try {
        if (isFirebaseConfigured) {
          await deleteDoc(doc(db, "registrations", memberToDelete));
        } else {
          mockMembers = mockMembers.filter((m) => m.id !== memberToDelete);
          renderMembers();
          renderDashboard();
        }
        window.closeDeleteModal();
      } catch (err) {
        console.error("Error deleting member: ", err);
        alert(
          "Failed to delete member. Make sure you have updated Firestore rules to allow read/write on /registrations. Error: " +
            err.message,
        );
        window.closeDeleteModal();
      } finally {
        btn.innerText = "Delete";
        btn.disabled = false;
      }
    });
});

let unsubAdmins = null;
let unsubMembers = null;

function setupFirebaseListeners() {
  if (unsubAdmins) unsubAdmins();
  if (unsubMembers) unsubMembers();

  // Listen to Admins
  unsubAdmins = onSnapshot(
    collection(db, "admins"),
    (snapshot) => {
      mockAdmins = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        mockAdmins.push({
          id: doc.id,
          ...data,
          status: data.status || "pending",
          permissions: data.permissions || { ...defaultPermissions },
        });
      });
      renderAdmins();
      renderDashboard();

      // Update modal if it's currently open
      if (currentEditingAdminId) {
        window.openAdminSettings(currentEditingAdminId);
      }
    },
    (error) => {
      console.warn("Firebase Admins Listener Warning:", error);
      // Silently handle error or show in UI without blocking alert
      const tbody = document.getElementById("admins-table-body");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-light);">
            <strong style="color: var(--danger);">Firestore Database Permission Denied</strong><br><br>
            Please go to your <a href="https://console.firebase.google.com/" target="_blank" style="color:#007bff; text-decoration:underline;">Firebase Console</a> &gt; <strong>Firestore Database</strong> &gt; <strong>Rules</strong> and update them EXACTLY to this:<br>
            <pre style="background: rgba(0,0,0,0.3); color: #fff; padding: 1rem; border-radius: 8px; margin: 1rem auto; text-align: left; max-width: 450px; font-size: 0.85rem;">rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /admins/{document=**} {\n      allow read, write: if request.auth != null;\n    }\n    match /members/{document=**} {\n      allow read, write: if true;\n    }\n  }\n}</pre>
            <i>After publishing the rules, refresh this page, and your Main Site will also work perfectly.</i>
        </td></tr>`;
    },
  );

  // Listen to Members
  unsubMembers = onSnapshot(
    collection(db, "registrations"),
    (snapshot) => {
      mockMembers = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let joinedDate = data.joinedDate || data.date || "N/A";
        const timeField = data.createdAt || data.timestamp || data.created_at;

        if (timeField && typeof timeField.toDate === "function") {
          joinedDate = timeField.toDate().toLocaleDateString();
        } else if (timeField && timeField.seconds) {
          joinedDate = new Date(timeField.seconds * 1000).toLocaleDateString();
        } else if (timeField) {
          joinedDate = new Date(timeField).toLocaleDateString() || timeField;
        }

        mockMembers.push({
          id: doc.id,
          ...data,
          joinedDate: joinedDate,
        });
      });

      mockMembers.sort((a, b) => {
        const getT = (obj) => {
          const timeField = obj.createdAt || obj.timestamp || obj.created_at;
          if (!timeField && !obj.joinedDate && !obj.date) return 0;
          if (timeField) {
            if (typeof timeField.toDate === "function")
              return timeField.toDate().getTime();
            if (timeField.seconds) return timeField.seconds * 1000;
            const d = new Date(timeField).getTime();
            if (!isNaN(d)) return d;
          }
          if (obj.joinedDate || obj.date) {
            const d = new Date(obj.joinedDate || obj.date).getTime();
            if (!isNaN(d)) return d;
          }
          return 0;
        };
        return getT(b) - getT(a);
      });

      renderMembers();
      renderDashboard();
    },
    (error) => {
      console.warn("Firebase Members Listener Warning:", error);
      // Silently handle error or show in UI without blocking alert
      const tbody = document.getElementById("members-table-body");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-light);">
            <strong style="color: var(--danger);">Firestore Database Permission Denied</strong><br><br>
            Please go to your <a href="https://console.firebase.google.com/" target="_blank" style="color:#007bff; text-decoration:underline;">Firebase Console</a> &gt; <strong>Firestore Database</strong> &gt; <strong>Rules</strong> and update them EXACTLY to this:<br>
            <pre style="background: rgba(0,0,0,0.3); color: #fff; padding: 1rem; border-radius: 8px; margin: 1rem auto; text-align: left; max-width: 450px; font-size: 0.85rem;">rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /admins/{document=**} {\n      allow read, write: if request.auth != null;\n    }\n    match /registrations/{document=**} {\n      allow read, write: if true;\n    }\n  }\n}</pre>
            <i>After publishing the rules, refresh this page, and your Main Site will also work perfectly.</i>
        </td></tr>`;
    },
  );
}

function initNavigation() {
  const navItems = document.querySelectorAll(
    ".sidebar-nav .nav-item[data-target]",
  );
  const sections = document.querySelectorAll(".section-content");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      // Remove active classes
      navItems.forEach((n) => n.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      // Add active class to clicked
      item.classList.add("active");
      const targetId = item.getAttribute("data-target");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

function initAnimatedBackground() {
  const container = document.getElementById("bg-animation");
  for (let i = 0; i < 20; i++) {
    const cube = document.createElement("div");
    cube.classList.add("cube");

    // Random properties
    const size = Math.random() * 60 + 20;
    const left = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 10;

    cube.style.width = `${size}px`;
    cube.style.height = `${size}px`;
    cube.style.left = `${left}vw`;
    cube.style.animationDuration = `${duration}s`;
    cube.style.animationDelay = `${delay}s`;

    container.appendChild(cube);
  }
}

// ==========================================
// 4. RENDER FUNCTIONS
// ==========================================
function renderDashboard() {
  // If firebase is configured, you would listen to collections here.
  // For now we calculate from mock data.
  const totalMembers = mockMembers.length;
  const totalAdmins = mockAdmins.length;
  const activeAdmins = mockAdmins.filter((a) => a.status === "active").length;
  const pendingAdmins = mockAdmins.filter((a) => a.status === "pending").length;

  // Animate numbers
  animateValue("stat-members", 0, totalMembers, 1000);
  animateValue("stat-admins", 0, totalAdmins, 1000);
  animateValue("stat-active-admins", 0, activeAdmins, 1000);
  animateValue("stat-pending", 0, pendingAdmins, 1000);
  animateValue("stat-daily", 0, 3, 1000); // Mock daily
}

function renderAdmins(adminsData = mockAdmins) {
  const tbody = document.getElementById("admins-table-body");
  tbody.innerHTML = "";

  if (adminsData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No admins found</td></tr>`;
    return;
  }

  adminsData.forEach((admin) => {
    let statusBadge = "";
    if (admin.status === "active")
      statusBadge = `<span class="badge badge-success">Active</span>`;
    else if (admin.status === "pending")
      statusBadge = `<span class="badge badge-warning">Pending</span>`;
    else statusBadge = `<span class="badge badge-danger">Blocked</span>`;

    const tr = document.createElement("tr");
    const shortId =
      admin.id.length > 8 ? admin.id.substring(0, 8) + "..." : admin.id;

    let referralIdentifier = admin.email ? admin.email.split("@")[0] : admin.id;
    let adminReferralLink = `https://mywebsite21.github.io/Ads-Point-BD/?ref=${referralIdentifier}`;

    tr.innerHTML = `
            <td title="${admin.id}"><span style="font-size: 11px; color: var(--text-faded);">${shortId}</span></td>
            <td><strong>${admin.email || "N/A"}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap: 0.5rem;">
                    <input type="text" class="input-field" value="${adminReferralLink}" readonly style="padding: 0.25rem 0.5rem; font-size: 12px; width: 140px; border-color: rgba(255,255,255,0.1);">
                    <button class="btn btn-sm btn-outline" onclick="navigator.clipboard.writeText('${adminReferralLink}'); alert('Link copied!')" title="Copy Referral Link"><i class="fa-solid fa-copy"></i></button>
                </div>
            </td>
            <td>${statusBadge}</td>
            <td style="display:flex; gap: 0.5rem;">
                ${admin.status === "pending" ? `<button class="btn btn-sm btn-primary" onclick="window.approveAdmin('${admin.id}')"><i class="fa-solid fa-check"></i></button>` : ""}
                ${admin.status === "pending" ? `<button class="btn btn-sm btn-danger" onclick="window.rejectAdmin('${admin.id}')"><i class="fa-solid fa-xmark"></i></button>` : ""}
                ${admin.status === "active" ? `<button class="btn btn-sm btn-danger" onclick="window.blockAdmin('${admin.id}')"><i class="fa-solid fa-ban"></i></button>` : ""}
                ${admin.status === "blocked" ? `<button class="btn btn-sm btn-success" style="background:#10b981; color:#fff;" onclick="window.unblockAdmin('${admin.id}')"><i class="fa-solid fa-unlock"></i></button>` : ""}
                <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="window.deleteAdmin('${admin.id}')" title="Delete Admin"><i class="fa-solid fa-trash"></i></button>
                <button class="btn btn-sm btn-outline" style="color:var(--primary); border-color:var(--primary);" onclick="window.openAdminSettings('${admin.id}')" title="Permissions Settings"><i class="fa-solid fa-gear"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

function renderMembers(membersData = mockMembers) {
  const tbody = document.getElementById("members-table-body");
  tbody.innerHTML = "";

  if (membersData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No members found</td></tr>`;
    return;
  }

  membersData.forEach((member) => {
    const tr = document.createElement("tr");

    let referredByText =
      '<span style="color:var(--text-light); opacity: 0.5;">Direct</span>';
    const refSource =
      member.referredBy ||
      member.referrer ||
      member.admin ||
      member.ref ||
      member.reference ||
      member.referral ||
      member.adminId ||
      member.adminEmail ||
      member.admin_id ||
      member.refId;

    if (refSource) {
      const refUrl = `https://mywebsite21.github.io/Ads-Point-BD/?ref=${encodeURIComponent(refSource)}`;
      referredByText = `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; display: inline-block; width: fit-content;">${refSource}</span>
          <a href="${refUrl}" target="_blank" style="font-size: 0.75rem; color: #007bff; text-decoration: underline; white-space: nowrap;"><i class="fa-solid fa-link"></i> ${refUrl}</a>
        </div>
      `;
    }

    tr.innerHTML = `
            <td><strong>${member.name || member.fullName || "N/A"}</strong></td>
            <td style="color:#38bdf8;">${member.telegram || member.telegramUsername || "N/A"}</td>
            <td style="color:#4ade80;">${member.whatsapp || member.whatsappNumber || "N/A"}</td>
            <td>${referredByText}</td>
            <td>${member.joinedDate || "N/A"}</td>
            <td style="display:flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-danger" onclick="window.deleteMember('${member.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

// Render Permissions is now handled dynamically in the modal

// ==========================================
// 5. ACTIONS & UTILS
// ==========================================

// Global actions for onclick attributes
window.approveAdmin = (id) => updateAdminStatus(id, "active");
window.rejectAdmin = (id) => updateAdminStatus(id, "rejected");
window.blockAdmin = (id) => updateAdminStatus(id, "blocked");
window.unblockAdmin = (id) => updateAdminStatus(id, "active");
window.deleteAdmin = async (id) => {
  if (confirm("Are you sure you want to delete this admin?")) {
    try {
      if (isFirebaseConfigured) {
        await deleteDoc(doc(db, "admins", id));
      } else {
        mockAdmins = mockAdmins.filter((a) => a.id !== id);
        renderAdmins();
        renderDashboard();
      }
    } catch (error) {
      console.warn("Delete Admin Error:", error);
      alert("Error deleting admin: " + error.message);
    }
  }
};

window.viewMember = (id) => {
  const mem = mockMembers.find((m) => m.id === id);
  alert(
    `Member Details:\nName: ${mem.name || mem.username || "Unknown"}\nTelegram: ${mem.telegram || "N/A"}\nWhatsApp: ${mem.whatsapp || "N/A"}\nJoined: ${mem.joinedDate}`,
  );
};

let memberToDelete = null;

window.deleteMember = (id) => {
  memberToDelete = id;
  const modal = document.getElementById("delete-confirm-modal");
  if (modal) modal.classList.remove("hidden");
};

window.closeDeleteModal = () => {
  memberToDelete = null;
  const modal = document.getElementById("delete-confirm-modal");
  if (modal) modal.classList.add("hidden");
};

let currentEditingAdminId = null;

window.openAdminSettings = (id) => {
  const admin = mockAdmins.find((a) => a.id === id);
  if (!admin) return;

  currentEditingAdminId = id;
  const adminName =
    admin.email || admin.name || admin.username || admin.id || "Admin";
  document.getElementById("modal-admin-name").innerText =
    `Permissions: ${adminName}`;

  const container = document.getElementById("modal-permissions-container");
  container.innerHTML = "";

  permissionDefinitions.forEach((permDef) => {
    const isActive = admin.permissions[permDef.id] || false;

    const wrapper = document.createElement("div");
    wrapper.className = "toggle-wrapper";
    wrapper.innerHTML = `
            <div class="toggle-info">
                <h4>${permDef.name}</h4>
                <p>${permDef.desc}</p>
            </div>
            <div class="toggle ${isActive ? "active" : ""}" onclick="window.toggleAdminPermission('${admin.id}', '${permDef.id}')" id="toggle-${admin.id}-${permDef.id}"></div>
        `;
    container.appendChild(wrapper);
  });

  document.getElementById("admin-modal").classList.add("active");
};

window.closeAdminModal = () => {
  document.getElementById("admin-modal").classList.remove("active");
  currentEditingAdminId = null;
};

window.toggleAdminPermission = async (adminId, permId) => {
  const admin = mockAdmins.find((a) => a.id === adminId);
  if (admin) {
    try {
      const newState = !admin.permissions[permId];

      // Optimistic UI update
      admin.permissions[permId] = newState;
      const el = document.getElementById(`toggle-${adminId}-${permId}`);
      if (newState) el.classList.add("active");
      else el.classList.remove("active");

      if (isFirebaseConfigured) {
        await updateDoc(doc(db, "admins", adminId), {
          [`permissions.${permId}`]: newState,
        });
      }
    } catch (error) {
      console.warn("Toggle Permission Error:", error);
      alert("Error updating permission: " + error.message);

      // Revert changes on error
      admin.permissions[permId] = !admin.permissions[permId];
      const el = document.getElementById(`toggle-${adminId}-${permId}`);
      if (admin.permissions[permId]) el.classList.add("active");
      else el.classList.remove("active");
    }
  }
};

async function updateAdminStatus(id, status) {
  try {
    if (isFirebaseConfigured) {
      if (status === "rejected") {
        await deleteDoc(doc(db, "admins", id));
      } else {
        await updateDoc(doc(db, "admins", id), { status: status });
      }
    } else {
      if (status === "rejected") {
        mockAdmins = mockAdmins.filter((a) => a.id !== id);
      } else {
        const admin = mockAdmins.find((a) => a.id === id);
        if (admin) admin.status = status;
      }
      renderAdmins();
      renderDashboard();
    }
  } catch (error) {
    console.warn("Update Status Error:", error);
    alert(
      "Action failed: " +
        error.message +
        "\n\nMake sure you are logged in and have Master Admin rights.",
    );
  }
}

function handleAdminSearch() {
  const type = document.getElementById("admin-search-type").value;
  const query = document
    .getElementById("admin-search-input")
    .value.toLowerCase();

  if (!query) return renderAdmins(mockAdmins);

  const filtered = mockAdmins.filter((a) => {
    if (type === "email") return (a.email || "").toLowerCase().includes(query);
    if (type === "username")
      return (a.username || "").toLowerCase().includes(query);
    if (type === "id") return (a.id || "").toLowerCase().includes(query);
    return false;
  });
  renderAdmins(filtered);
}

function handleMemberSearch() {
  const type = document.getElementById("member-search-type").value;
  const query = document
    .getElementById("member-search-input")
    .value.toLowerCase();

  if (!query) return renderMembers(mockMembers);

  const filtered = mockMembers.filter((m) => {
    if (type === "name")
      return (m.name || m.fullName || "").toLowerCase().includes(query);
    if (type === "telegram")
      return (m.telegram || m.telegramUsername || "")
        .toLowerCase()
        .includes(query);
    if (type === "whatsapp")
      return (m.whatsapp || "").toLowerCase().includes(query);
    return false;
  });
  renderMembers(filtered);
}

function exportMembersCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID,Name,Telegram,WhatsApp,Joined Date\n";

  mockMembers.forEach((m) => {
    csvContent += `${m.id},${m.name},${m.telegram},${m.whatsapp},${m.joinedDate}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "members_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleLogout(e) {
  e.preventDefault();
  if (isFirebaseConfigured) {
    signOut(auth)
      .then(() => {
        alert("Logged out successfully");
        // window.location.href = "/login.html";
      })
      .catch((err) => alert("Logout failed: " + err.message));
  } else {
    alert("Logged out successfully (Mock)");
  }
}

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
