import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
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
} catch (error) {
  console.warn("Firebase init error:", error);
}

// ==========================================
// 2. MOCK DATA (Fallback if Firebase not setup)
// ==========================================
const defaultPermissions = {
  allowCustomURL: false,
  allowExport: false,
  allowTelegramEdit: false,
  allowMemberMgmt: false,
  allowExcelDownload: false,
  allowSearch: false,
};

const permissionDefinitions = [
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
];

let mockMembers = [
  {
    id: "MEM-101",
    name: "John Doe",
    telegram: "@johnd",
    whatsapp: "+1234567890",
    joinedDate: "2026-06-01",
    referralAdmin: "Ovi",
    referralLink: "https://mywebsite21.github.io/Ads-Point-BD/?ref=Ovi"
  }
];

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
          // You might need to change "registrations" to "CommunityMembers" if that's what your main site uses
          await deleteDoc(doc(db, "CommunityMembers", memberToDelete));
        } else {
          mockMembers = mockMembers.filter((m) => m.id !== memberToDelete);
          renderMembers();
          renderDashboard();
        }
        window.closeDeleteModal();
      } catch (err) {
        console.error("Error deleting member: ", err);
        alert("Failed to delete member: " + err.message);
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

      if (currentEditingAdminId) {
        window.openAdminSettings(currentEditingAdminId);
      }
    },
    (error) => {
      console.warn("Firebase Admins Listener Warning:", error);
    }
  );

  // Listen to Members (Note: Using CommunityMembers from your frontend code)
  unsubMembers = onSnapshot(
    collection(db, "CommunityMembers"),
    (snapshot) => {
      mockMembers = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let joinedDate = data.registrationDate || data.joinedDate || data.date || "N/A";
        
        mockMembers.push({
          id: doc.id,
          ...data,
          joinedDate: joinedDate,
        });
      });

      // Sort by timestamp if available
      mockMembers.sort((a, b) => {
        if(b.timestamp && a.timestamp) return b.timestamp - a.timestamp;
        return 0;
      });

      renderMembers();
      renderDashboard();
    },
    (error) => {
      console.warn("Firebase Members Listener Warning:", error);
    }
  );
}

function initNavigation() {
  const navItems = document.querySelectorAll(".sidebar-nav .nav-item[data-target]");
  const sections = document.querySelectorAll(".section-content");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      navItems.forEach((n) => n.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

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
  const totalMembers = mockMembers.length;
  const totalAdmins = mockAdmins.length;
  const activeAdmins = mockAdmins.filter((a) => a.status === "active").length;
  const pendingAdmins = mockAdmins.filter((a) => a.status === "pending").length;

  animateValue("stat-members", 0, totalMembers, 1000);
  animateValue("stat-admins", 0, totalAdmins, 1000);
  animateValue("stat-active-admins", 0, activeAdmins, 1000);
  animateValue("stat-pending", 0, pendingAdmins, 1000);
  animateValue("stat-daily", 0, 3, 1000); 
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
    if (admin.status === "active") statusBadge = `<span class="badge badge-success">Active</span>`;
    else if (admin.status === "pending") statusBadge = `<span class="badge badge-warning">Pending</span>`;
    else statusBadge = `<span class="badge badge-danger">Blocked</span>`;

    const tr = document.createElement("tr");
    const shortId = admin.id.length > 8 ? admin.id.substring(0, 8) + "..." : admin.id;

    // Fixed Referral Link Generator 
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

    let referredByText = '<span style="color:var(--text-light); opacity: 0.5;">Direct</span>';
    
    // Correctly fetching the referralAdmin field from your database
    const refSource =
      member.referralAdmin || 
      member.referredBy ||
      member.referrer ||
      member.admin ||
      member.ref;

    // Update the UI to show the correct Link and Identifier
    if (refSource && refSource.toLowerCase() !== "official" && refSource.toLowerCase() !== "direct traffic") {
      // It will prioritize the exact link saved in DB. If not found, it generates it using your domain.
      const refUrl = member.referralLink || `https://mywebsite21.github.io/Ads-Point-BD/?ref=${encodeURIComponent(refSource)}`;
      
      referredByText = `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; display: inline-block; width: fit-content; text-transform: none; font-size: 11px;">${refSource}</span>
          <a href="${refUrl}" target="_blank" style="font-size: 0.75rem; color: #00d2ff; text-decoration: underline; white-space: nowrap;"><i class="fa-solid fa-link"></i> ${refUrl}</a>
        </div>
      `;
    } else if (refSource && refSource.toLowerCase() === "official") {
        referredByText = `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #22c55e; display: inline-block; width: fit-content;">Official</span>
        </div>
      `;
    }

    tr.innerHTML = `
            <td><strong>${member.fullName || member.name || "N/A"}</strong></td>
            <td style="color:#38bdf8;">${member.telegramUsername || member.telegram || "N/A"}</td>
            <td style="color:#4ade80;">${member.whatsappNumber || member.whatsapp || "N/A"}</td>
            <td>${referredByText}</td>
            <td>${member.joinedDate || "N/A"}</td>
            <td style="display:flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-danger" onclick="window.deleteMember('${member.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// 5. ACTIONS & UTILS
// ==========================================
window.approveAdmin = (id) => updateAdminStatus(id, "active");
window.rejectAdmin = (id) => updateAdminStatus(id, "rejected");
window.blockAdmin = (id) => updateAdminStatus(id, "blocked");
window.unblockAdmin = (id) => updateAdminStatus(id, "active");
window.deleteAdmin = async (id) => {
  if (confirm("Are you sure you want to delete this admin?")) {
    try {
      if (isFirebaseConfigured) await deleteDoc(doc(db, "admins", id));
      else {
        mockAdmins = mockAdmins.filter((a) => a.id !== id);
        renderAdmins();
        renderDashboard();
      }
    } catch (error) {
      alert("Error deleting admin: " + error.message);
    }
  }
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
  const adminName = admin.email || admin.id || "Admin";
  document.getElementById("modal-admin-name").innerText = `Permissions: ${adminName}`;

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
      alert("Error updating permission: " + error.message);
    }
  }
};

async function updateAdminStatus(id, status) {
  try {
    if (isFirebaseConfigured) {
      if (status === "rejected") await deleteDoc(doc(db, "admins", id));
      else await updateDoc(doc(db, "admins", id), { status: status });
    } else {
      if (status === "rejected") mockAdmins = mockAdmins.filter((a) => a.id !== id);
      else {
        const admin = mockAdmins.find((a) => a.id === id);
        if (admin) admin.status = status;
      }
      renderAdmins();
      renderDashboard();
    }
  } catch (error) {
    alert("Action failed: " + error.message);
  }
}

function handleAdminSearch() {
  const type = document.getElementById("admin-search-type").value;
  const query = document.getElementById("admin-search-input").value.toLowerCase();
  if (!query) return renderAdmins(mockAdmins);

  const filtered = mockAdmins.filter((a) => {
    if (type === "email") return (a.email || "").toLowerCase().includes(query);
    if (type === "id") return (a.id || "").toLowerCase().includes(query);
    return false;
  });
  renderAdmins(filtered);
}

function handleMemberSearch() {
  const type = document.getElementById("member-search-type").value;
  const query = document.getElementById("member-search-input").value.toLowerCase();
  if (!query) return renderMembers(mockMembers);

  const filtered = mockMembers.filter((m) => {
    if (type === "name") return (m.fullName || m.name || "").toLowerCase().includes(query);
    if (type === "telegram") return (m.telegramUsername || m.telegram || "").toLowerCase().includes(query);
    if (type === "whatsapp") return (m.whatsappNumber || m.whatsapp || "").toLowerCase().includes(query);
    return false;
  });
  renderMembers(filtered);
}

function exportMembersCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Name,Telegram,WhatsApp,Referred By,Joined Date\n";
  mockMembers.forEach((m) => {
    csvContent += `${m.fullName || m.name || ""},${m.telegramUsername || m.telegram || ""},${m.whatsappNumber || m.whatsapp || ""},${m.referralAdmin || "Direct"},${m.joinedDate}\n`;
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
    signOut(auth).then(() => alert("Logged out successfully")).catch((err) => alert("Logout failed: " + err.message));
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
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
