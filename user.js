const user = requireUser();

async function loadUserDashboard() {
  if (!document.getElementById('waterLevel')) {
    return;
  }

  document.getElementById('welcome').textContent = `Welcome, ${user.full_name}`;

  const response = await fetch(`${API_BASE}/api/user/dashboard/${user.user_id}`, {
    headers: authHeaders(),
  });

  const data = await response.json();

  document.getElementById('address').textContent = `${data.address || '-'} • ${data.district || '-'}`;
  document.getElementById('waterLevel').textContent = `${data.water_percent || 0}%`;
  document.getElementById('waterLiters').textContent = `${data.current_level_liters || 0} L / ${
    data.capacity_liters || 0
  } L`;
  document.getElementById('batteryLevel').textContent = `${data.battery_level_percent || 0}%`;
  document.getElementById('energyWh').textContent = `${data.energy_generated_wh || 0} Wh`;
  document.getElementById('tankStatus').innerHTML = statusBadge(data.tank_status || 'normal');
  document.getElementById('systemStatus').innerHTML = statusBadge(data.system_status || 'active');

  const notificationResponse = await fetch(`${API_BASE}/api/user/notifications/${user.user_id}`, {
    headers: authHeaders(),
  });

  const notifications = await notificationResponse.json();

  document.getElementById('notifications').innerHTML = notifications
    .slice(0, 5)
    .map((notification) => {
      return `
        <tr>
          <td>${notification.title}</td>
          <td>${notification.message}</td>
          <td>${statusBadge(notification.type)}</td>
          <td>${formatDate(notification.created_at)}</td>
        </tr>
      `;
    })
    .join('');
}

let waterChart;
let energyChart;

function makeLabels(rows) {
  return rows
    .slice()
    .reverse()
    .map((row) => {
      return new Date(row.reading_datetime).toLocaleDateString('en-US');
    });
}

async function loadHistory() {
  if (!document.getElementById('waterHistory')) {
    return;
  }

  const waterResponse = await fetch(`${API_BASE}/api/user/water-history/${user.user_id}`, {
    headers: authHeaders(),
  });

  const water = await waterResponse.json();

  document.getElementById('waterHistory').innerHTML = water
    .map((row) => {
      return `
        <tr>
          <td>${formatDate(row.reading_datetime)}</td>
          <td>${row.water_level_liters} L</td>
          <td>${row.water_level_percent}%</td>
          <td>${row.daily_usage_liters} L</td>
          <td>${statusBadge(row.status)}</td>
        </tr>
      `;
    })
    .join('');

  const waterAscending = water.slice().reverse();
  const waterChartElement = document.getElementById('waterChart');

  if (waterChartElement && window.Chart) {
    if (waterChart) {
      waterChart.destroy();
    }

    waterChart = new Chart(waterChartElement, {
      type: 'line',
      data: {
        labels: makeLabels(water),
        datasets: [
          {
            label: 'Water level %',
            data: waterAscending.map((row) => Number(row.water_level_percent)),
            tension: 0.35,
            fill: true,
          },
          {
            label: 'Usage L',
            data: waterAscending.map((row) => Number(row.daily_usage_liters)),
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  const energyResponse = await fetch(`${API_BASE}/api/user/energy-history/${user.user_id}`, {
    headers: authHeaders(),
  });

  const energy = await energyResponse.json();

  document.getElementById('energyHistory').innerHTML = energy
    .map((row) => {
      return `
        <tr>
          <td>${formatDate(row.reading_datetime)}</td>
          <td>${row.energy_generated_wh} Wh</td>
          <td>${row.battery_level_percent}%</td>
          <td>${statusBadge(row.status)}</td>
        </tr>
      `;
    })
    .join('');

  const energyAscending = energy.slice().reverse();
  const energyChartElement = document.getElementById('energyChart');

  if (energyChartElement && window.Chart) {
    if (energyChart) {
      energyChart.destroy();
    }

    energyChart = new Chart(energyChartElement, {
      type: 'bar',
      data: {
        labels: makeLabels(energy),
        datasets: [
          {
            label: 'Battery %',
            data: energyAscending.map((row) => Number(row.battery_level_percent)),
          },
          {
            label: 'Generated Wh',
            data: energyAscending.map((row) => Number(row.energy_generated_wh)),
            type: 'line',
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}

async function loadServicePage() {
  if (!document.getElementById('serviceForm')) {
    return;
  }

  const servicesResponse = await fetch(`${API_BASE}/api/user/services`, {
    headers: authHeaders(),
  });

  const services = await servicesResponse.json();

  document.getElementById('service_id').innerHTML = services
    .map((service) => {
      return `
        <option value="${service.service_id}">
          ${service.service_name} - SRD ${service.base_price}
        </option>
      `;
    })
    .join('');

  await loadUserRequests();

  document.getElementById('serviceForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const serviceId = document.getElementById('service_id').value;
    const preferredDate = document.getElementById('preferred_date').value;
    const description = document.getElementById('description').value;

    const response = await fetch(`${API_BASE}/api/user/service-request`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: user.user_id,
        service_id: serviceId,
        preferred_date: preferredDate,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage('serviceMessage', data.message || 'Request failed.', 'error');
    } else {
      setMessage('serviceMessage', 'Service request submitted successfully.', 'ok');
      document.getElementById('serviceForm').reset();
      await loadUserRequests();
    }
  });
}

async function loadUserRequests() {
  const response = await fetch(`${API_BASE}/api/user/service-requests/${user.user_id}`, {
    headers: authHeaders(),
  });

  const requests = await response.json();

  document.getElementById('requests').innerHTML = requests
    .map((request) => {
      return `
        <tr>
          <td>${request.service_name}</td>
          <td>${request.request_date}</td>
          <td>${request.preferred_date || '-'}</td>
          <td>${request.description || '-'}</td>
          <td>${statusBadge(request.status)}</td>
        </tr>
      `;
    })
    .join('');
}

loadUserDashboard();
loadHistory();
loadServicePage();
