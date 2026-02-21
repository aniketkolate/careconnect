const db = require('../config/db');

/* ---------------- DASHBOARD ---------------- */
const getDashboardStats = async (takerId) => {
  const pending = await db.query(
    `SELECT COUNT(*) FROM care_assignments 
     WHERE caretaker_id=$1 AND status='PENDING_ACCEPTANCE'`,
    [takerId]
  );

  const active = await db.query(
    `SELECT COUNT(*) FROM care_assignments 
     WHERE caretaker_id=$1 AND status='ONGOING'`,
    [takerId]
  );

  const completed = await db.query(
    `SELECT COUNT(*) FROM care_assignments 
     WHERE caretaker_id=$1 AND status='COMPLETED'`,
    [takerId]
  );

  const earnings = await db.query(
    `SELECT COALESCE(SUM(amount),0) AS total 
     FROM payments 
     WHERE caretaker_id=$1 
     AND status='PAID'
     AND DATE_TRUNC('month', paid_at)=DATE_TRUNC('month', CURRENT_DATE)`,
    [takerId]
  );

  return {
    pendingAssignments: Number(pending.rows[0].count),
    activeAssignments: Number(active.rows[0].count),
    completedAssignments: Number(completed.rows[0].count),
    monthlyEarnings: Number(earnings.rows[0].total)
  };
};

/* ---------------- ASSIGNMENTS ---------------- */
const getAssignments = async (takerId, query) => {
  let sql = `
    SELECT
      ca.*,
      cr.care_type,
      cr.start_time,
      cr.end_time,
      u.name AS seeker_name,
      COALESCE(p.status, 'PENDING') AS payment_status
    FROM care_assignments ca
    JOIN care_requests cr ON cr.id = ca.care_request_id
    JOIN users u ON u.id = cr.seeker_id
    LEFT JOIN payments p
      ON p.care_request_id = ca.care_request_id
     AND p.caretaker_id = ca.caretaker_id
    WHERE ca.caretaker_id = $1
  `;

  const params = [takerId];

  if (query.status) {
    sql += ` AND ca.status = $2`;
    params.push(query.status);
  }

  sql += ` ORDER BY ca.assigned_at DESC`;

  const result = await db.query(sql, params);
  return result.rows;
};


const getAssignmentById = async (takerId, careRequestId) => {
  const { rows } = await db.query(
    `SELECT 
        ca.id AS assignment_id,
        ca.care_request_id,
        ca.caretaker_id,              -- ✅ REQUIRED
        ca.status AS assignment_status,
        ca.amount AS assignment_amount,
        cr.seeker_id,
        cr.status AS request_status
     FROM care_assignments ca
     LEFT JOIN care_requests cr ON ca.care_request_id = cr.id
     WHERE ca.care_request_id = $1
       AND ca.caretaker_id = $2`,
    [careRequestId, takerId]
  );

  return rows[0] || null;
};




const respondToAssignment = async (takerId, assignmentId, body) => {
  const { action } = body;

  if (!['ACCEPT', 'REJECT'].includes(action)) {
    throw { status: 400, message: 'Invalid action' };
  }

  // Fetch assignment by ASSIGNMENT ID
  const { rows } = await db.query(
    `
    SELECT 
      ca.id AS assignment_id,
      ca.care_request_id,
      ca.status AS assignment_status
    FROM care_assignments ca
    WHERE ca.id = $1
      AND ca.caretaker_id = $2
      AND ca.status = 'PENDING_ACCEPTANCE'
    `,
    [assignmentId, takerId]
  );

  const assignment = rows[0];

  if (!assignment) {
    throw {
      status: 404,
      message: 'No pending assignment found for this caretaker'
    };
  }

  const assignmentStatus =
    action === 'ACCEPT' ? 'ONGOING' : 'CANCELLED';

  const requestStatus =
    action === 'ACCEPT' ? 'ONGOING' : 'ASSIGNED';

  // Transaction (VERY IMPORTANT)
  await db.query('BEGIN');

  try {
    await db.query(
      `UPDATE care_assignments
       SET status = $1
       WHERE id = $2`,
      [assignmentStatus, assignment.assignment_id]
    );

    await db.query(
      `UPDATE care_requests
       SET status = $1
       WHERE id = $2`,
      [requestStatus, assignment.care_request_id]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  return {
    assignmentId,
    assignmentStatus,
    requestStatus
  };
};



const updateAssignmentStatus = async (takerId, assignmentId, body) => {
  const { status, amount } = body;

  // Fetch assignment and seeker
  const assignment = await getAssignmentById(takerId, assignmentId);
  if (!assignment) throw { status: 404, message: 'Assignment not found' };
  console.log('Assignment:', assignment);


  // Validate status
  if (!['ONGOING', 'COMPLETED'].includes(status))
    throw { status: 400, message: 'Invalid status update' };

  // Validate amount if COMPLETED
  if (status === 'COMPLETED' && (!amount || amount <= 0))
    throw { status: 400, message: 'Amount required to complete request' };

  if (status === 'COMPLETED') {
    // 1️⃣ Update assignment
    await db.query(
      `UPDATE care_assignments
       SET status='COMPLETED', amount=$1
       WHERE id=$2`,
      [amount, assignmentId]
    );

    // 2️⃣ Update care request
    await db.query(
      `UPDATE care_requests
       SET status='COMPLETED'
       WHERE id=$1`,
      [assignment.care_request_id]
    );

    // 3️⃣ Insert payment record
    await db.query(
      `INSERT INTO payments (
         care_request_id,
         seeker_id,
         caretaker_id,
         amount,
         status
       ) VALUES ($1, $2, $3, $4, 'PENDING')`,
      [
        assignment.care_request_id,
        assignment.seeker_id,
        assignment.caretaker_id,
        amount
      ]
    );

  } else {
    // If status is ONGOING, just update assignment and request
    await db.query(
      `UPDATE care_assignments
       SET status='ONGOING'
       WHERE id=$1`,
      [assignmentId]
    );

    await db.query(
      `UPDATE care_requests
       SET status='ONGOING'
       WHERE id=$1`,
      [assignment.care_request_id]
    );
  }

  return { status };
};


/* ---------------- AVAILABILITY ---------------- */
const setAvailability = async (takerId, body) => {
  const { availability } = body;

  if (!Array.isArray(availability))
    throw { status: 400, message: 'Availability must be array of days' };

  await db.query(
    `DELETE FROM caretaker_availability WHERE caretaker_id=$1`,
    [takerId]
  );

  for (const day of availability) {
    await db.query(
      `INSERT INTO caretaker_availability (caretaker_id, day)
       VALUES ($1,$2)`,
      [takerId, day]
    );
  }

  return availability;
};


const getAvailability = async (takerId) => {
  const result = await db.query(
    `SELECT day FROM caretaker_availability WHERE caretaker_id=$1`,
    [takerId]
  );
  return result.rows;
};


/* ---------------- PROFILE ---------------- */
const getProfile = async (takerId) => {
  const user = await db.query(
    `SELECT id,name,email,phone FROM users WHERE id=$1`,
    [takerId]
  );
  const profile = await db.query(
    `SELECT * FROM care_taker_profiles WHERE user_id=$1`,
    [takerId]
  );

  return { ...user.rows[0], profile: profile.rows[0] };
};

const updateProfile = async (takerId, body) => {
  const {
    name,
    phone,
    experience_years,
    skills,
    hourly_rate,
    profile_image
  } = body;

  try {
    await db.query("BEGIN");

    /* ===========================
       Update USERS table
    ============================ */
    await db.query(
      `
      UPDATE users
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone)
      WHERE id = $3
      `,
      [name, phone, takerId]
    );

    /* ===========================
       Update CARE TAKER PROFILE
    ============================ */
    await db.query(
      `
      UPDATE care_taker_profiles
      SET experience_years = COALESCE($1, experience_years),
          skills = COALESCE($2, skills),
          hourly_rate = COALESCE($3, hourly_rate),
          profile_image = COALESCE($4, profile_image),
          is_profile_completed = TRUE
      WHERE user_id = $5
      `,
      [experience_years, skills, hourly_rate, profile_image, takerId]
    );

    await db.query("COMMIT");

    return getProfile(takerId);

  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};


/* ---------------- PAYMENTS ---------------- */
const sendPaymentReminder = async (takerId, careRequestId) => {
  const payment = await db.query(
    `SELECT * FROM payments WHERE care_request_id=$1`,
    [careRequestId]
  );

  if (payment.rows.length && payment.rows[0].status === 'PAID')
    throw { status: 400, message: 'Payment already completed' };

  const assignment = await db.query(
    `SELECT cr.seeker_id FROM care_assignments ca
     JOIN care_requests cr ON cr.id=ca.care_request_id
     WHERE ca.caretaker_id=$1 AND ca.care_request_id=$2`,
    [takerId, careRequestId]
  );

  if (!assignment.rows.length)
    throw { status: 404, message: 'Invalid request' };

  await db.query(
    `INSERT INTO notifications (user_id, title, message, care_request_id)
    VALUES ($1, 'Payment Reminder', 'Please complete pending payment', $2)`,
    [assignment.rows[0].seeker_id, careRequestId]
  );

  return { success: true };
};

const getMonthlyEarnings = async (takerId) => {
  const result = await db.query(
    `SELECT COALESCE(SUM(amount),0) AS total
     FROM payments
     WHERE caretaker_id=$1 AND status='PAID'
     AND DATE_TRUNC('month', paid_at)=DATE_TRUNC('month', CURRENT_DATE)`,
    [takerId]
  );

  return { monthlyEarnings: Number(result.rows[0].total) };
};

const getTodaySchedule = async (caretakerId) => {
  const query = `
    SELECT
      ca.id AS assignment_id,
      ca.status AS assignment_status,
      ca.amount,
      cr.id AS care_request_id,
      cr.care_type,
      cr.start_time,
      cr.end_time,
      u.name AS seeker_name
    FROM care_assignments ca
    JOIN care_requests cr ON ca.care_request_id = cr.id
    JOIN users u ON cr.seeker_id = u.id
    WHERE ca.caretaker_id = $1
      AND ca.status IN ('ONGOING')
      AND cr.start_time::date = CURRENT_DATE
    ORDER BY cr.start_time ASC
  `;

  const { rows } = await db.query(query, [caretakerId]);
  return rows;
};

module.exports = {
  getTodaySchedule
};


module.exports = {
  getDashboardStats,
  getAssignments,
  getAssignmentById,
  respondToAssignment,
  updateAssignmentStatus,
  setAvailability,
  getAvailability,
  getProfile,
  updateProfile,
  sendPaymentReminder,
  getMonthlyEarnings,
  getTodaySchedule
};
