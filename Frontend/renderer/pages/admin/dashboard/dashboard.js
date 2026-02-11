async function loadDashboardStats() {
  try {
    const res = await api('/admin/dashboard-stats', 'GET');

    if (!res.success) {
      throw new Error(res.message || 'Failed to load dashboard stats');
    }

    const stats = res.data;

    document.getElementById('totalCareSeekers').textContent =
      stats.totalCareSeekers ?? 0;

    document.getElementById('totalCareTakers').textContent =
      stats.totalCareTakers ?? 0;

    document.getElementById('pendingCareRequests').textContent =
      stats.pendingCareRequests ?? 0;

    document.getElementById('activeAssignments').textContent =
      stats.activeAssignments ?? 0;

    document.getElementById('completedAssignments').textContent =
      stats.completedAssignments ?? 0;

    document.getElementById('availableCaretakers').textContent =
      stats.availableCaretakers ?? 0;

  } catch (err) {
    console.error('Dashboard stats error:', err);
    alert('Unable to load dashboard metrics');
  }
}

document.addEventListener('DOMContentLoaded', loadDashboardStats);
