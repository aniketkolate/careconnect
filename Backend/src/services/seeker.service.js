const db = require('../config/db'); // assuming pg pool or client
const { v4: uuidv4 } = require('uuid');

const getDashboardStats = async (userId) => {
    const totalRequests = await db.query(
        'SELECT COUNT(*) FROM care_requests WHERE seeker_id = $1',
        [userId]
    );
    const activeRequests = await db.query(
        "SELECT COUNT(*) FROM care_requests WHERE seeker_id = $1 AND status IN ('ASSIGNED','PENDING_ACCEPTANCE','ONGOING')",
        [userId]
    );
    const completedRequests = await db.query(
        "SELECT COUNT(*) FROM care_requests WHERE seeker_id = $1 AND status='COMPLETED'",
        [userId]
    );

    return {
        totalRequests: parseInt(totalRequests.rows[0].count),
        activeRequests: parseInt(activeRequests.rows[0].count),
        completedRequests: parseInt(completedRequests.rows[0].count),
    };
};

const createCareRequest = async (userId, body) => {
    const { care_type, description, start_time, end_time } = body;

    if (!care_type || !start_time || !end_time)
        throw { status: 400, message: 'care_type, start_time and end_time are required' };

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate) || isNaN(endDate))
        throw { status: 400, message: 'Invalid date format' };

    if (startDate >= endDate)
        throw { status: 400, message: 'start_time must be before end_time' };


    console.log(care_type)

    const result = await db.query(
        `INSERT INTO care_requests 
        (seeker_id, care_type, description, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, care_type, description || '', startDate, endDate]
    );

    await db.query(
        `INSERT INTO activity_logs 
        (user_id, activity_type, description)
        VALUES ($1, 'CREATE_REQUEST', 'Care request created')`,
        [userId]
    );

    return result.rows[0]; // ❌ only return, do not call res
};

module.exports = { createCareRequest };



const getAllCareRequests = async (userId, query) => {
    const { status } = query;
    let sql = 'SELECT * FROM care_requests WHERE seeker_id = $1';
    const params = [userId];

    if (status) {
        sql += ' AND status = $2';
        params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const result = await db.query(sql, params);
    return result.rows;
};

const getCareRequestById = async (userId, requestId) => {
    console.log("userId :", userId, " requestId :", requestId)
    const result = await db.query(
        'SELECT * FROM care_requests WHERE id = $1 AND seeker_id = $2',
        [requestId, userId]
    );

    if (result.rows.length === 0)
        throw { status: 404, message: 'Care request not found' };

    return result.rows[0];
};

const updateProfile = async (userId, body) => {
    const { name, phone, address, age, gender, emergency_contact, profile_image } = body;

    // Update users table
    if (name || phone) {
        await db.query(
            'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3',
            [name, phone, userId]
        );
    }

    // Update seeker profile
    if (address || age || gender || emergency_contact || profile_image) {
        await db.query(
            `UPDATE care_seeker_profiles 
       SET address = COALESCE($1, address),
           age = COALESCE($2, age),
           gender = COALESCE($3, gender),
           emergency_contact = COALESCE($4, emergency_contact),
           profile_image = COALESCE($5, profile_image)
       WHERE user_id = $6`,
            [address, age, gender, emergency_contact, profile_image, userId]
        );
    }

    return await getProfile(userId);
};

const getProfile = async (userId) => {
    const userResult = await db.query('SELECT id, name, email, phone, role, is_active FROM users WHERE id = $1', [userId]);
    const profileResult = await db.query('SELECT * FROM care_seeker_profiles WHERE user_id = $1', [userId]);

    return {
        ...userResult.rows[0],
        profile: profileResult.rows[0],
    };
};

const completeProfile = async (userId, body) => {
    const { address, age, gender, emergency_contact, profile_image } = body;

    if (!address || !age || !gender || !emergency_contact)
        throw { status: 400, message: 'All fields are required to complete profile' };

    await db.query(
        `UPDATE care_seeker_profiles
     SET address=$1, age=$2, gender=$3, emergency_contact=$4, profile_image=$5, is_profile_completed=TRUE
     WHERE user_id=$6`,
        [address, age, gender, emergency_contact, profile_image || null, userId]
    );

    // Log activity
    await db.query(
        `INSERT INTO activity_logs (user_id, activity_type, description)
     VALUES ($1,'PROFILE_COMPLETED','Completed profile')`,
        [userId]
    );

    return await getProfile(userId);
};

const getRecentRequests = async (userId) => {
    const result = await db.query(
        `SELECT * FROM care_requests WHERE seeker_id=$1 ORDER BY created_at DESC LIMIT 5`,
        [userId]
    );
    return result.rows;
};

const getAssignedCaretakers = async (userId) => {
    const result = await db.query(
        `
    SELECT
  ca.id AS assignment_id,
  ca.status AS assignment_status,
  ca.amount,
  ca.assigned_at,

  ct.id AS caretaker_id,
  ct.name AS caretaker_name,
  ct.email AS caretaker_email,
  ct.phone AS caretaker_phone,

  ctp.experience_years,
  ctp.skills,
  ctp.hourly_rate,
  ctp.profile_image,
  ctp.is_profile_completed,

  cr.id AS request_id,
  cr.care_type,
  cr.start_time,
  cr.end_time,

  -- 🔥 FINAL STATUS LOGIC
  CASE
    WHEN ca.status IS NOT NULL THEN ca.status
    ELSE cr.status
  END AS final_status

FROM care_assignments ca
JOIN care_requests cr ON cr.id = ca.care_request_id
JOIN users ct ON ct.id = ca.caretaker_id
LEFT JOIN care_taker_profiles ctp ON ctp.user_id = ct.id
WHERE cr.seeker_id = $1
ORDER BY ca.assigned_at DESC
`,
        [userId]
    );

    return result.rows.map(row => {
        let duration_days = null;

        if (row.start_time && row.end_time) {
            const diffMs = new Date(row.end_time) - new Date(row.start_time);
            if (diffMs > 0) {
                duration_days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            }
        }

        return {
            id: row.request_id,
            care_type: row.care_type,
            start_time: row.start_time,
            end_time: row.end_time,
            duration_days,
            status: row.final_status, // ✅ ONE status only

            assignment: {
                id: row.assignment_id,
                amount: row.amount,
                assigned_at: row.assigned_at
            },

            caretaker: {
                id: row.caretaker_id,
                name: row.caretaker_name,
                email: row.caretaker_email,
                phone: row.caretaker_phone,
                experience_years: row.experience_years,
                skills: row.skills,
                hourly_rate: row.hourly_rate,
                profile_image: row.profile_image,
                is_profile_completed: row.is_profile_completed
            }
        };
    });

};




const makePayment = async (userId, careRequestId, body) => {
    const { payment_mode } = body;

    /* 1. Fetch payment */
    const paymentRes = await db.query(
        `SELECT *
     FROM payments
     WHERE care_request_id = $1`,
        [careRequestId]
    );

    if (paymentRes.rows.length === 0) {
        throw { status: 404, message: 'Payment record not found' };
    }

    const payment = paymentRes.rows[0];

    /* 2. Ownership check */
    if (payment.seeker_id !== userId) {
        throw { status: 403, message: 'Unauthorized payment attempt' };
    }

    /* 3. Prevent double payment */
    if (payment.status === 'PAID') {
        throw { status: 400, message: 'Payment already completed' };
    }

    /* 4. Mark payment as PAID */
    const updatedPayment = await db.query(
        `UPDATE payments
     SET status = 'PAID',
         payment_mode = $1,
         paid_at = NOW()
     WHERE care_request_id = $2
     RETURNING *`,
        [payment_mode || 'CASH', careRequestId]
    );

    /* 5. Activity log */
    await db.query(
        `INSERT INTO activity_logs (user_id, activity_type, description)
     VALUES ($1, 'PAYMENT', 'Payment completed for care request')`,
        [userId]
    );

    /* 6. Notify caretaker */
    await db.query(
        `INSERT INTO notifications (user_id, title, message)
     VALUES ($1, 'Payment Received', 'Payment received for your service')`,
        [payment.caretaker_id]
    );

    return updatedPayment.rows[0];
};



const deleteCareRequest = async (userId, requestId) => {
    // 1. Check request exists and belongs to seeker
    const check = await db.query(
        `SELECT id, status 
     FROM care_requests 
     WHERE id = $1 AND seeker_id = $2`,
        [requestId, userId]
    );

    if (check.rowCount === 0) {
        throw new Error('Care request not found');
    }

    const { status } = check.rows[0];

    // 2. Block delete for critical states
    if (['ASSIGNED', 'ONGOING', 'COMPLETED'].includes(status)) {
        throw new Error(`Cannot delete care request with status ${status}`);
    }

    // 3. Delete request
    await db.query(
        `DELETE FROM care_requests WHERE id = $1`,
        [requestId]
    );

    return {
        id: requestId,
        status: 'DELETED'
    };
};

const getCompletedRequestsWithPayment = async (seekerId) => {
    const result = await db.query(
        `
    SELECT
      cr.id AS request_id,
      cr.care_type,
      cr.description,
      cr.start_time,
      cr.end_time,
      cr.status AS request_status,
      COALESCE(p.status, 'PENDING') AS payment_status,
      p.amount,
      p.payment_mode,
      p.paid_at
    FROM care_requests cr
    LEFT JOIN payments p
      ON p.care_request_id = cr.id
    WHERE cr.seeker_id = $1
      AND cr.status = 'COMPLETED'
    ORDER BY cr.created_at DESC
    `,
        [seekerId]
    );

    return result.rows;
};

const getPaymentDetails = async (careRequestId) => {
    const result = await db.query(
        `
    SELECT
      p.id,
      p.amount,
      p.status,
      p.payment_mode,
      p.paid_at,
      u.name AS caretaker_name
    FROM payments p
    JOIN users u ON u.id = p.caretaker_id
    WHERE p.care_request_id = $1
    `,
        [careRequestId]
    );

    return result.rows[0];
};



module.exports = {
    getDashboardStats,
    createCareRequest,
    getAllCareRequests,
    getCareRequestById,
    updateProfile,
    getProfile,
    completeProfile,
    getRecentRequests,
    getAssignedCaretakers,
    makePayment,
    deleteCareRequest,
    getCompletedRequestsWithPayment,
    getPaymentDetails
};
