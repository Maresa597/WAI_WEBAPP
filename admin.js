requireAdmin();

let allUsers = [];
let allRequests = [];
let selectedRequest = null;

async function loadAdminDashboard() {
  if (!document.getElementById('totalUsers')) {
    return;
  }

  const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: authHeaders(),
  });

  const data = await response.json();

  document.getElementById('totalUsers').textContent = data.totalUsers;
  document.getElementById('activeUsers').textContent = data.activeUsers;
  document.getElementById('serviceRequests').textContent = data.serviceRequests;
  document.getElementById('lowWaterSystems').textContent = data.lowWaterSystems;
  document.getElementById('criticalEnergySystems').textContent = data.criticalEnergySystems;

  const systemsResponse = await fetch(`${API_BASE}/api/admin/systems`, {
    headers: authHeaders(),
  });

  const systems = await systemsResponse.json();

  document.getElementById('systemsTable').innerHTML = systems
    .slice(0, 12)
    .map((system) => {
      return `
        <tr>
          <td>${system.full_name}</td>
          <td>${system.district}</td>
          <td>${system.system_name}</td>
          <td>${system.water_percent}%</td>
          <td>${system.battery_level_percent || 0}%</td>
          <td>${statusBadge(system.system_status)}</td>
        </tr>
      `;
    })
    .join('');
}

async function loadUsers() {
  if (!document.getElementById('usersTable')) {
    return;
  }

  const response = await fetch(`${API_BASE}/api/admin/users`, {
    headers: authHeaders(),
  });

  allUsers = await response.json();
  renderUsers();

  document.getElementById('districtFilter').addEventListener('change', renderUsers);
  document.getElementById('statusFilter').addEventListener('change', renderUsers);
  document.getElementById('userSearch').addEventListener('input', renderUsers);
}

function renderUsers() {
  const district = document.getElementById('districtFilter').value;
  const status = document.getElementById('statusFilter').value;
  const search = document.getElementById('userSearch').value.toLowerCase().trim();

  const filteredUsers = allUsers.filter((user) => {
    const districtMatches = district === 'all' || user.district === district;
    const statusMatches = status === 'all' || user.status === status;
    const searchMatches = !search || (user.full_name || '').toLowerCase().includes(search);

    return districtMatches && statusMatches && searchMatches;
  });

  document.getElementById('usersTable').innerHTML = filteredUsers
    .map((user) => {
      return `
        <tr>
          <td>${user.user_id}</td>
          <td>${user.full_name}</td>
          <td>${user.email}</td>
          <td>${user.phone || '-'}</td>
          <td>${user.district || '-'}</td>
          <td>${user.address || '-'}</td>
          <td>${statusBadge(user.status)}</td>
        </tr>
      `;
    })
    .join('');
}

async function loadRequests() {
  if (!document.getElementById('adminRequests')) {
    return;
  }

  const response = await fetch(`${API_BASE}/api/admin/service-requests`, {
    headers: authHeaders(),
  });

  allRequests = await response.json();
  renderRequests();

  document.getElementById('requestSearch').addEventListener('input', renderRequests);
  document.getElementById('requestStatusFilter').addEventListener('change', renderRequests);
  document.getElementById('requestDistrictFilter').addEventListener('change', renderRequests);
}

function renderRequests() {
  const search = document.getElementById('requestSearch').value.toLowerCase().trim();
  const status = document.getElementById('requestStatusFilter').value;
  const district = document.getElementById('requestDistrictFilter').value;

  const filteredRequests = allRequests.filter((request) => {
    const searchMatches =
      !search ||
      (request.full_name || '').toLowerCase().includes(search) ||
      (request.service_name || '').toLowerCase().includes(search) ||
      (request.district || '').toLowerCase().includes(search);

    const statusMatches = status === 'all' || request.status === status;
    const districtMatches = district === 'all' || request.district === district;

    return searchMatches && statusMatches && districtMatches;
  });

  document.getElementById('adminRequests').innerHTML = filteredRequests
    .map((request) => {
      return `
        <tr onclick="selectRequest(${request.request_id})" style="cursor:pointer;">
          <td>${request.request_id}</td>
          <td>${request.full_name}</td>
          <td>${request.district}</td>
          <td>${request.service_name}</td>
          <td>${request.preferred_date || '-'}</td>
          <td>${statusBadge(request.status)}</td>
        </tr>
      `;
    })
    .join('');
}

function selectRequest(requestId) {
  selectedRequest = allRequests.find((request) => request.request_id === requestId);

  if (!selectedRequest) {
    return;
  }

  document.getElementById('requestDetail').innerHTML = `
    <p><strong>Customer:</strong> ${selectedRequest.full_name}</p>
    <p><strong>District:</strong> ${selectedRequest.district}</p>
    <p><strong>Service:</strong> ${selectedRequest.service_name}</p>
    <p><strong>Preferred date:</strong> ${selectedRequest.preferred_date || '-'}</p>
    <p><strong>Description:</strong> ${selectedRequest.description || '-'}</p>
    <p><strong>Status:</strong> ${statusBadge(selectedRequest.status)}</p>

    <hr style="margin:18px 0; border:none; border-top:1px solid #E6EEF6;">

    <form id="requestManageForm">
      <label>Status</label>
      <select id="detailStatus">
        ${['pending', 'approved', 'in_progress', 'completed', 'cancelled']
          .map((status) => {
            const selected = status === selectedRequest.status ? 'selected' : '';

            return `
              <option value="${status}" ${selected}>
                ${status}
              </option>
            `;
          })
          .join('')}
      </select>

      <label>Planned service date</label>
      <input
        type="date"
        id="plannedDate"
        value="${
          selectedRequest.preferred_date
            ? String(selectedRequest.preferred_date).slice(0, 10)
            : ''
        }"
      >

      <label>Admin note</label>
      <textarea
        id="adminNote"
        placeholder="For example: customer called, technician scheduled, bring replacement part..."
      ></textarea>

      <button class="btn btn-primary" type="submit">
        Save update
      </button>
    </form>

    <div class="message" id="requestMessage"></div>

    <h3 style="margin-top:20px;">Quick actions</h3>

    <div class="action-row" style="margin-top:10px;">
      <button class="btn btn-soft" onclick="quickUpdate('approved')">Approve</button>
      <button class="btn btn-orange" onclick="quickUpdate('in_progress')">Start work</button>
      <button class="btn btn-primary" onclick="quickUpdate('completed')">Complete</button>
      <button class="btn btn-danger" onclick="quickUpdate('cancelled')">Cancel</button>
    </div>

    <div class="timeline">
      <div class="timeline-item">
        <strong>Request received</strong><br>
        <span class="small-text">${selectedRequest.request_date || '-'}</span>
      </div>

      <div class="timeline-item">
        <strong>Preferred date</strong><br>
        <span class="small-text">${selectedRequest.preferred_date || '-'}</span>
      </div>

      <div class="timeline-item">
        <strong>Current status</strong><br>
        <span class="small-text">${selectedRequest.status}</span>
      </div>
    </div>
  `;

  document.getElementById('requestManageForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = document.getElementById('detailStatus').value;

    await updateStatus(selectedRequest.request_id, status);

    setMessage('requestMessage', 'Request updated.', 'ok');
  });
}

async function updateStatus(requestId, status) {
  await fetch(`${API_BASE}/api/admin/service-requests/${requestId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      status,
    }),
  });

  const request = allRequests.find((item) => item.request_id === requestId);

  if (request) {
    request.status = status;
  }

  renderRequests();

  if (selectedRequest && selectedRequest.request_id === requestId) {
    selectedRequest.status = status;
    selectRequest(requestId);
  }
}

async function quickUpdate(status) {
  if (!selectedRequest) {
    return;
  }

  await updateStatus(selectedRequest.request_id, status);
}

loadAdminDashboard();
loadUsers();
loadRequests();
