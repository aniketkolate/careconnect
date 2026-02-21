const db = require("../config/db");
const { AppError } = require("../utils/response");

/* ================= DASHBOARD ================= */

exports.getDashboardStats = async () => {
  const results = await Promise.all([
    db.query(`SELECT COUNT(*) FROM users WHERE role = 'CARE_SEEKER'`),
    db.query(`SELECT COUNT(*) FROM users WHERE role = 'CARE_TAKER'`),
    db.query(`SELECT COUNT(*) FROM care_requests WHERE status = 'CREATED'`),
    db.query(`SELECT COUNT(*) FROM care_assignments WHERE status = 'ONGOING'`),
    db.query(`SELECT COUNT(*) FROM care_assignments WHERE status = 'COMPLETED'`)
  ]);

  return {
    totalCareSeekers: Number(results[0].rows[0].count),
    totalCareTakers: Number(results[1].rows[0].count),
    pendingCareRequests: Number(results[2].rows[0].count),
    activeAssignments: Number(results[3].rows[0].count),
    completedAssignments: Number(results[4].rows[0].count)
  };
};

/* ================= AVAILABLE CARETAKERS (TODAY) ================= */

exports.getTodayAvailableCaretakers = async () => {
  const dayMap = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ];

  const today = dayMap[new Date().getDay()];

  const { rows } = await db.query(
    `
    SELECT 
      u.id AS caretaker_id,
      u.name,
      u.email,
      u.phone,
      u.is_active,

      ctp.experience_years,
      ctp.skills,
      ctp.hourly_rate,
      ctp.profile_image,
      ctp.is_profile_completed,

      ca.day AS available_day
    FROM caretaker_availability ca
    JOIN users u 
      ON u.id = ca.caretaker_id
    JOIN care_taker_profiles ctp 
      ON ctp.user_id = u.id
    WHERE ca.day = $1
      AND ca.is_available = true
      AND u.role = 'CARE_TAKER'
      AND u.is_active = true
    ORDER BY 
      ctp.is_profile_completed DESC,
      ctp.experience_years DESC
    `,
    [today]
  );

  return rows;
};


/* ================= RECENT ACTIVITIES ================= */

exports.getRecentActivities = async () => {
  const { rows } = await db.query(
    `
    SELECT 
      al.id,
      al.activity_type,
      al.description,
      al.created_at,
      u.name AS performed_by
    FROM activity_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT 20
    `
  );

  return rows;
};

/* ================= CARE REQUESTS ================= */

exports.getAllCareRequests = async (status) => {
  let query = `
    SELECT 
      cr.id AS care_request_id,
      cr.care_type,
      cr.description,
      cr.start_time,
      cr.end_time,
      cr.status AS request_status,
      cr.created_at AS request_created_at,

      -- seeker basic info
      seeker.id AS seeker_id,
      seeker.name AS seeker_name,
      seeker.email AS seeker_email,
      seeker.phone AS seeker_phone,

      -- seeker profile info
      csp.address AS seeker_address,
      csp.age AS seeker_age,
      csp.gender AS seeker_gender,
      csp.emergency_contact AS seeker_emergency_contact,
      csp.profile_image AS seeker_profile_image,
      csp.is_profile_completed

    FROM care_requests cr
    JOIN users seeker ON seeker.id = cr.seeker_id
    LEFT JOIN care_seeker_profiles csp ON csp.user_id = seeker.id
  `;

  const params = [];

  if (status) {
    query += ` WHERE cr.status = $1`;
    params.push(status);
  }

  query += ` ORDER BY cr.created_at DESC`;

  const { rows } = await db.query(query, params);
  return rows;
};

exports.getCareRequestById = async (id) => {
  const { rows } = await db.query(
    `
    SELECT 
      cr.*,
      u.name AS seeker_name
    FROM care_requests cr
    JOIN users u ON u.id = cr.seeker_id
    WHERE cr.id = $1
    `,
    [id]
  );

  if (!rows.length) {
    throw new AppError("Care request not found", 404);
  }

  return rows[0];
};

/* ================= ASSIGN CARETAKER ================= */

exports.assignCaretaker = async (requestId, caretakerId, adminId) => {
  const request = await db.query(
    `
    SELECT * 
    FROM care_requests 
    WHERE id = $1 AND status = 'CREATED'
    `,
    [requestId]
  );

  if (!request.rows.length) {
    throw new AppError("Care request is not available for assignment", 400);
  }

  await db.query("BEGIN");

  try {
    await db.query(
      `
      INSERT INTO care_assignments
      (care_request_id, caretaker_id, assigned_by)
      VALUES ($1, $2, $3)
      `,
      [requestId, caretakerId, adminId]
    );

    await db.query(
      `
      UPDATE care_requests
      SET status = 'ASSIGNED'
      WHERE id = $1
      `,
      [requestId]
    );

    await db.query(
      `
      INSERT INTO activity_logs (user_id, activity_type, description)
      VALUES ($1, 'ASSIGNMENT', 'Caretaker assigned by admin')
      `,
      [adminId]
    );

    await db.query("COMMIT");

    return { requestId, caretakerId };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

/* ================= USERS ================= */

exports.getAllUsers = async (role) => {
  let query = `
    SELECT 
      id,
      name,
      email,
      phone,
      role,
      is_active,
      created_at
    FROM users
  `;

  const params = [];

  if (role) {
    query += ` WHERE role = $1`;
    params.push(role);
  }

  const { rows } = await db.query(query, params);
  return rows;
};

exports.getUserById = async (userId) => {
  // 1️⃣ Get base user info
  const userQuery = `
    SELECT 
      id,
      name,
      email,
      phone,
      role,
      is_active,
      created_at
    FROM users
    WHERE id = $1
  `;

  const userResult = await db.query(userQuery, [userId]);
  const user = userResult.rows[0];

  if (!user) return null;

  // 2️⃣ Role-based profile
  if (user.role === "CARE_SEEKER") {
    const profileQuery = `
      SELECT
        address,
        age,
        gender,
        emergency_contact,
        profile_image,
        is_profile_completed
      FROM care_seeker_profiles
      WHERE user_id = $1
    `;

    const profileResult = await db.query(profileQuery, [userId]);
    user.profile = profileResult.rows[0] || null;
  }

  if (user.role === "CARE_TAKER") {
    const profileQuery = `
      SELECT
        experience_years,
        skills,
        hourly_rate,
        profile_image,
        is_profile_completed
      FROM care_taker_profiles
      WHERE user_id = $1
    `;

    const profileResult = await db.query(profileQuery, [userId]);
    user.profile = profileResult.rows[0] || null;
  }

  return user;
};

exports.updateUserStatus = async (userId, status) => {
  if (typeof status !== "boolean") {
    throw new AppError("Invalid status value", 400);
  }

  const { rowCount } = await db.query(
    `
    UPDATE users
    SET is_active = $1
    WHERE id = $2
    `,
    [status, userId]
  );

  if (!rowCount) {
    throw new AppError("User not found", 404);
  }

  return { userId, status };
};
